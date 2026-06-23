// WhatsApp Cloud API webhook for St. Mary's learner portal bot
// - GET  /whatsapp-webhook  -> Meta verification handshake
// - POST /whatsapp-webhook  -> incoming message handler

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb, PDFFont } from "https://esm.sh/pdf-lib@1.17.1";
import QRCode from "https://esm.sh/qrcode@1.5.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WA_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN")!;
const WA_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;
const WA_VERIFY = Deno.env.get("WHATSAPP_VERIFY_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// ---------- WhatsApp send helpers ----------
async function sendText(to: string, body: string) {
  const res = await fetch(`https://graph.facebook.com/v21.0/${WA_PHONE_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WA_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: body.slice(0, 4000) },
    }),
  });
  if (!res.ok) console.error("WA send error", await res.text());
}

async function sendDocument(to: string, url: string, filename: string, caption?: string) {
  const res = await fetch(`https://graph.facebook.com/v21.0/${WA_PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${WA_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "document",
      document: { link: url, filename, caption },
    }),
  });
  if (!res.ok) {
    const error = await res.text();
    console.error("WA doc send error", error);
    return { ok: false, error };
  }
  return { ok: true, error: null };
}

// ---------- Menus ----------
const MAIN_MENU = `🎓 *St. Mary's Learner Portal*
_Excellence & Integrity_

Reply with a number:
1️⃣  Latest Report Card (PDF)
2️⃣  Fees Balance
3️⃣  Notices & Announcements
4️⃣  Attendance Summary
5️⃣  My Grades
6️⃣  My Profile
0️⃣  Logout`;

const LOGIN_PROMPT = `👋 Welcome to *St. Mary's WhatsApp Portal*.

Please reply with your *Student ID* (e.g. STM20240001) to log in.`;

// ---------- Session helpers ----------
type Session = {
  phone_number: string;
  user_id: string | null;
  student_profile_id: string | null;
  state: string;
  context: Record<string, unknown>;
};

async function getSession(phone: string): Promise<Session> {
  const { data } = await admin.from("whatsapp_sessions").select("*").eq("phone_number", phone).maybeSingle();
  if (data) return data as Session;
  const { data: created } = await admin.from("whatsapp_sessions").insert({ phone_number: phone, state: "awaiting_login" }).select().single();
  return created as Session;
}

async function updateSession(phone: string, patch: Partial<Session>) {
  await admin.from("whatsapp_sessions").update({ ...patch, last_activity_at: new Date().toISOString() }).eq("phone_number", phone);
}

// ---------- Feature handlers ----------
async function handleLogin(phone: string, studentIdInput: string) {
  const studentId = studentIdInput.trim().toUpperCase();
  const { data: profile } = await admin
    .from("student_profiles")
    .select("id, user_id, student_id, level, form")
    .eq("student_id", studentId)
    .maybeSingle();

  if (!profile) {
    await sendText(phone, `❌ No student found with ID *${studentId}*.\n\nPlease check and try again, or contact admin.`);
    return;
  }

  await updateSession(phone, {
    user_id: profile.user_id,
    student_profile_id: profile.id,
    state: "authenticated",
    authenticated_at: new Date().toISOString(),
  } as any);

  const { data: prof } = await admin.from("profiles").select("full_name").eq("user_id", profile.user_id).maybeSingle();
  await sendText(phone, `✅ Logged in as *${prof?.full_name ?? studentId}*\n\n${MAIN_MENU}`);
}

async function handleFees(phone: string, userId: string) {
  const { data: records } = await admin
    .from("fee_records")
    .select("term, academic_year, amount_due, amount_paid, currency")
    .eq("student_id", userId)
    .is("deleted_at", null)
    .order("academic_year", { ascending: false });

  if (!records || records.length === 0) {
    await sendText(phone, "📋 No fee records found.\n\nReply *menu* to return.");
    return;
  }

  let totalDue = 0, totalPaid = 0;
  const lines = records.map((r: any) => {
    totalDue += Number(r.amount_due);
    totalPaid += Number(r.amount_paid);
    const bal = Number(r.amount_due) - Number(r.amount_paid);
    return `• ${r.term} ${r.academic_year}: ${r.currency} ${bal.toFixed(2)} ${bal <= 0 ? "✅" : "⚠️"}`;
  });
  const balance = totalDue - totalPaid;
  await sendText(phone, `💰 *Fees Summary*\n\n${lines.join("\n")}\n\n*Outstanding: USD ${balance.toFixed(2)}*\n\nReply *menu* to return.`);
}

async function handleNotices(phone: string) {
  const { data } = await admin
    .from("announcements")
    .select("title, content, created_at")
    .is("deleted_at", null)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(5);

  if (!data || data.length === 0) {
    await sendText(phone, "📭 No announcements right now.\n\nReply *menu* to return.");
    return;
  }
  const txt = data.map((a: any, i: number) => `*${i + 1}. ${a.title}*\n${a.content.slice(0, 200)}`).join("\n\n");
  await sendText(phone, `📢 *Latest Notices*\n\n${txt}\n\nReply *menu* to return.`);
}

async function handleAttendance(phone: string, userId: string) {
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const { data } = await admin
    .from("attendance")
    .select("status")
    .eq("student_id", userId)
    .gte("date", since.toISOString().split("T")[0]);

  const total = data?.length ?? 0;
  if (total === 0) {
    await sendText(phone, "📅 No attendance records in the last 30 days.\n\nReply *menu* to return.");
    return;
  }
  const counts: Record<string, number> = {};
  data!.forEach((r: any) => (counts[r.status] = (counts[r.status] ?? 0) + 1));
  const present = counts["present"] ?? 0;
  const pct = ((present / total) * 100).toFixed(1);
  const breakdown = Object.entries(counts).map(([k, v]) => `• ${k}: ${v}`).join("\n");
  await sendText(phone, `📅 *Attendance (last 30 days)*\n\n${breakdown}\n\n*Rate: ${pct}%*\n\nReply *menu* to return.`);
}

async function handleGrades(phone: string, userId: string) {
  const { data } = await admin
    .from("grades")
    .select("mark, grade_letter, term, academic_year, subjects(name)")
    .eq("student_id", userId)
    .is("deleted_at", null)
    .order("academic_year", { ascending: false })
    .limit(15);

  if (!data || data.length === 0) {
    await sendText(phone, "📚 No grades published yet.\n\nReply *menu* to return.");
    return;
  }
  const lines = data.map((g: any) => `• ${g.subjects?.name ?? "—"}: *${g.mark}* (${g.grade_letter ?? "-"}) — ${g.term} ${g.academic_year}`);
  await sendText(phone, `📚 *Recent Grades*\n\n${lines.join("\n")}\n\nReply *menu* to return.`);
}

async function handleProfile(phone: string, userId: string) {
  const { data: prof } = await admin.from("profiles").select("full_name, email, phone").eq("user_id", userId).maybeSingle();
  const { data: sp } = await admin.from("student_profiles").select("student_id, level, form").eq("user_id", userId).maybeSingle();
  await sendText(
    phone,
    `👤 *Your Profile*\n\nName: ${prof?.full_name ?? "—"}\nStudent ID: ${sp?.student_id ?? "—"}\nLevel: ${sp?.level ?? "—"}\nForm: ${sp?.form ?? "—"}\nEmail: ${prof?.email ?? "—"}\n\nReply *menu* to return.`,
  );
}

function gradeFromMark(mark: number, level: string) {
  if (level === "a_level") {
    if (mark >= 76) return "A";
    if (mark >= 67) return "B";
    if (mark >= 55) return "C";
    if (mark >= 45) return "D";
    if (mark >= 35) return "E";
    return "O";
  }
  if (mark >= 70) return "A";
  if (mark >= 60) return "B";
  if (mark >= 50) return "C";
  if (mark >= 40) return "D";
  return "U";
}

function getComment(avg: number) {
  if (avg >= 80) return "Outstanding performance. Keep up the excellent work!";
  if (avg >= 70) return "Very good performance. Shows great potential.";
  if (avg >= 60) return "Good performance. Consistent effort is noted.";
  if (avg >= 50) return "Satisfactory performance. Room for improvement.";
  if (avg >= 40) return "Below average. Needs to put in more effort.";
  return "Unsatisfactory. Immediate intervention required.";
}

function getHeadmasterRemark(avg: number, name: string) {
  const first = (name || "Student").split(" ")[0];
  if (avg >= 80) return `${first} is an exemplary student. The school is proud of this achievement.`;
  if (avg >= 70) return `${first} has shown commendable performance. Continue striving for excellence.`;
  if (avg >= 60) return `A pleasing performance by ${first}. With more dedication, greater heights can be reached.`;
  if (avg >= 50) return `A fair attempt by ${first}. More effort and focus are encouraged next term.`;
  if (avg >= 40) return `${first}'s performance needs significant improvement. Parents are advised to assist.`;
  return `Very poor performance by ${first}. A meeting with the parents is recommended.`;
}

function ordinal(n: number) {
  if (n === 1) return "1st"; if (n === 2) return "2nd"; if (n === 3) return "3rd"; return `${n}th`;
}

const SCHOOL = {
  name: "ST. MARY'S HIGH SCHOOL",
  motto: "Excellence & Integrity",
  address: "P.O. Box 123, Harare, Zimbabwe",
  phone: "+263 242 123 456",
};

async function getAppOrigin(): Promise<string> {
  const { data } = await admin.from("system_settings").select("value").eq("key", "app_url").maybeSingle();
  if (data?.value) return String(data.value).replace(/\/$/, "");
  return "https://stmarys.app";
}

async function fetchPng(url: string): Promise<Uint8Array | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return new Uint8Array(await r.arrayBuffer());
  } catch { return null; }
}

async function generateReportPdf(userId: string, term: string, year: number) {
  const termValue = String(term).toLowerCase().replace(/\s+/g, "_");
  const [{ data: profile }, { data: student }, { data: grades }] = await Promise.all([
    admin.from("profiles").select("full_name").eq("user_id", userId).maybeSingle(),
    admin.from("student_profiles").select("student_id, level, form, class_id, date_of_birth, guardian_name").eq("user_id", userId).maybeSingle(),
    admin.from("grades").select("mark, grade_letter, comment, subjects(name, code)").eq("student_id", userId).eq("term", termValue as any).eq("academic_year", year).is("deleted_at", null),
  ]);

  if (!grades || grades.length === 0) return null;

  const level = student?.level || "o_level";
  const { data: cls } = student?.class_id
    ? await admin.from("classes").select("name, class_teacher_id").eq("id", student.class_id).maybeSingle()
    : { data: null } as any;

  const { data: scales } = await admin.from("grading_scales").select("*").eq("level", level);
  const sortedScales = ((scales || []) as any[]).sort((a, b) => b.max_mark - a.max_mark);

  // Position calculation
  let position = 0; let totalStudents = 0;
  if (student?.class_id) {
    const { data: classmates } = await admin.from("student_profiles").select("user_id").eq("class_id", student.class_id).eq("is_active", true);
    const ids = (classmates || []).map((c: any) => c.user_id);
    totalStudents = ids.length;
    if (ids.length) {
      const { data: allG } = await admin.from("grades").select("student_id, mark").in("student_id", ids).eq("term", termValue as any).eq("academic_year", year).is("deleted_at", null);
      const totals = new Map<string, { sum: number; n: number }>();
      (allG || []).forEach((g: any) => {
        const t = totals.get(g.student_id) || { sum: 0, n: 0 };
        t.sum += Number(g.mark); t.n += 1; totals.set(g.student_id, t);
      });
      const ranked = Array.from(totals.entries()).map(([sid, v]) => ({ sid, avg: v.sum / v.n })).sort((a, b) => b.avg - a.avg);
      position = ranked.findIndex(r => r.sid === userId) + 1;
    }
  }

  const totalMark = grades.reduce((s: number, g: any) => s + Number(g.mark), 0);
  const avgMark = parseFloat((totalMark / grades.length).toFixed(1));
  const termLabel = termValue.replace("_", " ").toUpperCase();
  const serial = `RPT-${year}-${termValue.replace("term_", "T")}-${Date.now().toString(36).toUpperCase()}`;
  const studentName = profile?.full_name || "Student";

  // Save verification
  await admin.from("report_verifications").insert({
    serial_number: serial,
    student_id: userId,
    student_name: studentName,
    student_code: student?.student_id || null,
    class_name: cls?.name || null,
    level,
    term: termLabel,
    academic_year: year,
    average_mark: avgMark,
    subjects_count: grades.length,
    position: position || null,
    total_students: totalStudents || null,
    generated_by: userId,
  });

  const origin = await getAppOrigin();
  const verifyUrl = `${origin}/verify-report?serial=${encodeURIComponent(serial)}`;

  // Signatures (admin always; class_teacher only if matches)
  const { data: sigsRaw } = await admin.from("report_signatures").select("*");
  const sigs = (sigsRaw || []).filter((s: any) => {
    if (s.role_title === "class_teacher") return cls?.class_teacher_id && s.user_id === cls.class_teacher_id;
    return true;
  });

  const gradeLetter = (mark: number) => {
    for (const s of sortedScales) if (mark >= s.min_mark && mark <= s.max_mark) return s.grade_letter;
    return gradeFromMark(mark, level);
  };

  // Build PDF
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const reg = await pdf.embedFont(StandardFonts.Helvetica);
  const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);
  const PW = 595;
  const primary = rgb(0.039, 0.239, 0.384);
  const muted = rgb(0.51, 0.51, 0.51);
  const dark = rgb(0.12, 0.12, 0.12);

  const text = (t: string, x: number, y: number, opts: { font?: PDFFont; size?: number; color?: any; align?: "left" | "center" | "right" } = {}) => {
    const f = opts.font || reg; const sz = opts.size || 9; const c = opts.color || dark;
    const w = f.widthOfTextAtSize(t, sz);
    const xx = opts.align === "center" ? x - w / 2 : opts.align === "right" ? x - w : x;
    page.drawText(t, { x: xx, y, size: sz, font: f, color: c });
  };

  let y = 815;
  // Header
  text(SCHOOL.name, PW / 2, y, { font: bold, size: 16, color: primary, align: "center" });
  y -= 14;
  text(`"${SCHOOL.motto}"`, PW / 2, y, { font: italic, size: 9, color: muted, align: "center" });
  y -= 10;
  text(`${SCHOOL.address}  |  Tel: ${SCHOOL.phone}`, PW / 2, y, { size: 7.5, color: muted, align: "center" });
  y -= 8;
  page.drawLine({ start: { x: 40, y }, end: { x: PW - 40, y }, thickness: 1.4, color: primary });
  y -= 3;
  page.drawLine({ start: { x: 40, y }, end: { x: PW - 40, y }, thickness: 0.6, color: primary });
  y -= 14;

  // Title bar
  page.drawRectangle({ x: 40, y: y - 10, width: PW - 80, height: 20, color: primary });
  text(`ACADEMIC REPORT CARD — ${termLabel} ${year}`, PW / 2, y - 4, { font: bold, size: 11, color: rgb(1, 1, 1), align: "center" });
  y -= 28;

  // Info grid
  const infoRows: [string, string, string, string][] = [
    ["Student Name:", studentName, "Student ID:", student?.student_id || "—"],
    ["Class:", cls?.name || "—", "Level:", String(level).replace("_", " ").toUpperCase()],
    ["Date of Birth:", student?.date_of_birth || "—", "Guardian:", student?.guardian_name || "—"],
  ];
  for (const r of infoRows) {
    text(r[0], 45, y, { font: bold, size: 9, color: primary });
    text(r[1], 130, y, { size: 9 });
    text(r[2], PW / 2 + 10, y, { font: bold, size: 9, color: primary });
    text(r[3], PW / 2 + 90, y, { size: 9 });
    y -= 14;
  }
  y -= 6;

  // Grades table
  const cols = [
    { h: "#", x: 45, w: 22, align: "center" as const },
    { h: "Subject", x: 70, w: 200 },
    { h: "Code", x: 275, w: 60 },
    { h: "Mark", x: 340, w: 55, align: "center" as const },
    { h: "Grade", x: 400, w: 50, align: "center" as const },
    { h: "Comment", x: 455, w: 100 },
  ];
  // Header row
  page.drawRectangle({ x: 40, y: y - 12, width: PW - 80, height: 16, color: primary });
  cols.forEach(c => {
    const cx = c.align === "center" ? c.x + c.w / 2 : c.x;
    text(c.h, cx, y - 8, { font: bold, size: 8, color: rgb(1, 1, 1), align: c.align });
  });
  y -= 16;

  grades.forEach((g: any, i: number) => {
    const rowH = 14;
    if (i % 2 === 0) page.drawRectangle({ x: 40, y: y - rowH + 2, width: PW - 80, height: rowH, color: rgb(0.96, 0.97, 0.98) });
    const sub = Array.isArray(g.subjects) ? g.subjects[0] : g.subjects;
    const m = Number(g.mark);
    text(String(i + 1), cols[0].x + cols[0].w / 2, y - 8, { size: 8, align: "center" });
    text(String(sub?.name || "—").slice(0, 32), cols[1].x, y - 8, { size: 8 });
    text(String(sub?.code || "—"), cols[2].x, y - 8, { size: 8 });
    text(String(m), cols[3].x + cols[3].w / 2, y - 8, { size: 8, font: bold, align: "center" });
    text(g.grade_letter || gradeLetter(m), cols[4].x + cols[4].w / 2, y - 8, { size: 8, font: bold, align: "center" });
    text(String(g.comment || "—").slice(0, 22), cols[5].x, y - 8, { size: 7, color: muted });
    y -= rowH;
  });
  // Total row
  page.drawRectangle({ x: 40, y: y - 14 + 2, width: PW - 80, height: 14, color: rgb(0.90, 0.92, 0.94) });
  text("TOTAL / AVERAGE", cols[1].x, y - 8, { size: 8, font: bold });
  text(`${totalMark} / ${avgMark}%`, cols[3].x + cols[3].w / 2, y - 8, { size: 8, font: bold, align: "center" });
  text(gradeLetter(avgMark), cols[4].x + cols[4].w / 2, y - 8, { size: 8, font: bold, align: "center" });
  y -= 22;

  // Summary boxes
  const items = [
    { l: "AVERAGE", v: `${avgMark}%` },
    { l: "POSITION", v: position ? ordinal(position) : "—" },
    { l: "OUT OF", v: totalStudents ? String(totalStudents) : "—" },
    { l: "SUBJECTS", v: String(grades.length) },
    { l: "OVERALL", v: gradeLetter(avgMark) },
  ];
  const totalW = PW - 80;
  const gap = 6;
  const bw = (totalW - gap * (items.length - 1)) / items.length;
  items.forEach((it, i) => {
    const bx = 40 + i * (bw + gap);
    page.drawRectangle({ x: bx, y: y - 38, width: bw, height: 38, color: rgb(0.98, 0.98, 0.99), borderColor: rgb(0.78, 0.78, 0.82), borderWidth: 0.5 });
    text(it.v, bx + bw / 2, y - 18, { font: bold, size: 13, color: primary, align: "center" });
    text(it.l, bx + bw / 2, y - 32, { size: 6.5, color: muted, align: "center" });
  });
  y -= 46;

  // Class teacher remark
  const drawRemark = (label: string, body: string) => {
    page.drawRectangle({ x: 40, y: y - 30, width: PW - 80, height: 30, color: rgb(0.98, 0.98, 0.99), borderColor: rgb(0.85, 0.85, 0.88), borderWidth: 0.4 });
    text(label, 46, y - 10, { font: bold, size: 7, color: primary });
    text(body, 46, y - 22, { size: 8.5, color: rgb(0.25, 0.25, 0.25) });
    y -= 36;
  };
  drawRemark("CLASS TEACHER'S REMARK", getComment(avgMark));
  drawRemark("HEADMASTER'S REMARK", getHeadmasterRemark(avgMark, studentName));

  // Grading key
  if (sortedScales.length) {
    const key = sortedScales.map(s => `${s.grade_letter}: ${s.min_mark}-${s.max_mark}`).join("   |   ");
    text(`GRADING KEY:  ${key}`, PW / 2, y, { size: 6.5, color: muted, align: "center" });
    y -= 12;
  }

  // Signatures
  const sigY = Math.max(y - 10, 110);
  const slots = [
    { role: "class_teacher", label: "CLASS TEACHER", x: 90 },
    { role: "headmaster", label: "HEADMASTER", x: PW / 2 },
    { role: "admin", label: "REGISTRAR", x: PW - 90 },
  ];
  for (const slot of slots) {
    const sig = sigs.find((s: any) => s.role_title === slot.role);
    if (sig?.signature_url) {
      const bytes = await fetchPng(sig.signature_url);
      if (bytes) {
        try {
          const img = await pdf.embedPng(bytes);
          const w = 60; const h = (img.height / img.width) * w;
          page.drawImage(img, { x: slot.x - w / 2, y: sigY - h, width: w, height: Math.min(h, 26) });
        } catch {}
      }
    }
    page.drawLine({ start: { x: slot.x - 50, y: sigY - 30 }, end: { x: slot.x + 50, y: sigY - 30 }, thickness: 0.5, color: rgb(0.5, 0.5, 0.5) });
    text(sig?.display_name || "—", slot.x, sigY - 40, { size: 7.5, font: bold, align: "center" });
    text(slot.label, slot.x, sigY - 49, { size: 6.5, color: muted, align: "center" });
  }

  // QR + verify URL footer
  try {
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 0, width: 200 });
    const qrBytes = Uint8Array.from(atob(qrDataUrl.split(",")[1]), c => c.charCodeAt(0));
    const qr = await pdf.embedPng(qrBytes);
    page.drawImage(qr, { x: PW - 80, y: 35, width: 50, height: 50 });
  } catch {}

  text(`Serial No: ${serial}`, 45, 70, { size: 7.5, font: bold });
  text(`Verify: ${verifyUrl}`, 45, 60, { size: 6.5, color: muted });
  text(`Generated: ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}`, 45, 50, { size: 6.5, color: muted });
  text("This is an officially generated academic record. Scan QR to verify authenticity.", 45, 40, { size: 6, color: muted, font: italic });

  const bytes = await pdf.save();
  return { bytes, serial, avgMark, position, totalStudents, termLabel, year, subjects: grades.length };
}

async function handleReport(phone: string, userId: string) {
  await sendText(phone, "📄 Generating your latest report card...");

  // Find latest term/year that has grades
  const { data: latestGrade } = await admin
    .from("grades")
    .select("term, academic_year")
    .eq("student_id", userId)
    .is("deleted_at", null)
    .order("academic_year", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latestGrade) {
    await sendText(phone, "❌ No grades available yet. Please check back once your teachers release marks.\n\nReply *menu* to return.");
    return;
  }

  const result = await generateReportPdf(userId, latestGrade.term, latestGrade.academic_year);
  if (!result) {
    await sendText(phone, "❌ Could not generate your report. Please try again later.\n\nReply *menu* to return.");
    return;
  }

  const path = `${userId}/${result.serial}.pdf`;
  await admin.storage.from("student-reports").upload(path, result.bytes, { contentType: "application/pdf", upsert: true });
  const { data: pub } = admin.storage.from("student-reports").getPublicUrl(path);

  const sent = await sendDocument(phone, pub.publicUrl, `${result.serial}.pdf`, `📄 Report Card — ${result.termLabel} ${result.year}`);
  const summary = `📊 *Report Summary*\n\n` +
    `Term: ${result.termLabel} ${result.year}\n` +
    `Subjects: ${result.subjects}\n` +
    `Average: ${result.avgMark}%\n` +
    `Position: ${result.position ? ordinal(result.position) : "—"}${result.totalStudents ? ` of ${result.totalStudents}` : ""}\n` +
    `Serial: ${result.serial}\n\n` +
    `${sent.ok ? "✅ PDF sent above." : `📥 Download: ${pub.publicUrl}`}\n\nReply *menu* to return.`;
  await sendText(phone, summary);
}

// ---------- Router ----------
async function handleMessage(phone: string, body: string) {
  const text = body.trim();
  const lower = text.toLowerCase();
  const session = await getSession(phone);

  // logout
  if (lower === "0" || lower === "logout") {
    await updateSession(phone, { state: "awaiting_login", user_id: null, student_profile_id: null } as any);
    await sendText(phone, "👋 Logged out. Reply with your *Student ID* to log back in.");
    return;
  }

  // not authenticated
  if (session.state !== "authenticated" || !session.user_id) {
    if (lower === "hi" || lower === "hello" || lower === "menu" || lower === "start") {
      await sendText(phone, LOGIN_PROMPT);
      return;
    }
    // treat as student-id attempt
    await handleLogin(phone, text);
    return;
  }

  // authenticated routing
  if (lower === "menu" || lower === "hi" || lower === "hello") {
    await sendText(phone, MAIN_MENU);
    return;
  }

  switch (text) {
    case "1": return handleReport(phone, session.user_id);
    case "2": return handleFees(phone, session.user_id);
    case "3": return handleNotices(phone);
    case "4": return handleAttendance(phone, session.user_id);
    case "5": return handleGrades(phone, session.user_id);
    case "6": return handleProfile(phone, session.user_id);
    default:
      await sendText(phone, `🤖 Sorry, I didn't understand "${text}".\n\n${MAIN_MENU}`);
  }
}

// ---------- HTTP entrypoint ----------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);

  // Verification handshake from Meta
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && token === WA_VERIFY) {
      return new Response(challenge ?? "", { status: 200, headers: corsHeaders });
    }
    return new Response("forbidden", { status: 403, headers: corsHeaders });
  }

  if (req.method === "POST") {
    try {
      const payload = await req.json();
      const entries = payload?.entry ?? [];
      for (const entry of entries) {
        for (const change of entry.changes ?? []) {
          const messages = change.value?.messages ?? [];
          for (const msg of messages) {
            const from = msg.from as string;
            const body = msg.text?.body ?? msg.button?.text ?? msg.interactive?.button_reply?.title ?? "";
            if (from && body) {
              await handleMessage(from, body).catch((e) => console.error("handleMessage error", e));
            }
          }
        }
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e) {
      console.error("webhook error", e);
      return new Response(JSON.stringify({ error: String(e) }), {
        status: 200, // still 200 so Meta doesn't retry forever
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response("method not allowed", { status: 405, headers: corsHeaders });
});
