import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendWhatsAppOtp } from "../_shared/whatsapp-otp.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SCHOOL = "St. Mary's High School";

function normalizePhone(p: string): string {
  // strip everything except digits, drop leading 0, ensure it has country code
  let d = (p || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('0')) d = '263' + d.slice(1); // Zimbabwe default
  return d;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { email, phone, full_name, message_only } = await req.json();
    if (!phone) {
      return new Response(JSON.stringify({ error: 'phone is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const token = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
    const phoneId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
    if (!token || !phoneId) {
      return new Response(JSON.stringify({ error: 'WhatsApp not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const to = normalizePhone(phone);
    let message: string;

    if (message_only) {
      message = String(message_only);
      const waRes = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: message } }),
      });
      if (!waRes.ok) {
        const waJson = await waRes.json().catch(() => ({}));
        return new Response(JSON.stringify({ error: waJson?.error?.message || 'WhatsApp send failed' }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    } else {
      if (!email) {
        return new Response(JSON.stringify({ error: 'email is required for OTP' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      );
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const expires = Date.now() + 10 * 60 * 1000;
      const otpKey = `otp_${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      await supabase.from('system_settings').upsert({
        key: otpKey,
        value: JSON.stringify({ code, expires }),
      });
      message = `🔐 *St. Mary's High School*\n\nYour verification code is:\n\`\`\`${code}\`\`\`\n\n⏳ Expires in 10 minutes.\n\nIf you didn't request this, please ignore.`;
      try {
        await sendWhatsAppOtp(phone, code, message);
      } catch (err) {
        return new Response(JSON.stringify({ error: (err as Error).message }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    return new Response(JSON.stringify({ success: true, to }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('send-whatsapp-otp error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
