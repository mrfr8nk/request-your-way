import { useEffect, useState } from "react";
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
import { CalendarDays, Plus, MapPin, Clock, Trash2 } from "lucide-react";

interface Event { id: string; title: string; description?: string; event_type: string; starts_at: string; ends_at?: string; location?: string; is_public: boolean; }

const TYPE_COLORS: Record<string, string> = {
  exam: "bg-destructive/20 text-destructive border-destructive/30",
  holiday: "bg-success/20 text-success border-success/30",
  sports: "bg-accent/30 text-accent-foreground border-accent/50",
  meeting: "bg-secondary/30 text-secondary-foreground border-secondary/50",
  general: "bg-primary/15 text-primary border-primary/30",
};

export default function EventsPage({ role }: { role: "admin" | "teacher" | "student" | "parent" }) {
  const { user } = useAuth();
  const isAdmin = role === "admin";
  const [events, setEvents] = useState<Event[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Event>>({ event_type: "general", is_public: true });

  const load = async () => {
    const { data } = await supabase.from("school_events").select("*").order("starts_at");
    setEvents((data as Event[]) || []);
  };
  useEffect(() => { load(); }, []);

  const upcoming = events.filter((e) => new Date(e.starts_at) >= new Date(Date.now() - 86400000));
  const past = events.filter((e) => new Date(e.starts_at) < new Date(Date.now() - 86400000));

  const save = async () => {
    if (!form.title || !form.starts_at) return toast.error("Title & start required");
    const { error } = await supabase.from("school_events").insert({
      title: form.title!, description: form.description, event_type: form.event_type || "general",
      starts_at: form.starts_at!, ends_at: form.ends_at, location: form.location,
      is_public: form.is_public ?? true, created_by: user?.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Event created");
    setOpen(false); setForm({ event_type: "general", is_public: true });
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("school_events").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed"); load();
  };

  const renderEvent = (e: Event) => (
    <Card key={e.id} className="hover:shadow-card-hover transition-all group">
      <CardContent className="p-4 flex gap-4">
        <div className="flex flex-col items-center justify-center w-16 shrink-0 rounded-lg bg-primary/10 p-2">
          <div className="text-[10px] uppercase font-bold text-primary">{new Date(e.starts_at).toLocaleString("en", { month: "short" })}</div>
          <div className="text-2xl font-display font-bold text-primary">{new Date(e.starts_at).getDate()}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight">{e.title}</h3>
            <Badge className={`text-[10px] capitalize ${TYPE_COLORS[e.event_type] || TYPE_COLORS.general}`} variant="outline">{e.event_type}</Badge>
          </div>
          {e.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{e.description}</p>}
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(e.starts_at).toLocaleString("en", { hour: "2-digit", minute: "2-digit" })}</span>
            {e.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{e.location}</span>}
          </div>
        </div>
        {isAdmin && (
          <button onClick={() => remove(e.id)} className="opacity-0 group-hover:opacity-100 text-destructive transition-opacity self-start">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout role={role}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold flex items-center gap-2">
              <CalendarDays className="w-7 h-7 text-primary" /> Events Calendar
            </h1>
            <p className="text-muted-foreground text-sm">Exams, holidays, sports and meetings</p>
          </div>
          {isAdmin && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" /> New Event</Button></DialogTrigger>
              <DialogContent className="glass-strong">
                <DialogHeader><DialogTitle>Create Event</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div><Label>Title*</Label><Input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                  <div><Label>Description</Label><Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>Type</Label>
                      <Select value={form.event_type} onValueChange={(v) => setForm({ ...form, event_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["general", "exam", "holiday", "sports", "meeting"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Location</Label><Input value={form.location || ""} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>Starts*</Label><Input type="datetime-local" onChange={(e) => setForm({ ...form, starts_at: new Date(e.target.value).toISOString() })} /></div>
                    <div><Label>Ends</Label><Input type="datetime-local" onChange={(e) => setForm({ ...form, ends_at: e.target.value ? new Date(e.target.value).toISOString() : undefined })} /></div>
                  </div>
                </div>
                <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div>
          <h2 className="font-display text-lg mb-3">Upcoming ({upcoming.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {upcoming.length === 0 && <p className="text-muted-foreground text-sm">No upcoming events</p>}
            {upcoming.map(renderEvent)}
          </div>
        </div>

        {past.length > 0 && (
          <div>
            <h2 className="font-display text-lg mb-3 text-muted-foreground">Past ({past.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 opacity-70">
              {past.slice(0, 10).map(renderEvent)}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
