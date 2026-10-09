// Settings > Roles & permissions (admins only): tick what each role may do.
//
// Edits stay on screen until "Save changes". Giving a role a sensitive
// permission (money or stock records) asks for confirmation first. The
// backend refuses to edit the admin role or give anyone "manage users", and
// records every change, which the history panel lists.
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  FaEdit,
  FaExclamationTriangle,
  FaHistory,
  FaLock,
  FaPlus,
  FaSave,
  FaTrash,
  FaUndo,
  FaUserShield,
} from "react-icons/fa";
import http from "../../../services/http";
import { ModalFooter, ModalShell, Panel, Spinner, secondaryButtonClass } from "./ui";

const primaryButtonClass =
  "flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-none transition-colors hover:bg-blue-700 disabled:opacity-50";

const messageFrom = (error, fallback) => {
  if (error.response?.status === 403) return "Only admins can change roles.";
  const errors = error.response?.data?.errors;
  const first = errors && Object.values(errors)[0]?.[0];
  return first || error.response?.data?.message || fallback;
};

const sameSet = (a, b) => a.length === b.length && a.every((item) => b.includes(item));

const HISTORY_VERB = {
  created: "created",
  updated: "changed",
  renamed: "renamed",
  deleted: "deleted",
};

const fieldClass = (hasError) =>
  `block w-full px-3 py-2.5 text-sm text-gray-800 bg-white border rounded-none outline-none transition-colors placeholder:text-gray-400 disabled:opacity-50 disabled:bg-gray-50 ${
    hasError
      ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
      : "border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
  }`;

const labelClass = "block mb-1.5 text-xs font-semibold tracking-wide text-gray-600 uppercase";

// Create a custom role (role = null) or rename one (role = the custom role)
const RoleFormModal = ({ role, roles, catalog, onClose, onSaved }) => {
  const isEdit = Boolean(role);
  const [label, setLabel] = useState(role?.label || "");
  const [description, setDescription] = useState(role?.description || "");
  const [startFrom, setStartFrom] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  // Copying admin means "everything except what only admins may hold"
  const startingPermissions = () => {
    if (!startFrom) return [];
    const source = roles.find((r) => r.value === startFrom);
    const locked = catalog.filter((p) => p.locked).map((p) => p.name);
    return (source?.permissions || []).filter((p) => !locked.includes(p));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = label.trim().replace(/\s+/g, " ");
    if (!name) {
      setErrors({ label: "Give the role a name." });
      return;
    }

    setBusy(true);
    setErrors({});
    setFormError("");
    try {
      const payload = { label: name, description: description.trim() || null };
      const { data } = isEdit
        ? await http.put(`/roles/${role.value}`, payload)
        : await http.post("/roles", { ...payload, permissions: startingPermissions() });
      onSaved(data, isEdit);
    } catch (error) {
      const fieldErrors = Object.fromEntries(
        Object.entries(error.response?.data?.errors || {}).map(([field, messages]) => [field, messages[0]])
      );
      setErrors(fieldErrors);
      if (!fieldErrors.label && !fieldErrors.description) {
        setFormError(messageFrom(error, isEdit ? "Could not rename this role." : "Could not create this role."));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell
      title={isEdit ? "Rename Role" : "Add Role"}
      subtitle={isEdit ? "Its users and permissions stay the same" : "Then tick what it may do in the grid"}
      icon={isEdit ? FaEdit : FaPlus}
      onClose={onClose}
      busy={busy}
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="px-6 py-6 space-y-5">
          {formError && (
            <div role="alert" className="flex items-start gap-3 px-4 py-3 text-sm text-red-800 border border-red-200 bg-red-50">
              <FaExclamationTriangle className="mt-0.5 shrink-0 text-red-600" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label htmlFor="role-label" className={labelClass}>Name</label>
            <input
              id="role-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={50}
              autoFocus
              disabled={busy}
              className={fieldClass(errors.label)}
              placeholder="Branch supervisor"
            />
            {errors.label && <p className="mt-1 text-xs text-red-600">{errors.label}</p>}
          </div>

          <div>
            <label htmlFor="role-description" className={labelClass}>
              Description <span className="font-normal text-gray-400 normal-case">(optional)</span>
            </label>
            <input
              id="role-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={255}
              disabled={busy}
              className={fieldClass(errors.description)}
              placeholder="What this person does"
            />
            {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
          </div>

          {!isEdit && (
            <div>
              <label htmlFor="role-start" className={labelClass}>Start with</label>
              <select
                id="role-start"
                value={startFrom}
                onChange={(e) => setStartFrom(e.target.value)}
                disabled={busy}
                className={fieldClass(false)}
              >
                <option value="">No permissions</option>
                {roles.map((r) => (
                  <option key={r.value} value={r.value}>Same as {r.label}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {startFrom === "admin"
                  ? "Everything except managing users, which stays with admins."
                  : "You can change every tick afterwards."}
              </p>
            </div>
          )}
        </div>

        <ModalFooter>
          <button type="button" onClick={onClose} disabled={busy} className={secondaryButtonClass}>Cancel</button>
          <button type="submit" disabled={busy} className={primaryButtonClass}>
            {busy ? <Spinner /> : <FaSave className="mr-2" />}
            {busy ? "Saving…" : isEdit ? "Save Name" : "Create Role"}
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  );
};

const formatWhen = (iso) =>
  new Date(iso).toLocaleString([], { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

export default function RolesSection({ notify }) {
  const [roles, setRoles] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [draft, setDraft] = useState({}); // role value -> permissions shown on screen
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmGrants, setConfirmGrants] = useState(null); // sensitive grants waiting for "Yes"
  const [toReset, setToReset] = useState(null);
  const [roleForm, setRoleForm] = useState(undefined); // undefined: closed, null: new role, object: rename
  const [toDelete, setToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  const labelOf = useMemo(() => Object.fromEntries(catalog.map((p) => [p.name, p.label])), [catalog]);

  const loadChanges = useCallback(async () => {
    try {
      const { data } = await http.get("/roles/changes");
      setChanges(data?.data || []);
    } catch {
      // History is extra information; the grid still works without it
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const { data } = await http.get("/roles");
      const loadedRoles = data?.data || [];
      setRoles(loadedRoles);
      setCatalog(data?.permissions || []);
      setDraft(Object.fromEntries(loadedRoles.map((role) => [role.value, role.permissions])));
    } catch (error) {
      setLoadError(messageFrom(error, "Could not load roles."));
    } finally {
      setLoading(false);
    }
    loadChanges();
  }, [loadChanges]);

  useEffect(() => {
    load();
  }, [load]);

  const groups = useMemo(() => {
    const byGroup = [];
    catalog.forEach((permission) => {
      const last = byGroup[byGroup.length - 1];
      if (last && last.name === permission.group) last.items.push(permission);
      else byGroup.push({ name: permission.group, items: [permission] });
    });
    return byGroup;
  }, [catalog]);

  const editableRoles = roles.filter((role) => role.editable);
  const changedRoles = editableRoles.filter((role) => !sameSet(draft[role.value] || [], role.permissions));
  const changeCount = changedRoles.reduce((total, role) => {
    const now = draft[role.value] || [];
    const added = now.filter((p) => !role.permissions.includes(p)).length;
    const removed = role.permissions.filter((p) => !now.includes(p)).length;
    return total + added + removed;
  }, 0);

  const toggle = (roleValue, permission) => {
    setDraft((prev) => {
      const current = prev[roleValue] || [];
      const next = current.includes(permission) ? current.filter((p) => p !== permission) : [...current, permission];
      return { ...prev, [roleValue]: next };
    });
  };

  const discard = () => setDraft(Object.fromEntries(roles.map((role) => [role.value, role.permissions])));

  // Sensitive permissions being given that the role doesn't have yet
  const pendingSensitiveGrants = () =>
    changedRoles.flatMap((role) =>
      (draft[role.value] || [])
        .filter((p) => !role.permissions.includes(p) && catalog.find((c) => c.name === p)?.sensitive)
        .map((p) => ({ role: role.label, permission: labelOf[p] || p }))
    );

  const replaceRole = (updated) =>
    setRoles((prev) => prev.map((role) => (role.value === updated.value ? { ...role, ...updated } : role)));

  const save = async () => {
    setConfirmGrants(null);
    setSaving(true);
    const saved = [];
    try {
      for (const role of changedRoles) {
        const { data } = await http.put(`/roles/${role.value}`, { permissions: draft[role.value] });
        replaceRole(data);
        setDraft((prev) => ({ ...prev, [data.value]: data.permissions }));
        saved.push(role.label);
      }
      notify("success", `Saved for ${saved.join(", ")}. Their users get the change on their next action.`, "Permissions updated");
    } catch (error) {
      const done = saved.length ? ` Saved so far: ${saved.join(", ")}.` : "";
      notify("error", messageFrom(error, "Could not save the changes.") + done, "Not all changes saved");
    } finally {
      setSaving(false);
      loadChanges();
    }
  };

  const requestSave = () => {
    const grants = pendingSensitiveGrants();
    if (grants.length) setConfirmGrants(grants);
    else save();
  };

  const confirmReset = async () => {
    const role = toReset;
    setSaving(true);
    try {
      const { data } = await http.post(`/roles/${role.value}/reset`);
      replaceRole(data);
      setDraft((prev) => ({ ...prev, [data.value]: data.permissions }));
      notify("success", `${role.label} is back to its default permissions.`, "Role reset");
      setToReset(null);
    } catch (error) {
      notify("error", messageFrom(error, "Could not reset this role."), "Role not reset");
    } finally {
      setSaving(false);
      loadChanges();
    }
  };

  const handleRoleSaved = (saved, isEdit) => {
    if (isEdit) {
      replaceRole(saved);
    } else {
      setRoles((prev) => [...prev, saved]);
      setDraft((prev) => ({ ...prev, [saved.value]: saved.permissions }));
    }
    setRoleForm(undefined);
    notify(
      "success",
      isEdit ? `The role is now called ${saved.label}.` : `${saved.label} is ready. Tick what it may do, then save.`,
      isEdit ? "Role renamed" : "Role created"
    );
    loadChanges();
  };

  const openDelete = (role) => {
    setDeleteError("");
    setToDelete(role);
  };

  const confirmDelete = async () => {
    const role = toDelete;
    setSaving(true);
    setDeleteError("");
    try {
      await http.delete(`/roles/${role.value}`);
      setRoles((prev) => prev.filter((r) => r.value !== role.value));
      setDraft((prev) => {
        const next = { ...prev };
        delete next[role.value];
        return next;
      });
      setToDelete(null);
      notify("success", `${role.label} was deleted.`, "Role deleted");
      loadChanges();
    } catch (error) {
      setDeleteError(messageFrom(error, "Could not delete this role."));
    } finally {
      setSaving(false);
    }
  };

  const addRoleButton = (
    <button
      type="button"
      onClick={() => setRoleForm(null)}
      disabled={saving}
      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white transition-colors bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
    >
      <FaPlus className="text-[11px]" />
      Add Role
    </button>
  );

  if (loading) {
    return (
      <Panel title="Roles & permissions" description="Loading…">
        <div className="flex items-center justify-center gap-3 text-sm text-gray-500 py-10">
          <div className="w-5 h-5 border-2 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          Loading roles…
        </div>
      </Panel>
    );
  }

  if (loadError) {
    return (
      <Panel title="Roles & permissions">
        <div className="flex flex-col items-center py-10 text-center">
          <p className="text-sm font-medium text-gray-700">Couldn&apos;t load roles</p>
          <p className="mt-1 text-xs text-red-600">{loadError}</p>
          <button type="button" onClick={load} className={`${secondaryButtonClass} mt-4`}>Try Again</button>
        </div>
      </Panel>
    );
  }

  return (
    <>
      <Panel
        title="Roles & permissions"
        description="Tick what each role may do. Admin always has everything. Changes apply to everyone with that role on their next action."
        action={addRoleButton}
        bodyClass=""
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th scope="col" className="sticky left-0 z-10 min-w-[16rem] px-4 py-3 text-left bg-gray-50 border-b border-gray-200">
                  <span className="text-[10px] font-semibold tracking-wide text-gray-500 uppercase">Permission</span>
                </th>
                {roles.map((role) => (
                  <th key={role.value} scope="col" className="px-3 py-3 text-center align-bottom border-b border-gray-200 min-w-[7.5rem]">
                    <span className="block text-xs font-semibold text-gray-900">{role.label}</span>
                    <span className="block text-[11px] font-normal text-gray-500">
                      {role.system ? "" : "Custom · "}
                      {role.users_count} user{role.users_count === 1 ? "" : "s"}
                    </span>
                    {!role.editable ? (
                      <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-gray-400">
                        <FaLock className="text-[9px]" /> Always all
                      </span>
                    ) : role.system ? (
                      <button
                        type="button"
                        onClick={() => setToReset(role)}
                        disabled={saving || sameSet(role.permissions, role.default_permissions || [])}
                        className="mt-1 text-[11px] font-medium text-blue-600 hover:underline disabled:text-gray-300 disabled:no-underline"
                        title={`Reset ${role.label} to its default permissions`}
                      >
                        Reset to default
                      </button>
                    ) : (
                      <span className="mt-1 inline-flex justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setRoleForm(role)}
                          disabled={saving}
                          className="flex items-center justify-center w-7 h-7 text-gray-500 hover:bg-gray-100 hover:text-blue-600 disabled:opacity-40"
                          title={`Rename ${role.label}`}
                          aria-label={`Rename ${role.label}`}
                        >
                          <FaEdit className="text-xs" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDelete(role)}
                          disabled={saving}
                          className="flex items-center justify-center w-7 h-7 text-gray-500 hover:bg-gray-100 hover:text-red-600 disabled:opacity-40"
                          title={`Delete ${role.label}`}
                          aria-label={`Delete ${role.label}`}
                        >
                          <FaTrash className="text-xs" />
                        </button>
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <Fragment key={group.name}>
                  <tr>
                    <th
                      scope="colgroup"
                      colSpan={roles.length + 1}
                      className="sticky left-0 px-4 pt-4 pb-1.5 text-left text-[10px] font-semibold tracking-wide text-gray-500 uppercase bg-white"
                    >
                      {group.name}
                    </th>
                  </tr>
                  {group.items.map((permission) => (
                    <tr key={permission.name} className="border-t border-gray-100 hover:bg-gray-50/60">
                      <th scope="row" className="sticky left-0 z-10 px-4 py-2 font-normal text-left text-gray-800 bg-white">
                        <span>{permission.label}</span>
                        {permission.locked && (
                          <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-px text-[10px] font-semibold text-gray-600 bg-gray-100">
                            <FaLock className="text-[8px]" /> Admin only
                          </span>
                        )}
                        {permission.sensitive && !permission.locked && (
                          <span className="ml-2 px-1.5 py-px text-[10px] font-semibold text-amber-700 bg-amber-50">Sensitive</span>
                        )}
                      </th>
                      {roles.map((role) => {
                        const checked = !role.editable || (draft[role.value] || []).includes(permission.name);
                        const disabled = !role.editable || permission.locked || saving;
                        const changed = role.editable && checked !== role.permissions.includes(permission.name);
                        return (
                          <td key={role.value} className={`px-3 py-2 text-center ${changed ? "bg-blue-50" : ""}`}>
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={disabled}
                              onChange={() => toggle(role.value, permission.name)}
                              aria-label={`${role.label}: ${permission.label}`}
                              className="w-4 h-4 accent-blue-600 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-white border-t border-gray-200">
          <p className="text-sm text-gray-600" role="status">
            {changeCount === 0
              ? "No unsaved changes"
              : `${changeCount} unsaved change${changeCount === 1 ? "" : "s"} for ${changedRoles.map((r) => r.label).join(", ")}`}
          </p>
          <div className="flex gap-3">
            <button type="button" onClick={discard} disabled={saving || changeCount === 0} className={secondaryButtonClass}>
              Discard
            </button>
            <button type="button" onClick={requestSave} disabled={saving || changeCount === 0} className={primaryButtonClass}>
              {saving ? <Spinner /> : <FaSave className="mr-2" />}
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </Panel>

      <Panel title="Change history" description="The latest 50 changes to roles" bodyClass="">
        {changes.length === 0 ? (
          <p className="px-5 py-6 text-sm text-gray-500">No changes yet. Every role still has its default permissions.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {changes.map((change) => (
              <li key={change.id} className="flex gap-3 px-5 py-3">
                <FaHistory className="mt-1 text-gray-400 shrink-0" />
                <div className="min-w-0 text-sm">
                  <p className="text-gray-900">
                    <span className="font-semibold">{change.changed_by?.name || "A deleted user"}</span>{" "}
                    {HISTORY_VERB[change.action] || "changed"}{" "}
                    <span className="font-semibold">
                      {change.action === "renamed" ? change.details?.from?.label || change.role_label : change.role_label}
                    </span>
                    {change.action === "renamed" && change.details?.to?.label !== change.details?.from?.label && (
                      <>
                        {" "}to <span className="font-semibold">{change.details?.to?.label}</span>
                      </>
                    )}
                    <span className="ml-2 text-xs text-gray-500">{formatWhen(change.created_at)}</span>
                  </p>
                  {change.added.length > 0 && (
                    <p className="text-xs text-green-700">Gave: {change.added.map((p) => labelOf[p] || p).join("; ")}</p>
                  )}
                  {change.removed.length > 0 && (
                    <p className="text-xs text-red-700">Took away: {change.removed.map((p) => labelOf[p] || p).join("; ")}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {confirmGrants && (
        <ModalShell
          title="Give sensitive permissions?"
          subtitle="These touch money or stock records"
          icon={FaExclamationTriangle}
          iconClass="bg-amber-500"
          onClose={() => setConfirmGrants(null)}
          busy={saving}
        >
          <div className="px-6 py-5 space-y-3 text-sm text-gray-700">
            <p>You are about to give:</p>
            <ul className="space-y-1">
              {confirmGrants.map((grant) => (
                <li key={`${grant.role}-${grant.permission}`}>
                  <span className="font-semibold">{grant.role}</span>: {grant.permission}
                </li>
              ))}
            </ul>
            <p className="text-xs text-gray-500">Everyone with these roles can do this from their next action.</p>
          </div>
          <ModalFooter>
            <button type="button" onClick={() => setConfirmGrants(null)} className={secondaryButtonClass}>Go back</button>
            <button type="button" onClick={save} className={primaryButtonClass}>
              <FaUserShield className="mr-2" />
              Yes, save changes
            </button>
          </ModalFooter>
        </ModalShell>
      )}

      {toReset && (
        <ModalShell
          title={`Reset ${toReset.label}?`}
          subtitle="Back to the permissions it started with"
          icon={FaUndo}
          onClose={() => !saving && setToReset(null)}
          busy={saving}
          maxWidth="max-w-md"
        >
          <div className="px-6 py-5 text-sm text-gray-700">
            Every change made to this role is undone. Its {toReset.users_count} user
            {toReset.users_count === 1 ? "" : "s"} get the default permissions on their next action.
            {changedRoles.some((role) => role.value === toReset.value) && (
              <p className="mt-2 text-xs text-amber-700">Your unsaved ticks for this role are discarded too.</p>
            )}
          </div>
          <ModalFooter>
            <button type="button" onClick={() => setToReset(null)} disabled={saving} className={secondaryButtonClass}>Cancel</button>
            <button type="button" onClick={confirmReset} disabled={saving} className={primaryButtonClass}>
              {saving ? <Spinner /> : <FaUndo className="mr-2" />}
              {saving ? "Resetting…" : "Reset role"}
            </button>
          </ModalFooter>
        </ModalShell>
      )}
      {roleForm !== undefined && (
        <RoleFormModal
          role={roleForm}
          roles={roles}
          catalog={catalog}
          onClose={() => setRoleForm(undefined)}
          onSaved={handleRoleSaved}
        />
      )}

      {toDelete && (
        <ModalShell
          title={`Delete ${toDelete.label}?`}
          subtitle="This can't be undone"
          icon={FaTrash}
          iconClass="bg-red-600"
          onClose={() => !saving && setToDelete(null)}
          busy={saving}
          maxWidth="max-w-md"
        >
          <div className="px-6 py-5 space-y-3 text-sm text-gray-700">
            {deleteError && (
              <div role="alert" className="flex items-start gap-3 px-4 py-3 text-red-800 border border-red-200 bg-red-50">
                <FaExclamationTriangle className="mt-0.5 shrink-0 text-red-600" />
                <span>{deleteError}</span>
              </div>
            )}
            {toDelete.users_count > 0 ? (
              <p>
                {toDelete.users_count} user{toDelete.users_count === 1 ? " still has" : "s still have"} this role. Give
                them another role in Settings &gt; Users first, then delete it.
              </p>
            ) : (
              <p>Nobody has this role, so deleting it changes no one&apos;s access. The history keeps a record of it.</p>
            )}
          </div>
          <ModalFooter>
            <button type="button" onClick={() => setToDelete(null)} disabled={saving} className={secondaryButtonClass}>
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={saving || toDelete.users_count > 0}
              className="flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-none transition-colors hover:bg-red-700 disabled:opacity-60"
            >
              {saving ? <Spinner /> : <FaTrash className="mr-2 text-xs" />}
              {saving ? "Deleting…" : "Delete Role"}
            </button>
          </ModalFooter>
        </ModalShell>
      )}
    </>
  );
}
