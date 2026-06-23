import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SCHOOL = "St. Mary's High School";
const otpKeyFor = (email: string) => `pwreset_${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

function normalizePhone(p: string): string {
  let d = (p || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('0')) d = '263' + d.slice(1);
  return d;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const body = await req.json();
    const action = body.action as 'send' | 'verify';
    const email = (body.email || '').trim().toLowerCase();
    const method = (body.method || 'email') as 'email' | 'whatsapp';

    if (!email) throw new Error('Email is required');

    // Find user by email
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id, full_name, phone')
      .ilike('email', email)
      .maybeSingle();

    if (!profile) throw new Error('No account found for that email.');

    if (action === 'send') {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const expires = Date.now() + 10 * 60 * 1000;
      await supabase.from('system_settings').upsert({
        key: otpKeyFor(email),
        value: JSON.stringify({ code, expires, user_id: profile.user_id }),
      });

      if (method === 'whatsapp') {
        const phone = body.phone || profile.phone;
        if (!phone) throw new Error('No phone number on file. Use email instead.');
        const token = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
        const phoneId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
        if (!token || !phoneId) throw new Error('WhatsApp not configured');
        const message = `🔐 *St. Mary's High School*\n\nYour password reset code is:\n\`\`\`${code}\`\`\`\n\n⏳ Expires in 10 minutes.\n\nIf you didn't request this, please ignore.\n\n*Tip:* Tap and hold the code above to copy it.\n──────────\n`;
        const waRes = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: normalizePhone(phone),
            type: 'text',
            text: { body: message },
          }),
        });
        const waJson = await waRes.json();
        if (!waRes.ok) throw new Error(waJson?.error?.message || 'WhatsApp send failed');
      } else {
        const emailFnUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-branded-email`;
        const r = await fetch(emailFnUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            email, type: 'verification_otp', full_name: profile.full_name,
            otp_code: code,
            skip_store: true,
            subject_override: 'Your password reset code',
          }),
        });
        if (!r.ok) {
          const t = await r.text();
          console.error('Email send failed', t);
          throw new Error('Failed to send reset email');
        }
      }

      return new Response(JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'verify') {
      const otp = String(body.otp_code || '').trim();
      const newPassword = String(body.new_password || '');
      if (otp.length !== 6) throw new Error('Enter the 6-digit code.');
      if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
        throw new Error('Password must be 8+ chars with letters and numbers.');
      }

      const { data: rec } = await supabase
        .from('system_settings').select('value').eq('key', otpKeyFor(email)).maybeSingle();
      if (!rec) throw new Error('No reset code found. Request a new one.');
      const parsed = JSON.parse(rec.value);
      if (Date.now() > parsed.expires) {
        await supabase.from('system_settings').delete().eq('key', otpKeyFor(email));
        throw new Error('Code expired. Request a new one.');
      }
      if (parsed.code !== otp) throw new Error('Invalid code.');

      const { error: updErr } = await supabase.auth.admin.updateUserById(parsed.user_id, {
        password: newPassword,
      });
      if (updErr) throw new Error(updErr.message);

      await supabase.from('system_settings').delete().eq('key', otpKeyFor(email));

      return new Response(JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    throw new Error('Invalid action');
  } catch (e) {
    console.error('reset-password-otp error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
