import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Library, Plus, BookOpen, Search } from "lucide-react";

interface Book { id: string; title: string; author?: string; isbn?: string; category?: string; total_copies: number; available_copies: number; cover_url?: string; description?: string; }
interface Loan { id: string; book_id: string; student_id: string; borrowed_at: string; due_at: string; returned_at?: string; }

export default function LibraryPage({ role }: { role: "admin" | "teacher" | "student" | "parent" }) {
  const isAdmin = role === "admin";
  const [tab, setTab] = useState<"catalog" | "loans">("catalog");
  const [books, setBooks] = useState<Book[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Book>>({ total_copies: 1, available_copies: 1 });

  const load = async () => {
    const [{ data: b }, { data: l }, { data: s }] = await Promise.all([
      supabase.from("library_books").select("*").order("title"),
      supabase.from("library_loans").select("*").order("borrowed_at", { ascending: false }),
      supabase.from("profiles").select("user_id,full_name"),
    ]);
    setBooks((b as Book[]) || []);
    setLoans((l as Loan[]) || []);
    setStudents(s || []);
  };
  useEffect(() => { load(); }, []);

  const filtered = books.filter((b) =>
    [b.title, b.author, b.isbn, b.category].filter(Boolean).join(" ").toLowerCase().includes(q.toLowerCase())
  );

  const save = async () => {
    if (!form.title) return toast.error("Title required");
    const { error } = await supabase.from("library_books").insert({
      title: form.title!,
      author: form.author,
      isbn: form.isbn,
      category: form.category,
      total_copies: form.total_copies || 1,
      available_copies: form.available_copies || form.total_copies || 1,
      description: form.description,
      cover_url: form.cover_url,
    });
    if (error) return toast.error(error.message);
    toast.success("Book added");
    setOpen(false); setForm({ total_copies: 1, available_copies: 1 });
    load();
  };

  const issue = async (bookId: string) => {
    const studentId = window.prompt("Student user ID to issue to:");
    if (!studentId) return;
    const due = new Date(Date.now() + 14 * 86400000).toISOString();
    const { error } = await supabase.from("library_loans").insert({ book_id: bookId, student_id: studentId, due_at: due });
    if (error) return toast.error(error.message);
    await supabase.from("library_books").update({ available_copies: Math.max(0, (books.find(b => b.id === bookId)?.available_copies || 1) - 1) }).eq("id", bookId);
    toast.success("Book issued"); load();
  };

  const returnLoan = async (loan: Loan) => {
    const { error } = await supabase.from("library_loans").update({ returned_at: new Date().toISOString() }).eq("id", loan.id);
    if (error) return toast.error(error.message);
    const book = books.find(b => b.id === loan.book_id);
    if (book) await supabase.from("library_books").update({ available_copies: book.available_copies + 1 }).eq("id", book.id);
    toast.success("Returned"); load();
  };

  return (
    <DashboardLayout role={role}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold flex items-center gap-2">
              <Library className="w-7 h-7 text-primary" /> School Library
            </h1>
            <p className="text-muted-foreground text-sm">Browse the catalog and track loans</p>
          </div>
          {isAdmin && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" /> Add Book</Button></DialogTrigger>
              <DialogContent className="glass-strong">
                <DialogHeader><DialogTitle>Add Book</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div><Label>Title*</Label><Input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>Author</Label><Input value={form.author || ""} onChange={(e) => setForm({ ...form, author: e.target.value })} /></div>
                    <div><Label>ISBN</Label><Input value={form.isbn || ""} onChange={(e) => setForm({ ...form, isbn: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div><Label>Category</Label><Input value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
                    <div><Label>Total</Label><Input type="number" value={form.total_copies} onChange={(e) => setForm({ ...form, total_copies: +e.target.value, available_copies: +e.target.value })} /></div>
                    <div><Label>Cover URL</Label><Input value={form.cover_url || ""} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} /></div>
                  </div>
                  <div><Label>Description</Label><Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                </div>
                <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="flex gap-2 border-b border-white/40">
          {(["catalog", "loans"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{t}</button>
          ))}
        </div>

        {tab === "catalog" && (
          <>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search title, author, ISBN…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 glass" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((b) => (
                <Card key={b.id} className="overflow-hidden hover:shadow-card-hover transition-all">
                  <div className="h-32 bg-gradient-to-br from-primary/20 to-accent/30 flex items-center justify-center">
                    {b.cover_url ? <img src={b.cover_url} alt={b.title} className="h-full w-full object-cover" /> : <BookOpen className="w-12 h-12 text-primary/50" />}
                  </div>
                  <CardContent className="p-4 space-y-1">
                    <h3 className="font-semibold leading-tight line-clamp-2">{b.title}</h3>
                    <p className="text-xs text-muted-foreground">{b.author || "Unknown author"}</p>
                    <div className="flex items-center justify-between pt-1">
                      <Badge variant={b.available_copies > 0 ? "default" : "destructive"} className="text-[10px]">
                        {b.available_copies}/{b.total_copies} available
                      </Badge>
                      {isAdmin && b.available_copies > 0 && (
                        <Button size="sm" variant="outline" onClick={() => issue(b.id)}>Issue</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filtered.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">No books found</p>}
            </div>
          </>
        )}

        {tab === "loans" && (
          <Card>
            <CardHeader><CardTitle>Active & Past Loans</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {loans.length === 0 && <p className="text-muted-foreground text-sm">No loans yet</p>}
                {loans.map((l) => {
                  const book = books.find((b) => b.id === l.book_id);
                  const student = students.find((s) => s.user_id === l.student_id);
                  const overdue = !l.returned_at && new Date(l.due_at) < new Date();
                  return (
                    <div key={l.id} className="glass rounded-lg p-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{book?.title || "Unknown book"}</p>
                        <p className="text-xs text-muted-foreground">{student?.full_name || l.student_id.slice(0, 8)}</p>
                      </div>
                      <div className="text-xs text-muted-foreground">Due {new Date(l.due_at).toLocaleDateString()}</div>
                      {l.returned_at ? (
                        <Badge variant="secondary">Returned</Badge>
                      ) : overdue ? (
                        <Badge variant="destructive">Overdue</Badge>
                      ) : (
                        <Badge>On loan</Badge>
                      )}
                      {isAdmin && !l.returned_at && <Button size="sm" variant="outline" onClick={() => returnLoan(l)}>Mark Returned</Button>}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
