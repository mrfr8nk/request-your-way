import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { PenLine, Upload, Trash2, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface SignatureManagerProps {
  /** Which roles to show. Admin sees all, teacher sees own */
  mode: "admin" | "teacher";
}

const ROLE_OPTIONS = [
  { value: "headmaster", label: "Headmaster" },
  { value: "deputy_head", label: "Deputy Headmaster" },
  { value: "class_teacher", label: "Class Teacher" },
  { value: "senior_teacher", label: "Senior Teacher" },
];

const SignatureManager = ({ mode }: SignatureManagerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [signatures, setSignatures] = useState<any[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [roleTitle, setRoleTitle] = useState("class_teacher");
  const [displayName, setDisplayName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [drawMode, setDrawMode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  const fetchSignatures = async () => {
    let q = supabase.from("report_signatures").select("*").order("created_at");
    if (mode === "teacher" && user) q = q.eq("user_id", user.id);
    const { data } = await q;
    setSignatures(data || []);
  };

  useEffect(() => { fetchSignatures(); }, [user, mode]);

  const handleFileUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${roleTitle}_${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("signatures").upload(path, file);
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("signatures").getPublicUrl(path);
      
      const { error } = await supabase.from("report_signatures").upsert({
        role_title: roleTitle,
        user_id: user.id,
        signature_url: urlData.publicUrl,
        display_name: displayName || "Signature",
      }, { onConflict: "role_title,user_id" });
      if (error) throw error;
      toast({ title: "Signature saved" });
      setAddOpen(false);
      fetchSignatures();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setUploading(false);
  };

  // Canvas drawing
  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    isDrawing.current = true;
    const ctx = canvas.getContext("2d")!;
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDraw = () => { isDrawing.current = false; };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveDrawnSignature = async () => {
    if (!canvasRef.current || !user) return;
    setUploading(true);
    try {
      const blob = await new Promise<Blob>((resolve) => {
        canvasRef.current!.toBlob((b) => resolve(b!), "image/png");
      });
      const path = `${user.id}/${roleTitle}_drawn_${Date.now()}.png`;
      const { error: uploadErr } = await supabase.storage.from("signatures").upload(path, blob);
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("signatures").getPublicUrl(path);
      
      const { error } = await supabase.from("report_signatures").upsert({
        role_title: roleTitle,
        user_id: user.id,
        signature_url: urlData.publicUrl,
        display_name: displayName || "Signature",
      }, { onConflict: "role_title,user_id" });
      if (error) throw error;
      toast({ title: "Signature saved" });
      setAddOpen(false);
      fetchSignatures();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setUploading(false);
  };

  const deleteSignature = async (id: string) => {
    await supabase.from("report_signatures").delete().eq("id", id);
    toast({ title: "Signature deleted" });
    fetchSignatures();
  };

  const roleLabel = (val: string) => ROLE_OPTIONS.find(r => r.value === val)?.label || val;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><PenLine className="w-5 h-5" /> Report Signatures</CardTitle>
        <Button size="sm" onClick={() => { setAddOpen(true); setDrawMode(false); setDisplayName(""); }}>
          <PenLine className="w-4 h-4 mr-1" /> Add Signature
        </Button>
      </CardHeader>
      <CardContent>
        {signatures.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No signatures added yet. Add signatures for report cards.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {signatures.map(sig => (
              <div key={sig.id} className="border border-border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">{roleLabel(sig.role_title)}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteSignature(sig.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
                {sig.signature_url && (
                  <div className="bg-white rounded border p-2 flex items-center justify-center h-20">
                    <img src={sig.signature_url} alt="Signature" className="max-h-full max-w-full object-contain" />
                  </div>
                )}
                <p className="text-sm font-medium text-foreground">{sig.display_name}</p>
              </div>
            ))}
          </div>
        )}

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Add Signature</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Role</label>
                <select className="w-full border border-input rounded-lg px-3 py-2 bg-background text-sm mt-1"
                  value={roleTitle} onChange={e => setRoleTitle(e.target.value)}>
                  {(mode === "teacher" ? ROLE_OPTIONS.filter(r => r.value === "class_teacher") : ROLE_OPTIONS).map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Display Name</label>
                <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="e.g. Mr. J. Moyo" className="mt-1" />
              </div>

              <div className="flex gap-2">
                <Button variant={!drawMode ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setDrawMode(false)}>
                  <Upload className="w-4 h-4 mr-1" /> Upload Image
                </Button>
                <Button variant={drawMode ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setDrawMode(true)}>
                  <PenLine className="w-4 h-4 mr-1" /> Draw Signature
                </Button>
              </div>

              {drawMode ? (
                <div className="space-y-2">
                  <div className="border border-border rounded-lg bg-white overflow-hidden touch-none">
                    <canvas
                      ref={canvasRef}
                      width={380}
                      height={150}
                      className="w-full cursor-crosshair"
                      onMouseDown={startDraw}
                      onMouseMove={draw}
                      onMouseUp={stopDraw}
                      onMouseLeave={stopDraw}
                      onTouchStart={startDraw}
                      onTouchMove={draw}
                      onTouchEnd={stopDraw}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={clearCanvas}>Clear</Button>
                    <Button size="sm" onClick={saveDrawnSignature} disabled={uploading}>
                      <Save className="w-4 h-4 mr-1" /> {uploading ? "Saving..." : "Save Signature"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <input type="file" accept="image/*" onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f);
                  }} className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" />
                  {uploading && <p className="text-sm text-muted-foreground mt-2">Uploading...</p>}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default SignatureManager;
