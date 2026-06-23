import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Plus, Trash2, CalendarDays } from "lucide-react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface Entry {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string | null;
}

export default function TimetablePage({ role }: { role: "admin" | "teacher" | "student" | "parent" }) {
  const { user } = useAuth();
  const isAdmin = role === "admin";
  const [entries, setEntries] = useState<Entry[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Entry>>({ day_of_week: 1, start_time: "08:00", end_time: "08:40" });
  const [loading, setLoading] = useState(true);

  const myClassId = useMemo(() => null as string | null, []);

  const load = async () => {
    setLoading(true);
    const [{ data: e }, { data: c }, { data: s }, { data: t }] = await Promise.all([
      supabase.from("timetable_entries").select("*").order("day_of_week").order("start_time"),
      supabase.from("classes").select("id,name,form,stream").is("deleted_at", null).order("form"),
      supabase.from("subjects").select("id,name,code").is("deleted_at", null).order("name"),
      supabase.from("profiles").select("user_id,full_name"),
    ]);
    setEntries((e as Entry[]) || []);
    setClasses(c || []);
    setSubjects(s || []);
    setTeachers(t || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Auto-scope for student
  useEffect(() => {
    if (role === "student" && user) {
      supabase.from("student_profiles").select("class_id").eq("user_id", user.id).maybeSingle().then(({ data }) => {
        if (data?.class_id) setSelectedClass(data.class_id);
      });
    }
  }, [role, user]);

  const filtered = selectedClass === "all" ? entries : entries.filter((e) => e.class_id === selectedClass);

  const byDay = (d: number) => filtered.filter((e) => e.day_of_week === d);

  const className = (id: string) => {
    const c = classes.find((x) => x.id === id);
    return c ? `${c.name}${c.stream ? " " + c.stream : ""}` : "—";
  };
  const subjectName = (id: string) => subjects.find((x) => x.id === id)?.name || "—";
  const teacherName = (id: string | null) => (id ? teachers.find((x) => x.user_id === id)?.full_name : "Unassigned");

  const save = async () => {
    if (!form.class_id || !form.subject_id || !form.start_time || !form.end_time) {
      toast.error("Fill all required fields");
      return;
    }
    const { error } = await supabase.from("timetable_entries").insert({
      class_id: form.class_id,
      subject_id: form.subject_id,
      teacher_id: form.teacher_id || null,
      day_of_week: Number(form.day_of_week),
      start_time: form.start_time,
      end_time: form.end_time,
      room: form.room || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Period added");
    setOpen(false);
    setForm({ day_of_week: 1, start_time: "08:00", end_time: "08:40" });
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("timetable_entries").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed");
    load();
  };

  return (
    <DashboardLayout role={role}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-2">
              <CalendarDays className="w-7 h-7 text-primary" /> Timetable
            </h1>
            <p className="text-muted-foreground text-sm">Weekly class schedule</p>
          </div>
          <div className="flex gap-2">
            {(role === "admin" || role === "teacher" || role === "parent") && (
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-[180px] glass"><SelectValue placeholder="All classes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All classes</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}{c.stream ? ` ${c.stream}` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {isAdmin && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" /> Period</Button></DialogTrigger>
                <DialogContent className="glass-strong">
                  <DialogHeader><DialogTitle>Add Period</DialogTitle></DialogHeader>
                  <div className="grid gap-3">
                    <div><Label>Class</Label>
                      <Select value={form.class_id} onValueChange={(v) => setForm({ ...form, class_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}{c.stream ? ` ${c.stream}` : ""}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>Subject</Label>
                      <Select value={form.subject_id} onValueChange={(v) => setForm({ ...form, subject_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>Teacher</Label>
                      <Select value={form.teacher_id || ""} onValueChange={(v) => setForm({ ...form, teacher_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                        <SelectContent>{teachers.map((t) => <SelectItem key={t.user_id} value={t.user_id}>{t.full_name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div><Label>Day</Label>
                        <Select value={String(form.day_of_week)} onValueChange={(v) => setForm({ ...form, day_of_week: Number(v) })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{DAYS.map((d, i) => <SelectItem key={i} value={String(i + 1)}>{d}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div><Label>Start</Label><Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} /></div>
                      <div><Label>End</Label><Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} /></div>
                    </div>
                    <div><Label>Room</Label><Input value={form.room || ""} onChange={(e) => setForm({ ...form, room: e.target.value })} placeholder="e.g. Room 12" /></div>
                  </div>
                  <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3">
          {DAYS.map((d, i) => (
            <Card key={d} className="min-h-[180px]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-display flex items-center justify-between">
                  {d}
                  <Badge variant="secondary" className="text-[10px]">{byDay(i + 1).length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {byDay(i + 1).length === 0 && <p className="text-xs text-muted-foreground italic">No periods</p>}
                {byDay(i + 1).map((p) => (
                  <div key={p.id} className="glass rounded-lg p-2 text-xs space-y-0.5 group relative">
                    <div className="font-semibold text-primary">{p.start_time.slice(0, 5)}–{p.end_time.slice(0, 5)}</div>
                    <div className="font-medium">{subjectName(p.subject_id)}</div>
                    <div className="text-muted-foreground">{className(p.class_id)}</div>
                    {p.room && <div className="text-muted-foreground">📍 {p.room}</div>}
                    <div className="text-muted-foreground text-[10px]">{teacherName(p.teacher_id)}</div>
                    {isAdmin && (
                      <button onClick={() => remove(p.id)} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-destructive">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
        {loading && <p className="text-center text-muted-foreground">Loading…</p>}
      </div>
    </DashboardLayout>
  );
}
