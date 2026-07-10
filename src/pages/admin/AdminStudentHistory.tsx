import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, GraduationCap, DollarSign, BookOpen, ClipboardCheck, ArrowLeft, User, ArrowUpDown } from "lucide-react";
import ExportDropdown from "@/components/ExportDropdown";

const levelLabel = (l: string) => ({ zjc: "ZJC", o_level: "O Level", a_level: "A Level" }[l] || l);
const termLabel = (t: string) => t?.replace("_", " ").toUpperCase() || "";
type SortField = "name" | "student_id" | "form" | "level" | "status";

const AdminStudentHistory = () => {
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [grades, setGrades] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [monthlyTests, setMonthlyTests] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    supabase.from("subjects").select("id, name").is("deleted_at", null).then(r => setSubjects(r.data || []));
    supabase.from("classes").select("id, name, form, level").then(r => setClasses(r.data || []));
  }, []);

  const searchStudents = async (showAll = false) => {
    if (!search.trim() && !showAll) return;
    setLoading(true);
    const q = search.toLowerCase();
    const { data: sps } = await supabase.from("student_profiles").select("*");
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, email, phone, avatar_url");
    const profileMap: Record<string, any> = {};
    (profiles || []).forEach(p => { profileMap[p.user_id] = p; });
    const results = (sps || []).filter(sp => {
      const p = profileMap[sp.user_id];
      const matchesSearch = showAll || (p?.full_name || "").toLowerCase().includes(q) ||
        (sp.student_id || "").toLowerCase().includes(q) ||
        (p?.email || "").toLowerCase().includes(q);
      const status = sp.graduation_status === "graduated" ? "graduated" : sp.is_active ? "active" : "inactive";
      return matchesSearch && (statusFilter === "all" || statusFilter === status);
    }).map(sp => ({ ...sp, profile: profileMap[sp.user_id] })).sort((a, b) => {
      const statusA = a.graduation_status === "graduated" ? "graduated" : a.is_active ? "active" : "inactive";
      const statusB = b.graduation_status === "graduated" ? "graduated" : b.is_active ? "active" : "inactive";
      const values: Record<SortField, [string, string]> = {
        name: [a.profile?.full_name || "", b.profile?.full_name || ""],
        student_id: [a.student_id || "", b.student_id || ""],
        form: [String(a.form || ""), String(b.form || "")],
        level: [levelLabel(a.level), levelLabel(b.level)],
        status: [statusA, statusB],
      };
      const [av, bv] = values[sortField];
      const cmp = av.localeCompare(bv, undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
    setStudents(results);
    setLoading(false);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead className="cursor-pointer select-none" onClick={() => toggleSort(field)}>
      <span className="flex items-center gap-1">{children} <ArrowUpDown className={`w-3 h-3 ${sortField === field ? "text-primary" : "text-muted-foreground"}`} /></span>
    </TableHead>
  );

  const loadHistory = async (student: any) => {
    setSelected(student);
    setHistoryLoading(true);
    setProfile(student.profile);
    const userId = student.user_id;
    const [gradesRes, feesRes, attendRes, testsRes] = await Promise.all([
      supabase.from("grades").select("*").eq("student_id", userId).is("deleted_at", null).order("academic_year", { ascending: false }),
      supabase.from("fee_records").select("*").eq("student_id", userId).is("deleted_at", null).order("academic_year", { ascending: false }),
      supabase.from("attendance").select("*").eq("student_id", userId).order("date", { ascending: false }).limit(500),
      supabase.from("monthly_tests").select("*").eq("student_id", userId).is("deleted_at", null).order("academic_year", { ascending: false }),
    ]);
    setGrades(gradesRes.data || []);
    setFees(feesRes.data || []);
    setAttendance(attendRes.data || []);
    setMonthlyTests(testsRes.data || []);
    setHistoryLoading(false);
  };

  const subjectName = (id: string) => subjects.find(s => s.id === id)?.name || "—";
  const className = (id: string) => classes.find(c => c.id === id)?.name || "—";

  const gradeYears = [...new Set(grades.map(g => g.academic_year))].sort((a, b) => b - a);
  const feeYears = [...new Set(fees.map(f => f.academic_year))].sort((a, b) => b - a);
  const totalPaid = fees.reduce((s, f) => s + Number(f.amount_paid), 0);
  const totalDue = fees.reduce((s, f) => s + Number(f.amount_due), 0);

  const attendanceSummary = {
    total: attendance.length,
    present: attendance.filter(a => a.status === "present").length,
    absent: attendance.filter(a => a.status === "absent").length,
    late: attendance.filter(a => a.status === "late").length,
    excused: attendance.filter(a => a.status === "excused").length,
  };

  const gradeExportHeaders = ["Year", "Term", "Subject", "Mark", "Grade", "Comment"];
  const gradeExportRows = grades.map(g => [
    g.academic_year, termLabel(g.term), subjectName(g.subject_id),
    g.mark, g.grade_letter || "—", g.comment || "",
  ]);

  const feeExportHeaders = ["Year", "Term", "Amount Due", "Amount Paid", "Balance", "Method", "Receipt"];
  const feeExportRows = fees.map(f => [
    f.academic_year, termLabel(f.term), f.amount_due,
    f.amount_paid, f.amount_due - f.amount_paid,
    f.payment_method || "—", f.receipt_number || "—",
  ]);

  if (selected) {
    return (
      <DashboardLayout role="admin">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <h1 className="font-display text-2xl font-bold">Student History</h1>
          </div>

          {/* Student Info Card */}
          <Card>
            <CardContent className="flex flex-wrap items-center gap-6 p-5">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile?.full_name || "Student"} className="w-14 h-14 rounded-full object-cover border border-border" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                  {(profile?.full_name || "S").charAt(0)}
                </div>
              )}
              <div className="space-y-1">
                <h2 className="text-lg font-bold">{profile?.full_name || "Unknown"}</h2>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
              </div>
              <div className="flex flex-wrap gap-3 ml-auto">
                <Badge variant="outline">ID: {selected.student_id || "—"}</Badge>
                <Badge variant="outline">Form {selected.form}</Badge>
                <Badge variant="outline">{levelLabel(selected.level)}</Badge>
                <Badge variant={selected.is_active ? "default" : "secondary"}>
                  {selected.graduation_status === "graduated" ? "Graduated" : selected.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {historyLoading ? (
            <p className="text-center py-10 text-muted-foreground">Loading history...</p>
          ) : (
            <Tabs defaultValue="grades">
              <TabsList>
                <TabsTrigger value="grades"><BookOpen className="w-4 h-4 mr-1" /> Grades ({grades.length})</TabsTrigger>
                <TabsTrigger value="fees"><DollarSign className="w-4 h-4 mr-1" /> Fees ({fees.length})</TabsTrigger>
                <TabsTrigger value="attendance"><ClipboardCheck className="w-4 h-4 mr-1" /> Attendance ({attendance.length})</TabsTrigger>
                <TabsTrigger value="tests"><BookOpen className="w-4 h-4 mr-1" /> Monthly Tests ({monthlyTests.length})</TabsTrigger>
              </TabsList>

              {/* GRADES */}
              <TabsContent value="grades" className="space-y-4">
                <div className="flex justify-end">
                  <ExportDropdown headers={gradeExportHeaders} rows={gradeExportRows} filename={`${selected.student_id || "student"}_grades`} title="Grades History" />
                </div>
                {gradeYears.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No grade records found.</p>
                ) : gradeYears.map(year => (
                  <Card key={year}>
                    <CardHeader><CardTitle className="text-base">{year}</CardTitle></CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Term</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Mark</TableHead>
                            <TableHead>Grade</TableHead>
                            <TableHead>Comment</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {grades.filter(g => g.academic_year === year).map(g => (
                            <TableRow key={g.id}>
                              <TableCell>{termLabel(g.term)}</TableCell>
                              <TableCell>{subjectName(g.subject_id)}</TableCell>
                              <TableCell className="font-mono font-bold">{g.mark}%</TableCell>
                              <TableCell><Badge variant="outline">{g.grade_letter || "—"}</Badge></TableCell>
                              <TableCell className="text-sm text-muted-foreground">{g.comment || "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* FEES */}
              <TabsContent value="fees" className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex gap-4">
                    <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Total Due</p><p className="text-lg font-bold">${totalDue.toFixed(2)}</p></CardContent></Card>
                    <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Total Paid</p><p className="text-lg font-bold text-green-600">${totalPaid.toFixed(2)}</p></CardContent></Card>
                    <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Balance</p><p className={`text-lg font-bold ${totalDue - totalPaid > 0 ? "text-destructive" : "text-green-600"}`}>${(totalDue - totalPaid).toFixed(2)}</p></CardContent></Card>
                  </div>
                  <ExportDropdown headers={feeExportHeaders} rows={feeExportRows} filename={`${selected.student_id || "student"}_fees`} title="Fee History" />
                </div>
                {feeYears.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No fee records found.</p>
                ) : feeYears.map(year => (
                  <Card key={year}>
                    <CardHeader><CardTitle className="text-base">{year}</CardTitle></CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Term</TableHead>
                            <TableHead>Due</TableHead>
                            <TableHead>Paid</TableHead>
                            <TableHead>Balance</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Receipt</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {fees.filter(f => f.academic_year === year).map(f => (
                            <TableRow key={f.id}>
                              <TableCell>{termLabel(f.term)}</TableCell>
                              <TableCell>${Number(f.amount_due).toFixed(2)}</TableCell>
                              <TableCell className="text-green-600 font-medium">${Number(f.amount_paid).toFixed(2)}</TableCell>
                              <TableCell className={Number(f.amount_due) - Number(f.amount_paid) > 0 ? "text-destructive font-medium" : "text-green-600"}>
                                ${(Number(f.amount_due) - Number(f.amount_paid)).toFixed(2)}
                              </TableCell>
                              <TableCell>{f.payment_method || "—"}</TableCell>
                              <TableCell>{f.receipt_number || "—"}</TableCell>
                              <TableCell>{f.payment_date || "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* ATTENDANCE */}
              <TabsContent value="attendance" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Total</p><p className="text-lg font-bold">{attendanceSummary.total}</p></CardContent></Card>
                  <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Present</p><p className="text-lg font-bold text-green-600">{attendanceSummary.present}</p></CardContent></Card>
                  <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Absent</p><p className="text-lg font-bold text-destructive">{attendanceSummary.absent}</p></CardContent></Card>
                  <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Late</p><p className="text-lg font-bold text-yellow-600">{attendanceSummary.late}</p></CardContent></Card>
                  <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Excused</p><p className="text-lg font-bold text-blue-600">{attendanceSummary.excused}</p></CardContent></Card>
                </div>
                {attendanceSummary.total > 0 && (
                  <Card>
                    <CardContent className="p-3">
                      <p className="text-sm text-muted-foreground">
                        Attendance Rate: <span className="font-bold text-foreground">
                          {((attendanceSummary.present / attendanceSummary.total) * 100).toFixed(1)}%
                        </span>
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* MONTHLY TESTS */}
              <TabsContent value="tests" className="space-y-4">
                {monthlyTests.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No monthly test records found.</p>
                ) : (
                  <Card>
                    <CardContent className="pt-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Year</TableHead>
                            <TableHead>Month</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Mark</TableHead>
                            <TableHead>Comment</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {monthlyTests.map(t => (
                            <TableRow key={t.id}>
                              <TableCell>{t.academic_year}</TableCell>
                              <TableCell>{new Date(2000, t.month - 1).toLocaleString("default", { month: "long" })}</TableCell>
                              <TableCell>{subjectName(t.subject_id)}</TableCell>
                              <TableCell className="font-mono font-bold">{t.mark}%</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{t.comment || "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Student History</h1>
            <p className="text-muted-foreground">Search active, inactive, or graduated students to view their complete school record</p>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search by name, student ID, or email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && searchStudents()}
                />
              </div>
              <select className="border border-input rounded-lg px-3 py-2 bg-background text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="graduated">Graduated</option>
              </select>
              <Button onClick={() => searchStudents()} disabled={loading}>
                {loading ? "Searching..." : "Search"}
              </Button>
              <Button variant="outline" onClick={() => searchStudents(true)} disabled={loading}>
                Load All Records
              </Button>
            </div>
          </CardContent>
        </Card>

        {students.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Results ({students.length})</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <SortHeader field="name">Name</SortHeader>
                    <SortHeader field="student_id">Student ID</SortHeader>
                    <SortHeader field="form">Form</SortHeader>
                    <SortHeader field="level">Level</SortHeader>
                    <SortHeader field="status">Status</SortHeader>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map(s => (
                    <TableRow key={s.id} className={!s.is_active ? "opacity-60" : ""}>
                      <TableCell>
                        {s.profile?.avatar_url ? (
                          <img src={s.profile.avatar_url} alt={s.profile?.full_name || "Student"} className="w-8 h-8 rounded-full object-cover border border-border" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                            {(s.profile?.full_name || "S").charAt(0)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{s.profile?.full_name || "—"}</TableCell>
                      <TableCell className="font-mono text-sm">{s.student_id || "—"}</TableCell>
                      <TableCell>Form {s.form}</TableCell>
                      <TableCell>{levelLabel(s.level)}</TableCell>
                      <TableCell>
                        <Badge variant={s.graduation_status === "graduated" ? "secondary" : s.is_active ? "default" : "outline"}>
                          {s.graduation_status === "graduated" ? "Graduated" : s.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => loadHistory(s)}>
                          <User className="w-4 h-4 mr-1" /> View History
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminStudentHistory;
