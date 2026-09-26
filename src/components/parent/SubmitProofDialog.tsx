import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2 } from "lucide-react";

const METHODS = [["bank_transfer", "Bank transfer"], ["ecocash", "EcoCash"], ["onemoney", "OneMoney"], ["cash", "Cash deposit"], ["swipe", "Swipe"]];

export default function SubmitProofDialog({ studentId, feeRecords }: { studentId: string; feeRecords: any[] }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ fee_record_id: feeRecords[0]?.id || "", amount: "", currency: "USD", method: "bank_transfer", reference: "", notes: "" });
  const [file, setFile] = useState<File | null>(null);
  const preview = file ? URL.createObjectURL(file) : null;

  const submit = async () => {
    const amt = Number(f.amount);
    if (!user || !amt || amt <= 0 || amt > 100000) return toast({ title: "Enter a valid amount", variant: "destructive" });
    if (!file) return toast({ title: "Attach a photo of your proof", variant: "destructive" });
    if (!/^image\/|application\/pdf/.test(file.type) || file.size > 5 * 1024 * 1024)
      return toast({ title: "Image or PDF under 5MB only", variant: "destructive" });
    setBusy(true);
    const ext = (file.name.split(".").pop() || "jpg").replace(/[^a-z0-9]/gi, "").slice(0, 5);
    const path = `proofs/${user.id}/${crypto.randomUUID()}.${ext}`;
    const up = await supabase.storage.from("receipts").upload(path, file, { contentType: file.type });
    if (up.error) { setBusy(false); return toast({ title: "Upload failed", description: up.error.message, variant: "destructive" }); }
    const { error } = await supabase.from("payment_submissions").insert({
      student_id: studentId, submitted_by: user.id, fee_record_id: f.fee_record_id || null,
      amount: amt, currency: f.currency, payment_method: f.method,
      reference: f.reference.trim().slice(0, 100) || null, notes: f.notes.trim().slice(0, 500) || null,
      proof_path: path, status: "pending",
    });
    setBusy(false);
    if (error) return toast({ title: "Could not submit", description: error.message, variant: "destructive" });
    toast({ title: "Proof submitted", description: "The bursar will review it shortly." });
    setOpen(false); setFile(null); setF({ ...f, amount: "", reference: "", notes: "" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Upload className="w-4 h-4 mr-1" /> Submit proof of payment</Button></DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Submit proof of payment</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {feeRecords.length > 0 && (
            <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={f.fee_record_id} onChange={(e) => setF({ ...f, fee_record_id: e.target.value })}>
              {feeRecords.map((r) => <option key={r.id} value={r.id}>{r.term.replace("_", " ").toUpperCase()} {r.academic_year}</option>)}
            </select>
          )}
          <div className="flex gap-2">
            <Input type="number" min="0" step="0.01" placeholder="Amount" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value })}>
              <option>USD</option><option>ZIG</option>
            </select>
          </div>
          <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })}>
            {METHODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <Input placeholder="Reference / transaction ID" maxLength={100} value={f.reference} onChange={(e) => setF({ ...f, reference: e.target.value })} />
          <Textarea placeholder="Notes (optional)" maxLength={500} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
          <Input type="file" accept="image/*,application/pdf" capture="environment" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          {preview && file?.type.startsWith("image/") && <img src={preview} alt="Proof preview" className="w-full max-h-64 object-contain rounded-md border border-border" />}
          <Button className="w-full" onClick={submit} disabled={busy}>{busy && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}Submit</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
