// components/guide/salesScenes.js
// Guide chapters: sales point, sales list, deleted sales, expenses, customers.
import { CircleCheck, Plus, Printer, ScanLine, Search, Trash2, Wallet } from "lucide-react";
import {
  Avatar,
  Button,
  Field,
  Flash,
  Heading,
  Kicker,
  Panel,
  Popup,
  Swap,
  Tag,
  Tile,
  at,
  clamp,
  countTo,
  easeOut,
  lerp,
  naira,
  prog,
  rise,
  typed,
} from "./kit";

// ---------------------------------------------------------------------------
// Sales point
// ---------------------------------------------------------------------------

const CART = [
  { name: "Full cream milk 400g", code: "6154000052041", price: 2450, at: 1.5 },
  { name: "Spaghetti 500g", code: "6151100023317", price: 1100, at: 2.7 },
  { name: "Granulated sugar 1kg", code: "6152200041125", price: 1850, at: 3.9 },
];
const SCANS = [0.9, 2.1, 3.3, 4.5]; // the fourth scans the milk again
const REPEAT_AT = 5.1;
const PAY_METHODS = ["Cash", "Transfer", "Card", "Customer balance"];
const PAY_AT = 6.0;
const COMPLETE_AT = 7.5;

export function SalesPointScene({ t }) {
  const scanning = SCANS.findIndex((s) => t >= s && t < s + 0.6);
  const scanned = scanning >= 0 ? -1 : SCANS.findIndex((s) => t >= s + 0.6 && t < s + 1.3);
  const scannedCode = scanned >= 0 ? CART[scanned % 3].code : null;
  const milkQty = t >= REPEAT_AT ? 2 : 1;
  const total = CART.reduce((sum, item) => sum + item.price * prog(t, item.at, 0.6), 0) + CART[0].price * prog(t, REPEAT_AT, 0.6);
  const picked = prog(t, PAY_AT, 0.35);
  const lines = CART.filter((item) => t >= item.at).length;

  return (
    <>
      <Panel style={{ ...at(24, 16, 470, 452), ...rise(t, 0.1, 0.8) }}>
        <div className="absolute flex items-center overflow-hidden bg-white border border-gray-300" style={{ ...at(16, 16, 436, 40), gap: 10, padding: "0 12px" }}>
          <ScanLine size={16} className={scanning >= 0 ? "text-red-500" : "text-gray-400"} />
          <span className={scannedCode ? "text-green-600 font-medium tabular-nums" : "text-gray-400"} style={{ fontSize: 12 }}>
            {scanning >= 0 ? "Scanning…" : scannedCode ? `${scannedCode}  ✓` : "Scan a barcode, or search by name or SKU"}
          </span>
          {scanning >= 0 && (
            <span
              className="absolute bg-red-500"
              style={{
                left: 8,
                right: 8,
                top: 19,
                height: 2,
                boxShadow: "0 0 10px 2px rgb(239 68 68 / 0.6)",
                opacity: 0.65 + 0.35 * Math.sin(t * 38),
                transform: `scaleX(${prog(t, SCANS[scanning], 0.3, easeOut)})`,
              }}
            />
          )}
        </div>

        <div className="absolute flex font-semibold tracking-wide text-gray-500 uppercase border-b border-gray-200" style={{ ...at(16, 72, 436, 26), fontSize: 9.5 }}>
          <span style={{ width: 250 }}>Item</span>
          <span style={{ width: 60 }}>Qty</span>
          <span className="flex-1 text-right">Amount</span>
        </div>

        {CART.map((item, i) => {
          const k = prog(t, item.at, 0.6, easeOut);
          const qty = i === 0 ? milkQty : 1;
          const bump = i === 0 ? 1 + 0.3 * Math.sin(Math.PI * clamp((t - REPEAT_AT) / 0.4)) : 1;
          return (
            <div key={item.name} className="absolute flex items-center border-b border-gray-100" style={{ ...at(16, 104 + i * 48, 436, 48), opacity: k, transform: `translateX(${(1 - k) * -16}px)` }}>
              <Flash t={t} from={i === 0 && t >= REPEAT_AT ? REPEAT_AT : item.at} />
              <div className="relative" style={{ width: 250 }}>
                <p className="font-medium text-gray-900" style={{ fontSize: 12.5 }}>{item.name}</p>
                <p className="text-gray-400 tabular-nums" style={{ fontSize: 10 }}>{naira(item.price)} each</p>
              </div>
              <span className="relative inline-block font-semibold text-gray-800 tabular-nums" style={{ width: 60, fontSize: 13 }}>
                <span className="inline-block" style={{ transform: `scale(${bump})` }}>× {qty}</span>
              </span>
              <span className="relative flex-1 font-semibold text-right text-gray-900 tabular-nums" style={{ fontSize: 13 }}>{naira(item.price * qty)}</span>
            </div>
          );
        })}

        <div className="absolute flex justify-between text-gray-500 border-t border-gray-200" style={{ ...at(16, 404, 436, 34), paddingTop: 10, fontSize: 11, opacity: prog(t, 1.5, 0.6) }}>
          <span>{lines} items · {lines + (t >= REPEAT_AT ? 1 : 0)} units</span>
          <span>Main branch till</span>
        </div>
      </Panel>

      <Panel style={{ ...at(506, 16, 250, 452), ...rise(t, 0.3, 0.8), padding: 16 }}>
        <Kicker>Total</Kicker>
        <p className="font-bold text-gray-900 tabular-nums" style={{ fontSize: 28, marginTop: 2 }}>{naira(total)}</p>

        <Kicker style={{ position: "absolute", left: 16, top: 104 }}>Payment method</Kicker>
        {PAY_METHODS.map((m, i) => {
          const on = m === "Transfer" ? picked : 0;
          return (
            <div key={m} className="absolute flex items-center justify-center overflow-hidden text-gray-700 border border-gray-300" style={{ ...at(16 + (i % 2) * 113, 124 + Math.floor(i / 2) * 44, 105, 36), fontSize: 11.5 }}>
              <span className="absolute inset-0 bg-blue-600" style={{ opacity: on }} />
              <span className="relative" style={{ color: on > 0.5 ? "#fff" : undefined }}>{m}</span>
            </div>
          );
        })}

        <div className="absolute" style={{ ...at(16, 224, 218, 60), ...rise(t, PAY_AT + 0.3, 0.6) }}>
          <Kicker>Paid into</Kicker>
          <div className="flex items-center justify-between text-gray-800 border border-gray-300" style={{ marginTop: 6, height: 34, padding: "0 10px", fontSize: 12 }}>
            GTBank •••• 2041 <span className="text-gray-400">▾</span>
          </div>
        </div>

        <Button t={t} press={COMPLETE_AT} done={COMPLETE_AT + 0.15} doneLabel="Sale saved" style={{ ...at(16, 392, 218, 44), fontSize: 13, opacity: lerp(0.45, 1, picked) }}>
          Complete sale
        </Button>
      </Panel>

      <div className="absolute bg-white border border-l-4 border-gray-200 shadow-xl border-l-green-600" style={{ ...at(104, 300, 300, 58), ...rise(t, COMPLETE_AT + 0.35, 0.7, 16), padding: "9px 14px" }}>
        <p className="flex items-center font-semibold text-gray-900" style={{ gap: 6, fontSize: 12.5 }}>
          <CircleCheck size={14} className="text-green-600" /> Sale saved
        </p>
        <p className="text-gray-600" style={{ fontSize: 11, marginTop: 2 }}>INV-1042 · ₦7,850 · receipt ready to print</p>
      </div>
    </>
  );
}

export const salesPointCursor = [[0.4, 330, 330], [5.2, 330, 330], [PAY_AT, 687, 158, true], [6.7, 687, 158], [COMPLETE_AT, 631, 430, true], [8.4, 631, 430], [9.4, 600, 470]];

// ---------------------------------------------------------------------------
// Sales list and receipts
// ---------------------------------------------------------------------------

const SALES = [
  ["INV-1042", "Walk-in customer", "Main branch", "Transfer", 7850],
  ["INV-1041", "Mrs Adeyemi", "Main branch", "Cash", 12300],
  ["INV-1040", "Walk-in customer", "Lekki branch", "Card", 4150],
  ["INV-1039", "Tunde Bakare", "Main branch", "Customer balance", 28000],
  ["INV-1038", "Walk-in customer", "Main branch", "Cash", 2450],
];
const SEARCH_AT = 1.8;
const ROW_AT = 3.5;
const PRINT_AT = 6.2;

export function SalesListScene({ t }) {
  const query = typed(t, SEARCH_AT, "1042", 6);
  const filtered = prog(t, 2.6, 0.5);
  const receipt = prog(t, ROW_AT + 0.2, 0.8, easeOut);

  return (
    <>
      <Heading t={t} title="Sales list" sub="Every sale from every till: search it, open it, reprint the receipt" />
      <Tile t={t} start={0.3} style={at(24, 62, 236, 72)} label="Total sales today" to={countTo(t, 0.5, 0, 1284500, 1.6)} />
      <Tile t={t} start={0.45} style={at(272, 62, 236, 72)} label="Transactions today" value={Math.round(countTo(t, 0.6, 0, 146, 1.6))} />
      <Tile t={t} start={0.6} style={at(520, 62, 236, 72)} label="Products sold today" value={Math.round(countTo(t, 0.7, 0, 412, 1.6))} />

      <Panel style={{ ...at(24, 148, 732, 320), ...rise(t, 0.7, 0.8) }}>
        <div className="absolute flex items-center bg-gray-100" style={{ ...at(16, 14, 380, 32), gap: 8, padding: "0 10px", fontSize: 11.5 }}>
          <Search size={13} className="text-gray-400" />
          <span className={query ? "text-gray-900" : "text-gray-400"}>{query || "Search by transaction, customer, product, store or user"}</span>
        </div>
        <div className="absolute flex font-semibold tracking-wide text-gray-500 uppercase border-b border-gray-200" style={{ ...at(16, 58, 700, 26), fontSize: 9.5 }}>
          <span style={{ width: 110 }}>Transaction</span>
          <span style={{ width: 170 }}>Customer</span>
          <span style={{ width: 130 }}>Store</span>
          <span style={{ width: 150 }}>Payment</span>
          <span className="flex-1 text-right">Total</span>
        </div>
        {SALES.map(([ref, customer, store, method, amount], i) => {
          const k = prog(t, 0.9 + i * 0.12, 0.5, easeOut);
          const hide = i === 0 ? 1 : 1 - filtered;
          const picked = i === 0 ? prog(t, ROW_AT, 0.3) : 0;
          return (
            <div key={ref} className="absolute flex items-center border-b border-gray-100" style={{ ...at(16, 86 + i * 44, 700, 44), opacity: k * hide, fontSize: 12 }}>
              <span className="absolute inset-0 bg-blue-50" style={{ opacity: picked }} />
              <span className="relative font-semibold text-blue-700 tabular-nums" style={{ width: 110 }}>{ref}</span>
              <span className="relative text-gray-800" style={{ width: 170 }}>{customer}</span>
              <span className="relative text-gray-600" style={{ width: 130 }}>{store}</span>
              <span className="relative" style={{ width: 150 }}><Tag tone={method === "Cash" ? "green" : method === "Card" ? "purple" : "blue"}>{method}</Tag></span>
              <span className="relative flex-1 font-semibold text-right text-gray-900 tabular-nums">{naira(amount)}</span>
            </div>
          );
        })}
      </Panel>

      {receipt > 0 && (
        <div className="absolute shadow-2xl theme-fixed" style={{ ...at(470, 120, 270, 348), opacity: receipt, transform: `translateX(${(1 - receipt) * 40}px)`, background: "#fff", color: "#111827", padding: "16px 20px", border: "1px solid #e5e7eb" }}>
          <p className="font-bold text-center" style={{ fontSize: 12, letterSpacing: "0.2em" }}>SALES RECEIPT</p>
          <p className="text-center" style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>SellaPad · Main branch · INV-1042</p>
          <div style={{ borderTop: "1px dashed #d1d5db", marginTop: 10, paddingTop: 8 }}>
            {[["Full cream milk 400g × 2", 4900], ["Spaghetti 500g × 1", 1100], ["Granulated sugar 1kg × 1", 1850]].map(([name, amount], i) => (
              <div key={name} className="flex justify-between" style={{ fontSize: 11, padding: "3px 0", ...rise(t, ROW_AT + 0.6 + i * 0.15, 0.5, 6) }}>
                <span>{name}</span>
                <span className="tabular-nums">{naira(amount)}</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px dashed #d1d5db", marginTop: 8, paddingTop: 8, fontSize: 11 }}>
            {[["Subtotal", "₦7,850"], ["Discount", "₦0"], ["Tax", "₦0"]].map(([k, v]) => (
              <div key={k} className="flex justify-between" style={{ color: "#4b5563", padding: "2px 0" }}><span>{k}</span><span className="tabular-nums">{v}</span></div>
            ))}
            <div className="flex justify-between font-bold" style={{ fontSize: 14, marginTop: 4 }}><span>Total</span><span className="tabular-nums">₦7,850</span></div>
            <p style={{ color: "#6b7280", marginTop: 4 }}>Paid by transfer · GTBank •••• 2041</p>
          </div>
          <Button t={t} press={PRINT_AT} done={PRINT_AT + 0.15} doneLabel="Sent to printer" icon={Printer} style={at(20, 294, 230, 36)}>
            Print receipt
          </Button>
        </div>
      )}
    </>
  );
}

export const salesListCursor = [[0.6, 300, 430], [1.6, 160, 178, true], [3.0, 160, 178], [ROW_AT, 70, 256, true], [5.0, 70, 256], [PRINT_AT, 605, 432, true], [7.2, 605, 432]];

// ---------------------------------------------------------------------------
// Deleted sales
// ---------------------------------------------------------------------------

const DELETE_AT = 1.1;
const CONFIRM_AT = 3.4;

export function DeletedSalesScene({ t }) {
  const gone = prog(t, CONFIRM_AT + 0.3, 0.6);
  const logged = prog(t, 4.3, 0.8, easeOut);

  return (
    <>
      <Heading t={t} title="Deleted sales" sub="Deleting a sale never erases it. It is kept here with who did it, when and why" />

      <Kicker style={{ ...at(24, 64, 300, 14), ...rise(t, 0.2) }}>Sales list</Kicker>
      <Panel style={{ ...at(24, 82, 732, 56), ...rise(t, 0.3), opacity: rise(t, 0.3).opacity * lerp(1, 0.35, gone) }}>
        <div className="absolute flex items-center" style={{ ...at(16, 0, 700, 56), fontSize: 12 }}>
          <span className="font-semibold text-blue-700 tabular-nums" style={{ width: 110, textDecoration: gone > 0.5 ? "line-through" : undefined }}>INV-1037</span>
          <span className="text-gray-800" style={{ width: 200 }}>Walk-in customer · 3 items</span>
          <span className="text-gray-600" style={{ width: 160 }}>Main branch · 13:58</span>
          <span className="font-semibold text-gray-900 tabular-nums" style={{ width: 120 }}>₦5,600</span>
          <span className="flex items-center justify-center flex-1">
            <span className="flex items-center justify-center text-red-600 border border-gray-200" style={{ width: 30, height: 30, transform: `scale(${t >= DELETE_AT && t < DELETE_AT + 0.25 ? 0.9 : 1})` }}>
              <Trash2 size={14} />
            </span>
          </span>
        </div>
      </Panel>

      <Kicker style={{ ...at(24, 164, 300, 14), opacity: logged }}>Deleted sales</Kicker>
      <Panel style={{ ...at(24, 182, 732, 150), opacity: logged, transform: `translateY(${(1 - logged) * 14}px)`, padding: "14px 18px" }}>
        <div className="flex items-center justify-between">
          <span className="flex items-center" style={{ gap: 10 }}>
            <span className="font-semibold text-gray-900 tabular-nums" style={{ fontSize: 14 }}>INV-1037</span>
            <Tag tone="red">Deleted</Tag>
          </span>
          <span className="font-bold text-gray-900 tabular-nums" style={{ fontSize: 15 }}>₦5,600</span>
        </div>
        <div className="grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 14 }}>
          {[["Deleted by", "Amaka Obi · Store manager"], ["When", "Today, 14:32"], ["Reason", "Customer returned the items"]].map(([k, v], i) => (
            <div key={k} style={rise(t, 4.6 + i * 0.15, 0.6, 8)}>
              <Kicker>{k}</Kicker>
              <p className="text-gray-900" style={{ fontSize: 12, marginTop: 3 }}>{v}</p>
            </div>
          ))}
        </div>
      </Panel>

      <div className="absolute flex items-center" style={{ ...at(24, 348, 732, 40), ...rise(t, 5.3, 0.7, 10), gap: 10 }}>
        <Tag tone="green">+3 units back on the shelf</Tag>
        <span className="text-gray-600" style={{ fontSize: 11.5 }}>The stock ledger records it as “Sale deleted”, and the day&apos;s totals are corrected.</span>
      </div>

      <Popup t={t} show={DELETE_AT + 0.2} hide={CONFIRM_AT + 0.25} style={{ ...at(200, 150, 380, 222), padding: 18 }}>
        <p className="font-semibold text-gray-900" style={{ fontSize: 14 }}>Delete transaction</p>
        <p className="text-gray-500" style={{ fontSize: 11, marginTop: 2 }}>INV-1037 · ₦5,600. Its items go back into stock.</p>
        <Field t={t} label="Reason" value={typed(t, 1.7, "Customer returned the items", 18)} active={t > 1.6 && t < CONFIRM_AT} style={at(18, 76, 342, 60)} />
        <Button t={t} tone="secondary" style={at(18, 156, 120, 36)}>Keep it</Button>
        <Button t={t} tone="danger" press={CONFIRM_AT} icon={Trash2} style={at(150, 156, 210, 36)}>Delete transaction</Button>
      </Popup>
    </>
  );
}

export const deletedSalesCursor = [[0.4, 560, 300], [DELETE_AT, 685, 110, true], [1.6, 400, 260], [2.8, 400, 260], [CONFIRM_AT, 455, 324, true], [4.4, 455, 324], [5.4, 300, 300]];

// ---------------------------------------------------------------------------
// Expenses
// ---------------------------------------------------------------------------

const SEND_AT = 3.7;
const APPROVE_AT = 5.4;

export function ExpensesScene({ t }) {
  const approved = prog(t, APPROVE_AT + 0.2, 0.6);
  const amount = typed(t, 0.9, "18,500", 10);
  const desc = typed(t, 1.6, "Diesel for the generator", 18);

  return (
    <>
      <Heading t={t} title="Expenses" sub="A store asks, an approver approves, and the store's cash at hand stays in step" />
      <Tile t={t} start={0.3} style={at(24, 62, 236, 72)} label="Spent this month" to={countTo(t, APPROVE_AT + 0.4, 486200, 504700, 1.2)} hint="31 approved" />
      <Tile t={t} start={0.45} style={at(272, 62, 236, 72)} label="Cash at hand" to={countTo(t, APPROVE_AT + 0.4, 142000, 123500, 1.2)} hint="3 of 3 stores set up" />
      <Tile t={t} start={0.6} style={at(520, 62, 236, 72)} label="Expenses ÷ sales" value="4.2%" hint="This month" />

      <Panel style={{ ...at(24, 148, 350, 320), ...rise(t, 0.5, 0.8), padding: 16 }}>
        <p className="font-semibold text-gray-900" style={{ fontSize: 13 }}>Request an expense</p>
        <Field t={t} label="Store" value="Main branch" style={at(16, 42, 150, 56)} />
        <Field t={t} label="Category" value="Generator & fuel" style={at(176, 42, 158, 56)} />
        <Field t={t} label="Amount" value={amount && `₦${amount}`} active={t > 0.8 && t < 1.6} style={at(16, 106, 318, 56)} />
        <Field t={t} label="Description" value={desc} placeholder="e.g. Diesel for the generator" active={t > 1.5 && t < SEND_AT} style={at(16, 170, 318, 56)} />
        <Button t={t} press={SEND_AT} done={SEND_AT + 0.15} doneLabel="Sent for approval" style={at(16, 266, 318, 38)}>
          Send for approval
        </Button>
      </Panel>

      <Panel style={{ ...at(386, 148, 370, 320), ...rise(t, 0.6, 0.8) }}>
        <div className="flex items-center justify-between" style={{ padding: "14px 16px 8px" }}>
          <p className="font-semibold text-gray-900" style={{ fontSize: 13 }}>Recent expenses</p>
          <span className="text-gray-500" style={{ fontSize: 10.5 }}>Export CSV</span>
        </div>
        {[
          { ref: "EXP-0094", what: "Diesel for the generator", amount: 18500, at: SEND_AT + 0.3, fresh: true },
          { ref: "EXP-0093", what: "Cleaning supplies", amount: 6200, at: 0.9 },
          { ref: "EXP-0092", what: "Delivery bike repair", amount: 14000, at: 1.0 },
        ].map((e, i) => {
          const shift = i > 0 ? prog(t, SEND_AT + 0.2, 0.5) : 0;
          return (
            <div key={e.ref} className="absolute flex items-center border-b border-gray-100" style={{ ...at(0, 46 + (i - 1 + shift) * 60 + (i === 0 ? 60 : 0), 368, 60), ...rise(t, e.at, 0.6, 10), padding: "0 16px", gap: 10 }}>
              {e.fresh && <Flash t={t} from={APPROVE_AT + 0.2} />}
              <div className="relative flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate" style={{ fontSize: 12 }}>{e.what}</p>
                <p className="text-gray-500 tabular-nums" style={{ fontSize: 10.5 }}>{e.ref} · {naira(e.amount)}</p>
              </div>
              {e.fresh ? (
                <>
                  <Swap t={t} style={{ justifyItems: "end" }} items={[[0, <Tag key="w" tone="amber">Waiting for approval</Tag>], [APPROVE_AT + 0.2, <Tag key="a" tone="green">Approved</Tag>]]} />
                  <Button t={t} press={APPROVE_AT} style={{ position: "relative", width: lerp(70, 0, approved), marginLeft: lerp(0, -10, approved), height: 28, fontSize: 11, opacity: 1 - approved }}>Approve</Button>
                </>
              ) : (
                <Tag tone="green">Approved</Tag>
              )}
            </div>
          );
        })}
        <p className="absolute text-gray-500" style={{ left: 16, right: 16, bottom: 12, fontSize: 10.5, lineHeight: 1.45, opacity: prog(t, 6.6, 0.6) }}>
          Approved cash expenses come out of the store&apos;s cash at hand. Count the cash, give a store cash, or record cash taken to the bank from the same page.
        </p>
      </Panel>
    </>
  );
}

export const expensesCursor = [[0.4, 200, 260], [SEND_AT, 199, 433, true], [4.5, 199, 433], [APPROVE_AT, 701, 226, true], [6.1, 701, 226], [7.2, 390, 104]];

// ---------------------------------------------------------------------------
// Customers and deposits
// ---------------------------------------------------------------------------

const CUSTOMERS = [
  ["Tunde Bakare", 42000],
  ["Mrs Adeyemi", 0],
  ["Chika Obi", 15500],
  ["Ibrahim Musa", -8000],
  ["Grace Eze", 3200],
];
const PICK_AT = 1.1;
const ADD_AT = 2.9;
const SAVE_AT = 4.6;

export function CustomersScene({ t }) {
  const profile = prog(t, PICK_AT + 0.2, 0.8, easeOut);
  const form = prog(t, ADD_AT + 0.1, 0.5, easeOut);
  const saved = prog(t, SAVE_AT + 0.2, 0.5);

  return (
    <>
      <Heading t={t} title="Customers" sub="Customer accounts with deposits and credit limits, used at the till" />

      <Panel style={{ ...at(24, 62, 290, 406), ...rise(t, 0.2, 0.8) }}>
        <div className="flex items-center bg-gray-100" style={{ margin: 14, height: 30, gap: 8, padding: "0 10px", fontSize: 11 }}>
          <Search size={13} className="text-gray-400" />
          <span className="text-gray-400">Search by name, phone or ID</span>
        </div>
        {CUSTOMERS.map(([name, balance], i) => (
          <div key={name} className="absolute flex items-center border-b border-gray-100" style={{ ...at(0, 58 + i * 56, 288, 56), ...rise(t, 0.4 + i * 0.1, 0.5, 8), gap: 10, padding: "0 14px" }}>
            <span className="absolute inset-0 bg-blue-50" style={{ opacity: i === 0 ? prog(t, PICK_AT, 0.3) : 0 }} />
            <Avatar name={name} style={{ position: "relative" }} />
            <span className="relative flex-1 font-medium text-gray-900" style={{ fontSize: 12 }}>{name}</span>
            <span className={`relative tabular-nums font-semibold ${balance < 0 ? "text-red-600" : "text-gray-700"}`} style={{ fontSize: 11.5 }}>
              {naira(i === 0 ? countTo(t, SAVE_AT + 0.3, 42000, 62000, 1) : balance)}
            </span>
          </div>
        ))}
      </Panel>

      <Panel style={{ ...at(326, 62, 430, 406), opacity: profile, transform: `translateX(${(1 - profile) * 24}px)`, padding: 16 }}>
        <div className="flex items-center" style={{ gap: 12 }}>
          <Avatar name="Tunde Bakare" size={42} />
          <div>
            <p className="font-semibold text-gray-900" style={{ fontSize: 15 }}>Tunde Bakare</p>
            <p className="text-gray-500" style={{ fontSize: 11 }}>0803 555 0142 · tunde@example.com</p>
          </div>
        </div>
        <div className="grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 14 }}>
          {[
            ["Current balance", naira(countTo(t, SAVE_AT + 0.3, 42000, 62000, 1))],
            ["Credit limit", "₦50,000"],
            ["Total deposits", naira(countTo(t, SAVE_AT + 0.3, 180000, 200000, 1))],
          ].map(([k, v]) => (
            <div key={k} className="border border-gray-200" style={{ padding: "8px 10px" }}>
              <Kicker>{k}</Kicker>
              <p className="font-bold text-gray-900 tabular-nums" style={{ fontSize: 15, marginTop: 3 }}>{v}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between" style={{ marginTop: 16 }}>
          <p className="font-semibold text-gray-900" style={{ fontSize: 12.5 }}>Deposit history</p>
        </div>
        <Button t={t} press={ADD_AT} icon={Plus} style={at(296, 150, 116, 30)}>Add deposit</Button>

        <div className="absolute" style={{ ...at(16, 192, 396, 60), opacity: form * (1 - saved), transform: `translateY(${(1 - form) * -6}px)` }}>
          <Field t={t} label="Amount" value={typed(t, 3.3, "₦20,000", 10)} active={t > 3.2 && t < SAVE_AT} style={at(0, 0, 200, 56)} />
          <Field t={t} label="Method" value="Transfer" style={at(208, 0, 100, 56)} />
          <Button t={t} press={SAVE_AT} style={at(316, 21, 80, 32)}>Save</Button>
        </div>

        {[
          ["₦20,000", "Transfer · just now", SAVE_AT + 0.3, true],
          ["₦50,000", "Cash · 3 Oct", 0],
          ["₦30,000", "Transfer · 21 Sep", 0],
        ].map(([amount, meta, start, fresh], i) => (
          <div
            key={meta}
            className="absolute flex items-center justify-between border-b border-gray-100"
            style={{ ...at(16, (fresh ? 192 : 192 + lerp(0, 46, saved) + (i - 1) * 46 + 62 * (1 - saved)), 396, 46), opacity: fresh ? saved : profile, fontSize: 12 }}
          >
            {fresh && <Flash t={t} from={SAVE_AT + 0.3} />}
            <span className="relative flex items-center font-semibold text-gray-900 tabular-nums" style={{ gap: 8 }}>
              <Wallet size={14} className="text-green-600" /> {amount}
            </span>
            <span className="relative text-gray-500" style={{ fontSize: 11 }}>{meta}</span>
          </div>
        ))}

        <p className="absolute text-gray-500" style={{ left: 16, right: 16, bottom: 14, fontSize: 10.5, lineHeight: 1.45, ...rise(t, 6.2, 0.7, 8) }}>
          At the sales point, choose “Customer balance” to pay from deposits, or “Credit limit” to let a trusted customer owe up to their limit.
        </p>
      </Panel>
    </>
  );
}

export const customersCursor = [[0.4, 200, 420], [PICK_AT, 160, 148, true], [2.2, 160, 148], [ADD_AT, 680, 227, true], [3.4, 680, 227], [SAVE_AT, 698, 290, true], [5.4, 698, 290], [6.4, 560, 120]];
