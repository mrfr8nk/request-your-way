export const DEFAULT_FEE_STRUCTURE: Record<string, { tuition: number; levy: number }> = {
  zjc: { tuition: 90, levy: 30 },
  o_level: { tuition: 90, levy: 30 },
  a_level: { tuition: 100, levy: 40 },
};

export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "ecocash", label: "EcoCash" },
  { value: "innbucks", label: "InnBucks" },
  { value: "zipit", label: "ZIPIT" },
  { value: "swipe", label: "Swipe / POS" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
];

export const DEFAULT_ZIG_RATE = 28.5;

export const getTermFromDate = (date: Date = new Date()) => {
  const month = date.getMonth() + 1;
  if (month >= 1 && month <= 4) return "term_1";
  if (month >= 5 && month <= 8) return "term_2";
  return "term_3";
};

export const generateReceipt = () => {
  const d = new Date();
  return `REC-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
};

export const methodLabel = (m: string) =>
  PAYMENT_METHODS.find((p) => p.value === m)?.label || m || "—";
