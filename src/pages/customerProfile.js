import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CreditCard,
  History,
  Mail,
  MapPin,
  Phone,
  PiggyBank,
  Plus,
  RefreshCw,
  StickyNote,
  UserRound,
  Wallet,
} from "lucide-react";

import { customerAPI } from "../../services/api";
import { useAuth } from "../context/AuthContext";
import {
  Badge,
  EmptyState,
  FormModal,
  LoadingState,
  Pagination,
  PanelHeader,
  StatTiles,
  formatDay,
  formatNaira,
  secondaryButtonClass,
  statLabelClass,
  toDate,
  toList,
  toolbarButtonClass,
  unwrap,
  usePagination,
  useToast,
} from "../components/ui/Boxy";

const DEPOSIT_FIELDS = [
  { name: "amount", label: "Amount", type: "number", required: true, prefix: "₦", placeholder: "0.00" },
  { name: "description", label: "Description", type: "textarea", placeholder: "e.g. Cash paid at the till" },
];

const formatClock = (value) =>
  toDate(value)?.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) || "";

const capitalize = (value) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : "—");

// Rendered inside Customer Management (with customerId/onBack), or on its own
// at /customerProfile?id=123
const CustomerProfile = ({ customerId: customerIdProp, onBack: onBackProp }) => {
  const router = useRouter();
  const customerId = customerIdProp ?? router.query.id;
  const onBack = onBackProp || (() => router.push("/folio/customer-management"));
  // Deposits are money in: accountants and admins only
  const { can } = useAuth();
  const canDeposit = can("customers.deposit");

  const [customer, setCustomer] = useState(null);
  const [deposits, setDeposits] = useState([]);
  const [showAddDeposit, setShowAddDeposit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { notify, toastElement } = useToast();

  // Fetch customer details and deposits
  const fetchCustomerData = async () => {
    setLoading(true);
    setError("");
    try {
      const [customerData, depositsData] = await Promise.all([
        customerAPI.getCustomerById(customerId),
        customerAPI.getCustomerDeposits(customerId),
      ]);
      setCustomer(unwrap(customerData, "customer"));
      setDeposits(toList(depositsData));
    } catch (err) {
      setError(err.message);
      console.error("Error loading customer profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) fetchCustomerData();
    else if (router.isReady) setLoading(false);
  }, [customerId, router.isReady]);

  const handleAddDeposit = async (values) => {
    const amount = parseFloat(values.amount);
    if (!(amount > 0)) throw new Error("Enter an amount greater than zero.");

    await customerAPI.addDeposit(customerId, { ...values, amount });
    await fetchCustomerData();
    setShowAddDeposit(false);
    notify("success", `${formatNaira(amount)} added to ${customer?.name || "the customer"}'s account.`, "Deposit recorded");
  };

  // Newest deposits first
  const sortedDeposits = [...deposits].sort(
    (a, b) => (toDate(b.created_at)?.getTime() || 0) - (toDate(a.created_at)?.getTime() || 0)
  );
  const pager = usePagination(sortedDeposits, 10, deposits.length);

  // ---- Loading / missing states -------------------------------------------

  const backButton = (
    <button onClick={onBack} className={toolbarButtonClass.secondary}>
      <ArrowLeft size={14} />
      Back to Customers
    </button>
  );

  if (loading) {
    return (
      <div className="pt-0 mt-0 font-raleway">
        <div className="mb-5">{backButton}</div>
        <section className="bg-white border border-gray-200">
          <LoadingState label="Loading customer profile…" />
        </section>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="pt-0 mt-0 font-raleway">
        <div className="mb-5">{backButton}</div>
        <section className="bg-white border border-gray-200">
          <EmptyState
            icon={error ? AlertTriangle : UserRound}
            tone={error ? "red" : "gray"}
            title={!customerId ? "No customer selected" : error ? "Couldn't load this customer" : "Customer not found"}
            hint={!customerId ? "Open a customer from Customer Management" : error || "They may have been deleted"}
            action={
              customerId && error ? (
                <button onClick={fetchCustomerData} className={secondaryButtonClass}>
                  Try again
                </button>
              ) : null
            }
          />
        </section>
      </div>
    );
  }

  // ---- Figures --------------------------------------------------------------

  const balance = parseFloat(customer.balance) || 0;
  const owing = balance < 0;
  const creditLimit = parseFloat(customer.credit_limit) || 0;
  const availableCredit = Math.max(0, creditLimit - (owing ? Math.abs(balance) : 0));
  const totalDeposits = deposits.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
  const lastDeposit = sortedDeposits[0];

  const tiles = [
    {
      icon: Wallet,
      iconClass: owing ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700",
      label: "Current Balance",
      value: formatNaira(Math.abs(balance)),
      hint: owing ? "Owes you" : balance > 0 ? "In credit" : "Settled",
      hintClass: owing ? "text-red-600" : balance > 0 ? "text-green-700" : "text-gray-500",
    },
    {
      icon: CreditCard,
      iconClass: "bg-purple-50 text-purple-700",
      label: "Credit Limit",
      value: formatNaira(creditLimit),
      hint: creditLimit > 0 ? `${formatNaira(availableCredit)} still available` : "No credit allowed",
    },
    {
      icon: PiggyBank,
      iconClass: "bg-blue-50 text-blue-700",
      label: "Total Deposits",
      value: formatNaira(totalDeposits),
      hint: deposits.length
        ? `${deposits.length} deposit${deposits.length === 1 ? "" : "s"} · last ${formatDay(lastDeposit?.created_at)}`
        : "No deposits yet",
    },
  ];

  const details = [
    { icon: Phone, label: "Phone", value: customer.phone, href: customer.phone && `tel:${customer.phone}` },
    { icon: Mail, label: "Email", value: customer.email, href: customer.email && `mailto:${customer.email}` },
    { icon: UserRound, label: "Gender", value: capitalize(customer.gender) },
    { icon: CalendarDays, label: "Birthday", value: customer.birthday ? formatDay(customer.birthday) : null },
    { icon: MapPin, label: "Address", value: customer.address, wide: true },
  ];

  const initial = (customer.name || "?").charAt(0).toUpperCase();

  // ---- Render ---------------------------------------------------------------

  return (
    <div className="pt-0 mt-0 font-raleway">
      {toastElement}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        {backButton}
        <div className="flex gap-2">
          <button onClick={fetchCustomerData} className={toolbarButtonClass.secondary}>
            <RefreshCw size={13} />
            Refresh
          </button>
          {canDeposit && (
            <button onClick={() => setShowAddDeposit(true)} className={toolbarButtonClass.primary}>
              <Plus size={14} />
              Add Deposit
            </button>
          )}
        </div>
      </div>

      <div className="space-y-5">
        {/* Identity */}
        <section className="flex items-center gap-4 px-5 py-4 bg-white border border-gray-200">
          <div className="flex items-center justify-center w-12 h-12 text-lg font-semibold text-blue-700 shrink-0 bg-blue-50">
            {initial}
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-gray-900 truncate">{customer.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-gray-500">
              <span>Customer ID {customer.id}</span>
              <Badge
                className={
                  owing ? "bg-red-50 text-red-700" : balance > 0 ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
                }
              >
                {owing ? "Debtor" : balance > 0 ? "Creditor" : "Settled"}
              </Badge>
            </div>
          </div>
        </section>

        <StatTiles tiles={tiles} />

        <div className="grid gap-5 lg:grid-cols-3 lg:items-start">
          <div className="space-y-5 lg:col-span-2">
            {/* Details */}
            <section className="bg-white border border-gray-200">
              <PanelHeader title="Details" />
              <dl className="grid gap-px bg-gray-200 sm:grid-cols-2">
                {details.map(({ icon: Icon, label, value, href, wide }) => (
                  <div key={label} className={`px-5 py-3.5 bg-white ${wide ? "sm:col-span-2" : ""}`}>
                    <dt className={`flex items-center gap-1.5 ${statLabelClass}`}>
                      <Icon size={11} />
                      {label}
                    </dt>
                    <dd className="mt-0.5 text-sm font-medium text-gray-900 break-words">
                      {value ? (
                        href ? (
                          <a href={href} className="text-blue-600 hover:underline">
                            {value}
                          </a>
                        ) : (
                          value
                        )
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            {/* Deposit History */}
            <section className="bg-white border border-gray-200">
              <PanelHeader
                title="Deposit History"
                meta={deposits.length ? `${deposits.length} · ${formatNaira(totalDeposits)} · newest first` : null}
              >
                {canDeposit && (
                  <button onClick={() => setShowAddDeposit(true)} className={toolbarButtonClass.secondary}>
                    <Plus size={13} />
                    Add Deposit
                  </button>
                )}
              </PanelHeader>

              {deposits.length === 0 ? (
                <EmptyState
                  icon={History}
                  title="No deposits yet"
                  hint="Money the customer pays into their account will appear here"
                />
              ) : (
                <>
                  <table className="w-full text-sm table-fixed">
                    <colgroup>
                      <col className="w-[34%] sm:w-[28%]" />
                      <col className="w-[30%] sm:w-[22%]" />
                      <col />
                    </colgroup>
                    <thead className="border-b border-gray-200 bg-gray-50">
                      <tr className="text-left">
                        <th className={`px-5 py-2.5 ${statLabelClass}`}>Date</th>
                        <th className={`px-3 py-2.5 text-right ${statLabelClass}`}>Amount</th>
                        <th className={`px-5 py-2.5 ${statLabelClass}`}>Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {pager.pageRows.map((deposit, index) => (
                        <tr key={deposit.id ?? index} className="transition-colors hover:bg-blue-50/50">
                          <td className="px-5 py-3">
                            <div className="text-gray-900 truncate">{formatDay(deposit.created_at)}</div>
                            <div className="text-xs text-gray-500">{formatClock(deposit.created_at)}</div>
                          </td>
                          <td className="px-3 py-3 font-semibold text-right text-green-700 truncate">
                            {formatNaira(deposit.amount)}
                          </td>
                          <td className="px-5 py-3 text-gray-700 break-words">
                            {deposit.description || <span className="text-gray-400">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Pagination {...pager} shown={pager.pageRows.length} />
                </>
              )}
            </section>
          </div>

          {/* Notes */}
          <section className="bg-white border border-gray-200">
            <PanelHeader title="Notes" />
            <div className="px-5 py-4">
              {customer.notes ? (
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{customer.notes}</p>
              ) : (
                <p className="flex items-center gap-2 text-sm text-gray-400">
                  <StickyNote size={14} />
                  No notes for this customer. Add them from Edit in Customer Management.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>

      {canDeposit && showAddDeposit && (
        <FormModal
          title="Add Deposit"
          subtitle={`Pay into ${customer.name}'s account`}
          icon={PiggyBank}
          fields={DEPOSIT_FIELDS}
          initialValues={{ amount: "", description: "" }}
          submitLabel="Add Deposit"
          busyLabel="Recording…"
          errorTitle="Deposit not recorded"
          onSubmit={handleAddDeposit}
          onClose={() => setShowAddDeposit(false)}
        />
      )}
    </div>
  );
};

export default CustomerProfile;
