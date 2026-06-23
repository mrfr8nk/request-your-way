import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Plus, Trash2, Edit, RotateCcw, Search, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

const ZIMSEC_SUBJECTS: { name: string; code: string; level: string; is_compulsory: boolean }[] = [
  // O-Level core (compulsory)
  { name: "English Language", code: "1122", level: "o_level", is_compulsory: true },
  { name: "Mathematics", code: "4004", level: "o_level", is_compulsory: true },
  { name: "Combined Science", code: "5009", level: "o_level", is_compulsory: true },
  { name: "Heritage Studies", code: "2070", level: "o_level", is_compulsory: true },
  // O-Level optionals
  { name: "Shona", code: "3158", level: "o_level", is_compulsory: false },
  { name: "Ndebele", code: "3159", level: "o_level", is_compulsory: false },
  { name: "History", code: "2167", level: "o_level", is_compulsory: false },
  { name: "Geography", code: "2217", level: "o_level", is_compulsory: false },
  { name: "Religious Studies", code: "2046", level: "o_level", is_compulsory: false },
  { name: "Biology", code: "5008", level: "o_level", is_compulsory: false },
  { name: "Chemistry", code: "5070", level: "o_level", is_compulsory: false },
  { name: "Physics", code: "6043", level: "o_level", is_compulsory: false },
  { name: "Accounts", code: "7106", level: "o_level", is_compulsory: false },
  { name: "Business Studies", code: "7115", level: "o_level", is_compulsory: false },
  { name: "Computer Science", code: "7050", level: "o_level", is_compulsory: false },
  { name: "Agriculture", code: "5035", level: "o_level", is_compulsory: false },
  { name: "Food & Nutrition", code: "6065", level: "o_level", is_compulsory: false },
  { name: "Fashion & Fabrics", code: "6064", level: "o_level", is_compulsory: false },
  { name: "Physical Education", code: "8035", level: "o_level", is_compulsory: false },
  { name: "Art", code: "6032", level: "o_level", is_compulsory: false },
  { name: "Music", code: "6033", level: "o_level", is_compulsory: false },
  { name: "Wood Technology", code: "6019", level: "o_level", is_compulsory: false },
  { name: "Metal Technology", code: "6020", level: "o_level", is_compulsory: false },
  { name: "Technical Graphics", code: "6022", level: "o_level", is_compulsory: false },
  // A-Level
  { name: "General Paper", code: "8001", level: "a_level", is_compulsory: true },
  { name: "Mathematics", code: "9164", level: "a_level", is_compulsory: false },
  { name: "Further Mathematics", code: "9182", level: "a_level", is_compulsory: false },
  { name: "Physics", code: "9188", level: "a_level", is_compulsory: false },
  { name: "Chemistry", code: "9189", level: "a_level", is_compulsory: false },
  { name: "Biology", code: "9190", level: "a_level", is_compulsory: false },
  { name: "Geography", code: "9156", level: "a_level", is_compulsory: false },
  { name: "History", code: "9155", level: "a_level", is_compulsory: false },
  { name: "Divinity", code: "9023", level: "a_level", is_compulsory: false },
  { name: "Literature in English", code: "9153", level: "a_level", is_compulsory: false },
  { name: "Shona", code: "9158", level: "a_level", is_compulsory: false },
  { name: "Ndebele", code: "9159", level: "a_level", is_compulsory: false },
  { name: "Sociology", code: "9157", level: "a_level", is_compulsory: false },
  { name: "Economics", code: "9163", level: "a_level", is_compulsory: false },
  { name: "Accounting", code: "9197", level: "a_level", is_compulsory: false },
  { name: "Business Studies", code: "9198", level: "a_level", is_compulsory: false },
  { name: "Computer Science", code: "9195", level: "a_level", is_compulsory: false },
  { name: "Agriculture", code: "9192", level: "a_level", is_compulsory: false },
  { name: "Physical Education", code: "9285", level: "a_level", is_compulsory: false },
];

const AdminSubjects = () => {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [deletedSubjects, setDeletedSubjects] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [subLevel, setSubLevel] = useState("");
  const [isCompulsory, setIsCompulsory] = useState(false);
  const [search, setSearch] = useState("");
  const [editSubject, setEditSubject] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);

  const fetchData = async () => {
    const { data } = await supabase.from("subjects").select("*").order("name");
    const all = data || [];
    setSubjects(all.filter((s: any) => !s.deleted_at));
    setDeletedSubjects(all.filter((s: any) => s.deleted_at));
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async () => {
    if (!name.trim() || !code.trim()) return;
    const { error } = await supabase.from("subjects").insert({
      name: name.trim(), code: code.trim().toUpperCase(),
      level: subLevel || null, is_compulsory: isCompulsory,
    } as any);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Subject Added" }); setName(""); setCode(""); setSubLevel(""); setIsCompulsory(false); fetchData(); }
  };

  const handleSeedZIMSEC = async () => {
    if (!confirm(`Load ${ZIMSEC_SUBJECTS.length} ZIMSEC subjects? Existing codes will be skipped.`)) return;
    const { data: existing } = await supabase.from("subjects").select("code");
    const existingCodes = new Set((existing || []).map((s: any) => (s.code || "").toUpperCase()));
    const toInsert = ZIMSEC_SUBJECTS
      .filter(s => !existingCodes.has(s.code.toUpperCase()))
      .map(s => ({ ...s, code: s.code.toUpperCase(), level: s.level as any }));
    if (toInsert.length === 0) { toast({ title: "All ZIMSEC subjects already loaded" }); return; }
    const { error } = await supabase.from("subjects").insert(toInsert as any);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: `Loaded ${toInsert.length} subjects` }); fetchData(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this subject?")) return;
    await supabase.from("subjects").update({ deleted_at: new Date().toISOString() } as any).eq("id", id);
    toast({ title: "Subject Deleted" }); fetchData();
  };

  const handleRestore = async (id: string) => {
    await supabase.from("subjects").update({ deleted_at: null } as any).eq("id", id);
    toast({ title: "Subject Restored" }); fetchData();
  };

  const handleEdit = async () => {
    if (!editSubject) return;
    const { error } = await supabase.from("subjects").update({
      name: editSubject.name, code: editSubject.code,
      level: editSubject.level || null, is_compulsory: editSubject.is_compulsory,
    }).eq("id", editSubject.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Subject Updated" }); setEditOpen(false); fetchData(); }
  };

  const filtered = subjects.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) || (s.code || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="font-display text-2xl font-bold text-foreground">Subject Management</h1>
          <Button variant="outline" onClick={handleSeedZIMSEC}>
            <Sparkles className="w-4 h-4 mr-1" /> Load ZIMSEC Subjects
          </Button>
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="w-5 h-5" /> Add Subject</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-3">
              <Input placeholder="Subject name" value={name} onChange={e => setName(e.target.value)} className="flex-1 min-w-[200px]" />
              <Input placeholder="Code (e.g. MATH)" value={code} onChange={e => setCode(e.target.value)} className="w-32" />
              <select className="border border-input rounded-lg px-3 py-2 bg-background text-sm" value={subLevel} onChange={e => setSubLevel(e.target.value)}>
                <option value="">All Levels</option>
                <option value="zjc">ZJC</option><option value="o_level">O Level</option><option value="a_level">A Level</option>
              </select>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={isCompulsory} onCheckedChange={v => setIsCompulsory(!!v)} /> Compulsory
              </label>
              <Button onClick={handleAdd}><Plus className="w-4 h-4 mr-1" /> Add</Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">Active ({subjects.length})</TabsTrigger>
            <TabsTrigger value="deleted">Deleted ({deletedSubjects.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <div className="relative max-w-sm mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search subjects..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Name</TableHead><TableHead>Code</TableHead><TableHead>Level</TableHead><TableHead>Compulsory</TableHead><TableHead>Actions</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell>{s.code}</TableCell>
                        <TableCell>{s.level ? s.level.replace("_", " ").toUpperCase() : "All"}</TableCell>
                        <TableCell>{s.is_compulsory ? "Yes" : "No"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => { setEditSubject({...s}); setEditOpen(true); }}><Edit className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deleted">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Code</TableHead><TableHead>Deleted</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {deletedSubjects.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No deleted subjects.</TableCell></TableRow>
                    ) : deletedSubjects.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell>{s.code}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(s.deleted_at).toLocaleDateString()}</TableCell>
                        <TableCell><Button variant="ghost" size="sm" onClick={() => handleRestore(s.id)}><RotateCcw className="w-4 h-4 text-primary" /> Restore</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Subject</DialogTitle></DialogHeader>
            {editSubject && (
              <div className="space-y-3">
                <Input placeholder="Name" value={editSubject.name} onChange={e => setEditSubject({...editSubject, name: e.target.value})} />
                <Input placeholder="Code" value={editSubject.code} onChange={e => setEditSubject({...editSubject, code: e.target.value})} />
                <select className="w-full border border-input rounded-lg px-3 py-2 bg-background text-sm" value={editSubject.level || ""} onChange={e => setEditSubject({...editSubject, level: e.target.value || null})}>
                  <option value="">All Levels</option>
                  <option value="zjc">ZJC</option><option value="o_level">O Level</option><option value="a_level">A Level</option>
                </select>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={editSubject.is_compulsory} onCheckedChange={v => setEditSubject({...editSubject, is_compulsory: !!v})} /> Compulsory
                </label>
                <Button className="w-full" onClick={handleEdit}>Save Changes</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminSubjects;
