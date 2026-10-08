import { useState, useEffect } from "react";
import FolioNav from "../../components/FolioNav";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  ChevronRight,
  Mail,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import CustomerProfile from "../customerProfile";

import { customerAPI } from "../../../services/api";
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
  formatDay,
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

const GENDERS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "other", label: "Other" },
];

const CUSTOMER_FIELDS = [
  { name: "name", label: "Full Name", required: true, placeholder: "Customer's full name" },
  { name: "gender", label: "Gender", type: "select", required: true, span: "half", options: GENDERS },
  { name: "phone", label: "Phone", type: "tel", required: true, placeholder: "Phone number", span: "half" },
  { name: "email", label: "Email", type: "email", required: true, placeholder: "email@example.com", span: "half" },
  { name: "birthday", label: "Birthday", type: "date", span: "half" },
  {
    name: "balance",
    label: "Balance",
    type: "number",
    prefix: "₦",
    span: "half",
    hint: "Negative if the customer owes you",
  },
  { name: "credit_limit", label: "Credit Limit", type: "number", prefix: "₦", span: "half" },
  { name: "address", label: "Address", placeholder: "Street address" },
  { name: "notes", label: "Notes", type: "textarea", placeholder: "Anything worth remembering" },
];

const EMPTY_CUSTOMER = {
  name: "",
  gender: "female",
  phone: "",
  email: "",
  address: "",
  birthday: "",
  balance: "0.00",
  credit_limit: "0.00",
  notes: "",
};

const GENDER_BADGE = {
  male: "bg-blue-50 text-blue-700",
  female: "bg-rose-50 text-rose-700",
  other: "bg-purple-50 text-purple-700",
};

const balanceOf = (customer) => parseFloat(customer.balance) || 0;

const balanceStatus = (customer) => {
  const balance = balanceOf(customer);
  if (balance < 0) return "owing";
  if (balance > 0) return "credit";
  return "settled";
};

const capitalize = (value) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : "—");

// Negative balance = the customer owes the business
const BalanceCell = ({ customer, align = "right" }) => {
  const balance = balanceOf(customer);
  const status = balanceStatus(customer);
  return (
    <div className={align === "right" ? "text-right" : ""}>
      <div
        className={`font-semibold ${
          status === "owing" ? "text-red-600" : status === "credit" ? "text-green-700" : "text-gray-900"
        }`}
      >
        {formatNaira(Math.abs(balance))}
      </div>
      <div className="text-[11px] text-gray-500">
        {status === "owing" ? "Owes you" : status === "credit" ? "In credit" : "Settled"}
      </div>
    </div>
  );
};

// Main Customer Management Component
export default function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [selectedBalance, setSelectedBalance] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formCustomer, setFormCustomer] = useState(null); // {} = new, customer = edit
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [profileId, setProfileId] = useState(null);
  const { notify, toastElement } = useToast();

  // Fetch customers from API
  const fetchCustomers = async () => {
    setLoading(true);
    setError("");
    try {
      setCustomers(toList(await customerAPI.getAllCustomers()));
    } catch (err) {
      setError(err.message);
      console.error("Error fetching customers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // ---- Save / delete -------------------------------------------------------

  const isEditing = Boolean(formCustomer?.id);

  const handleSave = async (values) => {
    if (isEditing) {
      const saved = unwrap(await customerAPI.updateCustomer(formCustomer.id, values), "customer");
      // Merge so a wrapped or partial response can't blank the row
      setCustomers((prev) =>
        prev.map((c) => (c.id === formCustomer.id ? { ...c, ...values, ...(saved?.id ? saved : {}) } : c))
      );
      notify("success", `${values.name} was saved.`, "Customer updated");
    } else {
      await customerAPI.createCustomer(values);
      await fetchCustomers();
      notify("success", `${values.name} was added.`, "Customer added");
    }
    setFormCustomer(null);
  };

  const handleDelete = async () => {
    const customer = customerToDelete;
    await customerAPI.deleteCustomer(customer.id);
    setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
    setCustomerToDelete(null);
    notify("success", `${customer.name} was removed.`, "Customer deleted");
  };

  // ---- Filtering -------------------------------------------------------------

  const term = searchTerm.trim().toLowerCase();
  const filteredCustomers = customers.filter(
    (c) =>
      matchesTerm(term, [c.name, c.email, c.phone, c.address, c.id]) &&
      (!selectedGender || c.gender === selectedGender) &&
      (!selectedBalance || balanceStatus(c) === selectedBalance)
  );

  const hasFilters = Boolean(searchTerm || selectedGender || selectedBalance);
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedGender("");
    setSelectedBalance("");
  };

  const pager = usePagination(filteredCustomers, 25, `${searchTerm}|${selectedGender}|${selectedBalance}`);

  const debtors = customers.filter((c) => balanceStatus(c) === "owing");
  const creditors = customers.filter((c) => balanceStatus(c) === "credit");
  const debtAmount = debtors.reduce((sum, c) => sum + Math.abs(balanceOf(c)), 0);
  const creditAmount = creditors.reduce((sum, c) => sum + balanceOf(c), 0);

  const tiles = [
    { icon: Users, iconClass: "bg-blue-50 text-blue-700", label: "Total Customers", value: customers.length },
    {
      icon: ArrowDownCircle,
      iconClass: "bg-red-50 text-red-700",
      label: "Debtors",
      value: debtors.length,
      hint: `${formatNaira(debtAmount)} owed to you`,
      hintClass: "text-red-600",
    },
    {
      icon: ArrowUpCircle,
      iconClass: "bg-green-50 text-green-700",
      label: "Creditors",
      value: creditors.length,
      hint: `${formatNaira(creditAmount)} held in credit`,
      hintClass: "text-green-700",
    },
  ];

  // The profile replaces the list; going back refreshes balances
  if (profileId) {
    return (
      <CustomerProfile
        customerId={profileId}
        onBack={() => {
          setProfileId(null);
          fetchCustomers();
        }}
      />
    );
  }

  // ---- Render ----------------------------------------------------------------

  const stop = (fn) => (e) => {
    e.stopPropagation();
    fn();
  };

  let body;
  if (loading && customers.length === 0) {
    body = <LoadingState label="Loading customers…" />;
  } else if (error && customers.length === 0) {
    body = (
      <EmptyState
        icon={AlertTriangle}
        tone="red"
        title="Couldn't load customers"
        hint={error}
        action={
          <button onClick={fetchCustomers} className={secondaryButtonClass}>
            Try again
          </button>
        }
      />
    );
  } else if (filteredCustomers.length === 0) {
    body = (
      <EmptyState
        icon={Users}
        title={customers.length === 0 ? "No customers yet" : "No customers match your filters"}
        hint={customers.length === 0 ? "Add customers to track balances and credit" : "Try a different search or filter"}
        action={
          hasFilters ? (
            <button onClick={clearFilters} className={secondaryButtonClass}>
              Clear filters
            </button>
          ) : (
            <button onClick={() => setFormCustomer({})} className={toolbarButtonClass.primary}>
              <Plus size={14} />
              Add Customer
            </button>
          )
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
              <col />
              <col className="w-[10%]" />
              <col className="w-[15%]" />
              <col className="w-[13%]" />
              <col className="w-[12%]" />
              <col className="w-[5.5rem]" />
            </colgroup>
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr className="text-left">
                <th className={`px-5 py-2.5 ${statLabelClass}`}>Customer</th>
                <th className={`px-3 py-2.5 ${statLabelClass}`}>Contact</th>
                <th className={`px-3 py-2.5 ${statLabelClass}`}>Gender</th>
                <th className={`px-3 py-2.5 text-right ${statLabelClass}`}>Balance</th>
                <th className={`px-3 py-2.5 text-right ${statLabelClass}`}>Credit Limit</th>
                <th className={`px-3 py-2.5 ${statLabelClass}`}>Birthday</th>
                <th className={`px-5 py-2.5 text-right ${statLabelClass}`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pager.pageRows.map((customer) => (
                <tr
                  key={customer.id}
                  onClick={() => setProfileId(customer.id)}
                  className="transition-colors cursor-pointer hover:bg-blue-50/50"
                  title="Open customer profile"
                >
                  <td className="px-5 py-3">
                    <div className="font-medium text-gray-900 truncate">{customer.name}</div>
                    <div className="text-xs text-gray-500">ID {customer.id}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5 text-gray-900 truncate">
                      <Mail size={12} className="text-gray-400 shrink-0" />
                      <span className="truncate">{customer.email || "—"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 truncate">
                      <Phone size={11} className="text-gray-400 shrink-0" />
                      <span className="truncate">{customer.phone || "—"}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <Badge className={GENDER_BADGE[customer.gender] || undefined}>{capitalize(customer.gender)}</Badge>
                  </td>
                  <td className="px-3 py-3">
                    <BalanceCell customer={customer} />
                  </td>
                  <td className="px-3 py-3 text-right text-gray-700 truncate">{formatNaira(customer.credit_limit)}</td>
                  <td className="px-3 py-3 text-gray-700 truncate">{formatDay(customer.birthday)}</td>
                  <td className="px-5 py-2">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={stop(() => setFormCustomer(customer))}
                        className={iconButtonClass()}
                        title="Edit"
                        aria-label={`Edit ${customer.name}`}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={stop(() => setCustomerToDelete(customer))}
                        className={iconButtonClass("red")}
                        title="Delete"
                        aria-label={`Delete ${customer.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <ul className="divide-y divide-gray-100 md:hidden">
          {pager.pageRows.map((customer) => (
            <li key={customer.id} className="px-5 py-4">
              <button type="button" onClick={() => setProfileId(customer.id)} className="w-full text-left">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                      <span className="truncate">{customer.name}</span>
                      <ChevronRight size={14} className="text-gray-400 shrink-0" />
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {customer.phone}
                      {customer.email && ` · ${customer.email}`}
                    </p>
                  </div>
                  <BalanceCell customer={customer} />
                </div>
                <div className="grid grid-cols-3 gap-px mt-3 bg-gray-200 border border-gray-200">
                  {[
                    ["Gender", capitalize(customer.gender)],
                    ["Credit Limit", formatNaira(customer.credit_limit)],
                    ["Birthday", formatDay(customer.birthday)],
                  ].map(([label, value]) => (
                    <div key={label} className="px-2.5 py-2 bg-white">
                      <div className={statLabelClass}>{label}</div>
                      <div className="text-xs font-semibold text-gray-900 truncate">{value}</div>
                    </div>
                  ))}
                </div>
              </button>
              <div className="grid grid-cols-2 mt-3 border border-gray-200 divide-x divide-gray-200">
                <button
                  onClick={() => setFormCustomer(customer)}
                  className="flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Pencil size={13} /> Edit
                </button>
                <button
                  onClick={() => setCustomerToDelete(customer)}
                  className="flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </li>
          ))}
        </ul>

        <Pagination {...pager} shown={pager.pageRows.length} />
      </>
    );
  }

  const genderOptions = [
    ...new Set([...GENDERS.map((g) => g.value), ...customers.map((c) => c.gender).filter(Boolean)]),
  ];

  return (
    <div className="pt-0 mt-0 font-raleway">
      {toastElement}

      <PageTitle title="Customer Management" description="Customers, their balances and credit limits" />
      <FolioNav />

      <div className="mt-5 space-y-5">
        <StatTiles tiles={tiles} loading={loading && customers.length === 0} />

        <section className="bg-white border border-gray-200">
          <PanelHeader
            title="Customers"
            meta={
              loading && customers.length === 0
                ? "Loading…"
                : `${filteredCustomers.length} ${hasFilters ? "matching" : "customers"} · click a row to open the profile`
            }
          >
            {hasFilters && (
              <button onClick={clearFilters} className={toolbarButtonClass.ghost}>
                <X size={14} />
                Clear filters
              </button>
            )}
            <button onClick={fetchCustomers} disabled={loading} className={toolbarButtonClass.secondary}>
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button onClick={() => setFormCustomer({})} className={toolbarButtonClass.primary}>
              <Plus size={14} />
              Add Customer
            </button>
          </PanelHeader>

          <FilterBar
            search={searchTerm}
            onSearch={setSearchTerm}
            placeholder="Search by name, email, phone, address or ID"
            columns="md:grid-cols-[minmax(0,1fr)_10rem_11rem]"
            filtersActive={Boolean(selectedGender || selectedBalance)}
            filters={
              <>
                <FilterSelect value={selectedGender} onChange={(e) => setSelectedGender(e.target.value)} aria-label="Filter by gender">
                  <option value="">All Genders</option>
                  {genderOptions.map((gender) => (
                    <option key={gender} value={gender}>
                      {capitalize(gender)}
                    </option>
                  ))}
                </FilterSelect>
                <FilterSelect value={selectedBalance} onChange={(e) => setSelectedBalance(e.target.value)} aria-label="Filter by balance">
                  <option value="">All Balances</option>
                  <option value="owing">Owing (debtors)</option>
                  <option value="credit">In credit (creditors)</option>
                  <option value="settled">Settled</option>
                </FilterSelect>
              </>
            }
          />

          {body}
        </section>
      </div>

      {formCustomer && (
        <FormModal
          key={formCustomer.id || "new"}
          title={isEditing ? "Edit Customer" : "Add Customer"}
          subtitle={isEditing ? formCustomer.name : "Save a customer's details and balance"}
          icon={isEditing ? Pencil : UserPlus}
          fields={CUSTOMER_FIELDS}
          initialValues={
            isEditing
              ? Object.fromEntries(
                  Object.keys(EMPTY_CUSTOMER).map((k) => [
                    k,
                    k === "birthday" ? String(formCustomer.birthday || "").slice(0, 10) : formCustomer[k] ?? EMPTY_CUSTOMER[k],
                  ])
                )
              : EMPTY_CUSTOMER
          }
          submitLabel={isEditing ? "Update Customer" : "Add Customer"}
          errorTitle={isEditing ? "Customer not updated" : "Customer not added"}
          onSubmit={handleSave}
          onClose={() => setFormCustomer(null)}
        />
      )}

      {customerToDelete && (
        <ConfirmDeleteModal
          title="Delete Customer"
          message="This removes the customer and their contact details from your records."
          details={[
            ["Name", customerToDelete.name],
            ["Phone", customerToDelete.phone || "—"],
            [
              "Balance",
              `${formatNaira(Math.abs(balanceOf(customerToDelete)))} ${
                balanceStatus(customerToDelete) === "owing" ? "owed" : balanceStatus(customerToDelete) === "credit" ? "credit" : ""
              }`.trim(),
            ],
          ]}
          confirmLabel="Delete Customer"
          onConfirm={handleDelete}
          onClose={() => setCustomerToDelete(null)}
        />
      )}
    </div>
  );
}
