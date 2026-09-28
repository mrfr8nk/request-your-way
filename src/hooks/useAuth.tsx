import { useState, useEffect, createContext, useContext } from "react";
import type { ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin" | "teacher" | "student" | "parent";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: AppRole | null;
  profile: { full_name: string; email: string; avatar_url: string | null } | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  role: null,
  profile: null,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole | null>(null);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);

  const fetchRoleAndProfile = async (userId: string) => {
    const [roleRes, profileRes] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId).limit(1).single(),
      supabase.from("profiles").select("full_name, email, avatar_url, is_banned").eq("user_id", userId).single(),
    ]);
    if (profileRes.data?.is_banned) {
      await supabase.auth.signOut();
      setUser(null); setSession(null); setRole(null); setProfile(null);
      alert("Your account has been banned. Please contact the school administration.");
      return;
    }
    if (roleRes.data) setRole(roleRes.data.role as AppRole);
    if (profileRes.data) {
      setProfile(profileRes.data);
    } else {
      // Self-heal: create a missing profile so the user shows by name everywhere
      const { data: { user: u } } = await supabase.auth.getUser();
      const full_name = (u?.user_metadata?.full_name || u?.user_metadata?.name || u?.email?.split("@")[0] || "") as string;
      const { data: created } = await supabase.from("profiles")
        .insert({ user_id: userId, full_name, email: u?.email ?? null })
        .select("full_name, email, avatar_url, is_banned").maybeSingle();
      if (created) setProfile(created);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        setTimeout(() => fetchRoleAndProfile(sess.user.id), 0);
        // Log login activity
        if (event === "SIGNED_IN") {
          setTimeout(() => {
            supabase.from("activity_log").insert({
              user_id: sess.user.id,
              action: "Logged in",
              details: `Email: ${sess.user.email} | ${new Date().toLocaleString()}`,
              entity_type: "auth",
            }).then(() => {});
            supabase.functions.invoke("log-login", { body: { method: sess.user.app_metadata?.provider || "password" } }).catch(() => {});
          }, 500);
        }
      } else {
        setRole(null);
        setProfile(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        fetchRoleAndProfile(sess.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, role, profile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
