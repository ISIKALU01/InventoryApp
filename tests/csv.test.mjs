// Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { scrubRecords, toCsv } from "../utils/csv.js";

const lines = (csv) => csv.replace(/^﻿/, "").split("\r\n");

test("starts with a byte-order mark so Excel reads ₦ correctly", () => {
  assert.ok(toCsv([{ a: 1 }]).startsWith("﻿"));
});

test("columns are every field seen, in first-seen order", () => {
  assert.deepEqual(lines(toCsv([{ id: 1, name: "Rice" }, { id: 2, sku: "R-2" }])), ["id,name,sku", "1,Rice,", "2,,R-2"]);
});

test("never exports passwords or tokens", () => {
  const csv = toCsv([{ id: 1, email: "a@b.c", password: "x", remember_token: "y", api_token: "z" }]);
  assert.equal(lines(csv)[0], "id,email");
  assert.deepEqual(scrubRecords([{ id: 1, password: "x" }]), [{ id: 1 }]);
});

test("nested records show their name, lists of records their names", () => {
  const csv = toCsv([{ store: { id: 3, name: "Ikeja" }, items: [{ name: "Rice" }, { name: "Beans" }], tags: ["a", "b"] }]);
  assert.equal(lines(csv)[1], "Ikeja,Rice; Beans,a; b");
});

test("quotes commas, quotes and line breaks", () => {
  assert.equal(lines(toCsv([{ note: 'Say "hi", then go' }]))[1], '"Say ""hi"", then go"');
});

test("text that a spreadsheet would run as a formula is defused", () => {
  assert.equal(lines(toCsv([{ v: "=HYPERLINK(1)" }]))[1], "'=HYPERLINK(1)");
  assert.equal(lines(toCsv([{ v: "@SUM(A1)" }]))[1], "'@SUM(A1)");
});

test("negative numbers stay numbers", () => {
  assert.equal(lines(toCsv([{ a: -250, b: "-250.50" }]))[1], "-250,-250.50");
});
