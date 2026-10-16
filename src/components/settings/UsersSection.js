// Settings > Users (admins only): create accounts, choose each person's role,
// reset passwords and remove accounts. The roles and what each one may do come
// from the backend (GET /roles), so this screen never goes out of date.
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaChevronDown,
  FaEdit,
  FaExclamationTriangle,
  FaPlus,
  FaSave,
  FaStore,
  FaTrash,
  FaUserCog,
  FaUserPlus,
} from "react-icons/fa";
import http from "../../../services/http";
import { useAuth } from "../../context/AuthContext";
import { ModalFooter, ModalShell, Panel, Spinner, secondaryButtonClass, statLabelClass } from "./ui";

const primaryButtonClass =
  "flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-none transition-colors hover:bg-blue-700 disabled:opacity-50";

const fieldClass = (hasError) =>
  `block w-full px-3 py-2.5 text-sm text-gray-800 bg-white border rounded-none outline-none transition-colors placeholder:text-gray-400 disabled:opacity-50 disabled:bg-gray-50 ${
    hasError
      ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
      : "border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
  }`;

const labelClass = "block mb-1.5 text-xs font-semibold tracking-wide text-gray-600 uppercase";

// Laravel validation errors -> { field: "first message" }
const fieldErrorsFrom = (error) => {
  const errors = error.response?.data?.errors || {};
  return Object.fromEntries(Object.entries(errors).map(([field, messages]) => [field, messages[0]]));
};

const messageFrom = (error, fallback) => {
  if (error.response?.status === 403) return "Only admins can manage users.";
  return error.response?.data?.message || fallback;
};

const EMPTY_FORM = { name: "", email: "", role: "", password: "", password_confirmation: "" };

const UserFormModal = ({ user, roles, isSelf, onClose, onSaved }) => {
  const isEdit = Boolean(user);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(
      user
        ? { name: user.name || "", email: user.email || "", role: user.role || "", password: "", password_confirmation: "" }
        : EMPTY_FORM
    );
    setErrors({});
    setFormError("");
  }, [user]);

  const selectedRole = roles.find((role) => role.value === form.role);
  const roleChanged = isEdit && form.role !== user.role;
  const passwordChanged = form.password !== "";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Name is required.";
    if (!form.email.trim()) next.email = "Email is required.";
    if (!form.role) next.role = "Choose a role.";
    if (!isEdit || passwordChanged) {
      if (form.password.length < 8) next.password = "Password must be at least 8 characters.";
      else if (form.password !== form.password_confirmation) next.password_confirmation = "Passwords don't match.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Send only what is needed: an edit without a new password keeps the old one
    const payload = { name: form.name.trim(), email: form.email.trim(), role: form.role };
    if (!isEdit || passwordChanged) {
      payload.password = form.password;
      payload.password_confirmation = form.password_confirmation;
    }

    setSaving(true);
    setFormError("");
    try {
      const { data } = isEdit ? await http.put(`/users/${user.id}`, payload) : await http.post("/users", payload);
      onSaved(data, isEdit);
    } catch (error) {
      setErrors(fieldErrorsFrom(error));
      setFormError(messageFrom(error, isEdit ? "Could not save this user." : "Could not create this user."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={isEdit ? "Edit User" : "Add User"}
      subtitle={isEdit ? user.email : "They can log in once an admin approves them for the day"}
      icon={isEdit ? FaUserCog : FaUserPlus}
      onClose={onClose}
      busy={saving}
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 gap-5 px-6 py-6 sm:grid-cols-2">
          {formError && (
            <div role="alert" className="sm:col-span-2 flex items-start gap-3 px-4 py-3 text-sm text-red-800 border border-red-200 bg-red-50">
              <FaExclamationTriangle className="mt-0.5 shrink-0 text-red-600" />
              <span>{formError}</span>
            </div>
          )}

          <div className="sm:col-span-2">
            <label htmlFor="user-name" className={labelClass}>Full name</label>
            <input id="user-name" name="name" value={form.name} onChange={handleChange} disabled={saving} autoFocus className={fieldClass(errors.name)} placeholder="Amaka Obi" />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="user-email" className={labelClass}>Email</label>
            <input id="user-email" name="email" type="email" value={form.email} onChange={handleChange} disabled={saving} className={fieldClass(errors.email)} placeholder="amaka@yourstore.com" autoComplete="off" />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="user-role" className={labelClass}>Role</label>
            <select
              id="user-role"
              name="role"
              value={form.role}
              onChange={handleChange}
              // The backend refuses to let an admin remove their own admin role
              disabled={saving || isSelf}
              className={fieldClass(errors.role)}
            >
              <option value="">Choose a role…</option>
              {roles.map((role) => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
            {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role}</p>}
            {isSelf && <p className="mt-1 text-xs text-gray-500">You can&apos;t change your own role.</p>}
            {selectedRole && !isSelf && <p className="mt-1 text-xs text-gray-500">{selectedRole.description}</p>}
          </div>

          <div>
            <label htmlFor="user-password" className={labelClass}>
              {isEdit ? "New password" : "Password"}
              {isEdit && <span className="ml-1 font-normal text-gray-400 normal-case">(leave blank to keep)</span>}
            </label>
            <input id="user-password" name="password" type="password" value={form.password} onChange={handleChange} disabled={saving} className={fieldClass(errors.password)} autoComplete="new-password" placeholder="At least 8 characters" />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
          </div>

          <div>
            <label htmlFor="user-password-confirmation" className={labelClass}>Confirm password</label>
            <input id="user-password-confirmation" name="password_confirmation" type="password" value={form.password_confirmation} onChange={handleChange} disabled={saving} className={fieldClass(errors.password_confirmation)} autoComplete="new-password" />
            {errors.password_confirmation && <p className="mt-1 text-xs text-red-600">{errors.password_confirmation}</p>}
          </div>

          {isEdit && (roleChanged || passwordChanged) && (
            <p className="sm:col-span-2 px-4 py-3 text-xs text-amber-800 border border-amber-200 bg-amber-50">
              Saving will sign {user.name} out of every device. Their next login uses the new {roleChanged ? "role" : "password"}.
            </p>
          )}
        </div>

        <ModalFooter>
          <button type="button" onClick={onClose} disabled={saving} className={secondaryButtonClass}>Cancel</button>
          <button type="submit" disabled={saving} className={primaryButtonClass}>
            {saving ? <Spinner /> : <FaSave className="mr-2" />}
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create User"}
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  );
};

const RoleGuide = ({ roles, permissionLabels }) => {
  const [open, setOpen] = useState(null);

  return (
    <Panel title="What each role can do" description="Change these in Settings > Roles & permissions." bodyClass="">
      <ul className="divide-y divide-gray-200">
        {roles.map((role) => {
          const expanded = open === role.value;
          return (
            <li key={role.value}>
              <button
                type="button"
                onClick={() => setOpen(expanded ? null : role.value)}
                aria-expanded={expanded}
                className="flex items-center justify-between w-full gap-3 px-5 py-3 text-left hover:bg-gray-50"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-gray-900">{role.label}</span>
                  <span className="block text-xs text-gray-500">{role.description}</span>
                </span>
                <FaChevronDown className={`shrink-0 text-xs text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
              </button>
              {expanded && (
                <ul className="grid gap-1 px-5 pb-4 sm:grid-cols-2">
                  {role.permissions.map((permission) => (
                    <li key={permission} className="text-xs text-gray-700 before:content-['✓'] before:mr-2 before:text-green-600">
                      {permissionLabels[permission] || permission}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
};

// Which stores someone works at: one, several, or all. They sell from these
// stores and see only their sales, stock and expenses. Admins have them all.
const storesLine = (u) => {
  if (u.role === "admin") return "All stores (admin)";
  const access = u.store_access;
  if (!access) return null;
  if (access.all) return "All stores";
  return access.stores.length ? access.stores.map((s) => s.name).join(", ") : null;
};

const StoresModal = ({ user, onClose, onSaved }) => {
  const [stores, setStores] = useState(null);
  const [all, setAll] = useState(Boolean(user.store_access?.all));
  const [chosen, setChosen] = useState(() => new Set((user.store_access?.all ? [] : user.store_access?.stores || []).map((s) => s.id)));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    http
      .get("/stores")
      .then(({ data }) => setStores((Array.isArray(data) ? data : data?.data || []).sort((a, b) => String(a.name).localeCompare(String(b.name)))))
      .catch(() => setStores([]));
  }, []);

  const toggle = (id) =>
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const { data } = await http.put(`/users/${user.id}/stores`, { all_stores: all, store_ids: all ? [] : [...chosen] });
      onSaved(data);
    } catch (err) {
      setError(messageFrom(err, "Could not save the stores."));
    } finally {
      setSaving(false);
    }
  };

  const optionClass = (on) => `flex-1 px-3 py-2 text-sm font-semibold border ${on ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`;

  return (
    <ModalShell title="Stores" subtitle={`Where ${user.name} works`} icon={FaStore} onClose={onClose} busy={saving}>
      <div className="px-6 py-5 space-y-4 text-sm">
        {error && <p className="px-3 py-2 text-red-700 border border-red-200 bg-red-50">{error}</p>}
        <p className="text-gray-600">
          {user.name} sells from these stores, and only sees their sales, stock and expenses. With one store, it&apos;s chosen for them automatically.
        </p>
        <div className="flex">
          <button type="button" onClick={() => setAll(false)} className={optionClass(!all)}>Chosen stores</button>
          <button type="button" onClick={() => setAll(true)} className={`${optionClass(all)} -ml-px`}>All stores</button>
        </div>
        {all ? (
          <p className="text-gray-700">Every store, including ones added later.</p>
        ) : stores === null ? (
          <p className="text-gray-500">Loading stores…</p>
        ) : (
          <ul className="border border-gray-200 divide-y divide-gray-100">
            {stores.map((store) => (
              <li key={store.id}>
                <label className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50">
                  <input type="checkbox" checked={chosen.has(store.id)} onChange={() => toggle(store.id)} disabled={saving} className="accent-blue-600" />
                  <span className="flex-1">{store.name}</span>
                  <span className="text-xs text-gray-500">{store.type === "back_store" ? "Back store" : "Shop"}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
      <ModalFooter>
        <button type="button" onClick={onClose} disabled={saving} className={secondaryButtonClass}>Cancel</button>
        <button
          type="button"
          onClick={save}
          disabled={saving || (!all && chosen.size === 0)}
          className="flex items-center px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? <Spinner /> : <FaSave className="mr-2 text-xs" />} Save stores
        </button>
      </ModalFooter>
    </ModalShell>
  );
};

// Pick people from a role (some or all of them) and give them the same
// stores, or all stores. Only the people ticked change, so people in one role
// can still have different stores.
const BulkStoresModal = ({ users, roles, onClose, onSaved }) => {
  const assignable = roles.filter((r) => r.value !== "admin" && users.some((u) => u.role === r.value));
  const [role, setRole] = useState(assignable[0]?.value || "");
  const [picked, setPicked] = useState(() => new Set());
  const [stores, setStores] = useState(null);
  const [all, setAll] = useState(false);
  const [chosen, setChosen] = useState(() => new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    http
      .get("/stores")
      .then(({ data }) => setStores((Array.isArray(data) ? data : data?.data || []).sort((a, b) => String(a.name).localeCompare(String(b.name)))))
      .catch(() => setStores([]));
  }, []);

  const people = users.filter((u) => u.role === role);
  const allPicked = people.length > 0 && people.every((u) => picked.has(u.id));
  const toggleIn = (setter) => (id) =>
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const togglePerson = toggleIn(setPicked);
  const toggleStore = toggleIn(setChosen);

  const changeRole = (value) => {
    setRole(value);
    setPicked(new Set());
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const { data } = await http.put("/users/stores", { user_ids: [...picked], all_stores: all, store_ids: all ? [] : [...chosen] });
      onSaved(data);
    } catch (err) {
      setError(messageFrom(err, "Could not save the stores."));
    } finally {
      setSaving(false);
    }
  };

  const optionClass = (on) => `flex-1 px-3 py-2 text-sm font-semibold border ${on ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`;

  return (
    <ModalShell title="Assign Stores" subtitle="Pick people from a role and give them stores" icon={FaStore} onClose={onClose} busy={saving} maxWidth="max-w-2xl">
      <div className="px-6 py-5 space-y-5 text-sm">
        {error && <p className="px-3 py-2 text-red-700 border border-red-200 bg-red-50">{error}</p>}

        <div>
          <label htmlFor="bulk-role" className={`${statLabelClass} block mb-1.5`}>1. Role</label>
          <select id="bulk-role" value={role} onChange={(e) => changeRole(e.target.value)} disabled={saving} className="w-full px-3 py-2.5 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {assignable.map((r) => (
              <option key={r.value} value={r.value}>{r.label} ({users.filter((u) => u.role === r.value).length})</option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className={statLabelClass}>2. People ({picked.size} ticked)</p>
            <button type="button" onClick={() => setPicked(allPicked ? new Set() : new Set(people.map((u) => u.id)))} disabled={saving || people.length === 0} className="text-xs font-semibold text-blue-700 hover:underline">
              {allPicked ? "Untick all" : "Tick all"}
            </button>
          </div>
          <ul className="overflow-y-auto border border-gray-200 divide-y divide-gray-100 max-h-56">
            {people.map((u) => (
              <li key={u.id}>
                <label className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50">
                  <input type="checkbox" checked={picked.has(u.id)} onChange={() => togglePerson(u.id)} disabled={saving} className="accent-blue-600" />
                  <span className="flex-1 min-w-0">
                    <span className="block text-gray-900 truncate">{u.name}</span>
                    <span className="block text-xs text-gray-500 truncate">Now: {storesLine(u) || "no store"}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <p className={statLabelClass}>3. Stores for the people ticked</p>
          <div className="flex">
            <button type="button" onClick={() => setAll(false)} className={optionClass(!all)}>Chosen stores</button>
            <button type="button" onClick={() => setAll(true)} className={`${optionClass(all)} -ml-px`}>All stores</button>
          </div>
          {all ? (
            <p className="text-gray-700">Every store, including ones added later.</p>
          ) : stores === null ? (
            <p className="text-gray-500">Loading stores…</p>
          ) : (
            <ul className="grid gap-px bg-gray-200 border border-gray-200 sm:grid-cols-2">
              {stores.map((store) => (
                <li key={store.id} className="bg-white">
                  <label className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" checked={chosen.has(store.id)} onChange={() => toggleStore(store.id)} disabled={saving} className="accent-blue-600" />
                    <span className="flex-1">{store.name}</span>
                    <span className="text-xs text-gray-500">{store.type === "back_store" ? "Back store" : "Shop"}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-gray-500">Only the people ticked change. You can still change one person on their own with the shop icon next to them.</p>
        </div>
      </div>
      <ModalFooter>
        <button type="button" onClick={onClose} disabled={saving} className={secondaryButtonClass}>Cancel</button>
        <button
          type="button"
          onClick={save}
          disabled={saving || picked.size === 0 || (!all && chosen.size === 0)}
          className="flex items-center px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? <Spinner /> : <FaSave className="mr-2 text-xs" />} Save for {picked.size} {picked.size === 1 ? "person" : "people"}
        </button>
      </ModalFooter>
    </ModalShell>
  );
};

export default function UsersSection({ notify }) {
  const { user: currentUser, refresh } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissionLabels, setPermissionLabels] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [editing, setEditing] = useState(undefined); // undefined: closed, null: new user, object: edit
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [assigning, setAssigning] = useState(null);
  const [bulkAssigning, setBulkAssigning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [usersResponse, rolesResponse] = await Promise.all([http.get("/users"), http.get("/roles")]);
      setUsers(Array.isArray(usersResponse.data) ? usersResponse.data : []);
      setRoles(rolesResponse.data?.data || []);
      setPermissionLabels(rolesResponse.data?.permission_labels || {});
    } catch (error) {
      setLoadError(messageFrom(error, "Could not load users."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const roleCounts = useMemo(
    () => users.reduce((counts, u) => ({ ...counts, [u.role]: (counts[u.role] || 0) + 1 }), {}),
    [users]
  );

  const handleSaved = (saved, isEdit) => {
    setUsers((prev) =>
      (isEdit ? prev.map((u) => (u.id === saved.id ? saved : u)) : [...prev, saved]).sort((a, b) =>
        (a.name || "").localeCompare(b.name || "")
      )
    );
    setEditing(undefined);
    notify("success", `${saved.name} is now ${saved.role_label || saved.role}.`, isEdit ? "User updated" : "User created");
    if (saved.id === currentUser?.id) refresh();
    // A new person has no store yet: choose where they work straight away
    if (!isEdit && saved.role !== "admin") setAssigning(saved);
  };

  const handleBulkSaved = (result) => {
    const byId = Object.fromEntries(result.users.map((u) => [u.id, u]));
    setUsers((prev) => prev.map((u) => (byId[u.id] ? { ...u, ...byId[u.id] } : u)));
    setBulkAssigning(false);
    notify("success", `Stores saved for ${result.updated} ${result.updated === 1 ? "person" : "people"}.`, "Stores saved");
    if (byId[currentUser?.id]) refresh();
  };

  const handleStoresSaved = (saved) => {
    setUsers((prev) => prev.map((u) => (u.id === saved.id ? { ...u, ...saved } : u)));
    setAssigning(null);
    notify("success", `${saved.name} now works at ${storesLine(saved) || "no store"}.`, "Stores saved");
    if (saved.id === currentUser?.id) refresh();
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      await http.delete(`/users/${toDelete.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== toDelete.id));
      notify("success", `${toDelete.name} can no longer log in.`, "User deleted");
      setToDelete(null);
    } catch (error) {
      const fieldErrors = fieldErrorsFrom(error);
      setDeleteError(fieldErrors.user || messageFrom(error, "Could not delete this user."));
    } finally {
      setDeleting(false);
    }
  };

  const addButton = (
    <div className="flex gap-2">
    <button
      type="button"
      onClick={() => setBulkAssigning(true)}
      disabled={loading || users.every((u) => u.role === "admin")}
      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-700 transition-colors border border-blue-600 bg-white hover:bg-blue-50 disabled:opacity-50"
    >
      <FaStore className="text-[11px]" />
      Assign stores
    </button>
    <button
      type="button"
      onClick={() => setEditing(null)}
      disabled={loading || roles.length === 0}
      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white transition-colors bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
    >
      <FaPlus className="text-[11px]" />
      Add User
    </button>
    </div>
  );

  return (
    <>
      <Panel
        title="Users"
        description={loading ? "Loading…" : `${users.length} account${users.length === 1 ? "" : "s"} · each person has one role`}
        action={addButton}
        bodyClass=""
      >
        {loading ? (
          <div className="flex items-center justify-center gap-3 text-sm text-gray-500 py-14">
            <div className="w-5 h-5 border-2 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            Loading users…
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center px-5 text-center py-14">
            <p className="text-sm font-medium text-gray-700">Couldn&apos;t load users</p>
            <p className="mt-1 text-xs text-red-600">{loadError}</p>
            <button type="button" onClick={load} className={`${secondaryButtonClass} mt-4`}>Try Again</button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-px bg-gray-200 border-b border-gray-200">
              {roles.map((role) => (
                <div key={role.value} className="flex-1 min-w-[8rem] px-4 py-2.5 bg-white">
                  <p className={statLabelClass}>{role.label}</p>
                  <p className="text-sm font-semibold text-gray-900 tabular-nums">{roleCounts[role.value] || 0}</p>
                </div>
              ))}
            </div>
            <ul className="divide-y divide-gray-200">
              {users.map((u) => {
                const isSelf = u.id === currentUser?.id;
                return (
                  <li key={u.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex items-center justify-center w-9 h-9 text-xs font-bold text-blue-700 shrink-0 bg-blue-50">
                      {(u.name || "?").slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {u.name} {isSelf && <span className="ml-1 text-xs font-normal text-gray-500">(you)</span>}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{u.email}</p>
                      <p className={`text-xs truncate ${storesLine(u) ? "text-gray-600" : "text-amber-700"}`}>
                        <FaStore className="inline mr-1 text-[10px]" />
                        {storesLine(u) || "No store yet: can't sell"}
                      </p>
                    </div>
                    <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-semibold text-blue-700 bg-blue-50 whitespace-nowrap">
                      {u.role_label || u.role}
                    </span>
                    <div className="flex shrink-0">
                      {u.role !== "admin" && (
                        <button
                          type="button"
                          onClick={() => setAssigning(u)}
                          className="flex items-center justify-center w-8 h-8 text-gray-500 transition-colors hover:bg-gray-100 hover:text-blue-600"
                          title="Stores"
                          aria-label={`Stores for ${u.name}`}
                        >
                          <FaStore className="text-sm" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setEditing(u)}
                        className="flex items-center justify-center w-8 h-8 text-gray-500 transition-colors hover:bg-gray-100 hover:text-blue-600"
                        title="Edit user"
                        aria-label={`Edit ${u.name}`}
                      >
                        <FaEdit className="text-sm" />
                      </button>
                      {!isSelf && (
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError("");
                            setToDelete(u);
                          }}
                          className="flex items-center justify-center w-8 h-8 text-gray-500 transition-colors hover:bg-gray-100 hover:text-red-600"
                          title="Delete user"
                          aria-label={`Delete ${u.name}`}
                        >
                          <FaTrash className="text-sm" />
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Panel>

      {roles.length > 0 && <RoleGuide roles={roles} permissionLabels={permissionLabels} />}

      {assigning && <StoresModal user={assigning} onClose={() => setAssigning(null)} onSaved={handleStoresSaved} />}
      {bulkAssigning && <BulkStoresModal users={users} roles={roles} onClose={() => setBulkAssigning(false)} onSaved={handleBulkSaved} />}

      {editing !== undefined && (
        <UserFormModal
          user={editing}
          roles={roles}
          isSelf={Boolean(editing) && editing.id === currentUser?.id}
          onClose={() => setEditing(undefined)}
          onSaved={handleSaved}
        />
      )}

      {toDelete && (
        <ModalShell
          title="Delete User"
          subtitle="This can't be undone"
          icon={FaTrash}
          iconClass="bg-red-600"
          onClose={() => !deleting && setToDelete(null)}
          busy={deleting}
          maxWidth="max-w-md"
        >
          <div className="px-6 py-5 space-y-4">
            {deleteError && (
              <div role="alert" className="flex items-start gap-3 px-4 py-3 text-sm text-red-800 border border-red-200 bg-red-50">
                <FaExclamationTriangle className="mt-0.5 shrink-0 text-red-600" />
                <span>{deleteError}</span>
              </div>
            )}
            <p className="text-sm text-gray-600">
              Delete <span className="font-semibold text-gray-900">{toDelete.name}</span>? They are signed out at
              once and can&apos;t log in again. If they still work here in another job, change their role instead.
            </p>
          </div>
          <ModalFooter>
            <button type="button" onClick={() => setToDelete(null)} disabled={deleting} className={secondaryButtonClass}>Cancel</button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={deleting}
              className="flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-none transition-colors hover:bg-red-700 disabled:opacity-60"
            >
              {deleting ? <Spinner /> : <FaTrash className="mr-2 text-xs" />}
              {deleting ? "Deleting…" : "Delete User"}
            </button>
          </ModalFooter>
        </ModalShell>
      )}
    </>
  );
}
