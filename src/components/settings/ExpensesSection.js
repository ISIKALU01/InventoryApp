// Settings > Expenses (admins): who may approve expense requests and manage
// store cash (both are permissions, changed in Roles & permissions), and the
// list of expense categories requests must use.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FaCheck, FaPlus, FaTrash } from "react-icons/fa";
import http from "../../../services/http";
import { Panel, Spinner, secondaryButtonClass, statLabelClass } from "./ui";

const messageFrom = (error, fallback) => {
  const errors = error.response?.data?.errors;
  return (errors && Object.values(errors)[0]?.[0]) || error.response?.data?.message || fallback;
};

const holders = (roles, permission) =>
  roles.filter((r) => r.value === "admin" || (r.permissions || []).includes(permission)).map((r) => ({ ...r, isAdmin: r.value === "admin" }));

export default function ExpensesSection({ notify }) {
  const [roles, setRoles] = useState([]);
  const [categories, setCategories] = useState(null);
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState(null); // { id, name }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [r, c] = await Promise.all([http.get("/roles"), http.get("/expense-categories", { params: { all: 1 } })]);
      setRoles(r.data?.data || []);
      setCategories(c.data?.data || []);
    } catch (err) {
      setError(messageFrom(err, "Could not load expense settings."));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (request, message) => {
    setBusy(true);
    setError("");
    try {
      await request();
      notify("success", message, "Saved");
      setEditing(null);
      await load();
    } catch (err) {
      setError(messageFrom(err, "Could not save."));
    } finally {
      setBusy(false);
    }
  };

  const RoleList = ({ permission }) => (
    <ul className="flex flex-wrap gap-2">
      {holders(roles, permission).map((r) => (
        <li key={r.value} className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-50">
          {r.label}{r.isAdmin ? " (always)" : ""}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="space-y-5">
      <Panel
        title="Who approves expenses"
        description="Store managers request expenses for their store. These roles approve or reject them (never their own), paid from the store's cash."
        action={<Link href="/settings?section=roles" className={secondaryButtonClass}>Change in Roles &amp; permissions</Link>}
      >
        <div className="space-y-4 text-sm">
          <div>
            <p className={`${statLabelClass} mb-2`}>Approve or reject expense requests</p>
            <RoleList permission="expenses.approve" />
          </div>
          <div>
            <p className={`${statLabelClass} mb-2`}>Request expenses for their store</p>
            <RoleList permission="expenses.request" />
          </div>
          <div>
            <p className={`${statLabelClass} mb-2`}>Count store cash, give cash, record cash taken to the bank</p>
            <RoleList permission="cash.manage" />
          </div>
          <p className="text-xs text-gray-500">
            To let one particular person approve, make a role for them in Roles &amp; permissions with &ldquo;Approve or reject expense requests&rdquo;, and give them that role.
          </p>
        </div>
      </Panel>

      <Panel title="Expense categories" description="Requests must use one of these, so the analysis groups spending properly. Turn off ones you don't use any more." bodyClass="p-0">
        {error && <p className="px-5 py-3 text-sm text-red-700 border-b border-red-200 bg-red-50">{error}</p>}
        <form
          className="flex gap-2 px-5 py-3 border-b border-gray-200"
          onSubmit={(e) => {
            e.preventDefault();
            if (newName.trim()) run(() => http.post("/expense-categories", { name: newName.trim() }).then(() => setNewName("")), `${newName.trim()} was added.`);
          }}
        >
          <input value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={60} placeholder="New category, e.g. Generator repairs" aria-label="New category" className="flex-1 px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button type="submit" disabled={busy || !newName.trim()} className="flex items-center px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
            <FaPlus className="mr-2" /> Add
          </button>
        </form>
        {categories === null ? (
          <p className="px-5 py-6 text-sm text-gray-500">Loading…</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {categories.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-2.5 text-sm">
                {editing?.id === c.id ? (
                  <form
                    className="flex flex-1 gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      run(() => http.put(`/expense-categories/${c.id}`, { name: editing.name.trim() }), "Category renamed (and on its expenses).");
                    }}
                  >
                    <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} maxLength={60} autoFocus aria-label="Category name" className="flex-1 px-2 py-1 text-sm border border-gray-300" />
                    <button type="submit" disabled={busy || !editing.name.trim()} className="px-2 text-blue-700" aria-label="Save name"><FaCheck /></button>
                  </form>
                ) : (
                  <button type="button" onClick={() => setEditing({ id: c.id, name: c.name })} className={`flex-1 text-left ${c.active ? "text-gray-900" : "text-gray-400 line-through"}`} title="Rename">
                    {c.name} <span className="text-xs text-gray-500 no-underline">({c.used} used)</span>
                  </button>
                )}
                <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={c.active} disabled={busy} onChange={() => run(() => http.put(`/expense-categories/${c.id}`, { active: !c.active }), c.active ? `${c.name} turned off.` : `${c.name} turned on.`)} className="accent-blue-600" />
                  On
                </label>
                {c.used === 0 && (
                  <button type="button" disabled={busy} onClick={() => run(() => http.delete(`/expense-categories/${c.id}`), `${c.name} was deleted.`)} className="text-gray-400 hover:text-red-600" aria-label={`Delete ${c.name}`}>
                    <FaTrash className="text-xs" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {busy && <div className="px-5 py-2"><Spinner /></div>}
      </Panel>
    </div>
  );
}
