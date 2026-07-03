// Generates a PDF Fee Balance Statement and sends it to parent/guardian via WhatsApp.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WA_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN")!;
const WA_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;

function normalizeZwPhone(raw: string): string {
  let d = (raw || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("263")) return d;
  if (d.startsWith("0")) return "263" + d.slice(1);
  if (d.length === 9) return "263" + d;
  return d;
}

async function buildFeeReminderPdf(d: any): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const navy = rgb(0.0, 0.13, 0.4);
  const gold = rgb(0.83, 0.69, 0.22);
  const red = rgb(0.75, 0.15, 0.15);
  const ink = rgb(0.12, 0.12, 0.15);

  page.drawRectangle({ x: 0, y: 762, width: 595, height: 80, color: navy });
  page.drawRectangle({ x: 0, y: 758, width: 595, height: 4, color: gold });
  page.drawText("ST. MARY'S HIGH SCHOOL", { x: 40, y: 810, size: 18, font: bold, color: rgb(1, 1, 1) });
  page.drawText("Bursar's Office — Fee Statement", { x: 40, y: 790, size: 10, font: helv, color: rgb(0.95, 0.85, 0.5) });
  page.drawText("FEE REMINDER", { x: 428, y: 800, size: 13, font: bold, color: rgb(1, 1, 1) });

  page.drawText(`Date: ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`,
    { x: 40, y: 730, size: 10, font: helv, color: ink });

  let y = 700;
  const label = (l: string, v: string) => {
    page.drawText(l, { x: 40, y, size: 9, font: helv, color: rgb(0.45, 0.45, 0.5) });
    page.drawText(v, { x: 40, y: y - 14, size: 12, font: bold, color: ink });
    y -= 36;
  };
  label("Student", d.studentName || "—");
  label("Class", d.className || "—");
  label("Term / Year", `${(d.term || "").toString().replace("_", " ").toUpperCase()}  ${d.academicYear || ""}`);

  const balance = Number(d.amountDue || 0) - Number(d.amountPaid || 0);

  page.drawRectangle({ x: 40, y: 380, width: 515, height: 160, borderColor: navy, borderWidth: 1.5, color: rgb(0.98, 0.97, 0.92) });
  page.drawText("OUTSTANDING BALANCE", { x: 56, y: 515, size: 11, font: bold, color: navy });
  const row = (l: string, v: string, ry: number, big = false, color = ink) => {
    page.drawText(l, { x: 60, y: ry, size: 11, font: helv, color: ink });
    page.drawText(v, { x: 470, y: ry, size: big ? 16 : 11, font: bold, color });
  };
  row("Total Fees Due", `$${Number(d.amountDue || 0).toFixed(2)}`, 485);
  row("Amount Paid to Date", `$${Number(d.amountPaid || 0).toFixed(2)}`, 462);
  page.drawLine({ start: { x: 60, y: 448 }, end: { x: 535, y: 448 }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) });
  row("BALANCE OUTSTANDING", `$${balance.toFixed(2)}`, 420, true, red);
  if (d.zigRate) {
    page.drawText(`≈ ZIG ${(balance * Number(d.zigRate)).toFixed(0)} at rate ${d.zigRate}`,
      { x: 60, y: 398, size: 9, font: helv, color: rgb(0.4, 0.4, 0.45) });
  }

  page.drawText("Payment Instructions:", { x: 40, y: 340, size: 11, font: bold, color: navy });
  const lines = [
    "• Pay via EcoCash, bank transfer, or at the Bursar's Office.",
    "• Include the student's full name and Term/Year as reference.",
    "• Contact the bursar for banking details or a payment plan.",
    "• Keep receipts safe — you can verify them on our portal.",
  ];
  lines.forEach((ln, i) => page.drawText(ln, { x: 40, y: 320 - i * 16, size: 10, font: helv, color: ink }));

  page.drawText("Thank you for your continued support of your child's education.", { x: 40, y: 100, size: 10, font: helv, color: ink });
  page.drawText("This is a system-generated statement from St. Mary's High School.", { x: 40, y: 84, size: 8, font: helv, color: rgb(0.5, 0.5, 0.55) });
  page.drawRectangle({ x: 0, y: 0, width: 595, height: 4, color: gold });

  return await pdf.save();
}

async function uploadAndSign(supabase: any, bytes: Uint8Array, name: string) {
  const path = `whatsapp-reminders/${name}-${crypto.randomUUID()}.pdf`;
  const { error } = await supabase.storage.from("receipts").upload(path, bytes, {
    contentType: "application/pdf", upsert: true,
  });
  if (error) throw new Error("upload_failed: " + error.message);
  const { data: signed } = await supabase.storage.from("receipts").createSignedUrl(path, 60 * 60 * 24 * 30);
  return signed?.signedUrl;
}

async function sendDoc(to: string, url: string, filename: string, caption: string) {
  const cleaned = normalizeZwPhone(to);
  if (!cleaned || cleaned.length < 10) return { ok: false, error: "invalid_phone: " + to };
  const res = await fetch(`https://graph.facebook.com/v21.0/${WA_PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${WA_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: cleaned,
      type: "document",
      document: { link: url, filename, caption },
    }),
  });
  const txt = await res.text();
  if (!res.ok) console.error("WA reminder send failed", res.status, txt);
  return { ok: res.ok, error: res.ok ? null : `${res.status}: ${txt}` };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const { phones, phone, reminder_data } = await req.json();
    if (!reminder_data) throw new Error("reminder_data required");
    const targets: string[] = Array.isArray(phones) ? phones : (phone ? [phone] : []);
    if (targets.length === 0) throw new Error("phone(s) required");

    const bytes = await buildFeeReminderPdf(reminder_data);
    const url = await uploadAndSign(supabase, bytes, (reminder_data.studentName || "student").replace(/\W+/g, "_"));

    const balance = Number(reminder_data.amountDue || 0) - Number(reminder_data.amountPaid || 0);
    const caption = `🔔 *Fee Reminder*\n${reminder_data.studentName} — ${(reminder_data.term || "").toString().replace("_", " ").toUpperCase()} ${reminder_data.academicYear || ""}\n*Balance:* $${balance.toFixed(2)}\n\nSee attached statement.\n— St. Mary's Bursar's Office`;

    const results = [];
    for (const p of targets) {
      const r = await sendDoc(p, url!, `Fee-Statement-${(reminder_data.studentName || "student").replace(/\W+/g, "_")}.pdf`, caption);
      results.push({ phone: p, ...r });
    }
    const okCount = results.filter(r => r.ok).length;
    return new Response(JSON.stringify({ success: true, sent: okCount, failed: results.length - okCount, pdf_url: url, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
