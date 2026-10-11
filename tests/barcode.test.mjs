// Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { BARCODE_PATTERN, createScanBuffer, findProductByCode, looksLikeExcelNumber } from "../utils/barcode.js";

const products = [
  { id: 1, name: "Peak Milk 400g", sku: "PEAK-400", barcode: "6151100039013" },
  { id: 2, name: "Milo 500g", sku: "6151100039013", barcode: null }, // SKU equal to another product's barcode
  { id: 3, name: "Rice 50kg", sku: "GRN-001", barcode: "SP-00042" },
  { id: 4, name: "Loose tomatoes", sku: null, barcode: null },
];

// Feed a string to the buffer one key at a time, `gap` ms apart, then Enter
const type = (buffer, text, { start = 1000, gap = 5 } = {}) => {
  let time = start;
  for (const key of text) {
    buffer.push(key, time);
    time += gap;
  }
  return buffer.push("Enter", time);
};

test("barcode rule matches the backend", () => {
  assert.ok(BARCODE_PATTERN.test("6151100039013"));
  assert.ok(BARCODE_PATTERN.test("SP-00042"));
  assert.ok(!BARCODE_PATTERN.test("6151 1000"));
  assert.ok(!BARCODE_PATTERN.test(""));
  assert.ok(!BARCODE_PATTERN.test("x".repeat(65)));
  assert.ok(!BARCODE_PATTERN.test("615<script>"));
});

test("spots barcodes Excel has turned into scientific notation", () => {
  assert.ok(looksLikeExcelNumber("6.1511E+12"));
  assert.ok(looksLikeExcelNumber("6E+12"));
  assert.ok(!looksLikeExcelNumber("6151100039013"));
  assert.ok(!looksLikeExcelNumber("SP-00042"));
});

test("finds a product by exact barcode before SKU", () => {
  assert.equal(findProductByCode(products, "6151100039013").id, 1);
  assert.equal(findProductByCode(products, "  sp-00042 ").id, 3);
  assert.equal(findProductByCode(products, "GRN-001").id, 3);
});

test("never matches part of a code or an empty code", () => {
  assert.equal(findProductByCode(products, "615110003901"), null);
  assert.equal(findProductByCode(products, ""), null);
  assert.equal(findProductByCode(products, "   "), null);
  assert.equal(findProductByCode(null, "6151100039013"), null);
});

test("a scanner's fast burst ending in Enter is read as a scan", () => {
  assert.equal(type(createScanBuffer(), "6151100039013"), "6151100039013");
});

test("normal typing is not mistaken for a scan", () => {
  assert.equal(type(createScanBuffer(), "6151100039013", { gap: 150 }), null);
});

test("short codes and Enter on its own are ignored", () => {
  const buffer = createScanBuffer();
  assert.equal(type(buffer, "123"), null);
  assert.equal(buffer.push("Enter", 5000), null);
});

test("keys typed before a scan don't stick to the scanned code", () => {
  const buffer = createScanBuffer();
  buffer.push("a", 0);
  buffer.push("b", 200);
  assert.equal(type(buffer, "6151100039013", { start: 1000 }), "6151100039013");
});

test("two scans in a row are read separately", () => {
  const buffer = createScanBuffer();
  assert.equal(type(buffer, "6151100039013", { start: 0 }), "6151100039013");
  assert.equal(type(buffer, "6154000048014", { start: 20 }), "6154000048014");
});

test("modifier keys like Shift inside a scan are skipped", () => {
  const buffer = createScanBuffer();
  let time = 0;
  for (const key of ["S", "Shift", "P", "-", "0", "0", "0", "4", "2"]) {
    buffer.push(key, (time += 5));
  }
  assert.equal(buffer.push("Enter", time + 5), "SP-00042");
});

test("a code with characters a barcode can't have is dropped", () => {
  assert.equal(type(createScanBuffer(), "6151 100039"), null);
});

test("EAN-13 check digits match real barcodes and the backend", async () => {
  const { ean13CheckDigit, isValidEan13 } = await import("../utils/barcode.js");
  assert.equal(ean13CheckDigit("400638133393"), 1);
  assert.ok(isValidEan13("4006381333931"));
  assert.ok(!isValidEan13("4006381333932"));
  assert.ok(!isValidEan13("400638133393"));
  // An in-store code as the backend makes it: 20 + product id 5 padded + check digit
  assert.ok(isValidEan13("200000000005" + ean13CheckDigit("200000000005")));
});

test("labels use EAN-13 for valid retail codes and Code 128 for the rest", async () => {
  const { barcodeFormat } = await import("../utils/barcode.js");
  assert.equal(barcodeFormat("4006381333931"), "EAN13");
  assert.equal(barcodeFormat("4006381333932"), "CODE128", "bad check digit");
  assert.equal(barcodeFormat("SP-00042"), "CODE128");
  assert.equal(barcodeFormat("12345678"), "CODE128");
});
