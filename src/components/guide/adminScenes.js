// components/guide/adminScenes.js
// Guide chapters: staff and sign-in approvals, admin settings, appearance.
import {
  Bell,
  Check,
  Cog,
  Database,
  Loader2,
  LogOut,
  Palette,
  Plus,
  Receipt,
  Shield,
  ShieldCheck,
  ShoppingCart,
  UserCog,
} from "lucide-react";
import { ACCENTS } from "../../../utils/appearance";
import { Avatar, Button, Field, Flash, Heading, Kicker, Panel, Popup, Swap, Tag, Toggle, at, easeOut, lerp, mixColor, prog, rise, typed } from "./kit";

// ---------------------------------------------------------------------------
// Staff and sign-in approvals
// ---------------------------------------------------------------------------

const APPROVE_LOGIN_AT = 2.6;
const LOGOUT_AT = 4.6;
const CONFIRM_LOGOUT_AT = 5.7;

const STAFF = [
  { name: "Ngozi Eze", role: "Cashier · Main branch" },
  { name: "Musa Bello", role: "Inventory officer · Back store" },
  { name: "Kemi Adebayo", role: "Junior accountant" },
  { name: "Tola Martins", role: "Cashier · Lekki branch" },
];

export function StaffScene({ t }) {
  const approved = prog(t, APPROVE_LOGIN_AT + 0.2, 0.5);
  const statusFor = (i) => {
    if (i === 0) return <Swap t={t} style={{ justifyItems: "end" }} items={[[0, <Tag key="w" tone="amber">Waiting for approval</Tag>], [APPROVE_LOGIN_AT + 0.2, <Tag key="a" tone="green">Signed in today</Tag>]]} />;
    if (i === 1) return <Swap t={t} style={{ justifyItems: "end" }} items={[[0, <Tag key="s" tone="green">Signed in today</Tag>], [CONFIRM_LOGOUT_AT + 0.2, <Tag key="o" tone="gray">Signed out</Tag>]]} />;
    if (i === 2) return <Tag tone="green">Signed in today</Tag>;
    return <Tag tone="gray">Not signed in</Tag>;
  };

  return (
    <>
      <Heading t={t} title="Staff & sign-in approvals" sub="Staff ask to sign in each day and a manager approves them. Anyone can be signed out of every device" />

      <div className="absolute overflow-hidden border-gray-800 shadow-2xl rounded-3xl theme-fixed" style={{ ...at(54, 70, 200, 390), ...rise(t, 0.2, 0.9, 20), borderWidth: 8, background: "#f3f4f6", color: "#111827" }}>
        <div className="flex flex-col items-center text-center" style={{ padding: "40px 16px" }}>
          <p className="font-bold" style={{ fontSize: 18 }}>SellaPad</p>
          <Avatar name="Ngozi Eze" size={52} style={{ marginTop: 26 }} />
          <p className="font-semibold" style={{ fontSize: 13, marginTop: 10 }}>Ngozi Eze</p>
          <p style={{ fontSize: 10.5, color: "#6b7280" }}>Cashier · Main branch</p>
          <div style={{ marginTop: 34, minHeight: 80 }}>
            <div style={{ opacity: 1 - approved }}>
              <Loader2 size={22} className="mx-auto" style={{ color: "#2563eb", transform: `rotate(${t * 240}deg)` }} />
              <p style={{ fontSize: 11, color: "#4b5563", marginTop: 8, lineHeight: 1.4 }}>Waiting for a manager to approve today&apos;s sign-in…</p>
            </div>
            <div style={{ opacity: approved, marginTop: -64, transform: `scale(${lerp(0.9, 1, approved)})` }}>
              <span className="flex items-center justify-center mx-auto rounded-full" style={{ width: 30, height: 30, background: "#16a34a", color: "#fff" }}>
                <Check size={17} />
              </span>
              <p className="font-semibold" style={{ fontSize: 12, color: "#15803d", marginTop: 8 }}>Approved. Welcome, Ngozi!</p>
            </div>
          </div>
        </div>
      </div>

      <Panel style={{ ...at(296, 62, 460, 406), ...rise(t, 0.35, 0.8) }}>
        <div className="flex items-center justify-between" style={{ padding: "14px 16px" }}>
          <p className="font-semibold text-gray-900" style={{ fontSize: 13 }}>Authorize users</p>
          <span className="text-gray-500" style={{ fontSize: 10.5 }}>Today</span>
        </div>
        {STAFF.map((s, i) => (
          <div key={s.name} className="absolute flex items-center border-t border-gray-100" style={{ ...at(0, 48 + i * 64, 458, 64), ...rise(t, 0.6 + i * 0.12, 0.5, 8), padding: "0 16px", gap: 10 }}>
            {i === 0 && <Flash t={t} from={APPROVE_LOGIN_AT + 0.2} />}
            <Avatar name={s.name} style={{ position: "relative" }} />
            <div className="relative flex-1 min-w-0">
              <p className="font-medium text-gray-900" style={{ fontSize: 12 }}>{s.name}</p>
              <p className="text-gray-500" style={{ fontSize: 10.5 }}>{s.role}</p>
            </div>
            <span className="relative">{statusFor(i)}</span>
            {i === 0 && (
              <Button t={t} press={APPROVE_LOGIN_AT} style={{ position: "relative", width: lerp(80, 0, approved), marginLeft: lerp(0, -10, approved), height: 28, fontSize: 11, opacity: 1 - approved }}>Approve</Button>
            )}
            {i === 1 && (
              <span className="relative flex items-center justify-center text-red-600 border border-gray-200" style={{ width: 30, height: 30, transform: `scale(${t >= LOGOUT_AT && t < LOGOUT_AT + 0.25 ? 0.9 : 1})` }}>
                <LogOut size={14} />
              </span>
            )}
          </div>
        ))}
        <div className="absolute flex text-blue-800 bg-blue-50" style={{ ...at(16, 322, 426, 66), ...rise(t, 6.2, 0.7, 8), gap: 10, padding: "10px 12px", fontSize: 11, lineHeight: 1.45 }}>
          <ShieldCheck size={16} className="shrink-0" style={{ marginTop: 1 }} />
          Roles decide what each person can see and do. The menu only shows the pages someone is allowed to open, so a cashier never sees supplier payments.
        </div>
      </Panel>

      <Popup t={t} show={LOGOUT_AT + 0.2} hide={CONFIRM_LOGOUT_AT + 0.25} style={{ ...at(420, 200, 290, 110), padding: 14 }}>
        <p className="font-semibold text-gray-900" style={{ fontSize: 13 }}>Force logout Musa Bello?</p>
        <p className="text-gray-500" style={{ fontSize: 11, marginTop: 2 }}>Signs them out of every device.</p>
        <Button t={t} tone="danger" press={CONFIRM_LOGOUT_AT} icon={LogOut} style={at(14, 64, 262, 30)}>Force logout</Button>
      </Popup>
    </>
  );
}

export const staffCursor = [[0.4, 400, 440], [APPROVE_LOGIN_AT, 700, 142, true], [3.4, 700, 142], [LOGOUT_AT, 723, 206, true], [5.1, 565, 279], [CONFIRM_LOGOUT_AT, 565, 279, true], [6.4, 565, 279], [7.4, 520, 420]];

// ---------------------------------------------------------------------------
// Admin settings
// ---------------------------------------------------------------------------

const SECTIONS = [
  [Cog, "General"],
  [Palette, "Appearance"],
  [Bell, "Notifications"],
  [Shield, "Security"],
  [UserCog, "Users"],
  [ShieldCheck, "Roles & permissions"],
  [Receipt, "Expenses"],
  [Database, "Data Management"],
];
const NAV_AT = [0.6, 3.7, 6.0];
const NAV_TO = [4, 6, 2];
const navY = (i) => 74 + i * 44;

const Check2 = ({ on }) => (
  <span className="relative flex items-center justify-center border border-gray-300 shrink-0" style={{ width: 16, height: 16 }}>
    <span className="absolute inset-0 bg-blue-600" style={{ opacity: on }} />
    <Check size={11} className="relative" style={{ color: "#fff", opacity: on }} />
  </span>
);

export function AdminSettingsScene({ t }) {
  const step = NAV_AT.filter((s) => t >= s).length;
  const from = step <= 1 ? NAV_TO[0] : NAV_TO[step - 2];
  const to = step === 0 ? NAV_TO[0] : NAV_TO[step - 1];
  const activeY = navY(lerp(from, to, step === 0 ? 1 : prog(t, NAV_AT[step - 1], 0.5)));
  const view = (i) => prog(t, NAV_AT[i] + 0.1, 0.4) * (i < NAV_AT.length - 1 ? 1 - prog(t, NAV_AT[i + 1], 0.3) : 1);

  return (
    <>
      <Panel style={{ ...at(24, 16, 200, 452), ...rise(t, 0.1, 0.8) }}>
        <Kicker style={{ ...at(18, 22, 170, 14) }}>Settings</Kicker>
        <span className="absolute bg-blue-50" style={{ ...at(6, activeY - 16, 186, 40), borderLeft: "3px solid var(--color-blue-600, #2563eb)" }} />
        {SECTIONS.map(([Icon, name], i) => (
          <span key={name} className="absolute flex items-center text-gray-700" style={{ ...at(18, navY(i) - 16, 176, 40), gap: 10, fontSize: 12 }}>
            <Icon size={14} className="text-gray-500" />
            {name}
          </span>
        ))}
      </Panel>

      {/* Users: assign stores to people */}
      <Panel style={{ ...at(236, 16, 520, 452), opacity: view(0), padding: 18 }}>
        <p className="font-semibold text-gray-900" style={{ fontSize: 14 }}>Assign stores</p>
        <p className="text-gray-500" style={{ fontSize: 11 }}>Pick people from a role and give them stores. They only see sales and stock for their stores</p>
        <Field t={t} label="Role" value="Store manager" style={at(18, 62, 200, 56)} />
        {["Amaka Obi", "Chidi Nwosu", "Femi Ade"].map((name, i) => (
          <div key={name} className="absolute flex items-center border-b border-gray-100" style={{ ...at(18, 130 + i * 40, 484, 40), gap: 10, fontSize: 12 }}>
            <Check2 on={i < 2 ? prog(t, 1.3 + i * 0.4, 0.25) : 0} />
            <Avatar name={name} size={24} />
            <span className="text-gray-900">{name}</span>
          </div>
        ))}
        <Kicker style={{ ...at(18, 262, 300, 14) }}>Stores</Kicker>
        {["Main branch", "Lekki branch", "Back store"].map((store, i) => {
          const on = i < 2 ? prog(t, 2.2 + i * 0.4, 0.3) : 0;
          return (
            <span key={store} className="absolute flex items-center justify-center overflow-hidden text-gray-700 border border-gray-300" style={{ ...at(18 + i * 134, 282, 126, 32), fontSize: 11.5 }}>
              <span className="absolute inset-0 bg-blue-600" style={{ opacity: on }} />
              <span className="relative" style={{ color: on > 0.5 ? "#fff" : undefined }}>{store}</span>
            </span>
          );
        })}
        <Button t={t} press={3.1} done={3.25} doneLabel="Stores assigned" style={at(18, 340, 200, 34)}>
          Save
        </Button>
      </Panel>

      {/* Expenses: who approves, and categories */}
      <Panel style={{ ...at(236, 16, 520, 452), opacity: view(1), padding: 18 }}>
        <p className="font-semibold text-gray-900" style={{ fontSize: 14 }}>Who approves expenses</p>
        <p className="text-gray-500" style={{ fontSize: 11 }}>Requests wait in Expenses until one of these roles approves them</p>
        <div className="flex" style={{ gap: 8, marginTop: 12 }}>
          {[["Store manager", false], ["Senior accountant", true], ["Admin", true]].map(([role, on]) => (
            <span key={role} className={on ? "text-white bg-blue-600" : "text-gray-600 border border-gray-300"} style={{ fontSize: 11.5, padding: "6px 12px" }}>{role}</span>
          ))}
        </div>
        <p className="font-semibold text-gray-900" style={{ fontSize: 14, marginTop: 22 }}>Expense categories</p>
        <p className="text-gray-500" style={{ fontSize: 11 }}>Requests must use one of these, so the analysis groups spending properly</p>
        <Field t={t} label="New category" value={typed(t, 4.4, "Staff welfare", 14)} active={t > 4.3 && t < 5.3} style={at(18, 198, 300, 56)} />
        <Button t={t} press={5.3} icon={Plus} style={at(326, 219, 84, 32)}>Add</Button>
        <div className="absolute flex flex-wrap" style={{ ...at(18, 270, 484, 100), gap: 8 }}>
          {["Generator & fuel", "Cleaning", "Repairs", "Transport", "Staff welfare"].map((c, i) => (
            <span key={c} style={i === 4 ? { opacity: prog(t, 5.5, 0.4), transform: `scale(${lerp(0.8, 1, prog(t, 5.5, 0.4, easeOut))})` } : undefined}>
              <Tag tone={i === 4 ? "blue" : "gray"} style={{ fontSize: 11.5, padding: "5px 10px" }}>{c}</Tag>
            </span>
          ))}
        </div>
      </Panel>

      {/* Notifications: what reaches the inbox */}
      <Panel style={{ ...at(236, 16, 520, 452), opacity: view(2), padding: 18 }}>
        <p className="font-semibold text-gray-900" style={{ fontSize: 14 }}>What reaches your inbox</p>
        <p className="text-gray-500" style={{ fontSize: 11 }}>Each person picks the topics they want. “Your turn” messages always come through</p>
        {[
          ["Purchasing", "Orders, deliveries, SOR and payments", true],
          ["Expenses", "Requests and decisions", true],
          ["Stock alerts", "Low stock and expiry", true],
          ["Sales", "Deleted and edited sales", false, 6.8],
          ["Messages from admins", "Always on", true],
        ].map(([name, help, on, flip], i) => (
          <div key={name} className="absolute flex items-center justify-between border-b border-gray-100" style={{ ...at(18, 64 + i * 48, 484, 48) }}>
            <div>
              <p className="text-gray-900" style={{ fontSize: 12 }}>{name}</p>
              <p className="text-gray-500" style={{ fontSize: 10.5 }}>{help}</p>
            </div>
            <span style={{ opacity: i === 4 ? 0.5 : 1 }}><Toggle t={t} on={on} flip={flip} /></span>
          </div>
        ))}
      </Panel>
    </>
  );
}

export const adminSettingsCursor = [
  [0.2, 400, 440],
  [NAV_AT[0], 110, navY(4) + 16, true],
  [1.3, 262, 166, true],
  [1.7, 262, 206, true],
  [2.2, 317, 314, true],
  [2.6, 451, 314, true],
  [3.1, 354, 373, true],
  [NAV_AT[1], 110, navY(6) + 16, true],
  [4.4, 380, 250],
  [5.3, 604, 251, true],
  [NAV_AT[2], 110, navY(2) + 16, true],
  [6.8, 721, 248, true],
  [7.6, 560, 380],
];

// ---------------------------------------------------------------------------
// Appearance: three accents, then back to the user's own
// ---------------------------------------------------------------------------

const ACCENT_CLICKS = [1.2, 2.6, 4.0, 5.4];

export const accentTour = (current) => {
  const others = ["emerald", "violet", "orange", "teal", "rose", "default"].filter((id) => id !== current).slice(0, 3);
  return [current, ...others, current].map((id) => ACCENTS.find((a) => a.id === id) || ACCENTS[0]);
};
const accentStep = (t) => ACCENT_CLICKS.filter((c) => t >= c).length;
export const accentColor = (tour, t, key) => {
  const step = accentStep(t);
  if (step === 0) return tour[0][key];
  return mixColor(tour[step - 1][key], tour[step][key], prog(t, ACCENT_CLICKS[step - 1], 0.8));
};
const swatchX = (id) => 96 + ACCENTS.findIndex((a) => a.id === id) * 104;
const SWATCH_Y = 148;

export function AppearanceScene({ t, ctx }) {
  const step = accentStep(t);
  const selected = ctx.tour[step].id;
  const ringK = step === 0 ? 1 : prog(t, ACCENT_CLICKS[step - 1], 0.4, easeOut);
  const color = accentColor(ctx.tour, t, "swatch");

  return (
    <>
      <Panel style={{ ...at(24, 16, 732, 452), ...rise(t, 0.1, 0.8), padding: "16px 24px" }}>
        <p className="flex items-center font-semibold text-gray-900" style={{ gap: 8, fontSize: 14 }}>
          <Palette size={16} className="text-blue-600" /> Appearance
        </p>
        <p className="text-gray-500" style={{ fontSize: 11 }}>Make SellaPad yours. Theme, accent colour, size and motion apply on this device.</p>
        <Kicker style={{ marginTop: 22 }}>Accent colour</Kicker>
      </Panel>

      {ACCENTS.map((a, i) => {
        const on = a.id === selected ? ringK : 0;
        return (
          <div key={a.id} style={rise(t, 0.4 + i * 0.08, 0.6, 10)}>
            <span className="absolute rounded-full" style={{ ...at(swatchX(a.id) - 20, SWATCH_Y - 20, 40, 40), background: a.swatch, boxShadow: `0 0 0 ${3 * on}px var(--color-white, #fff), 0 0 0 ${5 * on}px ${a.swatch}` }} />
            <span className="absolute text-center text-gray-600" style={{ ...at(swatchX(a.id) - 40, SWATCH_Y + 28, 80, 16), fontSize: 11 }}>{a.label}</span>
          </div>
        );
      })}

      <div className="absolute border border-gray-200 bg-gray-50" style={{ ...at(48, 222, 684, 222), ...rise(t, 0.8, 0.8), padding: 20 }}>
        <Kicker>Preview</Kicker>
        <div className="flex items-center" style={{ marginTop: 16, gap: 16 }}>
          <span className="flex items-center font-medium" style={{ background: color, color: "#fff", padding: "10px 18px", fontSize: 12.5, gap: 8 }}>
            <ShoppingCart size={15} /> Complete sale
          </span>
          <span className="relative rounded-full" style={{ width: 40, height: 22, background: color }}>
            <span className="absolute rounded-full" style={{ ...at(20, 3, 16, 16), background: "#fff" }} />
          </span>
          <span className="font-medium" style={{ color, fontSize: 12.5 }}>View sales list →</span>
        </div>
        <Kicker style={{ marginTop: 22 }}>Theme · Interface size · Reduce motion</Kicker>
        <div className="flex" style={{ marginTop: 8, gap: 8 }}>
          {["Light", "Dark", "System"].map((s, i) => (
            <span key={s} className={i === 0 ? "font-medium" : "text-gray-600 border border-gray-300"} style={{ padding: "7px 14px", fontSize: 11.5, ...(i === 0 && { background: color, color: "#fff" }) }}>{s}</span>
          ))}
          <span style={{ width: 12 }} />
          {["Compact", "Default", "Large"].map((s) => (
            <span key={s} className={s === "Default" ? "font-medium" : "text-gray-600 border border-gray-300"} style={{ padding: "7px 14px", fontSize: 11.5, ...(s === "Default" && { background: color, color: "#fff" }) }}>{s}</span>
          ))}
        </div>
        <div className="bg-gray-200" style={{ marginTop: 22, height: 6 }}>
          <div className="h-full" style={{ width: `${30 + 50 * prog(t, 1, 5)}%`, background: color }} />
        </div>
      </div>
    </>
  );
}

export const appearanceCursor = (ctx) => {
  const keys = [[0.4, 420, 420]];
  ACCENT_CLICKS.forEach((c, i) => {
    keys.push([c, swatchX(ctx.tour[i + 1].id), SWATCH_Y, true]);
    keys.push([c + 0.35, swatchX(ctx.tour[i + 1].id), SWATCH_Y]);
  });
  keys.push([6.6, 560, 400]);
  return keys;
};
