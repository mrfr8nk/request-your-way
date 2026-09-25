import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { useFinanceAccess } from "@/hooks/useFinanceAccess";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, FileImage, Inbox } from "lucide-react";
import { generateReceipt, methodLabel, DEFAULT_ZIG_RATE } from "@/components/admin/fees/FeeConstants";

const PaymentApprovals = () => {
  const { toast } = useToast();
  const { layoutRole, canManage } = useFinanceAccess();
  const [rows, setRows] = useState<any[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [records, setRecords] = useState<Record<string, any>>({});
  const [status, setStatus] = useState("pending");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = async () => {
    const { data } = await supabase.from("payment_submissions").select("*").eq("status", status).order("created_at", { ascending: false });
    const list = data || [];
    setRows(list);
    const ids = [...new Set(list.flatMap((r: any) => [r.student_id, r.submitted_by]))];
    const recIds = list.map((r: any) => r.fee_record_id).filter(Boolean);
    const [p, fr] = await Promise.all([
      ids.length ? supabase.from("profiles").select("user_id, full_name").in("user_id", ids) : Promise.resolve({ data: [] as any[] }),
      recIds.length ? supabase.from("fee_records").select("*").in("id", recIds) : Promise.resolve({ data: [] as any[] }),
    ]);
    setNames(Object.fromEntries((p.data || []).map((x: any) => [x.user_id, x.full_name])));
    setRecords(Object.fromEntries((fr.data || []).map((x: any) => [x.id, x])));
  };
  useEffect(() => { load(); }, [status]);

  const viewProof = async (path: string) => {
    const { data } = await supabase.storage.from("receipts").createSignedUrl(path, 600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const review = async (r: any, approve: boolean) => {
    const { data: u } = await supabase.auth.getUser();
    const reviewNote = notes[r.id]?.trim() || null;
    let receipt: string | null = null;
    if (approve) {
      const rec = records[r.fee_record_id];
      if (!rec) { toast({ title: "No fee record linked", description: "Create an invoice for this term first.", variant: "destructive" }); return; }
      const usd = r.currency === "ZIG" ? Number(r.amount) / DEFAULT_ZIG_RATE : Number(r.amount);
      receipt = generateReceipt();
      const newPaid = Math.round((Number(rec.amount_paid) + usd) * 100) / 100;
      const { error } = await supabase.from("fee_records").update({
        amount_paid: newPaid, receipt_number: receipt, payment_method: r.payment_method,
        payment_date: new Date().toISOString().split("T")[0],
      }).eq("id", rec.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      await supabase.from("fee_payments").insert({
        fee_record_id: rec.id, student_id: r.student_id, amount_usd: Math.round(usd * 100) / 100,
        amount_original: Number(r.amount), currency: r.currency, payment_method: r.payment_method,
        receipt_number: receipt, receipt_image_url: r.proof_path, paid_by: u.user?.id,
        notes: `Approved submission${r.reference ? ` · Ref ${r.reference}` : ""}${reviewNote ? ` · ${reviewNote}` : ""}`,
      });
    }
    await supabase.from("payment_submissions").update({
      status: approve ? "approved" : "rejected", reviewed_by: u.user?.id,
      reviewed_at: new Date().toISOString(), review_notes: reviewNote,
    }).eq("id", r.id);
    await supabase.from("notifications").insert({
      user_id: r.submitted_by,
      title: approve ? "Payment approved" : "Payment proof rejected",
      message: approve
        ? `Your payment of ${r.currency} ${Number(r.amount).toFixed(2)} for ${names[r.student_id] || "your child"} was approved. Receipt: ${receipt}`
        : `Your payment proof for ${names[r.student_id] || "your child"} was rejected.${reviewNote ? " Reason: " + reviewNote : ""}`,
      type: approve ? "success" : "warning",
    });
    toast({ title: approve ? "Approved and posted" : "Rejected" });
    load();
  };

  return (
    <DashboardLayout role={layoutRole}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Finance · Reconciliation</p>
            <h1 className="font-display text-3xl font-bold text-foreground">Payment Approvals</h1>
            <p className="text-sm text-muted-foreground">Bank, EcoCash and other proofs submitted by parents and students.</p>
          </div>
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            {["pending", "approved", "rejected"].map((s) => (
              <Button key={s} size="sm" variant={status === s ? "default" : "ghost"} onClick={() => setStatus(s)} className="capitalize">{s}</Button>
            ))}
          </div>
        </div>

        {rows.length === 0 ? (
          <Card><CardContent className="p-10 text-center text-muted-foreground"><Inbox className="w-8 h-8 mx-auto mb-2" />Nothing {status}.</CardContent></Card>
        ) : rows.map((r) => {
          const rec = records[r.fee_record_id];
          return (
            <Card key={r.id}>
              <CardContent className="p-4 grid gap-3 md:grid-cols-[1fr_auto] items-start">
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">{names[r.student_id] || "Student"} <span className="text-xs font-normal text-muted-foreground">· submitted by {names[r.submitted_by] || "—"}</span></p>
                  <p className="text-2xl font-display font-bold">{r.currency} {Number(r.amount).toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">
                    {methodLabel(r.payment_method)}{r.reference ? ` · Ref ${r.reference}` : ""} · {new Date(r.created_at).toLocaleString("en-GB")}
                  </p>
                  {rec && <p className="text-xs text-muted-foreground">Invoice: {rec.term.replace("_", " ").toUpperCase()} {rec.academic_year} — balance ${(Number(rec.amount_due) - Number(rec.amount_paid)).toFixed(2)}</p>}
                  {r.notes && <p className="text-sm italic">"{r.notes}"</p>}
                  {r.review_notes && <p className="text-xs">Review note: {r.review_notes}</p>}
                </div>
                <div className="flex flex-col gap-2 md:w-64">
                  {r.proof_path && <Button variant="outline" size="sm" onClick={() => viewProof(r.proof_path)}><FileImage className="w-4 h-4 mr-1" /> View proof</Button>}
                  {status === "pending" && canManage && (
                    <>
                      <Input placeholder="Review note (optional)" value={notes[r.id] || ""} onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })} />
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1" onClick={() => review(r, true)}><CheckCircle2 className="w-4 h-4 mr-1" /> Approve</Button>
                        <Button size="sm" variant="destructive" className="flex-1" onClick={() => review(r, false)}><XCircle className="w-4 h-4 mr-1" /> Reject</Button>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </DashboardLayout>
  );
};

export default PaymentApprovals;
