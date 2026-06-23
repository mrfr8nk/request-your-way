import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Finalizes signup: writes role + student_profiles + parent links + phone using service role.
// Bypasses RLS so data isn't lost when there's no session yet (email confirmation flows).
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      user_id, email, role, full_name,
      phone,
      // student fields
      level, form, class_id, date_of_birth, gender,
      guardian_name, guardian_phone, guardian_email, address, national_id,
      // parent fields
      child_student_id,
    } = body;

    if (!user_id || !role || !email) {
      return new Response(JSON.stringify({ error: 'user_id, email, role required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Verify the user actually exists with this email (prevents spoofing arbitrary user_ids)
    const { data: userData, error: userErr } = await supabase.auth.admin.getUserById(user_id);
    if (userErr || !userData?.user || userData.user.email?.toLowerCase() !== String(email).toLowerCase()) {
      return new Response(JSON.stringify({ error: 'User not found or email mismatch' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const warnings: string[] = [];

    // Ensure profile row exists (handle_new_user trigger should make it but race-safe)
    await supabase.from('profiles').upsert({
      user_id, email, full_name: full_name || '', phone: phone || null,
    }, { onConflict: 'user_id' });

    // Role
    await supabase.from('user_roles').insert({ user_id, role }).then(({ error }) => {
      if (error && !String(error.message).includes('duplicate')) warnings.push(`role: ${error.message}`);
    });

    if (role === 'student') {
      const { error: spErr } = await supabase.from('student_profiles').insert({
        user_id,
        level, form: form ? Number(form) : null,
        class_id: class_id || null,
        date_of_birth: date_of_birth || null,
        gender: gender || null,
        guardian_name: guardian_name || null,
        guardian_phone: guardian_phone || null,
        guardian_email: guardian_email || null,
        address: address || null,
        national_id: national_id || null,
      });
      if (spErr) warnings.push(`student_profiles: ${spErr.message}`);
    } else if (role === 'teacher') {
      await supabase.from('teacher_profiles').insert({ user_id }).then(({ error }) => {
        if (error && !String(error.message).includes('duplicate')) warnings.push(`teacher_profiles: ${error.message}`);
      });
    } else if (role === 'parent' && child_student_id) {
      const { data: studentProfile } = await supabase
        .from('student_profiles')
        .select('user_id, guardian_phone, guardian_email')
        .eq('student_id', String(child_student_id).trim())
        .maybeSingle();
      if (studentProfile) {
        const last9 = (s: string) => (s || '').replace(/\D/g, '').slice(-9);
        const phoneMatch = phone && last9(phone).length >= 9 && last9(phone) === last9(studentProfile.guardian_phone || '');
        const emailMatch = email && studentProfile.guardian_email &&
          email.trim().toLowerCase() === studentProfile.guardian_email.trim().toLowerCase();
        if (phoneMatch || emailMatch) {
          await supabase.from('parent_student_links').insert({
            parent_id: user_id, student_id: studentProfile.user_id,
          });
          await supabase.from('notifications').insert({
            user_id: studentProfile.user_id,
            title: '🔗 Parent Account Linked',
            message: `${full_name || 'A parent'} linked to your account.`,
            type: 'parent_link',
          });
        } else {
          warnings.push('child_link_no_match');
        }
      } else {
        warnings.push('child_not_found');
      }
    }

    return new Response(JSON.stringify({ success: true, warnings }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('complete-signup error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
