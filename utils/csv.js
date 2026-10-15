// Records from the API as CSV text. No imports, so the tests can load it.

const SECRET_FIELDS = /^(password|remember_token|token|api_token|two_factor_secret|two_factor_recovery_codes)$/i;

const describe = (value) => {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) {
    if (value.every((v) => v === null || typeof v !== "object")) return value.join("; ");
    const names = value.map((v) => v?.name ?? v?.label ?? v?.product_name);
    return names.every(Boolean) ? names.join("; ") : JSON.stringify(value);
  }
  if (typeof value === "object") return value.name ?? value.label ?? JSON.stringify(value);
  return value;
};

// One level deep: nested records become "<field> name" columns
const flatten = (row) => {
  const out = {};
  Object.entries(row || {}).forEach(([field, value]) => {
    if (SECRET_FIELDS.test(field)) return;
    out[field] = describe(value);
  });
  return out;
};

// Spreadsheet apps run text that starts with = + - @ as a formula
const csvCell = (value) => {
  let text = String(value ?? "");
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text) && Number.isNaN(Number(text))) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const toCsv = (rows) => {
  const flat = rows.map(flatten);
  const columns = [];
  flat.forEach((row) => Object.keys(row).forEach((c) => !columns.includes(c) && columns.push(c)));
  const lines = [columns, ...flat.map((row) => columns.map((c) => row[c]))];
  // The byte-order mark lets Excel read ₦ and accented names correctly
  return "﻿" + lines.map((line) => line.map(csvCell).join(",")).join("\r\n");
};

// Drop secrets from a backup the same way the CSV does
export const scrubRecords = (rows) =>
  rows.map((row) =>
    row && typeof row === "object"
      ? Object.fromEntries(Object.entries(row).filter(([field]) => !SECRET_FIELDS.test(field)))
      : row
  );
