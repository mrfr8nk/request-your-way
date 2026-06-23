/**
 * Multi-format export utility: CSV, PDF, Word, Print
 */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const escapeCSV = (val: any): string => {
  const str = String(val ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export type ExportFormat = "csv" | "pdf" | "word" | "print";

interface ExportOptions {
  title: string;
  filename: string;
  headers: string[];
  rows: (string | number | null | undefined)[][];
  subtitle?: string;
}

/** Export as CSV with BOM for Excel */
export const exportCSV = (opts: ExportOptions) => {
  const csv = [
    opts.headers.map(escapeCSV).join(","),
    ...opts.rows.map(row => row.map(escapeCSV).join(","))
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `${opts.filename}_${dateStamp()}.csv`);
  return opts.rows.length;
};

/** Export as PDF using jsPDF + autoTable */
export const exportPDF = (opts: ExportOptions) => {
  const doc = new jsPDF({ orientation: opts.headers.length > 6 ? "landscape" : "portrait" });

  // Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("St. Mary's High School", doc.internal.pageSize.getWidth() / 2, 18, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text("Excellence & Integrity", doc.internal.pageSize.getWidth() / 2, 24, { align: "center" });

  // Title
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30);
  doc.text(opts.title, doc.internal.pageSize.getWidth() / 2, 34, { align: "center" });

  if (opts.subtitle) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120);
    doc.text(opts.subtitle, doc.internal.pageSize.getWidth() / 2, 40, { align: "center" });
  }

  // Table
  autoTable(doc, {
    head: [opts.headers],
    body: opts.rows.map(row => row.map(v => String(v ?? ""))),
    startY: opts.subtitle ? 46 : 40,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [26, 26, 26], textColor: 255, fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    margin: { left: 14, right: 14 },
    didDrawPage: (data: any) => {
      // Footer on every page
      const pageH = doc.internal.pageSize.getHeight();
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text(`Generated: ${new Date().toLocaleString()} | Page ${data.pageNumber}`, 14, pageH - 8);
      doc.text("St. Mary's High School — School Management System", doc.internal.pageSize.getWidth() - 14, pageH - 8, { align: "right" });
    },
  });

  doc.save(`${opts.filename}_${dateStamp()}.pdf`);
  return opts.rows.length;
};

/** Export as Word (.doc) using HTML blob */
export const exportWord = (opts: ExportOptions) => {
  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8"><title>${opts.title}</title>
    <style>
      body { font-family: Calibri, Arial, sans-serif; margin: 40px; color: #1a1a1a; }
      h1 { font-size: 20px; text-align: center; margin-bottom: 2px; }
      .subtitle { text-align: center; font-size: 11px; color: #666; margin-bottom: 6px; }
      h2 { font-size: 15px; text-align: center; margin-bottom: 16px; border-bottom: 2px solid #1a1a1a; padding-bottom: 8px; }
      table { width: 100%; border-collapse: collapse; font-size: 11px; }
      th { background: #1a1a1a; color: #fff; padding: 8px 10px; text-align: left; font-weight: bold; }
      td { padding: 6px 10px; border-bottom: 1px solid #e0e0e0; }
      tr:nth-child(even) td { background: #f8f8f8; }
      .footer { margin-top: 24px; font-size: 9px; color: #999; text-align: center; border-top: 1px solid #ddd; padding-top: 8px; }
    </style></head><body>
    <h1>St. Mary's High School</h1>
    <p class="subtitle">We Think We Can and Indeed We Can</p>
    <h2>${opts.title}</h2>
    ${opts.subtitle ? `<p class="subtitle">${opts.subtitle}</p>` : ""}
    <table>
      <thead><tr>${opts.headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>${opts.rows.map(row => `<tr>${row.map(v => `<td>${String(v ?? "")}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>
    <div class="footer">Generated: ${new Date().toLocaleString()} | Total Records: ${opts.rows.length}</div>
    </body></html>`;

  const blob = new Blob(["\uFEFF" + html], { type: "application/msword" });
  downloadBlob(blob, `${opts.filename}_${dateStamp()}.doc`);
  return opts.rows.length;
};

/** Print-friendly popup */
export const exportPrint = (opts: ExportOptions) => {
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) return 0;

  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${opts.title}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Inter', sans-serif; padding: 30px; color: #1a1a1a; }
      .header { text-align: center; margin-bottom: 20px; border-bottom: 3px solid #1a1a1a; padding-bottom: 14px; }
      .header h1 { font-size: 22px; letter-spacing: 2px; text-transform: uppercase; }
      .header .motto { font-size: 10px; color: #888; letter-spacing: 1px; margin-bottom: 8px; }
      .header h2 { font-size: 15px; font-weight: 600; margin-top: 8px; }
      .header .sub { font-size: 10px; color: #666; margin-top: 2px; }
      table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; }
      th { background: #1a1a1a; color: #fff; padding: 8px 10px; text-align: left; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
      td { padding: 7px 10px; border-bottom: 1px solid #e5e5e5; }
      tr:nth-child(even) td { background: #f9f9f9; }
      tr:hover td { background: #f0f0f0; }
      .footer { margin-top: 20px; font-size: 8px; color: #aaa; text-align: center; border-top: 1px solid #ddd; padding-top: 8px; }
      @media print { body { padding: 15px; } .no-print { display: none; } }
    </style></head><body>
    <div class="header">
      <h1>St. Mary's High School</h1>
      <div class="motto">We Think We Can and Indeed We Can</div>
      <h2>${opts.title}</h2>
      ${opts.subtitle ? `<div class="sub">${opts.subtitle}</div>` : ""}
    </div>
    <table>
      <thead><tr>${opts.headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>${opts.rows.map(row => `<tr>${row.map(v => `<td>${String(v ?? "")}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>
    <div class="footer">Generated: ${new Date().toLocaleString()} | Total Records: ${opts.rows.length} | St. Mary's High School</div>
    <script>window.onload = function() { window.print(); }</script>
    </body></html>`);
  w.document.close();
  return opts.rows.length;
};

/** Master export function */
export const exportData = (format: ExportFormat, opts: ExportOptions): number => {
  switch (format) {
    case "csv": return exportCSV(opts);
    case "pdf": return exportPDF(opts);
    case "word": return exportWord(opts);
    case "print": return exportPrint(opts);
    default: return 0;
  }
};

// Helpers
const dateStamp = () => new Date().toISOString().slice(0, 10);

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
