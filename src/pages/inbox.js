// Inbox: messages about everything that happens on the platform (except the
// sales point), for the people they concern. "Your turn" marks the ones where
// you have to do the next step. Admins see everything and can send messages
// to everyone, to a role, or to chosen people.
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { CheckCheck, Inbox as InboxIcon, Loader2, Megaphone, RefreshCw, Search, Send } from "lucide-react";
import http from "../../services/http";
import { useAuth } from "../context/AuthContext";
import { INBOX_CHANGED, timeAgo } from "../components/InboxBell";
import {
  Badge,
  EmptyState,
  ErrorBox,
  FilterSelect,
  LoadingState,
  ModalFooter,
  ModalShell,
  PageTitle,
  PanelHeader,
  fieldClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
  toList,
  toolbarButtonClass,
  useToast,
} from "../components/ui/Boxy";

const CATEGORIES = [
  ["", "All topics"],
  ["suppliers", "Suppliers"],
  ["purchasing", "Purchasing"],
  ["stock", "Stock"],
  ["money", "Money"],
  ["customers", "Customers"],
  ["sales", "Sales changes"],
  ["users", "Users and access"],
  ["sign_in", "Sign-ins"],
  ["message", "Messages"],
];

const CATEGORY_BADGE = {
  suppliers: "text-blue-800 bg-blue-50",
  purchasing: "text-purple-800 bg-purple-50",
  stock: "text-teal-800 bg-teal-50",
  money: "text-green-800 bg-green-50",
  customers: "text-indigo-800 bg-indigo-50",
  sales: "text-orange-800 bg-orange-50",
  users: "text-gray-800 bg-gray-100",
  sign_in: "text-gray-700 bg-gray-100",
  message: "text-red-700 bg-red-50",
};

const changed = () => window.dispatchEvent(new Event(INBOX_CHANGED));
const errorText = (err, fallback) => err.response?.data?.message || fallback;

// ---------------------------------------------------------------------------
// Compose (admins)
// ---------------------------------------------------------------------------

const ComposeModal = ({ onClose, onSent }) => {
  const [audience, setAudience] = useState("everyone");
  const [role, setRole] = useState("");
  const [people, setPeople] = useState(() => new Set());
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([http.get("/roles"), http.get("/users")])
      .then(([r, u]) => {
        setRoles(toList(r.data));
        setUsers(toList(u.data).sort((a, b) => String(a.name).localeCompare(String(b.name))));
      })
      .catch(() => {});
  }, []);

  const shownUsers = users.filter((u) => !search.trim() || [u.name, u.email, u.role_label].some((v) => String(v || "").toLowerCase().includes(search.trim().toLowerCase())));
  const togglePerson = (id) =>
    setPeople((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const ready = title.trim() && body.trim() && (audience === "everyone" || (audience === "role" && role) || (audience === "people" && people.size > 0)) && !sending;

  const send = async (e) => {
    e.preventDefault();
    if (!ready) return;
    setSending(true);
    setError("");
    try {
      const { data } = await http.post("/inbox/send", {
        audience,
        role: audience === "role" ? role : undefined,
        user_ids: audience === "people" ? [...people] : undefined,
        title: title.trim(),
        body: body.trim(),
      });
      onSent(data);
    } catch (err) {
      setError(errorText(err, "Could not send the message."));
    } finally {
      setSending(false);
    }
  };

  const optionClass = (value) => `flex-1 px-3 py-2 text-sm font-semibold border ${audience === value ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`;

  return (
    <ModalShell title="New Message" subtitle="Goes to their inboxes straight away" icon={Megaphone} onClose={onClose} busy={sending} maxWidth="max-w-xl">
      <form onSubmit={send}>
        <div className="px-6 py-5 space-y-4 text-sm">
          {error && <ErrorBox title="Not sent" message={error} />}
          <div>
            <p className={labelClass}>Send to</p>
            <div className="flex">
              <button type="button" onClick={() => setAudience("everyone")} className={optionClass("everyone")}>Everyone</button>
              <button type="button" onClick={() => setAudience("role")} className={`${optionClass("role")} -ml-px`}>A role</button>
              <button type="button" onClick={() => setAudience("people")} className={`${optionClass("people")} -ml-px`}>Chosen people</button>
            </div>
          </div>

          {audience === "role" && (
            <div>
              <label htmlFor="compose-role" className={labelClass}>Role</label>
              <select id="compose-role" value={role} onChange={(e) => setRole(e.target.value)} disabled={sending} className={fieldClass()}>
                <option value="">Choose a role</option>
                {roles.map((r) => <option key={r.value} value={r.value}>{r.label} ({r.users_count ?? 0})</option>)}
              </select>
            </div>
          )}

          {audience === "people" && (
            <div>
              <p className={labelClass}>People <span className="font-normal text-gray-400 normal-case">({people.size} chosen)</span></p>
              <div className="relative mb-2">
                <Search size={14} className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, email or role" aria-label="Find people" className={`${fieldClass()} pl-8`} />
              </div>
              <ul className="overflow-y-auto border border-gray-200 divide-y divide-gray-100 max-h-48">
                {shownUsers.map((u) => (
                  <li key={u.id}>
                    <label className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50">
                      <input type="checkbox" checked={people.has(u.id)} onChange={() => togglePerson(u.id)} className="accent-blue-600" />
                      <span className="flex-1 min-w-0">
                        <span className="block text-gray-900 truncate">{u.name}</span>
                        <span className="block text-xs text-gray-500 truncate">{u.role_label || u.role} · {u.email}</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <label htmlFor="compose-title" className={labelClass}>Title</label>
            <input id="compose-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} disabled={sending} placeholder="e.g. Stock count on Saturday" className={fieldClass()} />
          </div>
          <div>
            <label htmlFor="compose-body" className={labelClass}>Message</label>
            <textarea id="compose-body" rows={5} value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} disabled={sending} className={fieldClass()} />
          </div>
          <p className="text-xs text-gray-500">Other admins get a copy too.</p>
        </div>
        <ModalFooter>
          <button type="button" onClick={onClose} disabled={sending} className={secondaryButtonClass}>Cancel</button>
          <button type="submit" disabled={!ready} className={primaryButtonClass}>
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Send
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function InboxPage() {
  const router = useRouter();
  const { can } = useAuth();
  const canSend = can("notifications.manage");
  const [filter, setFilter] = useState("all");
  const [category, setCategory] = useState("");
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({ unread: 0, needs_action: 0 });
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [composing, setComposing] = useState(false);
  const { notify, toastElement } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await http.get("/inbox", { params: { page, filter, category: category || undefined } });
      setRows(toList(data));
      setCounts(data.counts || { unread: 0, needs_action: 0 });
      setLastPage(Number(data.last_page) || 1);
      setTotal(Number(data.total) || 0);
    } catch (err) {
      setError(errorText(err, "Could not load your inbox."));
    } finally {
      setLoading(false);
    }
  }, [page, filter, category]);

  useEffect(() => {
    load();
  }, [load]);

  // Refresh when the bell or another tab changes something
  useEffect(() => {
    const onChange = () => load();
    window.addEventListener("focus", onChange);
    return () => window.removeEventListener("focus", onChange);
  }, [load]);

  const markRead = async (row) => {
    if (row.read_at) return;
    try {
      await http.post(`/inbox/${row.id}/read`);
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, read_at: new Date().toISOString() } : r)));
      setCounts((prev) => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
      changed();
    } catch {
      // Not critical
    }
  };

  const openRow = async (row) => {
    await markRead(row);
    setExpanded(expanded === row.id ? null : row.id);
  };

  const readAll = async () => {
    try {
      const { data } = await http.post("/inbox/read-all", { category: category || undefined });
      notify("success", `${data.marked} marked as read.`, "Done");
      changed();
      load();
    } catch (err) {
      notify("error", errorText(err, "Could not mark them as read."), "Not done");
    }
  };

  const tabs = useMemo(
    () => [
      ["all", "All"],
      ["action", `Your turn${counts.needs_action ? ` (${counts.needs_action})` : ""}`],
      ["unread", `Unread${counts.unread ? ` (${counts.unread})` : ""}`],
    ],
    [counts]
  );

  return (
    <div className="pt-0 mt-0 font-raleway">
      {toastElement}
      <PageTitle title="Inbox" description="What's happening on the platform that concerns you, and what's waiting for you to do" />

      <div className="flex flex-wrap items-center justify-between gap-3 mt-5">
        <div className="flex" role="tablist">
          {tabs.map(([key, label], i) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={filter === key}
              onClick={() => { setFilter(key); setPage(1); }}
              className={`px-4 py-2 text-sm font-semibold border ${i ? "-ml-px" : ""} ${filter === key ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}
            >
              {label}
            </button>
          ))}
        </div>
        {canSend && (
          <button onClick={() => setComposing(true)} className={toolbarButtonClass.primary}>
            <Megaphone size={14} /> New message
          </button>
        )}
      </div>

      <section className="mt-3 bg-white border border-gray-200">
        <PanelHeader title="Messages" meta={loading ? "Loading…" : `${total} ${total === 1 ? "message" : "messages"}`}>
          <button onClick={readAll} disabled={counts.unread === 0} className={toolbarButtonClass.secondary}>
            <CheckCheck size={13} /> Mark all as read
          </button>
          <button onClick={load} disabled={loading} className={toolbarButtonClass.secondary}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </PanelHeader>
        <div className="flex flex-wrap gap-3 px-5 py-3 border-b border-gray-200">
          <FilterSelect value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} aria-label="Topic">
            {CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </FilterSelect>
        </div>

        {loading && rows.length === 0 ? (
          <LoadingState label="Loading your inbox…" />
        ) : error ? (
          <EmptyState icon={InboxIcon} tone="red" title="Couldn't load your inbox" hint={error} action={<button onClick={load} className={secondaryButtonClass}>Try again</button>} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={InboxIcon}
            title={filter === "action" ? "Nothing waiting for you" : filter === "unread" ? "No unread messages" : "Your inbox is empty"}
            hint="Messages about suppliers, orders, deliveries, payments, stock and sign-ins arrive here."
          />
        ) : (
          <ul className="divide-y divide-gray-100">
            {rows.map((row) => {
              const unread = !row.read_at;
              const isOpen = expanded === row.id;
              return (
                <li key={row.id} className={unread ? "bg-blue-50/40" : ""}>
                  <button type="button" onClick={() => openRow(row)} aria-expanded={isOpen} className="flex w-full gap-3 px-5 py-3 text-left hover:bg-gray-50">
                    <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${unread ? "bg-blue-600" : "bg-transparent"}`} aria-hidden />
                    <span className="flex-1 min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className={`text-sm truncate ${unread ? "font-semibold text-gray-900" : "text-gray-800"}`}>{row.title}</span>
                        {row.needs_action && <Badge className="text-amber-800 bg-amber-50">Your turn</Badge>}
                        <Badge className={CATEGORY_BADGE[row.category] || "text-gray-700 bg-gray-100"}>{row.category_label}</Badge>
                        {row.kind === "broadcast" && <Badge className="text-red-700 bg-red-50">To {row.audience}</Badge>}
                        {row.kind === "direct" && <Badge className="text-red-700 bg-red-50">Direct</Badge>}
                      </span>
                      {row.body && <span className={`block mt-0.5 text-sm text-gray-600 ${isOpen ? "whitespace-pre-line" : "truncate"}`}>{row.body}</span>}
                      <span className="block mt-0.5 text-xs text-gray-400">
                        {row.from?.name ? `${row.from.name} · ` : ""}{timeAgo(row.created_at)} · {new Date(row.created_at).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </span>
                  </button>
                  {isOpen && row.link && (
                    <div className="px-10 pb-3">
                      <button type="button" onClick={() => router.push(row.link)} className={secondaryButtonClass}>Go to the page</button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {lastPage > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading} className={secondaryButtonClass}>Newer</button>
            <span className="text-xs text-gray-500">Page {page} of {lastPage}</span>
            <button onClick={() => setPage((p) => Math.min(lastPage, p + 1))} disabled={page >= lastPage || loading} className={secondaryButtonClass}>Older</button>
          </div>
        )}
      </section>

      {composing && (
        <ComposeModal
          onClose={() => setComposing(false)}
          onSent={(data) => {
            setComposing(false);
            notify("success", `Sent to ${data.audience} (${data.recipients} ${data.recipients === 1 ? "inbox" : "inboxes"}).`, "Message sent");
            load();
          }}
        />
      )}
    </div>
  );
}
