// Settings > POS terminals (admins): the card machines at each store. A card
// sale sends the order amount to the store's machine and is recorded once the
// card is paid. The simulator is a demo card machine: open its screen on a
// phone or tablet with the terminal's code. Moniepoint/OPay machines are added
// as types once their integration is confirmed.
import { useCallback, useEffect, useState } from "react";
import { FaCreditCard, FaExternalLinkAlt, FaPlus, FaRedo, FaTrash } from "react-icons/fa";
import http from "../../../services/http";
import { Panel, Spinner, secondaryButtonClass, statLabelClass } from "./ui";

const fieldClass = "w-full px-3 py-2.5 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500";
const messageFrom = (error, fallback) => {
  const errors = error.response?.data?.errors;
  return (errors && Object.values(errors)[0]?.[0]) || error.response?.data?.message || fallback;
};
const listOf = (body) => (Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : []);

export default function PosTerminalsSection({ notify }) {
  const [terminals, setTerminals] = useState(null);
  const [stores, setStores] = useState([]);
  const [banks, setBanks] = useState([]);
  const [form, setForm] = useState({ name: "", store_id: "", provider: "simulator", bank_account_id: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const { data } = await http.get("/pos-terminals/all");
      setTerminals(listOf(data));
    } catch (err) {
      setError(messageFrom(err, "Could not load the card machines."));
      setTerminals([]);
    }
  }, []);

  useEffect(() => {
    load();
    http.get("/stores").then(({ data }) => setStores(listOf(data).filter((s) => s.type !== "back_store"))).catch(() => {});
    http.get("/bank-accounts").then(({ data }) => setBanks(listOf(data))).catch(() => {});
  }, [load]);

  const run = async (request, message) => {
    setBusy(true);
    setError("");
    try {
      await request();
      notify("success", message, "Saved");
      await load();
      return true;
    } catch (err) {
      setError(messageFrom(err, "Could not save."));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const add = async (e) => {
    e.preventDefault();
    const ok = await run(
      () =>
        http.post("/pos-terminals", {
          name: form.name.trim(),
          store_id: Number(form.store_id),
          provider: form.provider,
          bank_account_id: form.bank_account_id ? Number(form.bank_account_id) : null,
        }),
      `${form.name.trim()} was added.`
    );
    if (ok) setForm({ name: "", store_id: "", provider: "simulator", bank_account_id: "" });
  };

  const deviceLink = (t) => `/pos-device?code=${encodeURIComponent(t.device_code)}`;

  return (
    <div className="space-y-5">
      <Panel title="Card machines" description="Card sales send the order total to the store's card machine and are recorded once the card is paid." bodyClass="p-0">
        {error && <p className="px-5 py-3 text-sm text-red-700 border-b border-red-200 bg-red-50">{error}</p>}
        {terminals === null ? (
          <p className="px-5 py-6 text-sm text-gray-500">Loading…</p>
        ) : terminals.length === 0 ? (
          <p className="px-5 py-6 text-sm text-gray-500">No card machines yet. Add one below. Until a shop has one, its card sales are recorded by hand as before.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {terminals.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                <FaCreditCard className={t.active ? "text-blue-600" : "text-gray-300"} />
                <div className="flex-1 min-w-[12rem]">
                  <p className={`font-semibold ${t.active ? "text-gray-900" : "text-gray-400 line-through"}`}>
                    {t.name} <span className="font-normal text-gray-500">· {t.store?.name}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {t.provider_label}
                    {t.bank_account ? ` · settles to ${t.bank_account.bank_name} ${t.bank_account.account_number}` : ""}
                  </p>
                  {t.provider === "simulator" && (
                    <p className="text-xs text-gray-600">
                      Code <span className="font-mono font-semibold">{t.device_code}</span>
                      {" · "}
                      <span className={t.online ? "text-green-700" : "text-gray-400"}>{t.online ? "screen open" : "screen not open"}</span>
                    </p>
                  )}
                </div>
                {t.provider === "simulator" && t.device_code && (
                  <a href={deviceLink(t)} target="_blank" rel="noreferrer" className={`${secondaryButtonClass} flex items-center`}>
                    <FaExternalLinkAlt className="mr-2 text-xs" /> Open card machine
                  </a>
                )}
                {t.provider === "simulator" && (
                  <button type="button" disabled={busy} onClick={() => run(() => http.post(`/pos-terminals/${t.id}/new-code`), `${t.name} has a new code; the old one stops working.`)} className="p-2 text-gray-500 hover:text-blue-600" title="New code" aria-label={`New code for ${t.name}`}>
                    <FaRedo className="text-xs" />
                  </button>
                )}
                <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={t.active} disabled={busy} onChange={() => run(() => http.put(`/pos-terminals/${t.id}`, { active: !t.active }), t.active ? `${t.name} turned off.` : `${t.name} turned on.`)} className="accent-blue-600" />
                  On
                </label>
                <button type="button" disabled={busy} onClick={() => run(() => http.delete(`/pos-terminals/${t.id}`), `${t.name} was removed.`)} className="p-2 text-gray-400 hover:text-red-600" aria-label={`Remove ${t.name}`}>
                  <FaTrash className="text-xs" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Add a card machine" description="One per till. For now the simulator (a demo card machine); Moniepoint and OPay machines come once their integration is set up.">
        <form onSubmit={add} className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <label htmlFor="pos-name" className={`${statLabelClass} block mb-1.5`}>Name</label>
            <input id="pos-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={60} placeholder="e.g. Till 1" className={fieldClass} />
          </div>
          <div>
            <label htmlFor="pos-store" className={`${statLabelClass} block mb-1.5`}>Shop</label>
            <select id="pos-store" value={form.store_id} onChange={(e) => setForm({ ...form, store_id: e.target.value })} className={fieldClass}>
              <option value="">Choose the shop</option>
              {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="pos-provider" className={`${statLabelClass} block mb-1.5`}>Type</label>
            <select id="pos-provider" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} className={fieldClass}>
              <option value="simulator">Simulator (demo card machine)</option>
            </select>
          </div>
          <div />
          <div>
            <label htmlFor="pos-bank" className={`${statLabelClass} block mb-1.5`}>Card money settles to</label>
            <select id="pos-bank" value={form.bank_account_id} onChange={(e) => setForm({ ...form, bank_account_id: e.target.value })} className={fieldClass}>
              <option value="">Not set (the cashier chooses)</option>
              {banks.map((b) => <option key={b.id} value={b.id}>{b.bank_name} · {b.account_number}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={busy || !form.name.trim() || !form.store_id} className="flex items-center px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
              {busy ? <Spinner /> : <FaPlus className="mr-2 text-xs" />} Add card machine
            </button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
