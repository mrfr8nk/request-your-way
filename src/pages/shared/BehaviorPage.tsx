import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Award, Plus, TrendingUp, TrendingDown } from "lucide-react";

interface Point { id: string; student_id: string; awarded_by: string; points: number; category: string; reason: string; created_at: string; }

export default function BehaviorPage({ role }: { role: "admin" | "teacher" | "student" | "parent" }) {
  const { user } = useAuth();
  const canAward = role === "admin" || role === "teacher";
  const [points, setPoints] = useState<Point[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Point>>({ points: 1, category: "participation" });

  const load = async () => {
    const [{ data: p }, { data: s }] = await Promise.all([
      supabase.from("behavior_points").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("profiles").select("user_id,full_name"),
    ]);
    setPoints((p as Point[]) || []);
    setStudents(s || []);
  };
  useEffect(() => { load(); }, []);

  const studentName = (id: string) => students.find((s) => s.user_id === id)?.full_name || id.slice(0, 8);

  const totals = useMemo(() => {
    const t: Record<string, number> = {};
    points.forEach((p) => { t[p.student_id] = (t[p.student_id] || 0) + p.points; });
    return t;
  }, [points]);

  const save = async () => {
    if (!form.student_id || !form.reason || !form.points) return toast.error("Missing fields");
    const { error } = await supabase.from("behavior_points").insert({
      student_id: form.student_id!, awarded_by: user!.id,
      points: form.points!, category: form.category || "general", reason: form.reason!,
    });
    if (error) return toast.error(error.message);
    toast.success("Recorded"); setOpen(false); setForm({ points: 1, category: "participation" });
    load();
  };

  const leaderboard = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 10);

  return (
    <DashboardLayout role={role}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold flex items-center gap-2">
              <Award className="w-7 h-7 text-secondary" /> Behavior & Merit Points
            </h1>
            <p className="text-muted-foreground text-sm">Recognise good behaviour and track demerits</p>
          </div>
          {canAward && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" /> Award Points</Button></DialogTrigger>
              <DialogContent className="glass-strong">
                <DialogHeader><DialogTitle>Award / Deduct Points</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div><Label>Student</Label>
                    <Select value={form.student_id} onValueChange={(v) => setForm({ ...form, student_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                      <SelectContent className="max-h-64">{students.map((s) => <SelectItem key={s.user_id} value={s.user_id}>{s.full_name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>Points (+/-)</Label><Input type="number" value={form.points} onChange={(e) => setForm({ ...form, points: +e.target.value })} /></div>
                    <div><Label>Category</Label>
                      <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{["participation", "academic", "leadership", "discipline", "attendance", "general"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div><Label>Reason</Label><Textarea value={form.reason || ""} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Helped a peer in class" /></div>
                </div>
                <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-lg">Recent Activity</CardTitle></CardHeader>
            <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
              {points.length === 0 && <p className="text-muted-foreground text-sm">No points recorded yet</p>}
              {points.map((p) => (
                <div key={p.id} className="glass rounded-lg p-3 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${p.points >= 0 ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}>
                    {p.points >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{studentName(p.student_id)}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.reason}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`font-bold ${p.points >= 0 ? "text-success" : "text-destructive"}`}>{p.points > 0 ? "+" : ""}{p.points}</div>
                    <Badge variant="outline" className="text-[10px] capitalize">{p.category}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Award className="w-5 h-5 text-secondary" /> Top Students</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {leaderboard.length === 0 && <p className="text-muted-foreground text-sm">No data</p>}
              {leaderboard.map(([id, total], i) => (
                <div key={id} className="flex items-center gap-3 glass rounded-lg p-2">
                  <div className="w-7 h-7 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-xs">{i + 1}</div>
                  <p className="flex-1 text-sm truncate">{studentName(id)}</p>
                  <span className={`font-bold ${total >= 0 ? "text-success" : "text-destructive"}`}>{total}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
