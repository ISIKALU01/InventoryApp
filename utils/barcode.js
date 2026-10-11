// Barcode helpers shared by the product pages and the sales point.

// Same rule as the backend: letters, numbers and dashes, up to 64 characters
export const BARCODE_PATTERN = /^[A-Za-z0-9-]{1,64}$/;

// Excel shows long numbers like 6151100039013 as 6.1511E+12 and saves them that way
export const looksLikeExcelNumber = (value) => /^\d+(\.\d+)?e\+\d+$/i.test(String(value ?? "").trim());

// The product a scanned or typed code belongs to: barcode first, then SKU.
// Exact matches only, ignoring case and surrounding spaces.
export function findProductByCode(products, code) {
  const wanted = String(code ?? "").trim().toLowerCase();
  if (!wanted || !Array.isArray(products)) return null;

  const same = (value) => typeof value === "string" && value.trim().toLowerCase() === wanted;
  return products.find((p) => same(p?.barcode)) || products.find((p) => same(p?.sku)) || null;
}

// Tells a barcode scanner apart from a person typing. A scanner sends every
// character within a few milliseconds and finishes with Enter; people type
// much slower. push() returns the scanned code when a scan ends, else null.
export function createScanBuffer({ minLength = 6, maxGapMs = 50 } = {}) {
  let buffer = "";
  let lastTime = -Infinity;

  return {
    push(key, time) {
      if (key === "Enter") {
        const code = buffer;
        buffer = "";
        lastTime = -Infinity;
        return code.length >= minLength && BARCODE_PATTERN.test(code) ? code : null;
      }

      // Shift, arrows and other non-character keys are not part of a code
      if (typeof key !== "string" || key.length !== 1) return null;

      // A slow key starts a new code: whatever came before was typing
      if (time - lastTime > maxGapMs) buffer = "";
      lastTime = time;
      buffer = (buffer + key).slice(-64);
      return null;
    },
    reset() {
      buffer = "";
      lastTime = -Infinity;
    },
  };
}

// EAN-13 check digit for the first 12 digits (same rule as the backend)
export function ean13CheckDigit(twelveDigits) {
  const sum = String(twelveDigits)
    .split("")
    .reduce((total, digit, i) => total + Number(digit) * (i % 2 === 0 ? 1 : 3), 0);
  return (10 - (sum % 10)) % 10;
}

export function isValidEan13(code) {
  const value = String(code ?? "");
  return /^\d{13}$/.test(value) && ean13CheckDigit(value.slice(0, 12)) === Number(value[12]);
}

// How to draw a code: shop scanners read EAN-13 for 13-digit retail codes and
// Code 128 for anything else (letters, dashes, other lengths)
export function barcodeFormat(code) {
  return isValidEan13(code) ? "EAN13" : "CODE128";
}
