-- 1. One-time codes must never be readable by the public
DROP POLICY IF EXISTS "Anyone can read settings" ON public.system_settings;
CREATE POLICY "Anyone can read public settings" ON public.system_settings
  FOR SELECT USING (key NOT LIKE 'otp\_%' AND key NOT LIKE 'pwreset\_%' AND key NOT LIKE 'secret\_%');
DELETE FROM public.system_settings WHERE key LIKE 'otp\_%' OR key LIKE 'pwreset\_%';

-- 2. Users cannot un-ban themselves or change their own email record
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.is_banned := OLD.is_banned;
    NEW.banned_reason := OLD.banned_reason;
    NEW.banned_at := OLD.banned_at;
    NEW.user_id := OLD.user_id;
    NEW.email := OLD.email;
  END IF;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.protect_profile_fields() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_protect_profile_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_fields BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_fields();

-- 3. Admin roles can only be granted by an existing admin, or by an admin access code
--    (consume_access_code). Block banned users from consuming codes too.
CREATE OR REPLACE FUNCTION public.consume_access_code(_code text, _role app_role)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_row public.access_codes%ROWTYPE;
  v_use_count int; v_max_uses int;
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated'); END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = v_uid AND is_banned) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'banned'); END IF;
  IF length(COALESCE(_code,'')) < 6 THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid'); END IF;
  SELECT * INTO v_row FROM public.access_codes WHERE code = _code AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.security_alerts (alert_type, severity, title, description, user_id)
    VALUES ('access_code_failure', 'medium', 'Invalid access code attempt',
            'Someone tried an invalid staff access code for role ' || _role, v_uid);
    RETURN jsonb_build_object('ok', false, 'error', 'invalid');
  END IF;
  v_use_count := COALESCE(v_row.use_count, CASE WHEN v_row.used THEN 1 ELSE 0 END);
  v_max_uses  := COALESCE(v_row.max_uses, 1);
  IF v_use_count >= v_max_uses THEN RETURN jsonb_build_object('ok', false, 'error', 'used_up'); END IF;
  IF v_row.role <> _role THEN RETURN jsonb_build_object('ok', false, 'error', 'wrong_role'); END IF;
  IF v_row.expires_at IS NOT NULL AND v_row.expires_at < now() THEN RETURN jsonb_build_object('ok', false, 'error', 'expired'); END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_uid, _role) ON CONFLICT (user_id, role) DO NOTHING;
  UPDATE public.access_codes SET use_count = v_use_count + 1, used = (v_use_count + 1) >= v_max_uses, used_by = v_uid WHERE id = v_row.id;
  IF _role = 'admin' THEN
    INSERT INTO public.security_alerts (alert_type, severity, title, description, user_id)
    VALUES ('admin_granted', 'high', 'New administrator added', 'An admin access code was used to create a new administrator.', v_uid);
  END IF;
  RETURN jsonb_build_object('ok', true, 'role', v_row.role);
END;
$function$;

-- 4. Alert on every new admin role, however it was granted
CREATE OR REPLACE FUNCTION public.alert_on_admin_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.role = 'admin' THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    SELECT ur.user_id, 'Security: new administrator',
           'A new administrator account was just added. If this was not you or your team, remove it in Admin → Users immediately.', 'warning'
    FROM public.user_roles ur WHERE ur.role = 'admin' AND ur.user_id <> NEW.user_id;
  END IF;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.alert_on_admin_role() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_alert_on_admin_role ON public.user_roles;
CREATE TRIGGER trg_alert_on_admin_role AFTER INSERT ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.alert_on_admin_role();

-- 5. Admin access code ADMIN2026 is public knowledge from setup; retire any unused copies
UPDATE public.access_codes SET deleted_at = now()
 WHERE upper(code) = 'ADMIN2026' AND deleted_at IS NULL AND EXISTS (SELECT 1 FROM public.user_roles WHERE role='admin');