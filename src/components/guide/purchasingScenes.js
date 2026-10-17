// components/guide/purchasingScenes.js
// Guide chapters: the supplier-to-payment flow, then each step in detail.
// One order (PO-0088 from Bright Foods Ltd) runs through all of them.
import {
  AlertTriangle,
  CircleCheck,
  ClipboardList,
  FileText,
  Hourglass,
  Landmark,
  PackageCheck,
  Scale,
  ScanLine,
  ShieldCheck,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import { Button, Field, Flash, Heading, Kicker, Panel, Swap, Tag, Tile, at, countTo, easeOut, lerp, naira, prog, rise, typed } from "./kit";

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

const FLOW = [
  { label: "Requisition", icon: ClipboardList, kicker: "Store requisition", ref: "REQ-0142", status: "Approved", rows: [["Spaghetti 500g", "× 48"], ["Granulated sugar 1kg", "× 60"], ["Vegetable oil 1L", "× 24"]] },
  { label: "Purchase order", icon: FileText, kicker: "Purchase order", ref: "PO-0088", status: "Sent", rows: [["Supplier", "Bright Foods Ltd"], ["Lines", "12"], ["Order total", "₦640,000"]] },
  { label: "Goods received", icon: PackageCheck, kicker: "Goods received", ref: "GRN-0311", status: "Goods approved", rows: [["Received", "12 of 12 lines"], ["Short or damaged", "0"], ["Stock added to", "Back store"]] },
  { label: "SOR reconciliation", icon: Scale, kicker: "Sale or return", ref: "SOR-0057", status: "Reconciled", rows: [["Sold", "220 units"], ["Returned", "10 units"], ["Amount due", "₦611,600"]] },
  { label: "Supplier payment", icon: Wallet, kicker: "Supplier payment", ref: "PAY-0219", status: "Paid", rows: [["Paid to", "Bright Foods Ltd"], ["Method", "Bank transfer"], ["Amount", "₦611,600"]] },
];
const FLOW_AT = [1.0, 2.5, 4.0, 5.5, 7.0];
const flowX = (i) => 90 + i * 150;
const FLOW_Y = 150;

const tokenX = (t) => {
  for (let i = 0; i < FLOW_AT.length - 1; i++) {
    if (t < FLOW_AT[i + 1]) return lerp(flowX(i), flowX(i + 1), prog(t, FLOW_AT[i] + 0.5, FLOW_AT[i + 1] - FLOW_AT[i] - 0.5));
  }
  return flowX(FLOW.length - 1);
};

export function PurchasingScene({ t }) {
  const x = tokenX(t);
  return (
    <>
      <Heading t={t} title="Purchasing, start to finish" sub="Every order follows the same path, so nothing gets lost between the store and the supplier. The next chapters open each step" start={0.2} />

      <div className="absolute bg-gray-200" style={{ ...at(flowX(0), FLOW_Y - 2, flowX(4) - flowX(0), 4), opacity: prog(t, 0.3, 0.6) }} />
      <div className="absolute bg-blue-600" style={{ ...at(flowX(0), FLOW_Y - 2, x - flowX(0), 4), opacity: prog(t, 0.8, 0.4) }} />
      <div className="absolute bg-blue-600 rounded-full" style={{ ...at(x - 7, FLOW_Y - 7, 14, 14), opacity: prog(t, 0.8, 0.4), boxShadow: "0 0 0 6px rgb(59 130 246 / 0.25), 0 0 18px 4px rgb(59 130 246 / 0.45)" }} />

      {FLOW.map(({ label, icon: Icon }, i) => {
        const appear = prog(t, 0.3 + i * 0.12, 0.6, easeOut);
        const lit = prog(t, FLOW_AT[i], 0.5, easeOut);
        const doneK = i < FLOW.length - 1 ? prog(t, FLOW_AT[i + 1], 0.4, easeOut) : prog(t, FLOW_AT[i] + 0.6, 0.4, easeOut);
        return (
          <div key={label} style={{ opacity: appear }}>
            <div className="absolute flex items-center justify-center overflow-hidden text-gray-400 bg-white border-2 border-gray-300 rounded-full" style={{ ...at(flowX(i) - 24, FLOW_Y - 24, 48, 48), transform: `scale(${appear * (1 + 0.14 * Math.sin(Math.PI * lit))})` }}>
              <span className="absolute inset-0 bg-blue-600" style={{ opacity: lit }} />
              <Icon size={20} className="relative" style={{ color: lit > 0.5 ? "#fff" : undefined }} />
            </div>
            <span className="absolute flex items-center justify-center bg-green-600 rounded-full" style={{ ...at(flowX(i) + 12, FLOW_Y - 30, 18, 18), color: "#fff", opacity: doneK, transform: `scale(${doneK})` }}>
              <CircleCheck size={12} />
            </span>
            <p className="absolute font-medium text-center text-gray-800" style={{ ...at(flowX(i) - 70, FLOW_Y + 34, 140, 20), fontSize: 11.5, opacity: lerp(0.45, 1, lit) }}>{label}</p>
          </div>
        );
      })}

      <Panel className="shadow-sm" style={{ ...at(200, 232, 380, 216), opacity: prog(t, FLOW_AT[0], 0.5) }}>
        {FLOW.map((doc, i) => {
          const fadeOut = i < FLOW.length - 1 ? 1 - prog(t, FLOW_AT[i + 1] - 0.2, 0.4) : 1;
          const style = rise(t, FLOW_AT[i] + 0.15, 0.6, 10);
          return (
            <div key={doc.ref} className="absolute inset-0" style={{ ...style, opacity: style.opacity * fadeOut, padding: "16px 20px" }}>
              <div className="flex items-start justify-between">
                <div>
                  <Kicker>{doc.kicker}</Kicker>
                  <p className="font-bold text-gray-900 tabular-nums" style={{ fontSize: 17 }}>{doc.ref}</p>
                </div>
                <Tag tone="green">{doc.status}</Tag>
              </div>
              <div style={{ marginTop: 12 }}>
                {doc.rows.map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-gray-100" style={{ padding: "8px 0", fontSize: 12 }}>
                    <span className="text-gray-500">{k}</span>
                    <span className="font-semibold text-gray-900 tabular-nums">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </Panel>
    </>
  );
}

// A vertical list of steps; each lights up and shows who signed it
function Step({ t, x, y, w, icon: Icon, title, who, doneAt, doneBy, last }) {
  const k = prog(t, doneAt, 0.5, easeOut);
  return (
    <div className="absolute" style={at(x, y, w, 80)}>
      {!last && <span className="absolute bg-gray-200" style={{ left: 17, top: 40, width: 2, height: 44 }}><span className="block w-full bg-green-600" style={{ height: `${k * 100}%` }} /></span>}
      <span className="absolute flex items-center justify-center overflow-hidden text-gray-500 bg-gray-100 rounded-full" style={{ ...at(0, 2, 36, 36), transform: `scale(${1 + 0.15 * Math.sin(Math.PI * k)})` }}>
        <span className="absolute inset-0 bg-green-600" style={{ opacity: k }} />
        {k > 0.5 ? <CircleCheck size={17} className="relative" style={{ color: "#fff" }} /> : <Icon size={16} className="relative" />}
      </span>
      <div className="absolute" style={{ left: 48, top: 0, right: 0 }}>
        <p className="font-semibold text-gray-900" style={{ fontSize: 12.5 }}>{title}</p>
        <p className="text-gray-500" style={{ fontSize: 10.5 }}>{who}</p>
        <p className="text-green-700" style={{ fontSize: 10.5, marginTop: 3, opacity: k }}>{doneBy}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Suppliers: three checks by three different people
// ---------------------------------------------------------------------------

const CHECKS_AT = [1.6, 3.6, 5.6];

export function SuppliersScene({ t }) {
  const steps = [
    { icon: UserCheck, title: "Junior check", who: "Junior accountant", doneBy: "Kemi A. · phone call to the supplier", button: "Mark checked" },
    { icon: ShieldCheck, title: "Senior check", who: "Senior accountant", doneBy: "Dayo O. · confirmed with the bank", button: "Mark checked" },
    { icon: CircleCheck, title: "Final approval", who: "Admin", doneBy: "Admin · approved for payments", button: "Approve" },
  ];
  return (
    <>
      <Heading t={t} title="Suppliers" sub="A new supplier is checked by three different people before anyone can pay them" />

      <Panel style={{ ...at(24, 62, 330, 406), ...rise(t, 0.2, 0.8), padding: 18 }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold text-gray-900" style={{ fontSize: 15 }}>Bright Foods Ltd</p>
            <p className="text-gray-500" style={{ fontSize: 11 }}>Added by Bisi (procurement) · today</p>
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <Swap
            t={t}
            items={[
              [0, <Tag key="0" tone="amber">Waiting for junior check</Tag>],
              [CHECKS_AT[0] + 0.2, <Tag key="1" tone="blue">Waiting for senior check</Tag>],
              [CHECKS_AT[1] + 0.2, <Tag key="2" tone="purple">Waiting for final approval</Tag>],
              [CHECKS_AT[2] + 0.2, <Tag key="3" tone="green">Verified</Tag>],
            ]}
          />
        </div>
        <div style={{ marginTop: 16 }}>
          {[
            ["Contact person", "Bola Ade"],
            ["Phone", "0803 555 0199"],
            ["Bank", "GTBank"],
            ["Account number", "0123 457 781"],
            ["Account name", "Bright Foods Limited"],
            ["Payment terms", "30 days"],
          ].map(([k, v], i) => (
            <div key={k} className="flex justify-between border-b border-gray-100" style={{ ...rise(t, 0.5 + i * 0.1, 0.5, 6), padding: "8px 0", fontSize: 12 }}>
              <span className="text-gray-500">{k}</span>
              <span className="font-medium text-gray-900 tabular-nums">{v}</span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel style={{ ...at(366, 62, 390, 406), ...rise(t, 0.35, 0.8), padding: 18 }}>
        <p className="font-semibold text-gray-900" style={{ fontSize: 13 }}>Checks</p>
        {steps.map((s, i) => (
          <div key={s.title}>
            <Step t={t} x={18} y={56 + i * 96} w={350} {...s} doneAt={CHECKS_AT[i] + 0.15} last={i === steps.length - 1} />
            <Button
              t={t}
              press={CHECKS_AT[i]}
              style={{ ...at(254, 64 + i * 96, 112, 30), fontSize: 11, opacity: prog(t, i === 0 ? 0.6 : CHECKS_AT[i - 1] + 0.4, 0.4) * (1 - prog(t, CHECKS_AT[i] + 0.15, 0.3)) }}
            >
              {s.button}
            </Button>
          </div>
        ))}
        <div className="absolute flex text-blue-800 bg-blue-50" style={{ ...at(18, 340, 352, 50), ...rise(t, 6.4, 0.7, 8), gap: 10, padding: "8px 12px", fontSize: 11, lineHeight: 1.4 }}>
          <Users size={16} className="shrink-0" style={{ marginTop: 1 }} />
          Each check must be done by someone else. Whoever added the supplier can&apos;t check it, and you can suspend a supplier at any time.
        </div>
      </Panel>
    </>
  );
}

export const suppliersCursor = [[0.4, 560, 440], [CHECKS_AT[0], 676, 141, true], [2.2, 676, 141], [CHECKS_AT[1], 676, 237, true], [4.2, 676, 237], [CHECKS_AT[2], 676, 333, true], [6.2, 676, 333], [7.4, 560, 425]];

// ---------------------------------------------------------------------------
// Store requisitions
// ---------------------------------------------------------------------------

const REQ_LINES = [
  ["Spaghetti 500g", 48, 1.0],
  ["Granulated sugar 1kg", 60, 1.6],
  ["Vegetable oil 1L", 24, 2.2],
];
const SEND_REQ_AT = 3.9;
const APPROVE_REQ_AT = 5.6;

export function RequisitionsScene({ t }) {
  const scanning = REQ_LINES.find(([, , s]) => t >= s - 0.5 && t < s);
  return (
    <>
      <Heading t={t} title="Store requisitions" sub="A store asks for stock to be bought; a manager approves it before it becomes a purchase order" />

      <Panel style={{ ...at(24, 62, 450, 406), ...rise(t, 0.2, 0.8), padding: 16 }}>
        <p className="font-semibold text-gray-900" style={{ fontSize: 13 }}>Ask for stock to be bought</p>
        <Field t={t} label="For store" value="Shop floor" style={at(16, 40, 200, 56)} />
        <div className="absolute flex items-center overflow-hidden bg-white border border-gray-300" style={{ ...at(16, 106, 416, 34), gap: 8, padding: "0 10px", fontSize: 11.5 }}>
          <ScanLine size={14} className={scanning ? "text-red-500" : "text-gray-400"} />
          <span className="text-gray-400">{scanning ? "Scanning…" : "Scan a barcode, or type a name or SKU"}</span>
          {scanning && <span className="absolute bg-red-500" style={{ left: 8, right: 8, top: 16, height: 2, boxShadow: "0 0 10px 2px rgb(239 68 68 / 0.6)", opacity: 0.65 + 0.35 * Math.sin(t * 38) }} />}
        </div>
        {REQ_LINES.map(([name, units, start], i) => (
          <div key={name} className="absolute flex items-center border-b border-gray-100" style={{ ...at(16, 150 + i * 42, 416, 42), ...rise(t, start, 0.5, 8), fontSize: 12 }}>
            <Flash t={t} from={start} />
            <span className="relative flex-1 font-medium text-gray-900">{name}</span>
            <span className="relative flex items-center justify-end border border-gray-300 tabular-nums" style={{ width: 80, height: 28, padding: "0 8px" }}>
              {Math.round(countTo(t, start + 0.2, 1, units, 0.8))} units
            </span>
          </div>
        ))}
        <Field t={t} label="Note" value={typed(t, 2.8, "Weekend promo", 14)} active={t > 2.7 && t < SEND_REQ_AT} style={at(16, 286, 416, 56)} />
        <Button t={t} press={SEND_REQ_AT} done={SEND_REQ_AT + 0.15} doneLabel="Sent for approval" style={at(16, 352, 416, 36)}>
          Send requisition
        </Button>
      </Panel>

      <Panel style={{ ...at(486, 62, 270, 406), ...rise(t, 0.4, 0.8) }}>
        <p className="font-semibold text-gray-900" style={{ fontSize: 13, padding: "14px 16px 6px" }}>Requisitions</p>
        {[
          { ref: "REQ-0142", what: "Shop floor · 3 products", fresh: true },
          { ref: "REQ-0141", what: "Lekki branch · 7 products", tag: <Tag tone="blue">Ordered</Tag> },
          { ref: "REQ-0140", what: "Shop floor · 2 products", tag: <Tag tone="green">Approved</Tag> },
          { ref: "REQ-0139", what: "Back store · 5 products", tag: <Tag tone="gray">Cancelled</Tag> },
        ].map((r, i) => {
          const shift = i > 0 ? prog(t, SEND_REQ_AT + 0.2, 0.5) : 0;
          const y = r.fresh ? 40 : 40 + (i - 1 + shift) * 76;
          return (
            <div key={r.ref} className="absolute border-b border-gray-100" style={{ ...at(0, y, 268, 76), padding: "12px 16px", opacity: r.fresh ? prog(t, SEND_REQ_AT + 0.4, 0.5) : rise(t, 0.6 + i * 0.1, 0.5).opacity }}>
              {r.fresh && <Flash t={t} from={APPROVE_REQ_AT + 0.2} />}
              <p className="relative font-semibold text-gray-900 tabular-nums" style={{ fontSize: 12 }}>{r.ref}</p>
              <p className="relative text-gray-500" style={{ fontSize: 10.5 }}>{r.what}</p>
              <div className="relative" style={{ marginTop: 6 }}>
                {r.fresh ? (
                  <Swap
                    t={t}
                    items={[
                      [0, <Tag key="w" tone="amber">Waiting for approval</Tag>],
                      [APPROVE_REQ_AT + 0.2, <Tag key="a" tone="green">Approved</Tag>],
                      [7.0, <Tag key="o" tone="blue">Ordered · PO-0088</Tag>],
                    ]}
                  />
                ) : (
                  r.tag
                )}
              </div>
              {r.fresh && (
                <Button t={t} press={APPROVE_REQ_AT} style={{ ...at(176, 22, 76, 28), fontSize: 11, opacity: prog(t, SEND_REQ_AT + 0.6, 0.4) * (1 - prog(t, APPROVE_REQ_AT + 0.2, 0.3)) }}>
                  Approve
                </Button>
              )}
            </div>
          );
        })}
      </Panel>
    </>
  );
}

export const requisitionsCursor = [[0.4, 250, 200], [3.4, 250, 200], [SEND_REQ_AT, 249, 432, true], [4.7, 249, 432], [APPROVE_REQ_AT, 700, 138, true], [6.4, 700, 138], [7.4, 620, 160]];

// ---------------------------------------------------------------------------
// Goods received: three sign-offs
// ---------------------------------------------------------------------------

const SIGN_AT = [1.6, 3.5, 5.4];
const SIGN_OFFS = [
  { role: "Store manager", statement: "I checked the goods", button: "Goods checked", by: "Amaka Obi · 10:42" },
  { role: "Inventory officer", statement: "I posted the accepted goods into stock", button: "Post into stock", by: "Musa Bello · 11:05" },
  { role: "Procurement officer", statement: "PO, invoice and GRN match", button: "PO, invoice and GRN match", by: "Bisi Ola · 11:30" },
];

export function GoodsReceivedScene({ t }) {
  return (
    <>
      <Heading t={t} title="Goods received" sub="When a delivery arrives, three people sign it off before the supplier can be paid" />

      <Panel style={{ ...at(24, 62, 732, 104), ...rise(t, 0.2, 0.8), padding: "14px 18px" }}>
        <div className="flex items-center justify-between">
          <span className="flex items-center" style={{ gap: 10 }}>
            <span className="font-bold text-gray-900 tabular-nums" style={{ fontSize: 15 }}>GRN-0311</span>
            <span className="text-gray-500" style={{ fontSize: 11.5 }}>for PO-0088 · Bright Foods Ltd</span>
          </span>
          <Swap
            t={t}
            items={[
              [0, <Tag key="0" tone="amber">Waiting for store check</Tag>],
              [SIGN_AT[0] + 0.2, <Tag key="1" tone="blue">Waiting for stock posting</Tag>],
              [SIGN_AT[1] + 0.2, <Tag key="2" tone="purple">Waiting for procurement check</Tag>],
              [SIGN_AT[2] + 0.2, <Tag key="3" tone="green">Goods approved</Tag>],
            ]}
          />
        </div>
        <div className="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 12 }}>
          {[["Invoice", "INV-77812"], ["Invoice amount", "₦640,000"], ["Lines received", "12 of 12"], ["Driver's paper", "WB-2291"]].map(([k, v], i) => (
            <div key={k} style={rise(t, 0.5 + i * 0.1, 0.5, 6)}>
              <Kicker>{k}</Kicker>
              <p className="font-semibold text-gray-900 tabular-nums" style={{ fontSize: 12.5, marginTop: 2 }}>{v}</p>
            </div>
          ))}
        </div>
      </Panel>

      {SIGN_OFFS.map((s, i) => {
        const x = 24 + i * 248;
        const k = prog(t, SIGN_AT[i] + 0.15, 0.5, easeOut);
        const ready = i === 0 ? 1 : prog(t, SIGN_AT[i - 1] + 0.4, 0.4);
        return (
          <Panel key={s.role} className={k > 0.5 ? "border-green-300" : ""} style={{ ...at(x, 180, 236, 206), ...rise(t, 0.6 + i * 0.15, 0.7, 14), padding: 16 }}>
            <span className="absolute inset-x-0 top-0 bg-green-600" style={{ height: 3, transform: `scaleX(${k})`, transformOrigin: "left" }} />
            <Kicker>Sign-off {i + 1} of 3</Kicker>
            <p className="font-semibold text-gray-900" style={{ fontSize: 13.5, marginTop: 4 }}>{s.role}</p>
            <p className="text-gray-600" style={{ fontSize: 11.5, marginTop: 6, lineHeight: 1.4 }}>“{s.statement}”</p>
            <p className="flex items-center text-green-700" style={{ fontSize: 11, marginTop: 10, gap: 6, opacity: k }}>
              <CircleCheck size={13} /> {s.by}
            </p>
            <Button t={t} press={SIGN_AT[i]} done={SIGN_AT[i] + 0.15} doneLabel="Signed" style={{ ...at(16, 154, 204, 34), fontSize: 11.5, opacity: lerp(0.4, 1, ready) }}>
              {s.button}
            </Button>
          </Panel>
        );
      })}

      <div className="absolute flex items-center" style={{ ...at(24, 400, 732, 30), ...rise(t, SIGN_AT[1] + 0.5, 0.6, 8), gap: 10, fontSize: 11.5 }}>
        <Tag tone="green">+12 lines posted into the back store</Tag>
        <span className="text-gray-600">Stock goes up the moment the inventory officer posts it.</span>
      </div>
      <div className="absolute flex items-center" style={{ ...at(24, 436, 732, 30), ...rise(t, SIGN_AT[2] + 0.6, 0.6, 8), gap: 10, fontSize: 11.5 }}>
        <Tag tone="blue">Ready for payment</Tag>
        <span className="text-gray-600">Outright orders can now be paid; sale-or-return lines go to SOR reconciliation first.</span>
      </div>
    </>
  );
}

export const goodsReceivedCursor = [[0.4, 400, 470], ...SIGN_AT.flatMap((s, i) => [[s, 142 + i * 248, 351, true], [s + 0.5, 142 + i * 248, 351]]), [6.8, 300, 420]];

// ---------------------------------------------------------------------------
// SOR reconciliation
// ---------------------------------------------------------------------------

const SAVE_SOR_AT = 4.4;
const UNIT_COST = 2780;

export function SorScene({ t }) {
  const sold = Math.round(countTo(t, 1.0, 0, 220, 0.8));
  const returned = Math.round(countTo(t, 1.9, 0, 10, 0.5));
  const damaged = Math.round(countTo(t, 2.5, 0, 2, 0.3));
  const balanced = prog(t, 3.3, 0.5, easeOut);

  return (
    <>
      <Heading t={t} title="SOR reconciliation" sub="For sale-or-return goods: count what sold and what goes back, then pay only for what sold" />

      <Panel style={{ ...at(24, 62, 732, 76), ...rise(t, 0.2, 0.8), padding: "14px 18px" }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900" style={{ fontSize: 14 }}>Fresh bread loaf · SOR-0057</p>
            <p className="text-gray-500" style={{ fontSize: 11 }}>Bright Foods Ltd · PO-0088 · received 232 units at {naira(UNIT_COST)} each</p>
          </div>
          <Swap t={t} items={[[0, <Tag key="o" tone="amber">Open</Tag>], [SAVE_SOR_AT + 0.2, <Tag key="r" tone="green">Reconciled</Tag>]]} />
        </div>
      </Panel>

      <Panel style={{ ...at(24, 152, 360, 316), ...rise(t, 0.35, 0.8), padding: 16 }}>
        <p className="font-semibold text-gray-900" style={{ fontSize: 13 }}>Record a count</p>
        <Field t={t} label="Sold" value={t > 0.9 ? String(sold) : ""} active={t > 0.9 && t < 1.8} style={at(16, 38, 100, 56)} />
        <Field t={t} label="Returned" value={t > 1.8 ? String(returned) : ""} active={t > 1.8 && t < 2.4} style={at(124, 38, 100, 56)} />
        <Field t={t} label="Damaged" value={t > 2.4 ? String(damaged) : ""} active={t > 2.4 && t < 2.9} style={at(232, 38, 96, 56)} />
        <Field t={t} label="Note" value={typed(t, 2.9, "2 loaves damaged, not sold", 22)} style={at(16, 104, 312, 56)} />
        <Field t={t} label="Evidence" value={typed(t, 2.9, "Till report 1–12 Oct, shelf count", 26)} style={at(16, 170, 312, 56)} />
        <Button t={t} press={SAVE_SOR_AT} done={SAVE_SOR_AT + 0.15} doneLabel="Count saved" style={at(16, 248, 312, 36)}>
          Save count
        </Button>
      </Panel>

      <Panel style={{ ...at(396, 152, 360, 316), ...rise(t, 0.5, 0.8), padding: 16 }}>
        <p className="font-semibold text-gray-900" style={{ fontSize: 13 }}>Where the 232 units went</p>
        <div className="flex overflow-hidden bg-gray-100" style={{ height: 22, marginTop: 14 }}>
          <span className="h-full bg-blue-600" style={{ width: `${(sold / 232) * 100}%` }} />
          <span className="h-full bg-gray-400" style={{ width: `${(returned / 232) * 100}%` }} />
          <span className="h-full bg-red-500" style={{ width: `${(damaged / 232) * 100}%` }} />
        </div>
        <div style={{ marginTop: 12 }}>
          {[["bg-blue-600", "Sold", sold], ["bg-gray-400", "Returned to supplier", returned], ["bg-red-500", "Damaged", damaged]].map(([dot, k, v]) => (
            <div key={k} className="flex items-center justify-between" style={{ fontSize: 12, padding: "5px 0" }}>
              <span className="flex items-center text-gray-600" style={{ gap: 8 }}><span className={dot} style={{ width: 9, height: 9 }} />{k}</span>
              <span className="font-semibold text-gray-900 tabular-nums">{v}</span>
            </div>
          ))}
        </div>
        <p className="flex items-center text-green-700" style={{ fontSize: 11.5, marginTop: 8, gap: 6, opacity: balanced }}>
          <CircleCheck size={14} /> 220 + 10 + 2 = 232. It balances
        </p>
        <div className="border-t border-gray-200" style={{ marginTop: 14, paddingTop: 12, ...rise(t, SAVE_SOR_AT + 0.3, 0.6, 8) }}>
          <Kicker>Amount due to the supplier</Kicker>
          <p className="font-bold text-gray-900 tabular-nums" style={{ fontSize: 24, marginTop: 2 }}>{naira(countTo(t, SAVE_SOR_AT + 0.4, 0, 220 * UNIT_COST, 1.2))}</p>
          <p className="text-gray-500" style={{ fontSize: 10.5 }}>220 sold × {naira(UNIT_COST)}. The 10 returned go back on the next delivery</p>
        </div>
      </Panel>
    </>
  );
}

export const sorCursor = [[0.4, 300, 300], [3.8, 300, 300], [SAVE_SOR_AT, 196, 418, true], [5.2, 196, 418], [6.4, 560, 400]];

// ---------------------------------------------------------------------------
// Supplier payments
// ---------------------------------------------------------------------------

const PAY_STEPS_AT = [3.0, 4.6, 6.3];

export function PaymentsScene({ t }) {
  const checks = [
    ["Operations", "Every SOR line of the order is reconciled", 1.0],
    ["Bank details", "Supplier verified; invoice bank details match the register", 1.4],
    ["Amount", "More than ₦0 and not more than is available to pay", 1.8],
    ["Accounting", "Junior check and senior approval, by two different people", PAY_STEPS_AT[1] + 0.2],
  ];
  const stage = PAY_STEPS_AT.filter((s) => t >= s + 0.15).length;
  const labels = ["Mark junior check done", "Approve payment", "Record as paid"];
  const steps = [
    ["Requested", "Bisi Ola · procurement", 0],
    ["Junior check", "Kemi A. · junior accountant", PAY_STEPS_AT[0] + 0.15],
    ["Senior approval", "Dayo O. · senior accountant", PAY_STEPS_AT[1] + 0.15],
    ["Paid", "Transfer from GTBank •••• 2041", PAY_STEPS_AT[2] + 0.15],
  ];

  return (
    <>
      <Heading t={t} title="Supplier payments" sub="Automatic checks first, then a junior check and a senior approval by two different people" />

      <Panel style={{ ...at(24, 62, 420, 406), ...rise(t, 0.2, 0.8), padding: 16 }}>
        <div className="flex items-start justify-between">
          <div>
            <Kicker>Payment request · PAY-0219</Kicker>
            <p className="font-bold text-gray-900 tabular-nums" style={{ fontSize: 22, marginTop: 2 }}>₦611,600</p>
            <p className="text-gray-500" style={{ fontSize: 11 }}>Bright Foods Ltd · PO-0088 · full payment</p>
          </div>
          <Swap
            t={t}
            items={[
              [0, <Tag key="0" tone="amber">Waiting for junior check</Tag>],
              [PAY_STEPS_AT[0] + 0.2, <Tag key="1" tone="blue">Waiting for senior approval</Tag>],
              [PAY_STEPS_AT[1] + 0.2, <Tag key="2" tone="purple">Ready to pay</Tag>],
              [PAY_STEPS_AT[2] + 0.2, <Tag key="3" tone="green">Paid</Tag>],
            ]}
          />
        </div>
        <Kicker style={{ marginTop: 18 }}>Automatic checks</Kicker>
        {checks.map(([name, help, okAt], i) => {
          const ok = prog(t, okAt, 0.4, easeOut);
          return (
            <div key={name} className="flex items-start border-b border-gray-100" style={{ ...rise(t, 0.5 + i * 0.12, 0.5, 6), gap: 10, padding: "9px 0" }}>
              <span className="relative flex items-center justify-center shrink-0" style={{ width: 20, height: 20, marginTop: 1 }}>
                <Hourglass size={14} className="absolute text-amber-500" style={{ opacity: 1 - ok }} />
                <CircleCheck size={17} className="absolute text-green-600" style={{ opacity: ok, transform: `scale(${lerp(0.5, 1, ok)})` }} />
              </span>
              <div>
                <p className="font-semibold text-gray-900" style={{ fontSize: 12 }}>{name}</p>
                <p className="text-gray-500" style={{ fontSize: 10.5 }}>{help}</p>
              </div>
            </div>
          );
        })}
      </Panel>

      <Panel style={{ ...at(456, 62, 300, 406), ...rise(t, 0.35, 0.8), padding: 16 }}>
        <p className="font-semibold text-gray-900" style={{ fontSize: 13 }}>Progress</p>
        {steps.map(([title, who, doneAt], i) => (
          <Step key={title} t={t} x={16} y={44 + i * 76} w={268} icon={i === 3 ? Landmark : Wallet} title={title} who={who} doneAt={doneAt} doneBy="Done" last={i === steps.length - 1} />
        ))}
        <Button
          t={t}
          press={PAY_STEPS_AT[Math.min(stage, 2)]}
          done={PAY_STEPS_AT[2] + 0.15}
          doneLabel="Paid · supplier notified"
          style={at(16, 354, 268, 36)}
        >
          {labels[Math.min(stage, 2)]}
        </Button>
      </Panel>
    </>
  );
}

export const paymentsCursor = [[0.4, 300, 440], [2.4, 606, 434], ...PAY_STEPS_AT.flatMap((s) => [[s, 606, 434, true], [s + 0.6, 606, 434]]), [7.6, 230, 140]];

// ---------------------------------------------------------------------------
// Order follow-up
// ---------------------------------------------------------------------------

const ORDERS = [
  ["PO-0095", "Kola Distributors", "2. Waiting for approval", "amber", "Approve the order", "Store manager"],
  ["PO-0093", "Fresh Farms", "5. Waiting for delivery", "blue", "Receive the goods", "Store manager"],
  ["PO-0091", "Lagos Bottling Co.", "8. Procurement check", "purple", "Match PO, invoice and GRN", "Procurement officer"],
  ["PO-0094", "Sunrise Bakery", "11. Payment on hold", "red", "Resolve the hold", "Senior accountant"],
  ["PO-0088", "Bright Foods Ltd", "15. Paid", "green", "Nothing left to do", "—"],
];
const OWNER_AT = 4.2;

export function FollowUpScene({ t }) {
  const filtered = prog(t, OWNER_AT + 0.2, 0.5);
  return (
    <>
      <Heading t={t} title="Order follow-up" sub="The control tower: every purchase order, its stage, the next action and who must do it" />
      <Tile t={t} start={0.3} style={at(24, 62, 174, 72)} label="Orders in progress" value="14" />
      <Tile t={t} start={0.4} style={at(210, 62, 174, 72)} accent="border-l-red-600" label="Payments overdue" value="2" />
      <Tile t={t} start={0.5} style={at(396, 62, 174, 72)} accent="border-l-amber-500" label="Payments on hold" value="1" />
      <Tile t={t} start={0.6} style={at(582, 62, 174, 72)} accent="border-l-blue-600" label="Unpaid to suppliers" value="₦1,284,000" />

      <Panel style={{ ...at(24, 148, 732, 320), ...rise(t, 0.6, 0.8) }}>
        <div className="flex items-center" style={{ padding: "10px 16px", gap: 8 }}>
          <p className="flex-1 font-semibold text-gray-900" style={{ fontSize: 13 }}>Orders</p>
          <span className="flex items-center bg-gray-100" style={{ fontSize: 11, padding: "5px 10px", gap: 4, transform: `scale(${t >= OWNER_AT && t < OWNER_AT + 0.25 ? 0.96 : 1})` }}>
            <span className="text-gray-500">Action owner:</span>
            <Swap t={t} items={[[0, <span key="a" className="text-gray-900">Everyone</span>], [OWNER_AT + 0.2, <span key="s" className="font-semibold text-blue-700">Store manager</span>]]} />
          </span>
        </div>
        <div className="flex font-semibold tracking-wide text-gray-500 uppercase bg-gray-50 border-y border-gray-200" style={{ height: 28, alignItems: "center", padding: "0 16px", fontSize: 9.5 }}>
          <span style={{ width: 150 }}>Order</span>
          <span style={{ width: 180 }}>Stage</span>
          <span style={{ width: 190 }}>Next action</span>
          <span>Owner</span>
        </div>
        {ORDERS.map(([ref, supplier, stage, tone, action, owner], i) => {
          const mine = owner === "Store manager";
          return (
            <div key={ref} className="absolute flex items-center border-b border-gray-100" style={{ ...at(0, 78 + i * 42, 730, 42), padding: "0 16px", fontSize: 11.5, opacity: rise(t, 0.9 + i * 0.12, 0.5).opacity * (mine ? 1 : lerp(1, 0.25, filtered)) }}>
              <span className="absolute inset-0 bg-blue-50" style={{ opacity: mine ? filtered * 0.7 : 0 }} />
              <span className="relative" style={{ width: 150 }}>
                <span className="block font-semibold text-blue-700 tabular-nums">{ref}</span>
                <span className="block text-gray-500" style={{ fontSize: 10.5 }}>{supplier}</span>
              </span>
              <span className="relative" style={{ width: 180 }}><Tag tone={tone}>{stage}</Tag></span>
              <span className="relative text-gray-800" style={{ width: 190 }}>{action}</span>
              <span className="relative flex items-center text-gray-600 whitespace-nowrap" style={{ gap: 6 }}>
                {owner}
                {mine && <span style={{ opacity: filtered }}><Tag tone="amber">Your turn</Tag></span>}
              </span>
            </div>
          );
        })}
        <p className="absolute flex items-center text-gray-500" style={{ left: 16, bottom: 10, fontSize: 10.5, gap: 6, ...rise(t, 5.6, 0.6, 6) }}>
          <AlertTriangle size={12} className="text-amber-500" /> Each order follows a 15-stage guide, worked out from the documents, so nobody has to update it by hand.
        </p>
      </Panel>
    </>
  );
}

export const followUpCursor = [[0.4, 400, 470], [3.4, 400, 470], [OWNER_AT, 690, 175, true], [5.0, 690, 175], [6.2, 400, 260]];
