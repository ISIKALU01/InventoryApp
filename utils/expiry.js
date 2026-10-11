// Expiry helpers shared by the stock import and the Expiry page.

// The warning window the client asked for: batches expiring within 30 days
export const EXPIRY_WARNING_DAYS = 30;

const pad = (n) => String(n).padStart(2, "0");

// A real calendar date, or null (rejects 2026-02-30 and the like)
const toIsoDate = (year, month, day) => {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return `${year}-${pad(month)}-${pad(day)}`;
};

// Read an expiry date typed in a spreadsheet: 2026-12-31, or day first as
// used in Nigeria (31/12/2026, 31-12-2026, 31.12.2026). Returns "YYYY-MM-DD"
// or null when the text isn't a real date in one of those forms.
export function parseExpiryDate(text) {
  const value = String(text ?? "").trim();
  if (!value) return null;

  let match = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) return toIsoDate(Number(match[1]), Number(match[2]), Number(match[3]));

  match = value.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (match) return toIsoDate(Number(match[3]), Number(match[2]), Number(match[1]));

  return null;
}

// Whole days from `today` to `isoDate`: 0 = today, negative = already past
export function daysUntil(isoDate, today = new Date()) {
  const [y, m, d] = String(isoDate).split("-").map(Number);
  const target = Date.UTC(y, m - 1, d);
  const start = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target - start) / 86400000);
}

export function describeDaysLeft(days) {
  if (days < -1) return `Expired ${-days} days ago`;
  if (days === -1) return "Expired yesterday";
  if (days === 0) return "Expires today";
  if (days === 1) return "Expires tomorrow";
  return `${days} days left`;
}
