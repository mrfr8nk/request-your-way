// Generates a premium branded PDF receipt and sends it via WhatsApp.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";
import { PDFDocument, StandardFonts, rgb, degrees } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WA_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN")!;
const WA_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;

const SCHOOL_NAME = "ST. MARY'S HIGH SCHOOL";
const SCHOOL_MOTTO = "Excellence & Integrity";
const SCHOOL_ADDRESS = "P.O. Box 123 · Harare · Zimbabwe";
const SCHOOL_CONTACT = "admin@stmarys.ac.zw · +263 771 000 000";

// ---------- helpers ----------
function money(n: any) {
  return `USD ${Number(n || 0).toFixed(2)}`;
}
function fmtDate(d?: string) {
  const date = d ? new Date(d) : new Date();
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtTime(d?: string) {
  const date = d ? new Date(d) : new Date();
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
}
function docHash(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  const hex = (h >>> 0).toString(16).toUpperCase().padStart(8, "0");
  return `${hex.slice(0, 4)}-${hex.slice(4)}`;
}

async function buildReceiptPdf(data: any): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]); // A4
  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const oblq = await pdf.embedFont(StandardFonts.HelveticaOblique);

  const navy = rgb(0.04, 0.11, 0.31);
  const navyLight = rgb(0.12, 0.24, 0.5);
  const gold = rgb(0.83, 0.69, 0.22);
  const goldSoft = rgb(0.95, 0.87, 0.55);
  const ink = rgb(0.1, 0.1, 0.14);
  const mute = rgb(0.42, 0.44, 0.5);
  const paper = rgb(0.985, 0.98, 0.94);
  const line = rgb(0.85, 0.85, 0.88);

  const W = 595;
  const H = 842;

  // ---------- diagonal watermark ----------
  const wm = SCHOOL_NAME;
  for (let yy = -60; yy < H + 60; yy += 90) {
    for (let xx = -40; xx < W + 40; xx += 260) {
      page.drawText(wm, {
        x: xx,
        y: yy,
        size: 22,
        font: bold,
        color: rgb(0.93, 0.93, 0.96),
        rotate: degrees(-30),
        opacity: 0.35,
      });
    }
  }

  // ---------- header ----------
  page.drawRectangle({ x: 0, y: H - 110, width: W, height: 110, color: navy });
  page.drawRectangle({ x: 0, y: H - 116, width: W, height: 6, color: gold });

  // faux crest circle
  page.drawCircle({ x: 60, y: H - 55, size: 26, borderColor: gold, borderWidth: 2, color: navyLight });
  page.drawText("SM", { x: 46, y: H - 62, size: 18, font: bold, color: gold });

  page.drawText(SCHOOL_NAME, { x: 100, y: H - 45, size: 18, font: bold, color: rgb(1, 1, 1) });
  page.drawText(SCHOOL_MOTTO, { x: 100, y: H - 62, size: 10, font: oblq, color: goldSoft });
  page.drawText(SCHOOL_ADDRESS, { x: 100, y: H - 78, size: 8, font: helv, color: rgb(0.85, 0.87, 0.95) });
  page.drawText(SCHOOL_CONTACT, { x: 100, y: H - 90, size: 8, font: helv, color: rgb(0.85, 0.87, 0.95) });

  // Ribbon "OFFICIAL RECEIPT"
  page.drawRectangle({ x: W - 200, y: H - 70, width: 180, height: 26, color: gold });
  page.drawText("OFFICIAL RECEIPT", { x: W - 188, y: H - 63, size: 12, font: bold, color: navy });
  page.drawText("Original · Non-Transferable", { x: W - 188, y: H - 84, size: 7, font: helv, color: rgb(0.9, 0.9, 0.95) });

  // ---------- meta strip ----------
  const nowIso = new Date().toISOString();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Harare";
  const hash = docHash(`${data.receiptNumber || ""}|${data.studentName || ""}|${data.amountPaid || 0}|${nowIso}`);

  const metaY = H - 145;
  page.drawRectangle({ x: 30, y: metaY - 30, width: W - 60, height: 44, color: paper, borderColor: line, borderWidth: 0.5 });

  const metaCell = (label: string, value: string, x: number) => {
    page.drawText(label.toUpperCase(), { x, y: metaY, size: 7, font: bold, color: mute });
    page.drawText(value, { x, y: metaY - 14, size: 10, font: bold, color: ink });
  };
  metaCell("Receipt No.", data.receiptNumber || "—", 42);
  metaCell("Issued", `${fmtDate(data.paymentDate)}  ${fmtTime(data.paymentDate)}`, 190);
  metaCell("Method", (data.paymentMethod || "Cash").toString().toUpperCase(), 360);
  metaCell("Doc Hash", hash, 470);

  // ---------- student block ----------
  let y = H - 210;
  page.drawText("BILLED TO", { x: 40, y, size: 8, font: bold, color: gold });
  y -= 16;
  page.drawText(data.studentName || "—", { x: 40, y, size: 15, font: bold, color: navy });
  y -= 16;
  page.drawText(
    `${data.className || "—"}  ·  Student ID: ${data.studentId || "—"}`,
    { x: 40, y, size: 10, font: helv, color: ink },
  );
  y -= 14;
  page.drawText(
    `${(data.term || "").toString().replace("_", " ").toUpperCase()}  ·  Academic Year ${data.academicYear || ""}`,
    { x: 40, y, size: 10, font: helv, color: mute },
  );

  // ---------- payment table ----------
  const tableY = H - 320;
  page.drawRectangle({ x: 30, y: tableY - 30, width: W - 60, height: 30, color: navy });
  page.drawText("DESCRIPTION", { x: 44, y: tableY - 20, size: 9, font: bold, color: rgb(1, 1, 1) });
  page.drawText("AMOUNT (USD)", { x: W - 150, y: tableY - 20, size: 9, font: bold, color: rgb(1, 1, 1) });

  const paidNow = Number(data.amountPaidNow ?? data.paymentAmount ?? 0);
  const paidToDate = Number(data.amountPaid || 0);
  const due = Number(data.amountDue || 0);
  const bal = due - paidToDate;

  const rows: Array<[string, string, boolean?]> = [
    [`Tuition — ${(data.term || "").toString().replace("_", " ")} ${data.academicYear || ""}`, `$${due.toFixed(2)}`],
  ];
  if (paidNow > 0) rows.push([`Payment received (${data.paymentMethod || "Cash"})`, `- $${paidNow.toFixed(2)}`]);

  let rowY = tableY - 50;
  rows.forEach(([l, v]) => {
    page.drawText(l, { x: 44, y: rowY, size: 10, font: helv, color: ink });
    page.drawText(v, { x: W - 150, y: rowY, size: 10, font: helv, color: ink });
    rowY -= 22;
    page.drawLine({ start: { x: 30, y: rowY + 6 }, end: { x: W - 30, y: rowY + 6 }, thickness: 0.4, color: line });
  });

  // Totals card
  const cardY = rowY - 20;
  page.drawRectangle({ x: 300, y: cardY - 90, width: W - 330, height: 90, color: paper, borderColor: navy, borderWidth: 1.5 });
  const tRow = (l: string, v: string, ry: number, big = false) => {
    page.drawText(l, { x: 314, y: ry, size: big ? 11 : 9, font: big ? bold : helv, color: big ? navy : mute });
    page.drawText(v, { x: W - 60 - v.length * (big ? 6 : 5), y: ry, size: big ? 13 : 10, font: bold, color: big ? navy : ink });
  };
  tRow("Total Fees", money(due), cardY - 20);
  tRow("Paid to Date", money(paidToDate), cardY - 40);
  page.drawLine({ start: { x: 314, y: cardY - 52 }, end: { x: W - 46, y: cardY - 52 }, thickness: 0.6, color: gold });
  tRow(bal <= 0 ? "PAID IN FULL" : "OUTSTANDING BALANCE", money(Math.max(0, bal)), cardY - 72, true);

  // Paid stamp
  if (bal <= 0) {
    page.drawRectangle({ x: 55, y: cardY - 70, width: 180, height: 60, borderColor: rgb(0.1, 0.5, 0.2), borderWidth: 3, opacity: 0.85 });
    page.drawText("PAID", { x: 100, y: cardY - 50, size: 32, font: bold, color: rgb(0.1, 0.5, 0.2), rotate: degrees(-8) });
  }

  // ---------- signatures ----------
  const sigY = 170;
  page.drawLine({ start: { x: 60, y: sigY }, end: { x: 240, y: sigY }, thickness: 0.6, color: ink });
  page.drawText("Bursar's Signature", { x: 60, y: sigY - 12, size: 8, font: helv, color: mute });
  page.drawLine({ start: { x: 340, y: sigY }, end: { x: 540, y: sigY }, thickness: 0.6, color: ink });
  page.drawText("Official Stamp", { x: 340, y: sigY - 12, size: 8, font: helv, color: mute });

  // ---------- security strip ----------
  page.drawRectangle({ x: 30, y: 90, width: W - 60, height: 30, color: rgb(0.97, 0.97, 1), borderColor: line, borderWidth: 0.5 });
  page.drawText("SECURITY", { x: 42, y: 105, size: 7, font: bold, color: gold });
  page.drawText(
    `Doc ${hash}  ·  ${fmtDate(nowIso)} ${fmtTime(nowIso)} ${tz}  ·  Generated by St. Mary's Finance Portal`,
    { x: 42, y: 94, size: 7, font: helv, color: mute },
  );

  // ---------- footer ----------
  page.drawText("Thank you for your payment. Kindly retain this receipt for your records.", { x: 30, y: 70, size: 9, font: bold, color: ink });
  page.drawText(
    "This is a computer-generated official receipt. Any alteration, duplication or forgery is a criminal offence under Zimbabwean law.",
    { x: 30, y: 56, size: 7, font: oblq, color: mute },
  );
  page.drawText(`Verify authenticity at portal.stmarys.ac.zw/verify  ·  Ref: ${hash}`, { x: 30, y: 44, size: 7, font: helv, color: mute });
  page.drawRectangle({ x: 0, y: 0, width: W, height: 6, color: gold });
  page.drawRectangle({ x: 0, y: 6, width: W, height: 2, color: navy });

  // ---------- PDF metadata ----------
  pdf.setTitle(`Official Receipt ${data.receiptNumber || ""} — ${SCHOOL_NAME}`);
  pdf.setAuthor(SCHOOL_NAME);
  pdf.setSubject(`Fee Payment Receipt for ${data.studentName || ""}`);
  pdf.setCreator("St. Mary's Finance Portal");
  pdf.setProducer("St. Mary's Finance Portal");
  pdf.setKeywords([hash, data.receiptNumber || "", data.studentId || "", "official-receipt"]);
  pdf.setCreationDate(new Date());
  pdf.setModificationDate(new Date());

  return await pdf.save();
}

// ---------- upload + send ----------
async function uploadAndGetUrl(supabase: any, pdfBytes: Uint8Array, receiptNumber: string) {
  const path = `whatsapp-receipts/${receiptNumber || crypto.randomUUID()}-${Date.now()}.pdf`;
  const { error } = await supabase.storage.from("receipts").upload(path, pdfBytes, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (error) throw new Error("upload_failed: " + error.message);
  const { data: signed } = await supabase.storage.from("receipts").createSignedUrl(path, 60 * 60 * 24 * 30);
  return signed?.signedUrl;
}

function normalizeZwPhone(raw: string): string {
  let d = (raw || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("263")) return d;
  if (d.startsWith("0")) return "263" + d.slice(1);
  if (d.length === 9) return "263" + d;
  return d;
}

async function sendDocument(to: string, url: string, filename: string, caption: string) {
  const cleaned = normalizeZwPhone(to);
  if (!cleaned || cleaned.length < 10) return { ok: false, body: "invalid_phone: " + to };
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
  if (!res.ok) console.error("WhatsApp receipt send failed", res.status, txt);
  return { ok: res.ok, body: txt };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const { phone, receipt_data } = await req.json();
    if (!receipt_data) throw new Error("receipt_data required");

    const bytes = await buildReceiptPdf(receipt_data);
    const url = await uploadAndGetUrl(supabase, bytes, receipt_data.receiptNumber);

    const results: any = { pdf_url: url };
    if (phone) {
      const r = await sendDocument(
        phone,
        url,
        `Receipt-${receipt_data.receiptNumber || "stmarys"}.pdf`,
        `📄 *Official Receipt ${receipt_data.receiptNumber}*\n${receipt_data.studentName} — ${(receipt_data.term || "").toString().replace("_", " ").toUpperCase()} ${receipt_data.academicYear}\nAmount Paid: $${Number(receipt_data.amountPaidNow ?? receipt_data.paymentAmount ?? receipt_data.amountPaid ?? 0).toFixed(2)}\n\n— St. Mary's High School\n_Excellence & Integrity_`,
      );
      results.whatsapp = r;
    }

    return new Response(JSON.stringify({ success: true, ...results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
