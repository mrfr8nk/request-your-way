// Sends a WhatsApp OTP that works even if the user never messaged the bot.
// Business-initiated messages need a Meta-approved template, so we try the
// AUTHENTICATION template first and only fall back to plain text (which
// works inside the 24h window) if the template isn't available.
export function normalizePhone(p: string): string {
  let d = (p || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('0')) d = '263' + d.slice(1);
  return d;
}

async function post(phoneId: string, token: string, body: unknown) {
  const r = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, json: j as any };
}

export async function sendWhatsAppOtp(phone: string, code: string, fallbackText: string) {
  const token = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
  const phoneId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
  if (!token || !phoneId) throw new Error('WhatsApp not configured');
  const to = normalizePhone(phone);
  const name = Deno.env.get('WHATSAPP_OTP_TEMPLATE') || 'otp_code';
  const lang = Deno.env.get('WHATSAPP_OTP_TEMPLATE_LANG') || 'en_US';
  const base = { messaging_product: 'whatsapp', to, type: 'template' };
  const body = { type: 'body', parameters: [{ type: 'text', text: code }] };
  const button = { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: code }] };

  // 1) Authentication template with copy-code button
  let res = await post(phoneId, token, { ...base, template: { name, language: { code: lang }, components: [body, button] } });
  if (res.ok) return { to, via: 'template' };
  const tplErr = res.json?.error?.message;
  // 2) Same template without button (utility-style template)
  res = await post(phoneId, token, { ...base, template: { name, language: { code: lang }, components: [body] } });
  if (res.ok) return { to, via: 'template' };
  // 3) Plain text (only delivered if user messaged us in the last 24h)
  res = await post(phoneId, token, { messaging_product: 'whatsapp', to, type: 'text', text: { body: fallbackText } });
  if (res.ok) return { to, via: 'text' };
  console.error('WhatsApp OTP failed', { tplErr, textErr: res.json?.error });
  throw new Error(`WhatsApp send failed. Template "${name}": ${tplErr || 'unknown'}`);
}
