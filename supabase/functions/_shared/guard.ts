import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export type Caller = { isService: boolean; userId: string | null; roles: string[]; positions: string[] };

/** Identify who is calling an edge function. Service-role callers are other edge functions. */
export async function getCaller(req: Request): Promise<Caller> {
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (token && serviceKey && token === serviceKey) return { isService: true, userId: null, roles: [], positions: [] };
  if (!token) return { isService: false, userId: null, roles: [], positions: [] };
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey);
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return { isService: false, userId: null, roles: [], positions: [] };
  const uid = data.user.id;
  const [{ data: r }, { data: p }, { data: prof }] = await Promise.all([
    admin.from("user_roles").select("role").eq("user_id", uid),
    admin.from("staff_positions").select("position").eq("user_id", uid),
    admin.from("profiles").select("is_banned").eq("user_id", uid).maybeSingle(),
  ]);
  if (prof?.is_banned) return { isService: false, userId: null, roles: [], positions: [] };
  return { isService: false, userId: uid, roles: (r || []).map((x: any) => x.role), positions: (p || []).map((x: any) => x.position) };
}

export const isStaff = (c: Caller) => c.isService || c.roles.includes("admin") || c.roles.includes("teacher");
export const isAdminOrFinance = (c: Caller) => c.isService || c.roles.includes("admin") || c.positions.includes("bursar");

export function deny(cors: Record<string, string>, status = 403) {
  return new Response(JSON.stringify({ error: status === 401 ? "Sign in required" : "Not allowed" }), {
    status, headers: { ...cors, "Content-Type": "application/json" },
  });
}

const ALLOWED_ORIGINS = [
  "https://stmarys.synapex.co.zw",
  "http://localhost:8080",
];
/** Only allow redirect links to the school's own sites. */
export function safeRedirect(url: string | undefined, fallback: string): string {
  if (!url) return fallback;
  try {
    const u = new URL(url);
    const ok = ALLOWED_ORIGINS.includes(u.origin) || /\.lovable\.app$|\.lovableproject\.com$|\.onrender\.com$/.test(u.hostname);
    return ok && u.protocol.startsWith("http") ? u.toString() : fallback;
  } catch { return fallback; }
}
