import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Status = "paid" | "partial" | "unpaid" | "none";

interface Props {
  feeRecords: any[];
  students: any[];
  studentProfiles: any[];
  classes: any[];
}

const statusOf = (due: number, paid: number): Status => {
  if (due <= 0 && paid <= 0) return "none";
  if (paid >= due) return "paid";
  if (paid > 0) return "partial";
  return "unpaid";
};

const badge: Record<Status, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  paid: { label: "Paid", variant: "default" },
  partial: { label: "Partial", variant: "secondary" },
  unpaid: { label: "Unpaid", variant: "destructive" },
  none: { label: "No invoice", variant: "outline" },
};

const money = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

const ClassFeeBreakdown = ({ feeRecords, students, studentProfiles, classes }: Props) => {
  const terms = useMemo(() => Array.from(new Set(feeRecords.map((r) => `${r.academic_year}|${r.term}`))).sort().reverse(), [feeRecords]);
  const [period, setPeriod] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [q, setQ] = useState("");

  const nameOf = (uid: string) => students.find((s) => s.user_id === uid)?.full_name || "Unknown";

  const rows = useMemo(() => {
    const recs = feeRecords.filter((r) => !r.deleted_at && (period === "all" || `${r.academic_year}|${r.term}` === period));
    return studentProfiles.map((sp) => {
      const mine = recs.filter((r) => r.student_id === sp.user_id);
      const due = mine.reduce((a, r) => a + Number(r.amount_due || 0), 0);
      const paid = mine.reduce((a, r) => a + Number(r.amount_paid || 0), 0);
      return { uid: sp.user_id, code: sp.student_id, name: nameOf(sp.user_id), class_id: sp.class_id, due, paid, balance: Math.max(0, due - paid), status: statusOf(due, paid) };
    });
  }, [feeRecords, studentProfiles, students, period]);

  const byClass = useMemo(() => {
    const groups = [...classes.map((c) => ({ id: c.id, name: c.name })), { id: null, name: "No class" }];
    return groups.map((g) => {
      const rs = rows.filter((r) => (r.class_id ?? null) === g.id);
      return {
        ...g,
        count: rs.length,
        paid: rs.filter((r) => r.status === "paid").length,
        partial: rs.filter((r) => r.status === "partial").length,
        unpaid: rs.filter((r) => r.status === "unpaid").length,
        due: rs.reduce((a, r) => a + r.due, 0),
        collected: rs.reduce((a, r) => a + r.paid, 0),
      };
    }).filter((g) => g.count > 0);
  }, [rows, classes]);

  const visible = rows
    .filter((r) => classFilter === "all" || (r.class_id ?? "none") === classFilter)
    .filter((r) => statusFilter === "all" || r.status === statusFilter)
    .filter((r) => !q || r.name.toLowerCase().includes(q.toLowerCase()) || (r.code || "").toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.balance - a.balance);

  const totals = { paid: rows.filter((r) => r.status === "paid").length, partial: rows.filter((r) => r.status === "partial").length, unpaid: rows.filter((r) => r.status === "unpaid").length };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Term" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All terms</SelectItem>
            {terms.map((t) => { const [y, tm] = t.split("|"); return <SelectItem key={t} value={t}>{tm.replace("_", " ")} {y}</SelectItem>; })}
          </SelectContent>
        </Select>
        <div className="flex gap-2 text-sm items-center">
          <Badge>{totals.paid} paid</Badge><Badge variant="secondary">{totals.partial} partial</Badge><Badge variant="destructive">{totals.unpaid} unpaid</Badge>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {byClass.map((c) => {
          const pct = c.due > 0 ? Math.min(100, (c.collected / c.due) * 100) : 0;
          return (
            <Card key={c.id ?? "none"} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setClassFilter(c.id ?? "none")}>
              <CardHeader className="pb-2"><CardTitle className="text-base flex justify-between"><span>{c.name}</span><span className="text-muted-foreground text-sm">{c.count} students</span></CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex gap-2"><Badge>{c.paid} paid</Badge><Badge variant="secondary">{c.partial} partial</Badge><Badge variant="destructive">{c.unpaid} unpaid</Badge></div>
                <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div>
                <p className="text-muted-foreground">{money(c.collected)} of {money(c.due)} collected ({pct.toFixed(0)}%)</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <Input placeholder="Search student…" value={q} onChange={(e) => setQ(e.target.value)} className="w-56" />
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All classes</SelectItem>
            {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            <SelectItem value="none">No class</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
            <SelectItem value="none">No invoice</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Class</TableHead><TableHead className="text-right">Billed</TableHead><TableHead className="text-right">Paid</TableHead><TableHead className="text-right">Balance</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {visible.map((r) => (
                <TableRow key={r.uid}>
                  <TableCell><div className="font-medium">{r.name}</div><div className="text-xs text-muted-foreground">{r.code}</div></TableCell>
                  <TableCell>{classes.find((c) => c.id === r.class_id)?.name || "—"}</TableCell>
                  <TableCell className="text-right">{money(r.due)}</TableCell>
                  <TableCell className="text-right">{money(r.paid)}</TableCell>
                  <TableCell className="text-right font-semibold">{money(r.balance)}</TableCell>
                  <TableCell><Badge variant={badge[r.status].variant}>{badge[r.status].label}</Badge></TableCell>
                </TableRow>
              ))}
              {visible.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No students match.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassFeeBreakdown;
