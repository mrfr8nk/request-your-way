// Generates a PDF receipt and sends it to the parent/student via WhatsApp.
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

async function buildReceiptPdf(data: any): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const navy = rgb(0.0, 0.13, 0.4);
  const gold = rgb(0.83, 0.69, 0.22);
  const ink = rgb(0.12, 0.12, 0.15);

  // Header band
  page.drawRectangle({ x: 0, y: 762, width: 595, height: 80, color: navy });
  page.drawRectangle({ x: 0, y: 758, width: 595, height: 4, color: gold });
  page.drawText("ST. MARY'S HIGH SCHOOL", { x: 40, y: 810, size: 18, font: bold, color: rgb(1, 1, 1) });
  page.drawText("Excellence & Integrity", { x: 40, y: 790, size: 10, font: helv, color: rgb(0.95, 0.85, 0.5) });
  page.drawText("OFFICIAL RECEIPT", { x: 410, y: 800, size: 13, font: bold, color: rgb(1, 1, 1) });

  // Receipt info block
  let y = 720;
  const label = (l: string, v: string) => {
    page.drawText(l, { x: 40, y, size: 9, font: helv, color: rgb(0.45, 0.45, 0.5) });
    page.drawText(v, { x: 40, y: y - 14, size: 12, font: bold, color: ink });
    y -= 38;
  };
  const right = (l: string, v: string, ry: number) => {
    page.drawText(l, { x: 360, y: ry, size: 9, font: helv, color: rgb(0.45, 0.45, 0.5) });
    page.drawText(v, { x: 360, y: ry - 14, size: 12, font: bold, color: ink });
  };

  right("Receipt No.", data.receiptNumber || "—", 720);
  right("Date", data.paymentDate || new Date().toLocaleDateString(), 682);
  right("Method", data.paymentMethod || "Cash", 644);

  label("Student", data.studentName || "—");
  label("Class", data.className || "—");
  label("Term / Year", `${(data.term || "").toString().replace("_", " ").toUpperCase()}  ${data.academicYear || ""}`);

  // Amount summary box
  page.drawRectangle({ x: 40, y: 420, width: 515, height: 130, borderColor: navy, borderWidth: 1.5, color: rgb(0.98, 0.97, 0.92) });
  page.drawText("PAYMENT SUMMARY", { x: 56, y: 525, size: 11, font: bold, color: navy });
  const row = (l: string, v: string, ry: number, big = false) => {
    page.drawText(l, { x: 60, y: ry, size: 11, font: helv, color: ink });
    page.drawText(v, { x: 480, y: ry, size: big ? 14 : 11, font: bold, color: big ? navy : ink });
  };
  row("Amount Due", `$${Number(data.amountDue || 0).toFixed(2)}`, 495);
  row("Amount Paid (to date)", `$${Number(data.amountPaid || 0).toFixed(2)}`, 472);
  const bal = Number(data.amountDue || 0) - Number(data.amountPaid || 0);
  row("Balance", `$${bal.toFixed(2)}`, 449, true);

  // Footer
  page.drawText("Thank you for your prompt payment.", { x: 40, y: 90, size: 10, font: helv, color: ink });
  page.drawText("This is a system-generated receipt. Verify at the school portal.", { x: 40, y: 74, size: 8, font: helv, color: rgb(0.5, 0.5, 0.55) });
  page.drawRectangle({ x: 0, y: 0, width: 595, height: 4, color: gold });

  return await pdf.save();
}

async function uploadAndGetUrl(supabase: any, pdfBytes: Uint8Array, receiptNumber: string) {
  const path = `whatsapp-receipts/${receiptNumber || crypto.randomUUID()}.pdf`;
  const { error } = await supabase.storage.from("receipts").upload(path, pdfBytes, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (error) throw new Error("upload_failed: " + error.message);
  const { data: signed } = await supabase.storage.from("receipts").createSignedUrl(path, 60 * 60 * 24 * 30);
  return signed?.signedUrl;
}

async function sendDocument(to: string, url: string, filename: string, caption: string) {
  const cleaned = to.replace(/\D/g, "");
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
        `📄 *Receipt ${receipt_data.receiptNumber}*\n${receipt_data.studentName} — ${(receipt_data.term || "").toString().replace("_", " ").toUpperCase()} ${receipt_data.academicYear}\nAmount: $${Number(receipt_data.amountPaid || 0).toFixed(2)}\n\n— St. Mary's High School`,
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
