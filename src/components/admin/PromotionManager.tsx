import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, ArrowUpRight, GraduationCap, Loader2, RotateCcw, Eye } from "lucide-react";

const ALL = "all";
const levelLabel: Record<string, string> = { zjc: "ZJC", o_level: "O Level", a_level: "A Level" };

async function call(body: any) {
  const { data: { session } } = await supabase.auth.getSession();
  const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/promote-students`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
    body: JSON.stringify(body),
  });
  const json = await resp.json();
  if (!resp.ok) throw new Error(json.error || "Request failed");
  return json;
}

export default function PromotionManager({ academicYear }: { academicYear: number }) {
  const { toast } = useToast();
  const [level, setLevel] = useState(ALL);
  const [form, setForm] = useState(ALL);
  const [classId, setClassId] = useState(ALL);
  const [classes, setClasses] = useState<any[]>([]);
  const [preview, setPreview] = useState<any>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<any>(null);
  const [undoOpen, setUndoOpen] = useState(false);

  const filters = () => ({
    level: level === ALL ? undefined : level,
    form: form === ALL ? undefined : Number(form),
    class_id: classId === ALL ? undefined : classId,
  });

  const loadStatus = () => call({ action: "status" }).then((r) => setSnapshot(r.snapshot)).catch(() => {});

  useEffect(() => {
    supabase.from("classes").select("id, name, form, level").is("deleted_at", null).order("form")
      .then(({ data }) => setClasses(data || []));
    loadStatus();
  }, []);

  const doPreview = async () => {
    setBusy("preview");
    try { setPreview(await call({ action: "preview", ...filters() })); }
    catch (e: any) { toast({ title: "Preview failed", description: e.message, variant: "destructive" }); }
    setBusy(null);
  };

  const doPromote = async () => {
    setBusy("promote");
    try {
      const r = await call({ action: "promote", academic_year: academicYear, ...filters() });
      toast({ title: "Promotion complete", description: `${r.promoted} promoted, ${r.graduated} graduated. You can undo this.` });
      setPreview(null);
      loadStatus();
    } catch (e: any) { toast({ title: "Promotion error", description: e.message, variant: "destructive" }); }
    setBusy(null);
  };

  const doUndo = async () => {
    setUndoOpen(false);
    setBusy("undo");
    try {
      const r = await call({ action: "undo" });
      toast({ title: "Promotion undone", description: `${r.restored} students restored to their old form, class and status.` });
      loadStatus();
    } catch (e: any) { toast({ title: "Undo failed", description: e.message, variant: "destructive" }); }
    setBusy(null);
  };

  const filteredClasses = classes.filter((c) => (level === ALL || c.level === level) && (form === ALL || String(c.form) === form));

  return (
    <Card className="border-l-4 border-l-amber-500">
      <CardHeader><CardTitle className="flex items-center gap-2"><GraduationCap className="w-5 h-5" /> Student Promotion</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Choose who to promote, preview the result, then confirm. Form 4 and Form 6 students graduate. Every promotion saves a snapshot so it can be undone, classes included.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select value={level} onValueChange={(v) => { setLevel(v); setClassId(ALL); setPreview(null); }}>
            <SelectTrigger><SelectValue placeholder="Level" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All levels</SelectItem>
              <SelectItem value="zjc">ZJC</SelectItem>
              <SelectItem value="o_level">O Level</SelectItem>
              <SelectItem value="a_level">A Level</SelectItem>
            </SelectContent>
          </Select>
          <Select value={form} onValueChange={(v) => { setForm(v); setClassId(ALL); setPreview(null); }}>
            <SelectTrigger><SelectValue placeholder="Form" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All forms</SelectItem>
              {[1, 2, 3, 4, 5, 6].map((f) => <SelectItem key={f} value={String(f)}>Form {f}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={classId} onValueChange={(v) => { setClassId(v); setPreview(null); }}>
            <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All classes</SelectItem>
              {filteredClasses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={doPreview} disabled={!!busy}>
            {busy === "preview" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />} Preview
          </Button>
          {snapshot && !snapshot.undone && (
            <Button variant="outline" onClick={() => setUndoOpen(true)} disabled={!!busy} className="border-destructive text-destructive">
              {busy === "undo" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />} Undo last promotion
            </Button>
          )}
        </div>
        {snapshot && (
          <p className="text-xs text-muted-foreground">
            Last promotion: {new Date(snapshot.at).toLocaleString()} · {snapshot.count} students{snapshot.undone ? " · undone" : ""}
          </p>
        )}

        {preview && (
          <div className="rounded-lg border p-3 space-y-3">
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant="secondary">{preview.total} selected</Badge>
              <Badge>{preview.promoted} will move up</Badge>
              <Badge variant="destructive">{preview.graduated} will graduate</Badge>
            </div>
            <div className="max-h-64 overflow-auto text-sm divide-y">
              {preview.students.map((s: any) => (
                <div key={s.student_id} className="flex justify-between gap-2 py-1.5">
                  <span className="truncate"><span className="font-mono text-xs text-muted-foreground mr-2">{s.student_id}</span>{s.name}</span>
                  <span className="whitespace-nowrap text-muted-foreground">
                    {s.from.replace(/^(\w+)/, (m: string) => levelLabel[m] || m)} → <strong className={s.outcome === "graduated" ? "text-destructive" : "text-foreground"}>{s.to.replace(/^(\w+)/, (m: string) => levelLabel[m] || m)}</strong>
                  </span>
                </div>
              ))}
              {preview.total === 0 && <p className="py-2 text-muted-foreground">No active students match these filters.</p>}
            </div>
            {preview.total > 0 && (
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setPreview(null)}>Cancel</Button>
                <Button className="flex-1" onClick={doPromote} disabled={!!busy}>
                  {busy === "promote" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowUpRight className="w-4 h-4 mr-2" />} Confirm promotion
                </Button>
              </div>
            )}
          </div>
        )}

        <Dialog open={undoOpen} onOpenChange={setUndoOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-destructive" /> Undo last promotion?</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">
              {snapshot?.count} students will go back to the form, class and status they had before the promotion on {snapshot && new Date(snapshot.at).toLocaleString()}.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setUndoOpen(false)}>Cancel</Button>
              <Button variant="destructive" className="flex-1" onClick={doUndo}>Undo promotion</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
