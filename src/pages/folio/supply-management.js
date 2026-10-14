import { useState, useEffect } from "react";
import PurchasingNav from "../../components/PurchasingNav";
import { useAuth } from "../../context/AuthContext";
import {
  AlertTriangle,
  Ban,
  Building2,
  Clock,
  History,
  Landmark,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  User,
  X,
} from "lucide-react";

import { supplierAPI } from "../../../services/api";
import {
  Badge,
  ConfirmDeleteModal,
  EmptyState,
  dangerButtonClass,
  ErrorBox,
  FilterBar,
  FilterSelect,
  FormModal,
  LoadingState,
  ModalFooter,
  ModalShell,
  PageTitle,
  Pagination,
  PanelHeader,
  StatTiles,
  fieldClass,
  formatDay,
  iconButtonClass,
  labelClass,
  matchesTerm,
  primaryButtonClass,
  secondaryButtonClass,
  statLabelClass,
  toList,
  toolbarButtonClass,
  unwrap,
  usePagination,
  useToast,
} from "../../components/ui/Boxy";

const BANK_HINT = "Changing bank details of a verified supplier cancels the verification.";

const SUPPLIER_FIELDS = [
  { name: "name", label: "Supplier Name", required: true, placeholder: "Legal or trading name" },
  { name: "contact_name", label: "Contact Person", placeholder: "Who you deal with" },
  { name: "email", label: "Email", type: "email", placeholder: "email@example.com", span: "half" },
  { name: "phone", label: "Phone", type: "tel", placeholder: "Phone number", span: "half" },
  { name: "address", label: "Address", type: "textarea", rows: 2, placeholder: "Business address" },
  { name: "product_categories", label: "Product Categories", placeholder: "What they supply, e.g. Pasta, Sugar" },
  { name: "bank_name", label: "Bank", placeholder: "e.g. GTBank", span: "half", hint: "Needed before the supplier can be verified" },
  { name: "account_number", label: "Account Number", placeholder: "10-digit NUBAN", span: "half", hint: BANK_HINT },
  { name: "account_name", label: "Account Name", placeholder: "Name on the bank account" },
  {
    name: "payment_terms_days",
    label: "Payment Terms (days)",
    type: "number",
    step: "1",
    placeholder: "0 = pay on delivery",
    span: "half",
    hint: "Days after delivery the supplier is paid",
  },
  { name: "description", label: "Notes", type: "textarea", placeholder: "Delivery days, terms, anything else" },
];

const EMPTY_SUPPLIER = {
  name: "",
  contact_name: "",
  email: "",
  phone: "",
  address: "",
  product_categories: "",
  bank_name: "",
  account_number: "",
  account_name: "",
  payment_terms_days: "0",
  description: "",
};

const STATUS_BADGE = {
  verified: "text-green-800 bg-green-50",
  pending: "text-amber-800 bg-amber-50",
  suspended: "text-red-700 bg-red-50",
};

const VERIFY_METHODS = [
  { value: "phone_call", label: "Phone call to the supplier" },
  { value: "bank_confirmation", label: "Confirmed with the bank" },
  { value: "in_person", label: "Visited or met in person" },
  { value: "email", label: "Email from the supplier" },
  { value: "other", label: "Other" },
];

const StatusBadge = ({ supplier }) => (
  <Badge className={STATUS_BADGE[supplier.status] || "text-gray-700 bg-gray-100"}>{supplier.status_label || supplier.status}</Badge>
);

// Blank optional fields aren't sent when adding; when editing they are sent
// empty so a cleared field is actually cleared
const toPayload = (values, isEditing) =>
  Object.fromEntries(
    Object.entries(values)
      .filter(([, value]) => isEditing || value !== "")
      .map(([key, value]) => [key, key === "payment_terms_days" ? Number(value || 0) : value === "" ? null : value])
  );

const bankLine = (s) => (s.bank_name || s.account_number ? [s.bank_name, s.account_number].filter(Boolean).join(" · ") : null);

const formatWhen = (value) =>
  value ? new Date(value).toLocaleString([], { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—";

// ---------------------------------------------------------------------------
// Verify / suspend
// ---------------------------------------------------------------------------

const VerifyModal = ({ supplier, onClose, onDone }) => {
  const [method, setMethod] = useState("phone_call");
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!reference.trim()) {
      setError("Say how you confirmed it: who you spoke to and when, or a document reference.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      onDone(await supplierAPI.verifySupplier(supplier.id, { method, reference: reference.trim() }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Verify Supplier" subtitle={supplier.name} icon={ShieldCheck} iconClass="bg-green-600" onClose={onClose} busy={saving} maxWidth="max-w-lg">
      <form onSubmit={submit}>
        <div className="px-6 py-5 space-y-4 text-sm">
          {error && <ErrorBox title="Not verified" message={error} />}
          <p className="text-gray-700">
            Confirm these details <strong>directly with the supplier or their bank</strong>, not from the invoice or
            from the person who added them.
          </p>
          <dl className="grid grid-cols-1 gap-px bg-gray-200 border border-gray-200 sm:grid-cols-2">
            {[
              ["Bank", supplier.bank_name],
              ["Account number", supplier.account_number],
              ["Account name", supplier.account_name],
              ["Contact", [supplier.contact_name, supplier.phone].filter(Boolean).join(" · ")],
            ].map(([label, value]) => (
              <div key={label} className="px-3 py-2 bg-white">
                <dt className={statLabelClass}>{label}</dt>
                <dd className="font-medium text-gray-900">{value || "—"}</dd>
              </div>
            ))}
          </dl>
          <div>
            <label htmlFor="verify-method" className={labelClass}>How did you confirm it?</label>
            <select id="verify-method" value={method} onChange={(e) => setMethod(e.target.value)} disabled={saving} className={fieldClass()}>
              {VERIFY_METHODS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="verify-reference" className={labelClass}>Proof</label>
            <input
              id="verify-reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              maxLength={100}
              disabled={saving}
              autoFocus
              placeholder="e.g. Spoke to Bola Ade on 0803…, 13 Oct 10:25"
              className={fieldClass()}
            />
          </div>
        </div>
        <ModalFooter>
          <button type="button" onClick={onClose} disabled={saving} className={secondaryButtonClass}>Cancel</button>
          <button type="submit" disabled={saving} className={primaryButtonClass}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
            {saving ? "Verifying…" : "Mark as verified"}
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  );
};

const SuspendModal = ({ supplier, onClose, onDone }) => {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Give a reason, so others know why.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      onDone(await supplierAPI.suspendSupplier(supplier.id, reason.trim()));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Suspend Supplier" subtitle={supplier.name} icon={Ban} iconClass="bg-red-600" onClose={onClose} busy={saving}>
      <form onSubmit={submit}>
        <div className="px-6 py-5 space-y-4 text-sm">
          {error && <ErrorBox title="Not suspended" message={error} />}
          <p className="text-gray-700">
            The supplier can&apos;t be paid until it is verified again. Use this when something looks wrong, or you stop
            buying from them.
          </p>
          <div>
            <label htmlFor="suspend-reason" className={labelClass}>Reason</label>
            <input
              id="suspend-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={255}
              disabled={saving}
              autoFocus
              placeholder="e.g. Account name on invoice doesn't match"
              className={fieldClass()}
            />
          </div>
        </div>
        <ModalFooter>
          <button type="button" onClick={onClose} disabled={saving} className={secondaryButtonClass}>Cancel</button>
          <button type="submit" disabled={saving} className={dangerButtonClass}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Ban size={16} />}
            {saving ? "Suspending…" : "Suspend"}
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  );
};

// ---------------------------------------------------------------------------
// Details and history
// ---------------------------------------------------------------------------

const DetailsModal = ({ supplier, onClose }) => {
  const [history, setHistory] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    supplierAPI
      .getSupplierHistory(supplier.id)
      .then((body) => setHistory(toList(body)))
      .catch((err) => setError(err.message));
  }, [supplier.id]);

  const rows = [
    ["Status", <StatusBadge key="s" supplier={supplier} />],
    ["Contact person", supplier.contact_name],
    ["Phone", supplier.phone],
    ["Email", supplier.email],
    ["Address", supplier.address],
    ["Product categories", supplier.product_categories],
    ["Bank", supplier.bank_name],
    ["Account number", supplier.account_number],
    ["Account name", supplier.account_name],
    ["Payment terms", supplier.payment_terms_days ? `${supplier.payment_terms_days} days after delivery` : "On delivery"],
    ["Added by", supplier.added_by?.name],
  ];
  if (supplier.verification) {
    rows.push(
      ["Verified by", `${supplier.verification.by?.name || "—"} on ${formatWhen(supplier.verification.at)}`],
      ["How", `${supplier.verification.method_label}: ${supplier.verification.reference}`]
    );
  }
  if (supplier.suspended_reason) rows.push(["Suspended because", supplier.suspended_reason]);

  return (
    <ModalShell title={supplier.name} subtitle="Supplier details and history" icon={Building2} onClose={onClose} maxWidth="max-w-2xl">
      <div className="px-6 py-5 space-y-5 text-sm">
        <dl className="grid grid-cols-1 gap-px bg-gray-200 border border-gray-200 sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label} className="px-3 py-2 bg-white">
              <dt className={statLabelClass}>{label}</dt>
              <dd className="text-gray-900 break-words">{value || "—"}</dd>
            </div>
          ))}
        </dl>

        <div>
          <p className={`${statLabelClass} mb-2`}>History</p>
          {error ? (
            <p className="text-red-600">{error}</p>
          ) : history === null ? (
            <p className="text-gray-500">Loading…</p>
          ) : history.length === 0 ? (
            <p className="text-gray-500">Nothing recorded yet.</p>
          ) : (
            <ul className="border border-gray-200 divide-y divide-gray-100">
              {history.map((entry) => (
                <li key={entry.id} className="flex gap-3 px-3 py-2">
                  <History size={14} className="mt-0.5 text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-gray-900">{entry.description}</p>
                    {entry.changes && entry.action !== "verified" && (
                      <ul className="mt-0.5 text-xs text-gray-600">
                        {Object.entries(entry.changes).map(([field, change]) => (
                          <li key={field}>
                            {field.replace(/_/g, " ")}: {change.from ?? "—"} → {change.to ?? "—"}
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="text-xs text-gray-500">
                      {entry.by?.name || "Someone"} · {formatWhen(entry.at)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <ModalFooter>
        <button type="button" onClick={onClose} className={secondaryButtonClass}>Close</button>
      </ModalFooter>
    </ModalShell>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SupplierManagement() {
  // Several roles can look at suppliers; procurement (and admins) change them;
  // junior accountants (and admins) verify or suspend them
  const { can } = useAuth();
  const canManage = can("suppliers.manage");
  const canVerify = can("suppliers.verify");
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formSupplier, setFormSupplier] = useState(null); // {} = new, supplier = edit
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [toVerify, setToVerify] = useState(null);
  const [toSuspend, setToSuspend] = useState(null);
  const [viewing, setViewing] = useState(null);
  const { notify, toastElement } = useToast();

  // Fetch suppliers from API
  const fetchSuppliers = async () => {
    setLoading(true);
    setError("");
    try {
      setSuppliers(toList(await supplierAPI.getAllSuppliers()));
    } catch (err) {
      setError(err.message);
      console.error("Error fetching suppliers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const replaceSupplier = (saved) => setSuppliers((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));

  // ---- Save / delete -------------------------------------------------------

  const isEditing = Boolean(formSupplier?.id);

  const handleSave = async (values) => {
    const payload = toPayload(values, isEditing);
    if (isEditing) {
      const saved = unwrap(await supplierAPI.updateSupplier(formSupplier.id, payload), "supplier");
      if (saved?.id) replaceSupplier(saved);
      else await fetchSuppliers();
      const lostVerification = formSupplier.status === "verified" && saved?.status === "pending";
      notify(
        lostVerification ? "error" : "success",
        lostVerification
          ? `${values.name}'s bank details changed, so it must be verified again before it can be paid.`
          : `${values.name} was saved.`,
        lostVerification ? "Verification cancelled" : "Supplier updated"
      );
    } else {
      await supplierAPI.createSupplier(payload);
      await fetchSuppliers();
      notify("success", `${values.name} was added. A junior accountant now needs to verify it.`, "Supplier added");
    }
    setFormSupplier(null);
  };

  const handleDelete = async () => {
    const supplier = supplierToDelete;
    await supplierAPI.deleteSupplier(supplier.id);
    setSuppliers((prev) => prev.filter((s) => s.id !== supplier.id));
    setSupplierToDelete(null);
    notify("success", `${supplier.name} was removed.`, "Supplier deleted");
  };

  const handleVerified = (saved) => {
    replaceSupplier(saved);
    setToVerify(null);
    notify("success", `${saved.name} is verified and can now be paid.`, "Supplier verified");
  };

  const handleSuspended = (saved) => {
    replaceSupplier(saved);
    setToSuspend(null);
    notify("success", `${saved.name} is suspended and can't be paid.`, "Supplier suspended");
  };

  // ---- Filtering -------------------------------------------------------------

  const term = searchTerm.trim().toLowerCase();
  const filteredSuppliers = suppliers.filter(
    (s) =>
      matchesTerm(term, [s.name, s.contact_name, s.email, s.phone, s.address, s.description, s.product_categories, s.bank_name, s.account_number]) &&
      (!statusFilter || s.status === statusFilter)
  );

  const hasFilters = Boolean(searchTerm || statusFilter);
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
  };

  const pager = usePagination(filteredSuppliers, 25, `${searchTerm}|${statusFilter}`);

  const count = (status) => suppliers.filter((s) => s.status === status).length;
  const pending = count("pending");
  const tiles = [
    { icon: Building2, iconClass: "bg-blue-50 text-blue-700", label: "Total Suppliers", value: suppliers.length },
    { icon: ShieldCheck, iconClass: "bg-green-50 text-green-700", label: "Verified", value: count("verified") },
    {
      icon: Clock,
      iconClass: "bg-amber-50 text-amber-700",
      label: "Waiting for Verification",
      value: pending,
      hint: pending > 0 ? "Can't be paid until verified" : null,
    },
    { icon: Ban, iconClass: "bg-red-50 text-red-700", label: "Suspended", value: count("suspended") },
  ];

  // ---- Render ----------------------------------------------------------------

  const contactLines = (s) => (
    <>
      {s.phone ? (
        <a
          href={`tel:${s.phone}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 text-xs text-gray-600 truncate hover:underline"
        >
          <Phone size={11} className="shrink-0" />
          <span className="truncate">{s.phone}</span>
        </a>
      ) : null}
      {s.email ? (
        <a
          href={`mailto:${s.email}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 text-xs text-blue-600 truncate hover:underline"
        >
          <Mail size={11} className="shrink-0" />
          <span className="truncate">{s.email}</span>
        </a>
      ) : null}
      {!s.email && !s.phone && <span className="text-gray-400">—</span>}
    </>
  );

  // Verify (pending or suspended) / suspend (anything not already suspended)
  const verifyActions = (s, mobile = false) =>
    canVerify && (
      <>
        {s.status !== "verified" && (
          <button
            onClick={() => setToVerify(s)}
            disabled={!s.has_bank_details}
            className={
              mobile
                ? "flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-green-700 hover:bg-green-50 disabled:opacity-40"
                : `${iconButtonClass()} hover:text-green-600 disabled:opacity-40 disabled:cursor-not-allowed`
            }
            title={s.has_bank_details ? "Verify" : "Add bank details before verifying"}
            aria-label={`Verify ${s.name}`}
          >
            <ShieldCheck size={mobile ? 13 : 15} />
            {mobile && "Verify"}
          </button>
        )}
        {s.status !== "suspended" && (
          <button
            onClick={() => setToSuspend(s)}
            className={mobile ? "flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50" : iconButtonClass("red")}
            title="Suspend"
            aria-label={`Suspend ${s.name}`}
          >
            <Ban size={mobile ? 13 : 15} />
            {mobile && "Suspend"}
          </button>
        )}
      </>
    );

  let body;
  if (loading && suppliers.length === 0) {
    body = <LoadingState label="Loading suppliers…" />;
  } else if (error && suppliers.length === 0) {
    body = (
      <EmptyState
        icon={AlertTriangle}
        tone="red"
        title="Couldn't load suppliers"
        hint={error}
        action={
          <button onClick={fetchSuppliers} className={secondaryButtonClass}>
            Try again
          </button>
        }
      />
    );
  } else if (filteredSuppliers.length === 0) {
    body = (
      <EmptyState
        icon={Building2}
        title={suppliers.length === 0 ? "No suppliers yet" : "No suppliers match your filters"}
        hint={suppliers.length === 0 ? "Add the businesses you buy stock from" : "Try a different search or filter"}
        action={
          hasFilters ? (
            <button onClick={clearFilters} className={secondaryButtonClass}>
              Clear filters
            </button>
          ) : canManage ? (
            <button onClick={() => setFormSupplier({})} className={toolbarButtonClass.primary}>
              <Plus size={14} />
              Add Supplier
            </button>
          ) : null
        }
      />
    );
  } else {
    body = (
      <>
        {/* Desktop Table */}
        <div className="hidden md:block">
          <table className="w-full text-sm table-fixed">
            <colgroup>
              <col className="w-[24%]" />
              <col className="w-[16%]" />
              <col className="w-[20%]" />
              <col />
              <col className="w-[9rem]" />
            </colgroup>
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr className="text-left">
                <th className={`px-5 py-2.5 ${statLabelClass}`}>Supplier</th>
                <th className={`px-3 py-2.5 ${statLabelClass}`}>Contact</th>
                <th className={`px-3 py-2.5 ${statLabelClass}`}>Bank</th>
                <th className={`px-3 py-2.5 ${statLabelClass}`}>Status</th>
                <th className={`px-5 py-2.5 text-right ${statLabelClass}`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pager.pageRows.map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-blue-50/50">
                  <td className="px-5 py-3">
                    <button type="button" onClick={() => setViewing(s)} className="block max-w-full text-left">
                      <span className="block font-medium text-gray-900 truncate hover:underline">{s.name}</span>
                      <span className="block text-xs text-gray-500 truncate" title={s.product_categories || s.description}>
                        {s.product_categories || s.description || "No categories"}
                      </span>
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-gray-700 truncate">{s.contact_name || "—"}</div>
                    {contactLines(s)}
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-700">
                    {bankLine(s) ? (
                      <>
                        <div className="truncate">{bankLine(s)}</div>
                        <div className="text-gray-500 truncate">{s.account_name}</div>
                      </>
                    ) : (
                      <span className="text-amber-700">No bank details</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge supplier={s} />
                    <div className="mt-0.5 text-[11px] text-gray-500 truncate">
                      {s.verification
                        ? `by ${s.verification.by?.name || "—"}, ${formatDay(s.verification.at)}`
                        : s.suspended_reason || `Terms: ${s.payment_terms_days ? `${s.payment_terms_days} days` : "on delivery"}`}
                    </div>
                  </td>
                  <td className="px-5 py-2">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setViewing(s)} className={iconButtonClass()} title="Details and history" aria-label={`Details of ${s.name}`}>
                        <History size={15} />
                      </button>
                      {verifyActions(s)}
                      {canManage && (
                        <button onClick={() => setFormSupplier(s)} className={iconButtonClass()} title="Edit" aria-label={`Edit ${s.name}`}>
                          <Pencil size={15} />
                        </button>
                      )}
                      {canManage && (
                        <button
                          onClick={() => setSupplierToDelete(s)}
                          className={iconButtonClass("red")}
                          title="Delete"
                          aria-label={`Delete ${s.name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <ul className="divide-y divide-gray-100 md:hidden">
          {pager.pageRows.map((s) => (
            <li key={s.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <button type="button" onClick={() => setViewing(s)} className="min-w-0 text-left">
                  <p className="text-sm font-semibold text-gray-900 truncate">{s.name}</p>
                  {s.contact_name && (
                    <p className="flex items-center gap-1 text-xs text-gray-500 truncate">
                      <User size={11} className="shrink-0" />
                      {s.contact_name}
                    </p>
                  )}
                </button>
                <StatusBadge supplier={s} />
              </div>
              <div className="mt-2 space-y-1 text-sm">{contactLines(s)}</div>
              <p className="flex items-center gap-1.5 mt-1 text-xs text-gray-600">
                <Landmark size={11} className="shrink-0" />
                {bankLine(s) || <span className="text-amber-700">No bank details</span>}
              </p>
              {s.address && (
                <p className="flex items-start gap-1.5 mt-1 text-xs text-gray-600">
                  <MapPin size={11} className="mt-0.5 shrink-0" />
                  {s.address}
                </p>
              )}
              {(canManage || canVerify) && (
                <div className="flex mt-3 border border-gray-200 divide-x divide-gray-200 [&>*]:flex-1">
                  {verifyActions(s, true)}
                  {canManage && (
                    <button
                      onClick={() => setFormSupplier(s)}
                      className="flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Pencil size={13} /> Edit
                    </button>
                  )}
                  {canManage && (
                    <button
                      onClick={() => setSupplierToDelete(s)}
                      className="flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>

        <Pagination {...pager} shown={pager.pageRows.length} />
      </>
    );
  }

  return (
    <div className="pt-0 mt-0 font-raleway">
      {toastElement}

      <PageTitle title="Supplier Management" description="The businesses you buy stock from, and whether their bank details are verified" />
      <PurchasingNav />

      <div className="mt-5 space-y-5">
        <StatTiles tiles={tiles} loading={loading && suppliers.length === 0} columns="sm:grid-cols-2 lg:grid-cols-4" />

        {canVerify && pending > 0 && (
          <div className="flex items-center gap-2 px-4 py-3 text-sm border text-amber-800 border-amber-200 bg-amber-50">
            <Clock size={15} className="shrink-0" />
            {pending} supplier{pending === 1 ? " is" : "s are"} waiting for you to verify their bank details.
            <button onClick={() => setStatusFilter("pending")} className="ml-auto font-semibold underline whitespace-nowrap">
              Show them
            </button>
          </div>
        )}

        <section className="bg-white border border-gray-200">
          <PanelHeader
            title="Suppliers"
            meta={loading && suppliers.length === 0 ? "Loading…" : `${filteredSuppliers.length} ${hasFilters ? "matching" : "suppliers"}`}
          >
            {hasFilters && (
              <button onClick={clearFilters} className={toolbarButtonClass.ghost}>
                <X size={14} />
                Clear filters
              </button>
            )}
            <button onClick={fetchSuppliers} disabled={loading} className={toolbarButtonClass.secondary}>
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            {canManage && (
              <button onClick={() => setFormSupplier({})} className={toolbarButtonClass.primary}>
                <Plus size={14} />
                Add Supplier
              </button>
            )}
          </PanelHeader>

          <FilterBar
            search={searchTerm}
            onSearch={setSearchTerm}
            placeholder="Search by name, contact, phone, bank or account number"
            filtersActive={Boolean(statusFilter)}
            filters={
              <FilterSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
                <option value="">All Suppliers</option>
                <option value="verified">Verified</option>
                <option value="pending">Waiting for verification</option>
                <option value="suspended">Suspended</option>
              </FilterSelect>
            }
          />

          {body}
        </section>
      </div>

      {canManage && formSupplier && (
        <FormModal
          key={formSupplier.id || "new"}
          title={isEditing ? "Edit Supplier" : "Add Supplier"}
          subtitle={isEditing ? formSupplier.name : "A junior accountant will verify the bank details"}
          icon={isEditing ? Pencil : Building2}
          fields={SUPPLIER_FIELDS}
          initialValues={
            isEditing
              ? Object.fromEntries(Object.keys(EMPTY_SUPPLIER).map((k) => [k, formSupplier[k] ?? ""]))
              : EMPTY_SUPPLIER
          }
          submitLabel={isEditing ? "Update Supplier" : "Add Supplier"}
          errorTitle={isEditing ? "Supplier not updated" : "Supplier not added"}
          onSubmit={handleSave}
          onClose={() => setFormSupplier(null)}
        />
      )}

      {canManage && supplierToDelete && (
        <ConfirmDeleteModal
          title="Delete Supplier"
          message="This removes the supplier and their contact details from your records."
          details={[
            ["Supplier", supplierToDelete.name],
            ["Contact", supplierToDelete.contact_name || supplierToDelete.phone || supplierToDelete.email || "—"],
          ]}
          confirmLabel="Delete Supplier"
          onConfirm={handleDelete}
          onClose={() => setSupplierToDelete(null)}
        />
      )}

      {canVerify && toVerify && <VerifyModal supplier={toVerify} onClose={() => setToVerify(null)} onDone={handleVerified} />}
      {canVerify && toSuspend && <SuspendModal supplier={toSuspend} onClose={() => setToSuspend(null)} onDone={handleSuspended} />}
      {viewing && <DetailsModal supplier={suppliers.find((s) => s.id === viewing.id) || viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
