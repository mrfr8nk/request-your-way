import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  return { ok: res.ok, error: res.ok ? null : await res.text() };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");
    const { data: { user: caller } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!caller) throw new Error("Not authenticated");

    const { data: callerRole } = await supabase
      .from("user_roles").select("role").eq("user_id", caller.id).eq("role", "admin").single();
    if (!callerRole) throw new Error("Not authorized - admin only");

    const { email, role, class_id, full_name, whatsapp_number } = await req.json();
    if (!email || !role) throw new Error("Email and role are required");
    if (!["student", "teacher"].includes(role)) throw new Error("Role must be student or teacher");

    const tempPassword = "Welcome" + Date.now().toString(36).slice(-6) + "!";

    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email, password: tempPassword, email_confirm: true,
      user_metadata: { full_name: full_name || email.split("@")[0] },
    });
    if (createError) throw new Error(createError.message);
    if (!newUser.user) throw new Error("Failed to create user");

    const userId = newUser.user.id;
    await supabase.from("user_roles").insert({ user_id: userId, role });
    await supabase.from("profiles").upsert({
      user_id: userId,
      full_name: full_name || email.split("@")[0],
      email,
      phone: whatsapp_number || null,
    });

    if (role === "student") {
      let form = 1; let level = "o_level";
      if (class_id) {
        const { data: cls } = await supabase.from("classes").select("form, level").eq("id", class_id).single();
        if (cls) { form = cls.form; level = cls.level; }
      }
      await supabase.from("student_profiles").insert({
        user_id: userId,
        class_id: class_id || null,
        form, level,
        guardian_phone: whatsapp_number || null,
      });
    } else if (role === "teacher") {
      await supabase.from("teacher_profiles").insert({ user_id: userId });
    }

    const siteUrl = req.headers.get("origin") || "https://stmh.lovable.app";
    const { data: resetData } = await supabase.auth.admin.generateLink({
      type: "recovery", email,
      options: { redirectTo: siteUrl + "/reset-password" },
    });
    const activationLink = resetData?.properties?.action_link || siteUrl + "/login";

    // Welcome email
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      await fetch(supabaseUrl + "/functions/v1/send-branded-email", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + serviceKey },
        body: JSON.stringify({
          type: "welcome", email,
          welcome_data: { name: full_name || email.split("@")[0], role, activationLink },
        }),
      });
    } catch (emailErr) {
      console.error("Welcome email failed (non-blocking):", emailErr);
    }

    // Welcome WhatsApp
    let whatsappResult: any = null;
    if (whatsapp_number) {
      const msg =
`🎓 *Welcome to St. Mary's High School*

Hello ${full_name || "there"},

Your ${role} account has been created.

📧 *Email:* ${email}
🔑 *Temporary password:* ${tempPassword}

To activate your account and set a new password, tap the link below:
${activationLink}

_For security, please change your password immediately after first login._

— St. Mary's Admin`;
      whatsappResult = await sendWhatsApp(whatsapp_number, msg);
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        email,
        role,
        activation_link: activationLink,
        whatsapp_sent: whatsappResult?.ok || false,
        whatsapp_error: whatsappResult?.error || null,
        message: role + " account created. Activation email" + (whatsappResult?.ok ? " and WhatsApp message" : "") + " sent.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
