import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch active student_profiles for a given class.
 * Includes students explicitly assigned via class_id AND active students
 * whose class_id is null but whose form + level dynamically match the class.
 * This avoids "no students" issues when admins haven't yet pinned students to a class.
 */
export async function fetchClassStudents(classId: string) {
  if (!classId) return [];

  const { data: cls } = await supabase
    .from("classes")
    .select("id, form, level")
    .eq("id", classId)
    .maybeSingle();

  const { data: assigned } = await supabase
    .from("student_profiles")
    .select("*")
    .eq("class_id", classId)
    .eq("is_active", true);

  let dynamic: any[] = [];
  if (cls) {
    const { data: dyn } = await supabase
      .from("student_profiles")
      .select("*")
      .is("class_id", null)
      .eq("is_active", true)
      .eq("form", cls.form)
      .eq("level", cls.level as any);
    dynamic = dyn || [];
  }

  // Dedupe by user_id (assigned wins)
  const map = new Map<string, any>();
  [...(assigned || []), ...dynamic].forEach((s) => {
    if (!map.has(s.user_id)) map.set(s.user_id, s);
  });
  return Array.from(map.values());
}

/** Fetch enriched students with profile (full_name, email, phone) */
export async function fetchClassStudentsWithProfiles(classId: string) {
  const sp = await fetchClassStudents(classId);
  if (sp.length === 0) return [];
  const userIds = sp.map((s) => s.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, full_name, email, phone, avatar_url")
    .in("user_id", userIds);
  const map: Record<string, any> = {};
  (profiles || []).forEach((p) => { map[p.user_id] = p; });
  return sp.map((s) => ({ ...s, profiles: map[s.user_id] || null }));
}
