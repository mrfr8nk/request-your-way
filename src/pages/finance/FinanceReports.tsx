import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { useFinanceAccess } from "@/hooks/useFinanceAccess";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { exportCSV } from "@/lib/csv-export";
import { Download, Printer, UserCog, Trash2 } from "lucide-react";
import { methodLabel } from "@/components/admin/fees/FeeConstants";

const today = () => new Date().toISOString().split("T")[0];

const FinanceReports = () => {
  const { toast } = useToast();
  const { layoutRole, isAdmin } = useFinanceAccess();
  const [payments, setPayments] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());
  const [positions, setPositions] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [pos, setPos] = useState("bursar");

  const loadPositions = async () => {
    const { data } = await supabase.from("staff_positions").select("*");
    setPositions(data || []);
  };

  useEffect(() => {
    (async () => {
      const [p, r, s, pr] = await Promise.all([
        supabase.from("fee_payments").select("*").order("created_at", { ascending: false }).limit(5000),
        supabase.from("fee_records").select("*").is("deleted_at", null),
        supabase.from("student_profiles").select("user_id, form, level, student_id"),
        supabase.from("profiles").select("user_id, full_name"),
      ]);
      setPayments(p.data || []); setRecords(r.data || []); setStudents(s.data || []);
      setNames(Object.fromEntries((pr.data || []).map((x: any) => [x.user_id, x.full_name])));
    })();
    if (isAdmin) loadPositions();
  }, [isAdmin]);

  const inRange = useMemo(() => payments.filter((p) => {
    const d = p.created_at.slice(0, 10);
    return d >= from && d <= to;
  }), [payments, from, to]);
  const rangeTotal = inRange.reduce((s, p) => s + Number(p.amount_usd), 0);

  const byMethod = useMemo(() => {
    const m: Record<string, { n: number; t: number }> = {};
    inRange.forEach((p) => { (m[p.payment_method] ||= { n: 0, t: 0 }); m[p.payment_method].n++; m[p.payment_method].t += Number(p.amount_usd); });
    return Object.entries(m).sort((a, b) => b[1].t - a[1].t);
  }, [inRange]);

  const formOf = (uid: string) => students.find((s) => s.user_id === uid)?.form;
  const byForm = useMemo(() => {
    const m: Record<string, { due: number; paid: number; owing: number }> = {};
    records.forEach((r) => {
      const k = formOf(r.student_id) ? `Form ${formOf(r.student_id)}` : "Unassigned";
      (m[k] ||= { due: 0, paid: 0, owing: 0 });
      m[k].due += Number(r.amount_due); m[k].paid += Number(r.amount_paid);
      if (Number(r.amount_due) - Number(r.amount_paid) > 0.009) m[k].owing++;
    });
    return Object.entries(m).sort();
  }, [records, students]);

  const byTerm = useMemo(() => {
    const m: Record<string, { due: number; paid: number }> = {};
    records.forEach((r) => { const k = `${r.academic_year} ${r.term.replace("_", " ").toUpperCase()}`; (m[k] ||= { due: 0, paid: 0 }); m[k].due += Number(r.amount_due); m[k].paid += Number(r.amount_paid); });
    return Object.entries(m).sort().reverse();
  }, [records]);

  const outstanding = useMemo(() => records
    .map((r) => ({ ...r, bal: Number(r.amount_due) - Number(r.amount_paid) }))
    .filter((r) => r.bal > 0.009).sort((a, b) => b.bal - a.bal), [records]);

  const addPosition = async () => {
    const { data: prof } = await supabase.from("profiles").select("user_id").ilike("email", email.trim()).maybeSingle();
    if (!prof) { toast({ title: "No user with that email", variant: "destructive" }); return; }
    const { error } = await supabase.from("staff_positions").insert({ user_id: prof.user_id, position: pos });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setEmail(""); loadPositions(); toast({ title: "Position assigned" });
  };

  const money = (n: number) => `$${n.toFixed(2)}`;

  return (
    <DashboardLayout role={layoutRole}>
      <div className="space-y-6 print:space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Finance</p>
            <h1 className="font-display text-3xl font-bold text-foreground">Finance Reports</h1>
          </div>
          <Button variant="outline" onClick={() => window.print()} className="print:hidden"><Printer className="w-4 h-4 mr-1" /> Print / PDF</Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
            <CardTitle>Collections — {money(rangeTotal)} ({inRange.length} payments)</CardTitle>
            <div className="flex flex-wrap gap-2 print:hidden">
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
              <Button variant="outline" size="sm" onClick={() => exportCSV(`collections_${from}_${to}`, ["Date", "Student", "Receipt", "Method", "Currency", "Original", "USD"],
                inRange.map((p) => [p.created_at.slice(0, 16).replace("T", " "), names[p.student_id] || "", p.receipt_number, methodLabel(p.payment_method), p.currency, p.amount_original, Number(p.amount_usd).toFixed(2)]))}>
                <Download className="w-4 h-4 mr-1" /> CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto max-h-96">
            <Table>
              <TableHeader><TableRow><TableHead>Time</TableHead><TableHead>Student</TableHead><TableHead>Receipt</TableHead><TableHead>Method</TableHead><TableHead className="text-right">USD</TableHead></TableRow></TableHeader>
              <TableBody>
                {inRange.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No payments in this range.</TableCell></TableRow> :
                  inRange.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-xs">{new Date(p.created_at).toLocaleString("en-GB")}</TableCell>
                      <TableCell>{names[p.student_id] || "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{p.receipt_number}</TableCell>
                      <TableCell>{methodLabel(p.payment_method)}</TableCell>
                      <TableCell className="text-right font-semibold">{money(Number(p.amount_usd))}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader><CardTitle>By payment method</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {byMethod.length === 0 ? <p className="text-sm text-muted-foreground">No data.</p> : byMethod.map(([m, v]) => (
                <div key={m}>
                  <div className="flex justify-between text-sm"><span>{methodLabel(m)} ({v.n})</span><span className="font-semibold">{money(v.t)}</span></div>
                  <div className="h-1.5 bg-muted rounded"><div className="h-1.5 bg-primary rounded" style={{ width: `${rangeTotal ? (v.t / rangeTotal) * 100 : 0}%` }} /></div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>By form</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {byForm.map(([k, v]) => (
                <div key={k}>
                  <div className="flex justify-between text-sm"><span>{k} · {v.owing} owing</span><span className="font-semibold">{v.due ? Math.round((v.paid / v.due) * 100) : 0}%</span></div>
                  <div className="h-1.5 bg-muted rounded"><div className="h-1.5 bg-primary rounded" style={{ width: `${v.due ? (v.paid / v.due) * 100 : 0}%` }} /></div>
                  <p className="text-xs text-muted-foreground">{money(v.paid)} of {money(v.due)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>By term</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {byTerm.map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm border-b border-border pb-1">
                  <span>{k}</span><span><strong>{money(v.paid)}</strong> / {money(v.due)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Outstanding fees ({outstanding.length}) — {money(outstanding.reduce((s, r) => s + r.bal, 0))}</CardTitle>
            <Button variant="outline" size="sm" className="print:hidden" onClick={() => exportCSV("outstanding_fees", ["Student", "Student No", "Form", "Year", "Term", "Due", "Paid", "Balance"],
              outstanding.map((r) => { const s = students.find((x) => x.user_id === r.student_id); return [names[r.student_id] || "", s?.student_id || "", s?.form || "", r.academic_year, r.term, r.amount_due, r.amount_paid, r.bal.toFixed(2)]; }))}>
              <Download className="w-4 h-4 mr-1" /> CSV
            </Button>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto max-h-96">
            <Table>
              <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Form</TableHead><TableHead>Term</TableHead><TableHead className="text-right">Balance</TableHead></TableRow></TableHeader>
              <TableBody>
                {outstanding.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{names[r.student_id] || "—"}</TableCell>
                    <TableCell>{formOf(r.student_id) ?? "—"}</TableCell>
                    <TableCell>{r.academic_year} {r.term.replace("_", " ").toUpperCase()}</TableCell>
                    <TableCell className="text-right font-semibold text-destructive">{money(r.bal)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card className="print:hidden">
            <CardHeader><CardTitle className="flex items-center gap-2"><UserCog className="w-4 h-4" /> Finance staff</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Bursars can manage fees, invoices and approvals. Headmasters get read-only access to finance reports.</p>
              <div className="flex flex-wrap gap-2">
                <Input placeholder="Staff email" value={email} onChange={(e) => setEmail(e.target.value)} className="max-w-xs" />
                <select className="border border-input rounded-md px-3 py-2 bg-background text-sm" value={pos} onChange={(e) => setPos(e.target.value)}>
                  <option value="bursar">Bursar</option><option value="headmaster">Headmaster</option>
                </select>
                <Button onClick={addPosition}>Assign</Button>
              </div>
              {positions.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm border border-border rounded-md px-3 py-2">
                  <span>{names[p.user_id] || p.user_id} — <span className="capitalize font-medium">{p.position}</span></span>
                  <Button size="icon" variant="ghost" onClick={async () => { await supabase.from("staff_positions").delete().eq("id", p.id); loadPositions(); }}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FinanceReports;
