import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useFinanceAccess() {
  const { user, role, loading } = useAuth();
  const [positions, setPositions] = useState<string[] | null>(null);

  useEffect(() => {
    if (!user) { setPositions(loading ? null : []); return; }
    supabase.from("staff_positions").select("position").eq("user_id", user.id)
      .then(({ data }) => setPositions((data || []).map((d: any) => d.position)));
  }, [user, loading]);

  const isAdmin = role === "admin";
  const isBursar = positions?.includes("bursar") ?? false;
  const isHeadmaster = positions?.includes("headmaster") ?? false;
  return {
    ready: !loading && positions !== null && (!user || role !== null),
    isAdmin, isBursar, isHeadmaster,
    canManage: isAdmin || isBursar,
    canView: isAdmin || isBursar || isHeadmaster,
    layoutRole: (role || "teacher") as "admin" | "teacher" | "student" | "parent",
  };
}

export const FinanceRoute = ({ children, manage = false }: { children: React.ReactNode; manage?: boolean }) => {
  const { user } = useAuth();
  const a = useFinanceAccess();
  if (!user && a.ready) return <Navigate to="/login" replace />;
  if (!a.ready) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>;
  if (manage ? !a.canManage : !a.canView) return <Navigate to={`/${a.layoutRole}`} replace />;
  return <>{children}</>;
};
