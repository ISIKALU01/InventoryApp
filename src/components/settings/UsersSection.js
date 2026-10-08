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
    <Panel title="What each role can do" description="Set by the system. Ask your developer to change what a role can do." bodyClass="">
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
    <button
      type="button"
      onClick={() => setEditing(null)}
      disabled={loading || roles.length === 0}
      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white transition-colors bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
    >
      <FaPlus className="text-[11px]" />
      Add User
    </button>
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
                    </div>
                    <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-semibold text-blue-700 bg-blue-50 whitespace-nowrap">
                      {u.role_label || u.role}
                    </span>
                    <div className="flex shrink-0">
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
