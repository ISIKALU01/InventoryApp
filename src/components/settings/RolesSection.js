// Settings > Roles & permissions (admins only): tick what each role may do.
//
// Edits stay on screen until "Save changes". Giving a role a sensitive
// permission (money or stock records) asks for confirmation first. The
// backend refuses to edit the admin role or give anyone "manage users", and
// records every change, which the history panel lists.
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { FaExclamationTriangle, FaHistory, FaLock, FaSave, FaUndo, FaUserShield } from "react-icons/fa";
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
                      {role.users_count} user{role.users_count === 1 ? "" : "s"}
                    </span>
                    {role.editable ? (
                      <button
                        type="button"
                        onClick={() => setToReset(role)}
                        disabled={saving || sameSet(role.permissions, role.default_permissions)}
                        className="mt-1 text-[11px] font-medium text-blue-600 hover:underline disabled:text-gray-300 disabled:no-underline"
                        title={`Reset ${role.label} to its default permissions`}
                      >
                        Reset to default
                      </button>
                    ) : (
                      <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-gray-400">
                        <FaLock className="text-[9px]" /> Always all
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

      <Panel title="Change history" description="The latest 50 changes to role permissions" bodyClass="">
        {changes.length === 0 ? (
          <p className="px-5 py-6 text-sm text-gray-500">No changes yet. Every role still has its default permissions.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {changes.map((change) => (
              <li key={change.id} className="flex gap-3 px-5 py-3">
                <FaHistory className="mt-1 text-gray-400 shrink-0" />
                <div className="min-w-0 text-sm">
                  <p className="text-gray-900">
                    <span className="font-semibold">{change.changed_by?.name || "A deleted user"}</span> changed{" "}
                    <span className="font-semibold">{change.role_label}</span>
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
    </>
  );
}
