import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Monitor, Smartphone } from "lucide-react";
import { format } from "date-fns";

const deviceOf = (ua: string | null) => {
  if (!ua) return "Unknown device";
  const os = /Android/i.test(ua) ? "Android" : /iPhone|iPad/i.test(ua) ? "iOS" : /Windows/i.test(ua) ? "Windows" : /Mac/i.test(ua) ? "macOS" : /Linux/i.test(ua) ? "Linux" : "Other";
  const br = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  return `${br} on ${os}`;
};

const LoginHistory = ({ showAll = false }: { showAll?: boolean }) => {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    let q = supabase.from("login_events").select("*").order("created_at", { ascending: false }).limit(showAll ? 100 : 20);
    if (!showAll) q = q.eq("user_id", user.id);
    q.then(({ data }) => setRows(data || []));
  }, [user, showAll]);

  const uniqueIps = new Set(rows.map((r) => r.ip_address).filter(Boolean)).size;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg"><Globe className="w-5 h-5" /> {showAll ? "All Sign-ins" : "My Sign-in History"}</CardTitle>
        <p className="text-sm text-muted-foreground">{rows.length} recent sign-ins from {uniqueIps} IP address{uniqueIps === 1 ? "" : "es"}. Don't recognise one? Change your password.</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.length === 0 && <p className="text-sm text-muted-foreground">No sign-ins recorded yet.</p>}
        {rows.map((r) => {
          const mobile = /Android|iPhone|iPad/i.test(r.user_agent || "");
          const Icon = mobile ? Smartphone : Monitor;
          return (
            <div key={r.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
              <Icon className="w-4 h-4 mt-1 text-muted-foreground" />
              <div className="flex-1 min-w-0 text-sm">
                {showAll && <p className="font-medium truncate">{r.email}</p>}
                <p className="font-mono">{r.ip_address || "IP unknown"}{(r.city || r.country) && <span className="font-sans text-muted-foreground"> · {[r.city, r.country].filter(Boolean).join(", ")}</span>}</p>
                <p className="text-xs text-muted-foreground">{deviceOf(r.user_agent)} · {r.method} · {format(new Date(r.created_at), "d MMM yyyy, HH:mm")}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default LoginHistory;
