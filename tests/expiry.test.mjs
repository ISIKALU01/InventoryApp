// Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { EXPIRY_WARNING_DAYS, daysUntil, describeDaysLeft, parseExpiryDate } from "../utils/expiry.js";

test("the warning window is the 30 days the client asked for", () => {
  assert.equal(EXPIRY_WARNING_DAYS, 30);
});

test("reads year-first dates", () => {
  assert.equal(parseExpiryDate("2026-12-31"), "2026-12-31");
  assert.equal(parseExpiryDate(" 2026-1-5 "), "2026-01-05");
});

test("reads day-first dates as used in Nigeria", () => {
  assert.equal(parseExpiryDate("31/12/2026"), "2026-12-31");
  assert.equal(parseExpiryDate("05/01/2027"), "2027-01-05", "5 January, not 1 May");
  assert.equal(parseExpiryDate("5-1-2027"), "2027-01-05");
  assert.equal(parseExpiryDate("05.01.2027"), "2027-01-05");
});

test("rejects dates that don't exist or can't be read", () => {
  for (const bad of ["2026-02-30", "31/02/2026", "13/13/2026", "12/31/2026", "31/12/26", "Dec 2026", "46022", "", null]) {
    assert.equal(parseExpiryDate(bad), null, String(bad));
  }
  assert.equal(parseExpiryDate("29/02/2028"), "2028-02-29", "leap years are fine");
});

test("counts whole days to an expiry date", () => {
  const today = new Date(2026, 9, 11, 18, 30); // 11 Oct 2026, evening
  assert.equal(daysUntil("2026-10-11", today), 0);
  assert.equal(daysUntil("2026-10-12", today), 1);
  assert.equal(daysUntil("2026-11-10", today), 30);
  assert.equal(daysUntil("2026-10-05", today), -6);
});

test("describes days left in plain words", () => {
  assert.equal(describeDaysLeft(-6), "Expired 6 days ago");
  assert.equal(describeDaysLeft(-1), "Expired yesterday");
  assert.equal(describeDaysLeft(0), "Expires today");
  assert.equal(describeDaysLeft(1), "Expires tomorrow");
  assert.equal(describeDaysLeft(30), "30 days left");
});

test("dashboard windows include the client's 40 and 80 days and stay within the API's 365", async () => {
  const { DASHBOARD_EXPIRY_WINDOWS, DASHBOARD_EXPIRY_DEFAULT } = await import("../utils/expiry.js");
  assert.ok(DASHBOARD_EXPIRY_WINDOWS.includes(40));
  assert.ok(DASHBOARD_EXPIRY_WINDOWS.includes(80));
  assert.ok(DASHBOARD_EXPIRY_WINDOWS.includes(DASHBOARD_EXPIRY_DEFAULT));
  assert.ok(DASHBOARD_EXPIRY_WINDOWS.every((d) => d >= 1 && d <= 365));
});

test("urgency bands", async () => {
  const { expiryUrgency } = await import("../utils/expiry.js");
  assert.equal(expiryUrgency(0), "critical");
  assert.equal(expiryUrgency(7), "critical");
  assert.equal(expiryUrgency(8), "soon");
  assert.equal(expiryUrgency(30), "soon");
  assert.equal(expiryUrgency(31), "later");
});

test("reads the Expiry page filter from the URL, ignoring bad values", async () => {
  const { readExpiryQuery } = await import("../utils/expiry.js");
  assert.deepEqual(readExpiryQuery({ show: "expiring", days: "80" }), { show: "expiring", days: 80 });
  assert.deepEqual(readExpiryQuery({ show: "nope", days: "400" }), {});
  assert.deepEqual(readExpiryQuery({ days: "1.5" }), {});
  assert.deepEqual(readExpiryQuery(), {});
});
