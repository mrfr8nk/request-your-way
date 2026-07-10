import { methodLabel } from "./FeeConstants";

/**
 * Generate a Code128B barcode as SVG path data
 * Encodes alphanumeric receipt numbers for scanner compatibility
 */
const generateBarcodeSVG = (text: string): string => {
  // Code 128B encoding table (subset for alphanumeric)
  const CODE128B: Record<string, number[]> = {};
  const START_B = [2,1,1,2,1,4];
  const STOP = [2,3,3,1,1,1,2];
  
  // Build encoding patterns for printable ASCII (space to DEL)
  const patterns = [
    [2,1,2,2,2,2],[2,2,2,1,2,2],[2,2,2,2,2,1],[1,2,1,2,2,3],[1,2,1,3,2,2],
    [1,3,1,2,2,2],[1,2,2,2,1,3],[1,2,2,3,1,2],[1,3,2,2,1,2],[2,2,1,2,1,3],
    [2,2,1,3,1,2],[2,3,1,2,1,2],[1,1,2,2,3,2],[1,2,2,1,3,2],[1,2,2,2,3,1],
    [1,1,3,2,2,2],[1,2,3,1,2,2],[1,2,3,2,2,1],[2,2,3,2,1,1],[2,2,1,1,3,2],
    [2,2,1,2,3,1],[2,1,3,2,1,2],[2,2,3,1,1,2],[3,1,2,1,3,1],[3,1,1,2,2,2],
    [3,2,1,1,2,2],[3,2,1,2,2,1],[3,1,2,2,1,2],[3,2,2,1,1,2],[3,2,2,2,1,1],
    [2,1,2,1,2,3],[2,1,2,3,2,1],[2,3,2,1,2,1],[1,1,1,3,2,3],[1,3,1,1,2,3],
    [1,3,1,3,2,1],[1,1,2,3,1,3],[1,3,2,1,1,3],[1,3,2,3,1,1],[2,1,1,3,1,3],
    [2,3,1,1,1,3],[2,3,1,3,1,1],[1,1,2,1,3,3],[1,1,2,3,3,1],[1,3,2,1,3,1],
    [1,1,3,1,2,3],[1,1,3,3,2,1],[1,3,3,1,2,1],[3,1,3,1,2,1],[2,1,1,3,3,1],
    [2,3,1,1,3,1],[2,1,3,1,1,3],[2,1,3,3,1,1],[2,1,3,1,3,1],[3,1,1,1,2,3],
    [3,1,1,3,2,1],[3,3,1,1,2,1],[3,1,2,1,1,3],[3,1,2,3,1,1],[3,3,2,1,1,1],
    [3,1,4,1,1,1],[2,2,1,4,1,1],[4,3,1,1,1,1],[1,1,1,2,2,4],[1,1,1,4,2,2],
    [1,2,1,1,2,4],[1,2,1,4,2,1],[1,4,1,1,2,2],[1,4,1,2,2,1],[1,1,2,2,1,4],
    [1,1,2,4,1,2],[1,2,2,1,1,4],[1,2,2,4,1,1],[1,4,2,1,1,2],[1,4,2,2,1,1],
    [2,4,1,2,1,1],[2,2,1,1,1,4],[4,1,3,1,1,1],[2,4,1,1,1,2],[1,3,4,1,1,1],
    [1,1,1,2,4,2],[1,2,1,1,4,2],[1,2,1,2,4,1],[1,1,4,2,1,2],[1,2,4,1,1,2],
    [1,2,4,2,1,1],[4,1,1,2,1,2],[4,2,1,1,1,2],[4,2,1,2,1,1],[2,1,2,1,4,1],
    [2,1,4,1,2,1],[4,1,2,1,2,1],
  ];
  
  for (let i = 0; i < 95; i++) {
    CODE128B[String.fromCharCode(32 + i)] = patterns[i] || patterns[0];
  }

  // Build barcode bars
  let allBars: number[] = [...START_B];
  let checksum = 104; // Start B value
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const val = char.charCodeAt(0) - 32;
    const pattern = CODE128B[char] || patterns[0];
    allBars.push(...pattern);
    checksum += val * (i + 1);
  }
  
  // Add checksum character
  const checksumChar = checksum % 103;
  allBars.push(...(patterns[checksumChar] || patterns[0]));
  allBars.push(...STOP);

  // Render as SVG
  const barWidth = 1.5;
  let x = 0;
  let svgBars = '';
  for (let i = 0; i < allBars.length; i++) {
    const w = allBars[i] * barWidth;
    if (i % 2 === 0) {
      svgBars += `<rect x="${x}" y="0" width="${w}" height="50" fill="#000"/>`;
    }
    x += w;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${x}" height="50" viewBox="0 0 ${x} 50">${svgBars}</svg>`;
};

/** Generate a unique serial number for each receipt print */
const generateSerial = (receiptNumber: string): string => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SER-${ts}-${rand}`;
};

const docHash = (seed: string): string => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  const hex = (h >>> 0).toString(16).toUpperCase().padStart(8, "0");
  return `${hex.slice(0, 4)}-${hex.slice(4)}`;
};

const esc = (value: unknown): string => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");

export const printReceipt = (record: any, studentName: string, zigRate: number, className?: string) => {
  const balance = Number(record.amount_due) - Number(record.amount_paid);
  const serial = generateSerial(record.receipt_number || "");
  const barcodeData = record.receipt_number || serial;
  const barcodeSvg = generateBarcodeSVG(barcodeData);
  const issuedAt = new Date();
  const printDate = issuedAt.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Harare";
  const hash = docHash(`${record.receipt_number || serial}|${studentName}|${record.amount_due}|${record.amount_paid}|${record.payment_date || printDate}`);
  const paymentDate = record.payment_date
    ? new Date(record.payment_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const method = methodLabel((record as any).payment_method || "cash");
  const notes = (record.notes || "").toString().trim();

  const w = window.open("", "_blank", "width=500,height=750");
  if (!w) return;

  w.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Official Receipt ${esc(record.receipt_number || serial)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      max-width: 460px;
      margin: 0 auto;
      padding: 24px 20px;
      font-size: 13px;
      color: #111827;
      background: #f8fafc;
    }

    .receipt {
      position: relative;
      border: 2px solid #0b1f4d;
      border-radius: 8px;
      overflow: hidden;
      background: #fffef7;
      box-shadow: 0 12px 30px rgba(15,23,42,.12);
    }

    .receipt:before {
      content: "ST. MARY'S HIGH SCHOOL  ST. MARY'S HIGH SCHOOL  ST. MARY'S HIGH SCHOOL";
      position: absolute;
      left: -80px;
      top: 280px;
      width: 700px;
      transform: rotate(-34deg);
      color: rgba(11,31,77,.06);
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 5px;
      white-space: nowrap;
      z-index: 0;
    }

    .receipt > * { position: relative; z-index: 1; }

    .crest {
      width: 54px;
      height: 54px;
      border-radius: 50%;
      border: 2px solid #d3af37;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #d3af37;
      font-size: 18px;
      font-weight: 800;
      margin-bottom: 8px;
    }

    .receipt-header {
      background: #0b1f4d;
      color: #fff;
      text-align: center;
      padding: 18px 16px 16px;
      border-bottom: 5px solid #d3af37;
    }

    .receipt-header .school-name {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 2px;
    }

    .receipt-header .school-sub {
      font-size: 10px;
      letter-spacing: 1px;
      color: #f6d66b;
      text-transform: uppercase;
    }

    .receipt-header .school-contact {
      font-size: 9px;
      color: #dbe4ff;
      margin-top: 5px;
    }

    .receipt-badge {
      display: inline-block;
      background: #d3af37;
      color: #0b1f4d;
      font-size: 11px;
      font-weight: 700;
      padding: 5px 16px;
      border-radius: 4px;
      margin-top: 12px;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    .receipt-badge-sub {
      font-size: 9px;
      color: #e5e7eb;
      margin-top: 5px;
      letter-spacing: .5px;
    }

    .receipt-meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1px;
      padding: 0;
      background: #e5e7eb;
      border-bottom: 1px solid #d1d5db;
      font-size: 11px;
      color: #4b5563;
    }

    .receipt-meta span { background: #f8fafc; padding: 10px 12px; }
    .receipt-meta strong { color: #111827; display: block; margin-top: 2px; }

    .receipt-body { padding: 16px; }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 16px;
    }

    .info-item {
      padding: 8px 10px;
      background: #f9f9f9;
      border-radius: 6px;
      border: 1px solid #eee;
    }

    .info-item .label {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #888;
      font-weight: 600;
      margin-bottom: 2px;
    }

    .info-item .value {
      font-size: 13px;
      font-weight: 600;
      color: #1a1a1a;
    }

    .info-item.full { grid-column: 1 / -1; }

    .divider {
      border: none;
      border-top: 1px dashed #ccc;
      margin: 14px 0;
    }

    .amount-section { margin-bottom: 14px; }

    .amount-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
      font-size: 13px;
    }

    .amount-row .amt-label { color: #555; }
    .amount-row .amt-value { font-weight: 600; }
    .amount-row .zig { font-size: 10px; color: #888; font-weight: 400; }

    .amount-row.total-row {
      background: #f0f7f0;
      margin: 8px -16px 0;
      padding: 12px 16px;
      border-top: 2px solid #0b1f4d;
      font-size: 15px;
    }

    .amount-row.total-row .amt-value { font-weight: 700; }
    .amount-row.total-row.owing { background: #fef2f2; }
    .amount-row.total-row.owing .amt-value { color: #dc2626; }

    .paid-stamp {
      text-align: center;
      margin: 12px 0;
    }

    .paid-stamp span {
      display: inline-block;
      border: 3px solid #16a34a;
      color: #16a34a;
      font-size: 18px;
      font-weight: 800;
      letter-spacing: 4px;
      padding: 4px 20px;
      border-radius: 6px;
      transform: rotate(-3deg);
      text-transform: uppercase;
    }

    .barcode-section {
      text-align: center;
      padding: 16px;
      border-top: 1px dashed #ccc;
      background: #fafafa;
    }

    .security-strip {
      margin: 0 16px 14px;
      padding: 10px;
      border: 1px solid #d3af37;
      background: #fffbeb;
      font-size: 9px;
      color: #525252;
      line-height: 1.5;
    }

    .notes-box {
      margin-top: 12px;
      padding: 10px;
      border: 1px solid #e5e7eb;
      background: #f8fafc;
      border-radius: 6px;
      font-size: 11px;
      line-height: 1.5;
      white-space: pre-wrap;
    }

    .forgery-warning {
      color: #991b1b !important;
      font-weight: 700;
      margin-top: 6px;
    }

    .barcode-section svg {
      display: block;
      margin: 0 auto 6px;
      max-width: 240px;
      height: 45px;
    }

    .barcode-section .barcode-text {
      font-family: 'Courier New', monospace;
      font-size: 11px;
      letter-spacing: 2px;
      color: #333;
      font-weight: 600;
    }

    .serial-row {
      font-size: 9px;
      color: #999;
      margin-top: 4px;
      letter-spacing: 0.5px;
    }

    .receipt-footer {
      text-align: center;
      padding: 14px 16px;
      border-top: 1px solid #e0e0e0;
      background: #fafafa;
    }

    .receipt-footer p {
      font-size: 10px;
      color: #888;
      line-height: 1.6;
    }

    .receipt-footer .thank-you {
      font-size: 12px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 4px;
    }

    .watermark {
      font-size: 8px;
      color: #bbb;
      margin-top: 8px;
      text-align: center;
      letter-spacing: 0.3px;
    }

    @media print {
      body { padding: 0; }
      .receipt { border-width: 1px; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="receipt-header">
      <div class="crest">SM</div>
      <div class="school-name">St. Mary's High School</div>
      <div class="school-sub">Excellence & Integrity</div>
      <div class="school-contact">P.O. Box 123 · Harare · Zimbabwe · admin@stmarys.ac.zw</div>
      <div class="receipt-badge">Official Receipt</div>
      <div class="receipt-badge-sub">Original · Non-Transferable · Computer Generated</div>
    </div>

    <div class="receipt-meta">
      <span>Receipt No.<strong>${esc(record.receipt_number || "—")}</strong></span>
      <span>Payment Date<strong>${esc(paymentDate)}</strong></span>
      <span>Issued Time<strong>${esc(printDate)}</strong></span>
      <span>Document Hash<strong>${esc(hash)}</strong></span>
    </div>

    <div class="receipt-body">
      <div class="info-grid">
        <div class="info-item full">
          <div class="label">Student Name</div>
          <div class="value">${esc(studentName)}</div>
        </div>
        ${className ? `
        <div class="info-item">
          <div class="label">Class</div>
          <div class="value">${esc(className)}</div>
        </div>` : ""}
        <div class="info-item">
          <div class="label">Academic Year</div>
          <div class="value">${esc(record.academic_year)}</div>
        </div>
        <div class="info-item">
          <div class="label">Term</div>
          <div class="value">${esc(record.term.replace("_", " ").toUpperCase())}</div>
        </div>
        <div class="info-item">
          <div class="label">Payment Method</div>
          <div class="value">${esc(method)}</div>
        </div>
      </div>

      <hr class="divider" />

      <div class="amount-section">
        <div class="amount-row">
          <span class="amt-label">Total Fees Due</span>
          <span class="amt-value">$${Number(record.amount_due).toFixed(2)} <span class="zig">(ZIG ${(Number(record.amount_due) * zigRate).toLocaleString(undefined, { maximumFractionDigits: 0 })})</span></span>
        </div>
        <div class="amount-row">
          <span class="amt-label">Amount Paid</span>
          <span class="amt-value" style="color:#16a34a">$${Number(record.amount_paid).toFixed(2)}</span>
        </div>
        <div class="amount-row total-row ${balance > 0 ? "owing" : ""}">
          <span class="amt-label"><strong>Balance</strong></span>
          <span class="amt-value">${balance <= 0 ? "$0.00" : "$" + balance.toFixed(2)}${balance > 0 ? ` <span class="zig">(ZIG ${(balance * zigRate).toLocaleString(undefined, { maximumFractionDigits: 0 })})</span>` : ""}</span>
        </div>
      </div>

      ${balance <= 0 ? `
      <div class="paid-stamp">
        <span>Paid in Full</span>
      </div>` : ""}

      ${notes ? `<div class="notes-box"><strong>Notes</strong><br/>${esc(notes)}</div>` : ""}
    </div>

    <div class="security-strip">
      SECURITY: Doc ${esc(hash)} · Serial ${esc(serial)} · Generated ${esc(printDate)} ${esc(timezone)} · Verify authenticity at portal.stmarys.ac.zw/verify.
    </div>

    <div class="barcode-section">
      ${barcodeSvg}
      <div class="barcode-text">${esc(barcodeData)}</div>
      <div class="serial-row">Serial: ${esc(serial)} &bull; Printed: ${esc(printDate)}</div>
    </div>

    <div class="receipt-footer">
      <p class="thank-you">Thank you for your payment</p>
      <p>This is a computer-generated receipt and is valid without signature.<br/>
      For queries, contact the accounts office.</p>
      <p class="forgery-warning">Any alteration, duplication or forgery of this official receipt is prohibited.</p>
    </div>
  </div>

  <div class="watermark">St. Mary's High School &mdash; Official Fee Management System &mdash; ${esc(hash)}</div>

  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`);
  w.document.close();
};

export const generateCSVReport = (records: any[], getStudentName: (id: string) => string, zigRate: number) => {
  const headers = ["Student", "Year", "Term", "Due (USD)", "Due (ZIG)", "Paid (USD)", "Balance (USD)", "Method", "Receipt", "Status", "Date"];
  const rows = records.map((r) => {
    const balance = Number(r.amount_due) - Number(r.amount_paid);
    return [
      getStudentName(r.student_id),
      r.academic_year,
      r.term.replace("_", " "),
      Number(r.amount_due).toFixed(2),
      (Number(r.amount_due) * zigRate).toFixed(0),
      Number(r.amount_paid).toFixed(2),
      balance.toFixed(2),
      methodLabel((r as any).payment_method || "cash"),
      r.receipt_number || "",
      balance <= 0 ? "Paid" : "Owing",
      r.payment_date || "",
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fee-report-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
