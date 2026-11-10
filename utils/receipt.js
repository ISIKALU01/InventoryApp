// Customer receipts: one layout for the sales point (printed after every
// sale), the sales list (reprint) and Settings > Receipts (test print).
//
// Printed through a hidden frame, so pop-up blockers don't get in the way.
// Sized for supermarket thermal printers (80 mm or 58 mm rolls) or A4.
// Browsers always show the print dialog, unless Edge/Chrome is started with
// --kiosk-printing: then it goes straight to the computer's default printer.
//
// Settings are per computer (each till has its own printer).

const SETTINGS_KEY = "sellapad:receipt-settings";

export const PAPER_SIZES = {
  "80mm": { label: "80 mm roll (most receipt printers)", width: "80mm", content: "72mm" },
  "58mm": { label: "58 mm roll (small receipt printers)", width: "58mm", content: "48mm" },
  a4: { label: "A4 / Letter (office printer)", width: "A4", content: "90mm" },
};

export const DEFAULT_RECEIPT_SETTINGS = {
  autoPrint: true,
  paper: "80mm",
  businessName: "",
  footer: "Thank you for shopping with us!\nGoods sold in good condition are not returnable.",
  showCashier: true,
};

export const loadReceiptSettings = () => {
  try {
    return { ...DEFAULT_RECEIPT_SETTINGS, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}) };
  } catch {
    return { ...DEFAULT_RECEIPT_SETTINGS };
  }
};

export const saveReceiptSettings = (settings) => {
  const next = { ...DEFAULT_RECEIPT_SETTINGS, ...settings };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  } catch {
    // Not kept on this computer; the defaults are used
  }
  return next;
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const naira = (value) =>
  `₦${Number(value || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * receipt: {
 *   number, date, shop: { name, address, phone }, cashier, customer,
 *   items: [{ name, quantity, unit_price }], total, payment, bank, reference,
 *   offline, copy
 * }
 */
export const buildReceiptHtml = (receipt, settings = loadReceiptSettings()) => {
  const paper = PAPER_SIZES[settings.paper] || PAPER_SIZES["80mm"];
  const date = receipt.date ? new Date(receipt.date) : new Date();
  const items = receipt.items || [];
  const total = receipt.total ?? items.reduce((sum, i) => sum + Number(i.quantity) * Number(i.unit_price), 0);
  const count = items.reduce((sum, i) => sum + Number(i.quantity || 0), 0);
  const heading = settings.businessName?.trim() || receipt.shop?.name || "Receipt";
  const row = (label, value, cls = "") =>
    `<tr class="${cls}"><td>${escapeHtml(label)}</td><td class="r">${escapeHtml(value)}</td></tr>`;

  return `<!doctype html><html><head><meta charset="utf-8"><title>Receipt ${escapeHtml(receipt.number || "")}</title>
<style>
  @page { size: ${paper.width === "A4" ? "A4" : `${paper.width} auto`}; margin: ${paper.width === "A4" ? "12mm" : "0"}; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: "Courier New", ui-monospace, monospace; font-size: 12px; color: #000; }
  .receipt { width: ${paper.content}; margin: 0 auto; padding: 4mm 0; }
  h1 { font-size: 16px; margin: 0; text-align: center; text-transform: uppercase; }
  .c { text-align: center; }
  .small { font-size: 11px; }
  .rule { border-top: 1px dashed #000; margin: 6px 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 1px 0; vertical-align: top; }
  .r { text-align: right; white-space: nowrap; padding-left: 6px; }
  .item td { padding-top: 3px; }
  .total td { font-size: 15px; font-weight: bold; padding-top: 4px; }
  .badge { display: inline-block; border: 1px solid #000; padding: 1px 6px; margin-top: 4px; font-weight: bold; }
  .footer { white-space: pre-line; }
</style></head><body><div class="receipt">
  <h1>${escapeHtml(heading)}</h1>
  ${settings.businessName?.trim() && receipt.shop?.name ? `<div class="c">${escapeHtml(receipt.shop.name)}</div>` : ""}
  ${receipt.shop?.address ? `<div class="c small">${escapeHtml(receipt.shop.address)}</div>` : ""}
  ${receipt.shop?.phone ? `<div class="c small">Tel: ${escapeHtml(receipt.shop.phone)}</div>` : ""}
  ${receipt.copy ? `<div class="c"><span class="badge">COPY</span></div>` : ""}
  ${receipt.offline ? `<div class="c"><span class="badge">OFFLINE SALE</span></div>` : ""}
  <div class="rule"></div>
  <table class="small">
    ${row("Receipt", receipt.number || "—")}
    ${row("Date", date.toLocaleString([], { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }))}
    ${settings.showCashier && receipt.cashier ? row("Cashier", receipt.cashier) : ""}
    ${receipt.customer && !/walk-?in/i.test(receipt.customer) ? row("Customer", receipt.customer) : ""}
  </table>
  <div class="rule"></div>
  <table>
    ${items
      .map(
        (i) => `<tr class="item"><td colspan="2">${escapeHtml(i.name)}</td></tr>
    <tr class="small"><td>${Number(i.quantity)} x ${naira(i.unit_price)}</td><td class="r">${naira(Number(i.quantity) * Number(i.unit_price))}</td></tr>`
      )
      .join("")}
  </table>
  <div class="rule"></div>
  <table>
    ${row(`Items`, String(count), "small")}
    ${row("TOTAL", naira(total), "total")}
  </table>
  <div class="rule"></div>
  <table class="small">
    ${row("Paid by", receipt.payment || "—")}
    ${receipt.bank ? row("Into", receipt.bank) : ""}
    ${receipt.reference ? row("Ref", receipt.reference) : ""}
  </table>
  <div class="rule"></div>
  <div class="c small footer">${escapeHtml(settings.footer || "")}</div>
</div></body></html>`;
};

/** Print a receipt through a hidden frame. Resolves once the dialog is open. */
export const printReceipt = (receipt, settings = loadReceiptSettings()) =>
  new Promise((resolve) => {
    const frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
    document.body.appendChild(frame);

    const doc = frame.contentWindow.document;
    doc.open();
    doc.write(buildReceiptHtml(receipt, settings));
    doc.close();

    const cleanUp = () => setTimeout(() => frame.remove(), 1000);
    frame.contentWindow.onafterprint = cleanUp;
    // Fonts and layout first, then print
    setTimeout(() => {
      try {
        frame.contentWindow.focus();
        frame.contentWindow.print();
      } finally {
        resolve();
        setTimeout(cleanUp, 60_000);
      }
    }, 250);
  });
