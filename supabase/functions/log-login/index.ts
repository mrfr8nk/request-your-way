import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const auth = req.headers.get("Authorization") || "";
    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: { user }, error } = await admin.auth.getUser(auth.replace("Bearer ", ""));
    if (error || !user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: cors });

    const body = await req.json().catch(() => ({}));
    const ip = (req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") ||
      (req.headers.get("x-forwarded-for") || "").split(",")[0] || "").trim() || null;

    // Deduplicate: skip if same user+ip logged in the last 2 minutes
    const since = new Date(Date.now() - 120_000).toISOString();
    const { data: recent } = await admin.from("login_events").select("id")
      .eq("user_id", user.id).eq("ip_address", ip ?? "").gte("created_at", since).limit(1);
    if (recent && recent.length) return new Response(JSON.stringify({ ok: true, skipped: true }), { headers: cors });

    let city: string | null = null, country: string | null = null;
    if (ip) {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 2500);
        const g = await fetch(`https://ipwho.is/${ip}`, { signal: ctrl.signal }).then((r) => r.json());
        clearTimeout(t);
        if (g?.success) { city = g.city ?? null; country = g.country ?? null; }
      } catch { /* ignore */ }
    }

    await admin.from("login_events").insert({
      user_id: user.id,
      email: user.email,
      ip_address: ip,
      user_agent: (req.headers.get("user-agent") || "").slice(0, 400),
      city, country,
      method: String(body?.method || user.app_metadata?.provider || "password").slice(0, 30),
    });
    return new Response(JSON.stringify({ ok: true, ip }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: cors });
  }
});
