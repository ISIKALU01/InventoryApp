// Staff & Roles: a quick look for the admin at who works on the platform, what
// role each person has, whether they are signed in today, and what each role
// can do. Read-only; changes are made in Settings (users, roles) and on
// Authorize users (daily logins).
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronDown, Clock, KeyRound, RefreshCw, Search, ShieldCheck, UserCheck, Users, XCircle } from "lucide-react";
import http from "../../services/http";
import {
  Badge,
  EmptyState,
  LoadingState,
  ModalShell,
  PageTitle,
  PanelHeader,
  StatTiles,
  filterFieldClass,
  formatDay,
  secondaryButtonClass,
  statLabelClass,
  toList,
  toolbarButtonClass,
} from "../components/ui/Boxy";

const isToday = (value) => value && new Date(value).toDateString() === new Date().toDateString();

// Same rules as the backend (User::hasLoginApprovalToday)
const loginStatus = (user) => {
  if (user.role === "admin") return { key: "admin", label: "No approval needed", className: "text-gray-700 bg-gray-100" };
  const approved = user.login_approved_at ? new Date(user.login_approved_at) : null;
  const loggedOutSince = approved && user.logged_out_at && new Date(user.logged_out_at) >= approved;
  if (approved && isToday(approved) && !loggedOutSince) return { key: "approved", label: "Signed in today", className: "text-green-800 bg-green-50" };
  const requested = user.login_requested_at ? new Date(user.login_requested_at) : null;
  if (requested && isToday(requested) && (!approved || approved < requested)) return { key: "waiting", label: "Waiting for approval", className: "text-amber-800 bg-amber-50" };
  return { key: "away", label: "Not signed in today", className: "text-gray-600 bg-gray-100" };
};

// Where someone works: all stores, their stores, or none yet
const storesOf = (user) => {
  if (user.role === "admin" || user.store_access?.all) return "All stores";
  const names = (user.store_access?.stores || []).map((s) => s.name);
  return names.length ? names.join(", ") : null;
};

const initials = (name) =>
  String(name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

// A role's permissions grouped the way Settings shows them
const groupPermissions = (role, catalogue) => {
  const has = new Set(role?.permissions || []);
  const groups = [];
  for (const permission of catalogue) {
    let group = groups.find((g) => g.name === permission.group);
    if (!group) {
      group = { name: permission.group, can: [], cannot: [] };
      groups.push(group);
    }
    (has.has(permission.name) ? group.can : group.cannot).push(permission);
  }
  return groups;
};

const PermissionList = ({ role, catalogue, showMissing }) => {
  const groups = groupPermissions(role, catalogue);
  const total = groups.reduce((n, g) => n + g.can.length, 0);
  if (total === 0) return <p className="text-sm text-gray-500">This role can&apos;t do anything yet. Give it permissions in Settings → Roles &amp; permissions.</p>;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {groups
        .filter((g) => g.can.length > 0 || showMissing)
        .map((group) => (
          <div key={group.name} className="p-3 border border-gray-200">
            <p className={`${statLabelClass} mb-1`}>{group.name}</p>
            <ul className="space-y-1 text-sm">
              {group.can.map((p) => (
                <li key={p.name} className="flex gap-2 text-gray-900">
                  <CheckCircle2 size={14} className="mt-0.5 text-green-600 shrink-0" /> {p.label}
                </li>
              ))}
              {showMissing &&
                group.cannot.map((p) => (
                  <li key={p.name} className="flex gap-2 text-gray-400">
                    <XCircle size={14} className="mt-0.5 shrink-0" /> {p.label}
                  </li>
                ))}
            </ul>
          </div>
        ))}
    </div>
  );
};

const PersonModal = ({ person, role, catalogue, onClose }) => {
  const [showMissing, setShowMissing] = useState(false);
  const status = loginStatus(person);
  return (
    <ModalShell title={person.name} subtitle={person.email} icon={UserCheck} onClose={onClose} maxWidth="max-w-3xl">
      <div className="px-6 py-5 space-y-4 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="text-blue-800 bg-blue-50">{person.role_label || role?.label || person.role}</Badge>
          <Badge className={status.className}>{status.label}</Badge>
          <span className="text-xs text-gray-500">Joined {formatDay(person.created_at)}</span>
          <span className="text-xs text-gray-700">Works at: <span className="font-semibold">{storesOf(person) || "no store yet"}</span></span>
        </div>
        {role?.description && <p className="text-gray-700">{role.description}</p>}
        <div className="flex items-center justify-between">
          <p className={statLabelClass}>What {person.name.split(" ")[0]} can do</p>
          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
            <input type="checkbox" checked={showMissing} onChange={(e) => setShowMissing(e.target.checked)} className="accent-blue-600" />
            Also show what they can&apos;t do
          </label>
        </div>
        <PermissionList role={role} catalogue={catalogue} showMissing={showMissing} />
      </div>
    </ModalShell>
  );
};

export default function StaffAndRoles() {
  const [tab, setTab] = useState("staff");
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [catalogue, setCatalogue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [person, setPerson] = useState(null);
  const [openRole, setOpenRole] = useState(null);
  const [showMissing, setShowMissing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [usersResponse, rolesResponse] = await Promise.all([http.get("/users"), http.get("/roles")]);
      setUsers(toList(usersResponse.data));
      setRoles(toList(rolesResponse.data));
      setCatalogue(rolesResponse.data?.permissions || []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load staff and roles.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const roleOf = (value) => roles.find((r) => r.value === value);

  const staff = useMemo(() => {
    const term = query.trim().toLowerCase();
    return users
      .filter((u) => !term || [u.name, u.email, u.role_label, storesOf(u)].some((v) => String(v || "").toLowerCase().includes(term)))
      .filter((u) => !roleFilter || u.role === roleFilter)
      .filter((u) => !statusFilter || loginStatus(u).key === statusFilter)
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }, [users, query, roleFilter, statusFilter]);

  const counts = useMemo(() => {
    const statuses = users.map((u) => loginStatus(u).key);
    return {
      signedIn: statuses.filter((s) => s === "approved").length,
      waiting: statuses.filter((s) => s === "waiting").length,
      rolesInUse: new Set(users.map((u) => u.role)).size,
    };
  }, [users]);

  const tiles = [
    { icon: Users, iconClass: "text-blue-700 bg-blue-50", label: "Staff", value: users.length },
    { icon: UserCheck, iconClass: "text-green-700 bg-green-50", label: "Signed in today", value: counts.signedIn },
    { icon: Clock, iconClass: "text-amber-700 bg-amber-50", label: "Waiting for approval", value: counts.waiting, hint: counts.waiting ? "Approve on Authorize users" : undefined },
    { icon: ShieldCheck, iconClass: "text-purple-700 bg-purple-50", label: "Roles", value: roles.length, hint: `${counts.rolesInUse} in use` },
  ];

  const tabClass = (key) =>
    `px-4 py-2 text-sm font-semibold border ${tab === key ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`;

  return (
    <div className="pt-0 mt-0 font-raleway">
      <PageTitle title="Staff & Roles" description="Who works on SellaPad, their role, whether they're signed in today, and what each role can do" />

      <div className="mt-5">
        <StatTiles tiles={tiles} loading={loading && users.length === 0} columns="sm:grid-cols-2 lg:grid-cols-4" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mt-5">
        <div className="flex" role="tablist">
          <button type="button" role="tab" aria-selected={tab === "staff"} onClick={() => setTab("staff")} className={tabClass("staff")}>
            Staff ({users.length})
          </button>
          <button type="button" role="tab" aria-selected={tab === "roles"} onClick={() => setTab("roles")} className={`${tabClass("roles")} -ml-px`}>
            Roles ({roles.length})
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/authorizeUser" className={toolbarButtonClass.secondary}><KeyRound size={13} /> Approve logins</Link>
          <Link href={`/settings?section=${tab === "staff" ? "users" : "roles"}`} className={toolbarButtonClass.secondary}>
            {tab === "staff" ? "Add or edit staff" : "Edit roles"}
          </Link>
          <button onClick={load} disabled={loading} className={toolbarButtonClass.secondary}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {loading && users.length === 0 ? (
        <section className="mt-3 bg-white border border-gray-200"><LoadingState label="Loading staff and roles…" /></section>
      ) : error ? (
        <section className="mt-3 bg-white border border-gray-200">
          <EmptyState icon={Users} tone="red" title="Couldn't load staff and roles" hint={error} action={<button onClick={load} className={secondaryButtonClass}>Try again</button>} />
        </section>
      ) : tab === "staff" ? (
        <section className="mt-3 bg-white border border-gray-200">
          <PanelHeader title="Staff" meta={`${staff.length} shown`} />
          <div className="flex flex-wrap gap-3 px-5 py-3 border-b border-gray-200">
            <div className="relative flex-1 min-w-[14rem]">
              <Search size={14} className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name, email, role or store" aria-label="Search staff" className={`${filterFieldClass} w-full pl-8`} />
            </div>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} aria-label="Role" className={filterFieldClass}>
              <option value="">All roles</option>
              {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Today" className={filterFieldClass}>
              <option value="">Any status today</option>
              <option value="approved">Signed in today</option>
              <option value="waiting">Waiting for approval</option>
              <option value="away">Not signed in today</option>
            </select>
          </div>
          {staff.length === 0 ? (
            <EmptyState icon={Users} title="No staff match" hint="Try another search or filter." />
          ) : (
            <ul className="divide-y divide-gray-100">
              {staff.map((u) => {
                const status = loginStatus(u);
                return (
                  <li key={u.id}>
                    <button type="button" onClick={() => setPerson(u)} className="flex flex-wrap items-center justify-between w-full gap-3 px-5 py-3 text-left hover:bg-blue-50/50">
                      <span className="flex items-center min-w-0 gap-3">
                        <span className="flex items-center justify-center w-9 h-9 text-xs font-bold text-white bg-blue-600 rounded-full shrink-0">{initials(u.name)}</span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-gray-900 truncate">{u.name}</span>
                          <span className="block text-xs text-gray-500 truncate">{u.email}</span>
                          <span className={`block text-xs truncate ${storesOf(u) ? "text-gray-600" : "text-amber-700"}`}>{storesOf(u) || "No store yet"}</span>
                        </span>
                      </span>
                      <span className="flex flex-wrap items-center gap-2">
                        <Badge className="text-blue-800 bg-blue-50">{u.role_label || roleOf(u.role)?.label || u.role}</Badge>
                        <Badge className={status.className}>{status.label}</Badge>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : (
        <section className="mt-3 space-y-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={showMissing} onChange={(e) => setShowMissing(e.target.checked)} className="accent-blue-600" />
            Also show what each role can&apos;t do
          </label>
          {roles.map((role) => {
            const isOpen = openRole === role.value;
            const people = users.filter((u) => u.role === role.value);
            const allCount = catalogue.length;
            const has = role.value === "admin" ? allCount : (role.permissions || []).length;
            return (
              <div key={role.value} className="bg-white border border-gray-200">
                <button type="button" onClick={() => setOpenRole(isOpen ? null : role.value)} aria-expanded={isOpen} className="flex flex-wrap items-center justify-between w-full gap-3 px-5 py-4 text-left hover:bg-gray-50">
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-semibold text-gray-900">{role.label}</span>
                      <Badge className={role.system ? "text-gray-700 bg-gray-100" : "text-purple-800 bg-purple-50"}>{role.system ? "Built-in" : "Custom"}</Badge>
                    </span>
                    {role.description && <span className="block mt-0.5 text-sm text-gray-600">{role.description}</span>}
                  </span>
                  <span className="flex items-center gap-4 text-sm text-gray-700">
                    <span><span className="font-semibold tabular-nums">{role.users_count ?? people.length}</span> staff</span>
                    <span><span className="font-semibold tabular-nums">{has}</span> of {allCount} permissions</span>
                    <ChevronDown size={16} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 space-y-4 border-t border-gray-100">
                    {people.length > 0 && (
                      <p className="pt-4 text-sm text-gray-700">
                        <span className={statLabelClass}>Staff in this role: </span>
                        {people.map((u, i) => (
                          <span key={u.id}>
                            {i > 0 && ", "}
                            <button type="button" onClick={() => setPerson(u)} className="text-blue-700 hover:underline">{u.name}</button>
                          </span>
                        ))}
                      </p>
                    )}
                    <div className={people.length ? "" : "pt-4"}>
                      {role.value === "admin" ? (
                        <p className="text-sm text-gray-700">Admins can do everything, including managing users and roles. This can&apos;t be changed.</p>
                      ) : (
                        <PermissionList role={role} catalogue={catalogue} showMissing={showMissing} />
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      {person && (
        <PersonModal
          person={person}
          role={person.role === "admin" ? { ...roleOf("admin"), permissions: catalogue.map((p) => p.name) } : roleOf(person.role)}
          catalogue={catalogue}
          onClose={() => setPerson(null)}
        />
      )}
    </div>
  );
}
