import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { useFinanceAccess } from "@/hooks/useFinanceAccess";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Layers, Plus, Trash2, FileStack } from "lucide-react";
import { getTermFromDate } from "@/components/admin/fees/FeeConstants";

export const FEE_CATEGORIES = [
  "tuition", "development_levy", "registration", "examination", "sports", "ict",
  "library", "transport", "uniform", "trip", "textbooks", "other",
];
export const catLabel = (c: string) => c.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
const LEVELS = [{ v: "zjc", l: "ZJC" }, { v: "o_level", l: "O-Level" }, { v: "a_level", l: "A-Level" }];
const TERMS = ["term_1", "term_2", "term_3"];
const sel = "border border-input rounded-md px-3 py-2 bg-background text-sm";

/** Items that apply to a student: matching year/term (or all terms), level (or all), form (or all). */
export const itemsFor = (items: any[], level: string, form: number, term: string, year: number) =>
  items.filter((i) => i.academic_year === year && (!i.term || i.term === term) && (!i.level || i.level === level) && (!i.form || i.form === form));

const FeeStructure = () => {
  const { toast } = useToast();
  const { layoutRole } = useFinanceAccess();
  const year0 = new Date().getFullYear();
  const [items, setItems] = useState<any[]>([]);
  const [year, setYear] = useState(year0);
  const [term, setTerm] = useState(getTermFromDate());
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ name: "", category: "tuition", amount: "", level: "", form: "", term: "", optional: false });

  const load = async () => {
    const { data } = await supabase.from("fee_items").select("*").eq("academic_year", year).order("category");
    setItems(data || []);
  };
  useEffect(() => { load(); }, [year]);

  const add = async () => {
    if (!f.name.trim() || !Number(f.amount)) { toast({ title: "Name and amount required", variant: "destructive" }); return; }
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("fee_items").insert({
      name: f.name.trim(), category: f.category, amount: Number(f.amount),
      level: (f.level || null) as any, form: f.form ? Number(f.form) : null, term: (f.term || null) as any,
      academic_year: year, is_optional: f.optional, created_by: u.user?.id,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setF({ ...f, name: "", amount: "" });
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("fee_items").delete().eq("id", id);
    load();
  };

  const preview = useMemo(() => {
    const out: { label: string; total: number }[] = [];
    LEVELS.forEach((lv) => {
      const forms = lv.v === "zjc" ? [1, 2] : lv.v === "o_level" ? [3, 4] : [5, 6];
      forms.forEach((fm) => {
        const total = itemsFor(items, lv.v, fm, term, year).filter((i) => !i.is_optional).reduce((s, i) => s + Number(i.amount), 0);
        out.push({ label: `Form ${fm}`, total });
      });
    });
    return out;
  }, [items, term, year]);

  const generate = async () => {
    setBusy(true);
    const [{ data: students }, { data: existing }] = await Promise.all([
      supabase.from("student_profiles").select("user_id, level, form, is_active, graduation_status"),
      supabase.from("fee_records").select("id, student_id").eq("term", term as any).eq("academic_year", year).is("deleted_at", null),
    ]);
    const exMap = new Map((existing || []).map((r: any) => [r.student_id, r.id]));
    let created = 0, updated = 0;
    for (const s of (students || []).filter((s: any) => s.is_active !== false && s.graduation_status !== "graduated")) {
      const due = itemsFor(items, s.level, s.form, term, year).filter((i) => !i.is_optional).reduce((a, i) => a + Number(i.amount), 0);
      if (!due) continue;
      const id = exMap.get(s.user_id);
      if (id) { await supabase.from("fee_records").update({ amount_due: due }).eq("id", id); updated++; }
      else { await supabase.from("fee_records").insert({ student_id: s.user_id, term: term as any, academic_year: year, amount_due: due, amount_paid: 0 }); created++; }
    }
    setBusy(false);
    toast({ title: "Invoices generated", description: `${created} new, ${updated} updated for ${catLabel(term)} ${year}` });
  };

  return (
    <DashboardLayout role={layoutRole}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Finance</p>
            <h1 className="font-display text-3xl font-bold text-foreground">Fee Structure</h1>
            <p className="text-sm text-muted-foreground">Itemised charges per form and term. Blank level/form/term means it applies to all.</p>
          </div>
          <div className="flex gap-2">
            <select className={sel} value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {[year0 - 1, year0, year0 + 1].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <select className={sel} value={term} onChange={(e) => setTerm(e.target.value)}>
              {TERMS.map((t) => <option key={t} value={t}>{catLabel(t)}</option>)}
            </select>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="w-4 h-4" /> Add charge</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-4">
            <Input placeholder="Name e.g. ICT Levy" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <select className={sel} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
              {FEE_CATEGORIES.map((c) => <option key={c} value={c}>{catLabel(c)}</option>)}
            </select>
            <Input type="number" placeholder="Amount (USD)" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
            <select className={sel} value={f.level} onChange={(e) => setF({ ...f, level: e.target.value })}>
              <option value="">All levels</option>
              {LEVELS.map((l) => <option key={l.v} value={l.v}>{l.l}</option>)}
            </select>
            <select className={sel} value={f.form} onChange={(e) => setF({ ...f, form: e.target.value })}>
              <option value="">All forms</option>
              {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>Form {n}</option>)}
            </select>
            <select className={sel} value={f.term} onChange={(e) => setF({ ...f, term: e.target.value })}>
              <option value="">Every term</option>
              {TERMS.map((t) => <option key={t} value={t}>{catLabel(t)}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.optional} onChange={(e) => setF({ ...f, optional: e.target.checked })} /> Optional (not auto-billed)</label>
            <Button onClick={add}>Add charge</Button>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="flex items-center gap-2"><Layers className="w-4 h-4" /> Charges for {year}</CardTitle></CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Charge</TableHead><TableHead>Applies to</TableHead><TableHead>Term</TableHead><TableHead className="text-right">Amount</TableHead><TableHead /></TableRow></TableHeader>
                <TableBody>
                  {items.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No charges yet.</TableCell></TableRow> :
                    items.map((i) => (
                      <TableRow key={i.id}>
                        <TableCell><p className="font-medium">{i.name}</p><p className="text-xs text-muted-foreground">{catLabel(i.category)}{i.is_optional ? " · optional" : ""}</p></TableCell>
                        <TableCell className="text-sm">{i.level ? LEVELS.find((l) => l.v === i.level)?.l : "All levels"}{i.form ? ` · Form ${i.form}` : ""}</TableCell>
                        <TableCell className="text-sm">{i.term ? catLabel(i.term) : "Every term"}</TableCell>
                        <TableCell className="text-right font-semibold">${Number(i.amount).toFixed(2)}</TableCell>
                        <TableCell><Button size="icon" variant="ghost" onClick={() => remove(i.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileStack className="w-4 h-4" /> {catLabel(term)} invoice per form</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {preview.map((p) => (
                <div key={p.label} className="flex justify-between text-sm border-b border-border pb-1"><span>{p.label}</span><span className="font-semibold">${p.total.toFixed(2)}</span></div>
              ))}
              <Button className="w-full mt-3" disabled={busy} onClick={generate}>{busy ? "Generating..." : "Generate / update invoices"}</Button>
              <p className="text-xs text-muted-foreground">Creates a fee record for each active student, or updates the amount due if one already exists. Payments already made are kept.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FeeStructure;
