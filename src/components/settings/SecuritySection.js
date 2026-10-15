// Settings > Security: who is signed in and what they may do, automatic
// sign-out on this device, signing out, and (for admins) changing their own
// password or ending every session. Staff passwords are reset by an admin in
// Settings > Users; the backend has no self-service password change.
import { useEffect, useMemo, useState } from "react";
import {
  FaClock,
  FaDesktop,
  FaExclamationTriangle,
  FaKey,
  FaSignOutAlt,
  FaUserCircle,
} from "react-icons/fa";
import http from "../../../services/http";
import { useAuth } from "../../context/AuthContext";
import { IDLE_EVENT, IDLE_OPTIONS, loadIdleMinutes, saveIdleMinutes } from "../../../utils/idleSignOut";
import { ModalFooter, ModalShell, Panel, Spinner, secondaryButtonClass, statLabelClass } from "./ui";

const primaryButtonClass =
  "flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-none transition-colors hover:bg-blue-700 disabled:opacity-50";

const dangerButtonClass =
  "flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-none transition-colors hover:bg-red-700 disabled:opacity-60";

const labelClass = "block mb-1.5 text-xs font-semibold tracking-wide text-gray-600 uppercase";

const fieldClass = (hasError) =>
  `w-full px-3 py-2.5 text-sm border rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 ${
    hasError ? "border-red-400" : "border-gray-300"
  }`;

const messageFrom = (error, fallback) => {
  const errors = error.response?.data?.errors;
  const first = errors && Object.values(errors)[0]?.[0];
  return first || error.response?.data?.message || fallback;
};

// "purchase-orders.view" -> group "Purchase orders", action "view"
const humanize = (text) => {
  const words = String(text).replace(/[-_]/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
};

const groupPermissions = (permissions) => {
  const groups = {};
  permissions.forEach((permission) => {
    const [area, ...rest] = String(permission).split(".");
    (groups[area] ||= []).push(rest.join(".") || area);
  });
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([area, actions]) => ({ area: humanize(area), actions: actions.map(humanize).sort() }));
};

// A rough strength guide; the backend sets the actual rules
const strengthOf = (password) => {
  if (!password) return null;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (score <= 2) return { label: "Weak", width: "w-1/3", color: "bg-red-500" };
  if (score <= 3) return { label: "Fair", width: "w-2/3", color: "bg-amber-500" };
  return { label: "Strong", width: "w-full", color: "bg-green-600" };
};

// ---------------------------------------------------------------------------
// Change password (admins, through the users endpoint)
// ---------------------------------------------------------------------------

const ChangePasswordModal = ({ user, onClose, onChanged }) => {
  const [form, setForm] = useState({ password: "", password_confirmation: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const strength = strengthOf(form.password);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "", form: "" }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (form.password.length < 8) next.password = "Password must be at least 8 characters.";
    else if (form.password !== form.password_confirmation) next.password_confirmation = "Passwords don't match.";
    if (Object.keys(next).length) return setErrors(next);

    setSaving(true);
    try {
      await http.put(`/users/${user.id}`, {
        name: user.name,
        email: user.email,
        role: user.role,
        password: form.password,
        password_confirmation: form.password_confirmation,
      });
      onChanged();
    } catch (err) {
      console.error("Error changing password:", err);
      setErrors({ form: messageFrom(err, "Could not change your password.") });
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title="Change Password"
      subtitle={user.email}
      icon={FaKey}
      onClose={() => !saving && onClose()}
      busy={saving}
      maxWidth="max-w-md"
    >
      <form onSubmit={submit}>
        <div className="px-6 py-5 space-y-4">
          {errors.form && (
            <div role="alert" className="flex items-start gap-3 px-4 py-3 text-sm text-red-800 border border-red-200 bg-red-50">
              <FaExclamationTriangle className="mt-0.5 shrink-0 text-red-600" />
              <p>{errors.form}</p>
            </div>
          )}
          <div>
            <label htmlFor="new-password" className={labelClass}>New password</label>
            <input
              id="new-password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              disabled={saving}
              autoComplete="new-password"
              autoFocus
              placeholder="At least 8 characters"
              className={fieldClass(errors.password)}
            />
            {strength && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1 bg-gray-200">
                  <div className={`h-1 ${strength.width} ${strength.color}`} />
                </div>
                <span className="text-[11px] text-gray-500 w-12 text-right">{strength.label}</span>
              </div>
            )}
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
          </div>
          <div>
            <label htmlFor="confirm-password" className={labelClass}>Confirm password</label>
            <input
              id="confirm-password"
              name="password_confirmation"
              type="password"
              value={form.password_confirmation}
              onChange={handleChange}
              disabled={saving}
              autoComplete="new-password"
              className={fieldClass(errors.password_confirmation)}
            />
            {errors.password_confirmation && (
              <p className="mt-1 text-xs text-red-600">{errors.password_confirmation}</p>
            )}
          </div>
          <p className="px-3 py-2 text-xs border text-amber-900 border-amber-300 bg-amber-50">
            Saving signs you out of every device, this one included. Log in again with the new password.
          </p>
        </div>
        <ModalFooter>
          <button type="button" onClick={onClose} disabled={saving} className={secondaryButtonClass}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className={primaryButtonClass}>
            {saving ? <Spinner /> : <FaKey className="mr-2 text-xs" />}
            {saving ? "Saving…" : "Change Password"}
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  );
};

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

export default function SecuritySection({ notify }) {
  const { user, can, logout } = useAuth();
  const isAdmin = can("users.manage");
  const [idleMinutes, setIdleMinutes] = useState(0);
  const [changingPassword, setChangingPassword] = useState(false);
  const [confirmEverywhere, setConfirmEverywhere] = useState(false);
  const [endingSessions, setEndingSessions] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const [showPermissions, setShowPermissions] = useState(false);

  useEffect(() => {
    setIdleMinutes(loadIdleMinutes());
    const onChange = (e) => setIdleMinutes(e.detail);
    window.addEventListener(IDLE_EVENT, onChange);
    return () => window.removeEventListener(IDLE_EVENT, onChange);
  }, []);

  const permissions = useMemo(() => (Array.isArray(user?.permissions) ? user.permissions : []), [user]);
  const groups = useMemo(() => groupPermissions(permissions), [permissions]);

  const changeIdle = (minutes) => {
    setIdleMinutes(saveIdleMinutes(minutes));
    const option = IDLE_OPTIONS.find((o) => o.minutes === minutes);
    notify(
      "success",
      minutes ? `This device signs out after ${option.label} without activity.` : "This device stays signed in until you sign out.",
      "Automatic sign-out updated"
    );
  };

  // Ends every token the user has, including this one
  const signOutEverywhere = async () => {
    setEndingSessions(true);
    setSessionError("");
    try {
      await http.post(`/staff/${user.id}/logout`, {});
      logout();
    } catch (err) {
      console.error("Error ending sessions:", err);
      setSessionError(messageFrom(err, "Could not sign out of every device."));
      setEndingSessions(false);
    }
  };

  if (!user) {
    return (
      <Panel title="Security" description="Security and privacy">
        <p className="py-6 text-sm text-center text-gray-500">Loading your account…</p>
      </Panel>
    );
  }

  return (
    <>
      <Panel title="Your Account" description="Who is signed in on this device">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-12 h-12 text-xl text-blue-600 shrink-0 bg-blue-50">
            <FaUserCircle />
          </div>
          <div className="grid flex-1 min-w-0 gap-4 sm:grid-cols-3">
            <div className="min-w-0">
              <p className={statLabelClass}>Name</p>
              <p className="mt-0.5 text-sm font-medium text-gray-900 truncate">{user.name || "—"}</p>
            </div>
            <div className="min-w-0">
              <p className={statLabelClass}>Email</p>
              <p className="mt-0.5 text-sm text-gray-900 truncate" title={user.email}>{user.email || "—"}</p>
            </div>
            <div className="min-w-0">
              <p className={statLabelClass}>Role</p>
              <p className="mt-0.5 text-sm text-gray-900 truncate">{user.role_label || humanize(user.role || "—")}</p>
            </div>
          </div>
        </div>

        <div className="pt-4 mt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => setShowPermissions((v) => !v)}
            aria-expanded={showPermissions}
            className="text-xs font-medium text-blue-700 hover:underline"
          >
            {showPermissions ? "Hide" : "Show"} what you can do ({permissions.length} permission
            {permissions.length === 1 ? "" : "s"})
          </button>
          {showPermissions && (
            <div className="grid gap-px mt-3 bg-gray-200 border border-gray-200 sm:grid-cols-2">
              {groups.length === 0 ? (
                <p className="px-3 py-2 text-xs text-gray-500 bg-white sm:col-span-2">No permissions on this account.</p>
              ) : (
                groups.map((group) => (
                  <div key={group.area} className="px-3 py-2 bg-white">
                    <p className="text-xs font-semibold text-gray-800">{group.area}</p>
                    <p className="text-xs text-gray-500">{group.actions.join(" · ")}</p>
                  </div>
                ))
              )}
            </div>
          )}
          <p className="mt-2 text-[11px] text-gray-500">Permissions come from your role. An admin changes them in Roles &amp; permissions.</p>
        </div>
      </Panel>

      <Panel title="Password" description="The password you log in with">
        {isAdmin ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-600">Use at least 8 characters. A longer phrase is harder to guess.</p>
            <button type="button" onClick={() => setChangingPassword(true)} className={secondaryButtonClass}>
              <FaKey className="text-xs" />
              Change Password
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-600">
            To change your password, ask an admin to reset it in Settings › Users. You&apos;ll be signed out and can
            log in with the new one.
          </p>
        )}
      </Panel>

      <Panel title="Automatic Sign-out" description="Protect this device when it's left unattended">
        <div className="flex items-start gap-3">
          <FaClock className="mt-1 text-gray-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-600">
              Sign out after this long without any activity. You get a minute&apos;s warning first. The setting is
              for this device only, so a shared till can sign out sooner than a private computer.
            </p>
            <div role="radiogroup" aria-label="Sign out after" className="grid grid-cols-3 gap-2 mt-3 sm:grid-cols-6">
              {IDLE_OPTIONS.map((option) => {
                const selected = idleMinutes === option.minutes;
                return (
                  <button
                    key={option.minutes}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => !selected && changeIdle(option.minutes)}
                    className={`px-2 py-2 text-xs font-medium border transition-colors ${
                      selected
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="Sessions" description="Where you are signed in">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <FaDesktop className="mt-1 text-gray-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">This device</p>
                <p className="text-xs text-gray-500">Ends your session here and returns to the login page.</p>
              </div>
            </div>
            <button type="button" onClick={() => logout()} className={secondaryButtonClass}>
              <FaSignOutAlt className="text-xs" />
              Sign Out
            </button>
          </div>

          {isAdmin && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
              <div className="flex items-start gap-3">
                <FaSignOutAlt className="mt-1 text-red-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Every device</p>
                  <p className="text-xs text-gray-500">
                    Use this if you logged in on a shared computer or think someone else knows your password.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSessionError("");
                  setConfirmEverywhere(true);
                }}
                className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-red-700 bg-white border border-red-300 transition-colors hover:bg-red-50"
              >
                Sign Out Everywhere
              </button>
            </div>
          )}
        </div>
      </Panel>

      {changingPassword && (
        <ChangePasswordModal
          user={user}
          onClose={() => setChangingPassword(false)}
          onChanged={() => {
            notify("success", "Log in again with your new password.", "Password changed");
            logout();
          }}
        />
      )}

      {confirmEverywhere && (
        <ModalShell
          title="Sign Out Everywhere"
          subtitle="Ends every session on your account"
          icon={FaSignOutAlt}
          iconClass="bg-red-600"
          onClose={() => !endingSessions && setConfirmEverywhere(false)}
          busy={endingSessions}
          maxWidth="max-w-md"
        >
          <div className="px-6 py-5 space-y-4">
            {sessionError && (
              <div role="alert" className="flex items-start gap-3 px-4 py-3 text-sm text-red-800 border border-red-200 bg-red-50">
                <FaExclamationTriangle className="mt-0.5 shrink-0 text-red-600" />
                <p>{sessionError}</p>
              </div>
            )}
            <p className="text-sm text-gray-600">
              You&apos;ll be signed out on every computer and phone, including this one. Anything not yet saved will
              be lost.
            </p>
          </div>
          <ModalFooter>
            <button onClick={() => setConfirmEverywhere(false)} disabled={endingSessions} className={secondaryButtonClass}>
              Cancel
            </button>
            <button onClick={signOutEverywhere} disabled={endingSessions} className={dangerButtonClass}>
              {endingSessions ? <Spinner /> : <FaSignOutAlt className="mr-2 text-xs" />}
              {endingSessions ? "Signing out…" : "Sign Out Everywhere"}
            </button>
          </ModalFooter>
        </ModalShell>
      )}
    </>
  );
}
