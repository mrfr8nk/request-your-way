// Broadcasts announcements via in-app, email, and/or WhatsApp channels.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WA_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN") || "";
const WA_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") || "";

async function sendWhatsApp(to: string, body: string) {
  if (!WA_TOKEN || !WA_PHONE_ID) return { ok: false, error: "whatsapp_not_configured" };
  const cleaned = to.replace(/\D/g, "");
  const res = await fetch(`https://graph.facebook.com/v21.0/${WA_PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${WA_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: cleaned,
      type: "text",
      text: { body: body.slice(0, 4000) },
    }),
  });
  const txt = await res.text();
  return { ok: res.ok, error: res.ok ? null : txt };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");
    const { data: { user: caller } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!caller) throw new Error("Not authenticated");
    const { data: adminRole } = await supabase.from("user_roles").select("role").eq("user_id", caller.id).eq("role", "admin").single();
    if (!adminRole) throw new Error("Admin only");

    const { title, content, target_role, channels } = await req.json();
    if (!title || !content) throw new Error("Title and content required");
    const ch = channels || { email: false, whatsapp: false };

    // Find recipients
    let userIds: string[] = [];
    if (target_role) {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", target_role);
      userIds = (roles || []).map((r: any) => r.user_id);
    } else {
      const { data: profs } = await supabase.from("profiles").select("user_id");
      userIds = (profs || []).map((p: any) => p.user_id);
    }
    if (userIds.length === 0) return new Response(JSON.stringify({ sent: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Pull profiles (email + phone)
    const { data: profiles } = await supabase.from("profiles").select("user_id, email, full_name, phone").in("user_id", userIds);
    const list = profiles || [];

    const stats = { email_sent: 0, email_failed: 0, wa_sent: 0, wa_failed: 0 };

    // EMAIL — via send-branded-email edge function
    if (ch.email) {
      await Promise.all(list.map(async (p: any) => {
        if (!p.email) return;
        try {
          const r = await fetch(`${SUPABASE_URL}/functions/v1/send-branded-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_KEY}` },
            body: JSON.stringify({
              type: "announcement",
              email: p.email,
              announcement_data: { name: p.full_name || "Member", title, content },
            }),
          });
          r.ok ? stats.email_sent++ : stats.email_failed++;
        } catch { stats.email_failed++; }
      }));
    }

    // WHATSAPP
    if (ch.whatsapp) {
      const body = `📢 *${title}*\n\n${content}\n\n— St. Mary's High School`;
      // Throttle: 5 concurrent
      const chunks: any[][] = [];
      for (let i = 0; i < list.length; i += 5) chunks.push(list.slice(i, i + 5));
      for (const chunk of chunks) {
        await Promise.all(chunk.map(async (p: any) => {
          if (!p.phone) return;
          const r = await sendWhatsApp(p.phone, body);
          r.ok ? stats.wa_sent++ : stats.wa_failed++;
        }));
      }
    }

    return new Response(JSON.stringify({ success: true, recipients: list.length, ...stats }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
