import { useState, useEffect } from "react";
import FolioNav from "../../components/FolioNav";
import { useAuth } from "../../context/AuthContext";
import { AlertTriangle, Landmark, Layers, Pencil, Plus, RefreshCw, Trash2, Wallet, X } from "lucide-react";

import { bankAPI } from "../../../services/api";
import {
  Badge,
  ConfirmDeleteModal,
  EmptyState,
  FilterBar,
  FilterSelect,
  FormModal,
  LoadingState,
  PageTitle,
  Pagination,
  PanelHeader,
  StatTiles,
  formatNaira,
  iconButtonClass,
  matchesTerm,
  secondaryButtonClass,
  statLabelClass,
  toList,
  toolbarButtonClass,
  unwrap,
  usePagination,
  useToast,
} from "../../components/ui/Boxy";

const ACCOUNT_TYPES = ["Checking", "Savings", "Business", "Investment"];

const BANK_FIELDS = [
  { name: "bank_name", label: "Bank Name", required: true, placeholder: "e.g. GTBank" },
  { name: "account_number", label: "Account Number", required: true, placeholder: "10-digit account number", span: "half" },
  { name: "account_name", label: "Account Name", required: true, placeholder: "Name on the account", span: "half" },
  {
    name: "account_type",
    label: "Account Type",
    type: "select",
    required: true,
    span: "half",
    options: [{ value: "", label: "Select type" }, ...ACCOUNT_TYPES.map((t) => ({ value: t, label: t }))],
  },
  { name: "branch", label: "Branch", placeholder: "e.g. Ikeja", span: "half" },
  { name: "balance", label: "Balance", type: "number", required: true, prefix: "₦", placeholder: "0.00" },
  { name: "description", label: "Description", type: "textarea", placeholder: "What this account is used for" },
];

const EMPTY_BANK = {
  bank_name: "",
  account_number: "",
  account_name: "",
  branch: "",
  account_type: "",
  balance: "",
  description: "",
};

const balanceOf = (bank) => parseFloat(bank.balance) || 0;

// Main Bank Management Component
export default function BankManagement() {
  // Junior accountants can look; only the senior accountant (and admins) change bank accounts
  const { can } = useAuth();
  const canManage = can("banking.manage");
  const [banks, setBanks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formBank, setFormBank] = useState(null); // {} = new, bank = edit
  const [bankToDelete, setBankToDelete] = useState(null);
  const { notify, toastElement } = useToast();

  // Fetch banks from API
  const fetchBanks = async () => {
    setLoading(true);
    setError("");
    try {
      setBanks(toList(await bankAPI.getAllBanks()));
    } catch (err) {
      setError(err.message);
      console.error("Error fetching banks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  // ---- Save / delete -------------------------------------------------------

  const isEditing = Boolean(formBank?.id);

  const handleSave = async (values) => {
    const bankData = { ...values, balance: parseFloat(values.balance) || 0 };
    if (isEditing) {
      const saved = unwrap(await bankAPI.updateBank(formBank.id, bankData), "bank");
      // Merge so a wrapped or partial response can't blank the row
      setBanks((prev) =>
        prev.map((b) => (b.id === formBank.id ? { ...b, ...bankData, ...(saved?.id ? saved : {}) } : b))
      );
      notify("success", `${bankData.bank_name} · ${bankData.account_number} was saved.`, "Account updated");
    } else {
      await bankAPI.createBank(bankData);
      await fetchBanks();
      notify("success", `${bankData.bank_name} · ${bankData.account_number} was added.`, "Account added");
    }
    setFormBank(null);
  };

  const handleDelete = async () => {
    const bank = bankToDelete;
    await bankAPI.deleteBank(bank.id);
    setBanks((prev) => prev.filter((b) => b.id !== bank.id));
    setBankToDelete(null);
    notify("success", `${bank.bank_name} · ${bank.account_number} was removed.`, "Account deleted");
  };

  // ---- Filtering -------------------------------------------------------------

  const term = searchTerm.trim().toLowerCase();
  const filteredBanks = banks.filter(
    (bank) =>
      matchesTerm(term, [bank.bank_name, bank.account_number, bank.account_name, bank.branch, bank.description]) &&
      (!selectedType || bank.account_type === selectedType)
  );

  const hasFilters = Boolean(searchTerm || selectedType);
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedType("");
  };

  const pager = usePagination(filteredBanks, 25, `${searchTerm}|${selectedType}`);

  const accountTypes = [...new Set([...ACCOUNT_TYPES, ...banks.map((b) => b.account_type).filter(Boolean)])];
  const totalBalance = banks.reduce((sum, b) => sum + balanceOf(b), 0);
  const filteredBalance = filteredBanks.reduce((sum, b) => sum + balanceOf(b), 0);
  const largest = banks.reduce((top, b) => (!top || balanceOf(b) > balanceOf(top) ? b : top), null);

  const tiles = [
    {
      icon: Landmark,
      iconClass: "bg-blue-50 text-blue-700",
      label: "Bank Accounts",
      value: banks.length,
      hint: `${new Set(banks.map((b) => b.bank_name).filter(Boolean)).size} banks`,
    },
    { icon: Wallet, iconClass: "bg-green-50 text-green-700", label: "Total Balance", value: formatNaira(totalBalance) },
    {
      icon: Layers,
      iconClass: "bg-purple-50 text-purple-700",
      label: "Largest Balance",
      value: largest ? formatNaira(balanceOf(largest)) : "—",
      hint: largest ? `${largest.bank_name} · ${largest.account_type || "Account"}` : null,
    },
  ];

  // ---- Render ----------------------------------------------------------------

  const actions = (bank) => (
    <div className="flex justify-end gap-1">
      <button onClick={() => setFormBank(bank)} className={iconButtonClass()} title="Edit" aria-label={`Edit ${bank.bank_name}`}>
        <Pencil size={15} />
      </button>
      <button
        onClick={() => setBankToDelete(bank)}
        className={iconButtonClass("red")}
        title="Delete"
        aria-label={`Delete ${bank.bank_name}`}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );

  let body;
  if (loading && banks.length === 0) {
    body = <LoadingState label="Loading bank accounts…" />;
  } else if (error && banks.length === 0) {
    body = (
      <EmptyState
        icon={AlertTriangle}
        tone="red"
        title="Couldn't load bank accounts"
        hint={error}
        action={
          <button onClick={fetchBanks} className={secondaryButtonClass}>
            Try again
          </button>
        }
      />
    );
  } else if (filteredBanks.length === 0) {
    body = (
      <EmptyState
        icon={Landmark}
        title={banks.length === 0 ? "No bank accounts yet" : "No accounts match your filters"}
        hint={banks.length === 0 ? "Add the accounts your business pays into and from" : "Try a different search or account type"}
        action={
          hasFilters ? (
            <button onClick={clearFilters} className={secondaryButtonClass}>
              Clear filters
            </button>
          ) : canManage ? (
            <button onClick={() => setFormBank({})} className={toolbarButtonClass.primary}>
              <Plus size={14} />
              Add Bank Account
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
              <col className="w-[22%]" />
              <col className="w-[24%]" />
              <col className="w-[12%]" />
              <col className="w-[16%]" />
              <col />
              {canManage && <col className="w-[5.5rem]" />}
            </colgroup>
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr className="text-left">
                <th className={`px-5 py-2.5 ${statLabelClass}`}>Bank</th>
                <th className={`px-3 py-2.5 ${statLabelClass}`}>Account</th>
                <th className={`px-3 py-2.5 ${statLabelClass}`}>Type</th>
                <th className={`px-3 py-2.5 text-right ${statLabelClass}`}>Balance</th>
                <th className={`px-3 py-2.5 ${statLabelClass}`}>Description</th>
                {canManage && <th className={`px-5 py-2.5 text-right ${statLabelClass}`}>Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pager.pageRows.map((bank) => (
                <tr key={bank.id} className="transition-colors hover:bg-blue-50/50">
                  <td className="px-5 py-3">
                    <div className="font-medium text-gray-900 truncate">{bank.bank_name}</div>
                    <div className="text-xs text-gray-500 truncate">{bank.branch || "No branch"}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-mono text-gray-900 truncate">{bank.account_number}</div>
                    <div className="text-xs text-gray-500 truncate">{bank.account_name}</div>
                  </td>
                  <td className="px-3 py-3">{bank.account_type ? <Badge>{bank.account_type}</Badge> : "—"}</td>
                  <td
                    className={`px-3 py-3 font-semibold text-right truncate ${
                      balanceOf(bank) < 0 ? "text-red-600" : "text-gray-900"
                    }`}
                  >
                    {formatNaira(bank.balance)}
                  </td>
                  <td className="px-3 py-3 text-gray-600 truncate" title={bank.description}>
                    {bank.description || "—"}
                  </td>
                  {canManage && <td className="px-5 py-2">{actions(bank)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <ul className="divide-y divide-gray-100 md:hidden">
          {pager.pageRows.map((bank) => (
            <li key={bank.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{bank.bank_name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    <span className="font-mono">{bank.account_number}</span> · {bank.account_name}
                  </p>
                </div>
                <p
                  className={`text-sm font-bold whitespace-nowrap ${
                    balanceOf(bank) < 0 ? "text-red-600" : "text-gray-900"
                  }`}
                >
                  {formatNaira(bank.balance)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-600">
                {bank.account_type && <Badge>{bank.account_type}</Badge>}
                <span>{bank.branch || "No branch"}</span>
              </div>
              {bank.description && <p className="mt-2 text-xs text-gray-600">{bank.description}</p>}
              {canManage && (
                <div className="grid grid-cols-2 mt-3 border border-gray-200 divide-x divide-gray-200">
                  <button
                    onClick={() => setFormBank(bank)}
                    className="flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  <button
                    onClick={() => setBankToDelete(bank)}
                    className="flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
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

      <PageTitle title="Bank Management" description="The accounts your business banks with" />
      <FolioNav />

      <div className="mt-5 space-y-5">
        <StatTiles tiles={tiles} loading={loading && banks.length === 0} />

        <section className="bg-white border border-gray-200">
          <PanelHeader
            title="Bank Accounts"
            meta={
              loading && banks.length === 0
                ? "Loading…"
                : `${filteredBanks.length} ${hasFilters ? "matching" : "accounts"} · ${formatNaira(filteredBalance)}`
            }
          >
            {hasFilters && (
              <button onClick={clearFilters} className={toolbarButtonClass.ghost}>
                <X size={14} />
                Clear filters
              </button>
            )}
            <button onClick={fetchBanks} disabled={loading} className={toolbarButtonClass.secondary}>
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            {canManage && (
              <button onClick={() => setFormBank({})} className={toolbarButtonClass.primary}>
                <Plus size={14} />
                Add Bank Account
              </button>
            )}
          </PanelHeader>

          <FilterBar
            search={searchTerm}
            onSearch={setSearchTerm}
            placeholder="Search by bank, account number, name or branch"
            filtersActive={Boolean(selectedType)}
            filters={
              <FilterSelect value={selectedType} onChange={(e) => setSelectedType(e.target.value)} aria-label="Filter by account type">
                <option value="">All Account Types</option>
                {accountTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </FilterSelect>
            }
          />

          {body}
        </section>
      </div>

      {canManage && formBank && (
        <FormModal
          key={formBank.id || "new"}
          title={isEditing ? "Edit Bank Account" : "Add Bank Account"}
          subtitle={isEditing ? `${formBank.bank_name} · ${formBank.account_number}` : "Record an account the business uses"}
          icon={isEditing ? Pencil : Landmark}
          fields={BANK_FIELDS}
          initialValues={
            isEditing
              ? Object.fromEntries(Object.keys(EMPTY_BANK).map((k) => [k, formBank[k] ?? ""]))
              : EMPTY_BANK
          }
          submitLabel={isEditing ? "Update Account" : "Add Account"}
          errorTitle={isEditing ? "Account not updated" : "Account not added"}
          onSubmit={handleSave}
          onClose={() => setFormBank(null)}
        />
      )}

      {canManage && bankToDelete && (
        <ConfirmDeleteModal
          title="Delete Bank Account"
          message="This removes the account from your records."
          details={[
            ["Bank", bankToDelete.bank_name],
            ["Account", `${bankToDelete.account_number} · ${bankToDelete.account_name}`],
            ["Balance", formatNaira(bankToDelete.balance)],
          ]}
          confirmLabel="Delete Account"
          onConfirm={handleDelete}
          onClose={() => setBankToDelete(null)}
        />
      )}
    </div>
  );
}
