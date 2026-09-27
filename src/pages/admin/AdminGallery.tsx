import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, ArrowUp, ArrowDown } from "lucide-react";
import { resolveGalleryImage, GALLERY_CATEGORIES } from "@/lib/gallery-images";

const empty = { id: "", title: "", description: "", image_url: "", category: "campus", display_order: 0, is_active: true };

const AdminGallery = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState<any>(empty);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const load = async () => {
    const { data } = await supabase.from("gallery_items").select("*").order("display_order");
    setItems(data || []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.title.trim()) return toast({ title: "Title is required", variant: "destructive" });
    setSaving(true);
    try {
      let image_url = form.image_url;
      if (file) {
        if (file.size > 5 * 1024 * 1024) throw new Error("Image must be under 5MB");
        const path = `gallery/${crypto.randomUUID()}.${file.name.split(".").pop()}`;
        const { error } = await supabase.storage.from("homepage-images").upload(path, file);
        if (error) throw error;
        image_url = supabase.storage.from("homepage-images").getPublicUrl(path).data.publicUrl;
      }
      if (!image_url) throw new Error("Please choose an image");
      const payload = { title: form.title.trim(), description: form.description || null, image_url, category: form.category, display_order: Number(form.display_order) || 0, is_active: form.is_active };
      const { error } = form.id
        ? await supabase.from("gallery_items").update(payload).eq("id", form.id)
        : await supabase.from("gallery_items").insert({ ...payload, display_order: items.length + 1 });
      if (error) throw error;
      toast({ title: form.id ? "Photo updated" : "Photo added" });
      setOpen(false); setFile(null); load();
    } catch (e: any) {
      toast({ title: "Could not save", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this photo from the gallery?")) return;
    await supabase.from("gallery_items").delete().eq("id", id);
    load();
  };

  const toggle = async (it: any) => {
    await supabase.from("gallery_items").update({ is_active: !it.is_active }).eq("id", it.id);
    load();
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const a = items[idx], b = items[idx + dir];
    if (!a || !b) return;
    await Promise.all([
      supabase.from("gallery_items").update({ display_order: b.display_order }).eq("id", a.id),
      supabase.from("gallery_items").update({ display_order: a.display_order }).eq("id", b.id),
    ]);
    load();
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold">Photo Gallery</h1>
            <p className="text-muted-foreground">Add, edit, hide, reorder or delete photos shown on the public Gallery page.</p>
          </div>
          <Button onClick={() => { setForm(empty); setFile(null); setOpen(true); }}><Plus className="w-4 h-4 mr-2" /> Add photo</Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => (
            <Card key={it.id} className={it.is_active ? "" : "opacity-60"}>
              <img src={resolveGalleryImage(it.image_url)} alt={it.title} className="h-44 w-full object-cover rounded-t-lg" />
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{it.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{it.category}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs"><Switch checked={it.is_active} onCheckedChange={() => toggle(it)} />{it.is_active ? "Shown" : "Hidden"}</div>
                </div>
                {it.description && <p className="text-sm text-muted-foreground line-clamp-2">{it.description}</p>}
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" disabled={i === items.length - 1} onClick={() => move(i, 1)}><ArrowDown className="w-4 h-4" /></Button>
                  <Button size="sm" variant="outline" className="ml-auto" onClick={() => { setForm({ ...empty, ...it, description: it.description || "" }); setFile(null); setOpen(true); }}><Pencil className="w-4 h-4 mr-1" /> Edit</Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(it.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form.id ? "Edit photo" : "Add photo"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {(file || form.image_url) && <img src={file ? URL.createObjectURL(file) : resolveGalleryImage(form.image_url)} alt="" className="h-40 w-full object-cover rounded-lg" />}
            <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <Input placeholder="Title" value={form.title} maxLength={120} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Textarea placeholder="Short description" value={form.description} maxLength={300} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{GALLERY_CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
            </Select>
            <div className="flex items-center gap-2 text-sm"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /> Show on website</div>
            <Button className="w-full" onClick={save} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminGallery;
