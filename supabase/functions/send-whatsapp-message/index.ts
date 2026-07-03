// Simple text-only WhatsApp sender used for reminders, alerts, etc.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WA_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN") || "";
const WA_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") || "";

function normalizeZwPhone(raw: string): string {
  let d = (raw || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("263")) return d;
  if (d.startsWith("0")) return "263" + d.slice(1);
  if (d.length === 9) return "263" + d;
  return d;
}

async function sendText(to: string, body: string) {
  if (!WA_TOKEN || !WA_PHONE_ID) return { ok: false, error: "whatsapp_not_configured" };
  const cleaned = normalizeZwPhone(to);
  if (!cleaned || cleaned.length < 10) return { ok: false, error: "invalid_phone: " + to };
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
  if (!res.ok) console.error("WA text send failed", res.status, txt);
  return { ok: res.ok, error: res.ok ? null : `${res.status}: ${txt}` };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { phone, message, phones } = await req.json();
    const targets: string[] = phones && Array.isArray(phones) ? phones : (phone ? [phone] : []);
    if (targets.length === 0) throw new Error("phone or phones[] required");
    if (!message) throw new Error("message required");

    const results = [];
    for (const p of targets) {
      const r = await sendText(p, message);
      results.push({ phone: p, ...r });
    }

    const okCount = results.filter(r => r.ok).length;
    return new Response(JSON.stringify({ success: true, sent: okCount, failed: results.length - okCount, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
