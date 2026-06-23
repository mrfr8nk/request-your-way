import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Newspaper, Plus, Trash2, Edit, Eye, EyeOff, Upload, Image } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

const AdminHomepageUpdates = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [updates, setUpdates] = useState<any[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchUpdates = async () => {
    const { data } = await supabase
      .from("homepage_updates")
      .select("*")
      .order("display_order")
      .order("created_at", { ascending: false });
    setUpdates(data || []);
  };

  useEffect(() => { fetchUpdates(); }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("homepage-images").upload(path, file);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("homepage-images").getPublicUrl(path);
    setImageUrl(urlData.publicUrl);
    setUploading(false);
  };

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) {
      toast({ title: "Please fill title and description", variant: "destructive" });
      return;
    }

    if (editItem) {
      await supabase.from("homepage_updates").update({
        title: title.trim(),
        description: description.trim(),
        image_url: imageUrl || null,
        updated_at: new Date().toISOString(),
      }).eq("id", editItem.id);
      toast({ title: "Update saved" });
    } else {
      await supabase.from("homepage_updates").insert({
        title: title.trim(),
        description: description.trim(),
        image_url: imageUrl || null,
        created_by: user?.id,
      });
      toast({ title: "Update posted to homepage" });
    }

    resetForm();
    fetchUpdates();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("homepage_updates").delete().eq("id", id);
    toast({ title: "Update deleted" });
    fetchUpdates();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("homepage_updates").update({ is_active: !current }).eq("id", id);
    fetchUpdates();
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setImageUrl("");
    setEditItem(null);
    setFormOpen(false);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setTitle(item.title);
    setDescription(item.description);
    setImageUrl(item.image_url || "");
    setFormOpen(true);
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Homepage Updates</h1>
            <p className="text-muted-foreground text-sm">Manage news & updates shown on the public homepage</p>
          </div>
          <Button onClick={() => { resetForm(); setFormOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Add Update
          </Button>
        </div>

        <div className="grid gap-4">
          {updates.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No homepage updates yet. Click "Add Update" to create one.</p>
              </CardContent>
            </Card>
          )}

          {updates.map((item) => (
            <Card key={item.id} className={!item.is_active ? "opacity-60" : ""}>
              <CardContent className="p-4 flex gap-4 items-start">
                {item.image_url && (
                  <img src={item.image_url} alt="" className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display font-bold text-foreground">{item.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(item.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        {!item.is_active && <span className="ml-2 text-destructive font-semibold">Hidden</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => toggleActive(item.id, item.is_active)}>
                        {item.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editItem ? "Edit Update" : "Add Homepage Update"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
              <textarea
                className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground text-sm min-h-[100px] resize-y"
                placeholder="Description..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Image (optional)</label>
                <div className="flex items-center gap-3">
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                    <Upload className="w-4 h-4 mr-1" /> {uploading ? "Uploading..." : "Upload Image"}
                  </Button>
                  {imageUrl && (
                    <div className="flex items-center gap-2">
                      <img src={imageUrl} alt="" className="w-12 h-12 rounded object-cover" />
                      <Button variant="ghost" size="sm" onClick={() => setImageUrl("")}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button onClick={handleSave}>{editItem ? "Save Changes" : "Post Update"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminHomepageUpdates;
