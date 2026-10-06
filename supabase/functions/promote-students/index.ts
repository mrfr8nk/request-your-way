import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_FORM: Record<string, number> = { zjc: 2, o_level: 4, a_level: 6 };
const NEXT_LEVEL: Record<string, { level: string; form: number } | null> = {
  zjc: { level: "o_level", form: 3 },
  o_level: null,
  a_level: null,
};
const SNAPSHOT_KEY = "last_promotion_snapshot";
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { data: role } = await admin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!role) throw new Error("Admin access required");

    const body = await req.json().catch(() => ({}));
    const { academic_year, action = "promote", level, form, class_id } = body;

    // ---- Status of last snapshot ----
    if (action === "status") {
      const { data } = await admin.from("system_settings").select("value, updated_at").eq("key", SNAPSHOT_KEY).maybeSingle();
      if (!data) return json({ snapshot: null });
      const snap = JSON.parse(data.value);
      return json({ snapshot: { at: snap.at, count: snap.rows?.length || 0, filters: snap.filters, undone: !!snap.undone } });
    }

    // ---- Undo ----
    if (action === "undo") {
      const { data } = await admin.from("system_settings").select("value").eq("key", SNAPSHOT_KEY).maybeSingle();
      if (!data) throw new Error("No promotion to undo");
      const snap = JSON.parse(data.value);
      if (snap.undone) throw new Error("Last promotion was already undone");
      for (const r of snap.rows) {
        await admin.from("student_profiles").update({
          form: r.form, level: r.level, class_id: r.class_id, is_active: r.is_active,
          graduation_status: r.graduation_status, updated_at: new Date().toISOString(),
        }).eq("id", r.id);
      }
      snap.undone = true;
      await admin.from("system_settings").update({ value: JSON.stringify(snap), updated_at: new Date().toISOString(), updated_by: user.id }).eq("key", SNAPSHOT_KEY);
      await admin.from("activity_log").insert({
        user_id: user.id, action: `Undid last promotion (${snap.rows.length} students restored)`,
        entity_type: "promotion", details: `Snapshot from ${snap.at}`,
      });
      return json({ success: true, restored: snap.rows.length });
    }

    // ---- Select students with filters ----
    let q = admin.from("student_profiles").select("id, user_id, student_id, form, level, is_active, class_id, graduation_status").eq("is_active", true);
    if (level) q = q.eq("level", level);
    if (form) q = q.eq("form", Number(form));
    if (class_id) q = q.eq("class_id", class_id);
    const { data: students, error } = await q;
    if (error) throw error;
    const list = students || [];

    const ids = list.map((s) => s.user_id);
    const { data: profs } = ids.length
      ? await admin.from("profiles").select("user_id, full_name").in("user_id", ids)
      : { data: [] as any[] };
    const nameMap: Record<string, string> = {};
    (profs || []).forEach((p: any) => (nameMap[p.user_id] = p.full_name));

    const plan = list.map((s) => {
      const max = MAX_FORM[s.level] || 6;
      if (s.form >= max) {
        const next = NEXT_LEVEL[s.level];
        if (next) return { s, outcome: "promoted", to: { level: next.level, form: next.form } };
        return { s, outcome: "graduated", to: null };
      }
      return { s, outcome: "promoted", to: { level: s.level, form: s.form + 1 } };
    });

    if (action === "preview") {
      return json({
        total: plan.length,
        promoted: plan.filter((p) => p.outcome === "promoted").length,
        graduated: plan.filter((p) => p.outcome === "graduated").length,
        students: plan.map((p) => ({
          student_id: p.s.student_id, name: nameMap[p.s.user_id] || "—",
          from: `${p.s.level} F${p.s.form}`, outcome: p.outcome,
          to: p.to ? `${p.to.level} F${p.to.form}` : "Graduated",
        })),
      });
    }

    if (!academic_year) throw new Error("academic_year is required");
    if (plan.length === 0) return json({ success: true, promoted: 0, graduated: 0, message: "No matching students" });

    // Save snapshot BEFORE changing anything
    const snapshot = {
      at: new Date().toISOString(), by: user.id, academic_year,
      filters: { level: level || null, form: form || null, class_id: class_id || null },
      rows: list.map((s) => ({ id: s.id, form: s.form, level: s.level, class_id: s.class_id, is_active: s.is_active, graduation_status: s.graduation_status })),
    };
    const { error: snapErr } = await admin.from("system_settings").upsert(
      { key: SNAPSHOT_KEY, value: JSON.stringify(snapshot), updated_at: new Date().toISOString(), updated_by: user.id },
      { onConflict: "key" },
    );
    if (snapErr) throw new Error("Could not save undo snapshot: " + snapErr.message);

    let promoted = 0, graduated = 0;
    for (const p of plan) {
      const now = new Date().toISOString();
      if (p.outcome === "graduated") {
        await admin.from("student_profiles").update({ is_active: false, graduation_status: "graduated", updated_at: now }).eq("id", p.s.id);
        graduated++;
      } else {
        await admin.from("student_profiles").update({
          level: p.to!.level, form: p.to!.form, class_id: null,
          graduation_status: p.to!.level !== p.s.level ? "promoted" : null, updated_at: now,
        }).eq("id", p.s.id);
        promoted++;
      }
    }

    await admin.from("activity_log").insert({
      user_id: user.id, action: `Promoted ${promoted} students, graduated ${graduated} students for ${academic_year}`,
      entity_type: "promotion", details: `Filters: ${JSON.stringify(snapshot.filters)}. Promoted: ${promoted}, Graduated: ${graduated}`,
    });
    return json({ success: true, promoted, graduated, total: plan.length });
  } catch (error) {
    console.error("promote-students:", error);
    return json({ error: (error as Error).message }, 500);
  }
});
