// Settings > Notifications: which topics reach your inbox. Messages where it's
// your turn to act, and messages from admins, always arrive whatever is turned
// off here. The inbox itself is on the Inbox page and the bell in the top bar.
import { useEffect, useState } from "react";
import Link from "next/link";
import { FaBell, FaInbox, FaSave } from "react-icons/fa";
import http from "../../../services/http";
import { INBOX_CHANGED } from "../InboxBell";
import { Panel, Spinner, secondaryButtonClass } from "./ui";

const TOPIC_HELP = {
  suppliers: "Suppliers added, checked, approved, suspended or changed",
  purchasing: "Requisitions, purchase orders, deliveries and SOR",
  stock: "Products, stock counts, transfers and expired stock",
  money: "Expenses, bank, payments and supplier payments",
  customers: "Customers and their deposits",
  sales: "Completed sales that were changed or deleted",
  users: "Users, roles and which stores people work at",
  sign_in: "Who signed in, signed out or asked to sign in",
};

const messageFrom = (error, fallback) => error.response?.data?.message || fallback;

export default function NotificationsSection({ notify }) {
  const [topics, setTopics] = useState(null);
  const [counts, setCounts] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([http.get("/inbox/preferences"), http.get("/inbox/counts")])
      .then(([prefs, c]) => {
        setTopics(prefs.data.topics || []);
        setCounts(c.data);
      })
      .catch((err) => setError(messageFrom(err, "Could not load your notification settings.")));
  }, []);

  const toggle = (value) => setTopics((prev) => prev.map((t) => (t.value === value ? { ...t, on: !t.on } : t)));

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const { data } = await http.put("/inbox/preferences", { muted: topics.filter((t) => !t.on).map((t) => t.value) });
      setTopics(data.topics);
      window.dispatchEvent(new Event(INBOX_CHANGED));
      notify("success", "Your notification settings were saved.", "Saved");
    } catch (err) {
      setError(messageFrom(err, "Could not save your notification settings."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <Panel
        title="Your inbox"
        description="Everything that happens on the platform and concerns you, except the sales point"
        action={
          <Link href="/inbox" className={`${secondaryButtonClass} flex items-center`}>
            <FaInbox className="mr-2 text-xs" /> Open inbox
          </Link>
        }
      >
        <div className="flex flex-wrap gap-6 text-sm">
          <p>
            <span className="block text-2xl font-bold text-gray-900 tabular-nums">{counts ? counts.unread : "…"}</span>
            <span className="text-gray-600">unread</span>
          </p>
          <p>
            <span className="block text-2xl font-bold text-amber-700 tabular-nums">{counts ? counts.needs_action : "…"}</span>
            <span className="text-gray-600">waiting for you (your turn)</span>
          </p>
          <p className="flex-1 min-w-[14rem] text-gray-600">
            <FaBell className="inline mr-1 text-xs" /> The bell in the top bar shows these too. A red number is unread messages; an orange dot means
            something is waiting for you.
          </p>
        </div>
      </Panel>

      <Panel
        title="What reaches your inbox"
        description="Turn off topics you don't need. Your turn and messages from admins always arrive."
        action={
          <button
            type="button"
            onClick={save}
            disabled={saving || !topics}
            className="flex items-center px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? <Spinner /> : <FaSave className="mr-2" />} Save
          </button>
        }
        bodyClass="p-0"
      >
        {error && <p className="px-5 py-3 text-sm text-red-700 border-b border-red-200 bg-red-50">{error}</p>}
        {topics === null ? (
          <p className="px-5 py-6 text-sm text-gray-500">Loading…</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {topics.map((topic) => (
              <li key={topic.value}>
                <label className="flex items-center gap-4 px-5 py-3 cursor-pointer hover:bg-gray-50">
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-gray-900">{topic.label}</span>
                    <span className="block text-xs text-gray-500">{TOPIC_HELP[topic.value]}</span>
                  </span>
                  <span className={`text-xs font-semibold ${topic.on ? "text-green-700" : "text-gray-400"}`}>{topic.on ? "On" : "Off"}</span>
                  <input
                    type="checkbox"
                    role="switch"
                    checked={topic.on}
                    onChange={() => toggle(topic.value)}
                    disabled={saving}
                    aria-label={`${topic.label} notifications`}
                    className="w-4 h-4 accent-blue-600"
                  />
                </label>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
