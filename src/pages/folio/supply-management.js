import { useState, useEffect } from "react";
import FolioNav from "../../components/FolioNav";
import { useAuth } from "../../context/AuthContext";
import {
  AlertTriangle,
  Building2,
  Contact,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Trash2,
  User,
  UserX,
  X,
} from "lucide-react";

import { supplierAPI } from "../../../services/api";
import {
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

const SUPPLIER_FIELDS = [
  { name: "name", label: "Supplier Name", required: true, placeholder: "Company or trader name" },
  { name: "contact_name", label: "Contact Person", placeholder: "Who you deal with" },
  { name: "email", label: "Email", type: "email", placeholder: "email@example.com", span: "half" },
  { name: "phone", label: "Phone", type: "tel", placeholder: "Phone number", span: "half" },
  { name: "address", label: "Address", type: "textarea", rows: 2, placeholder: "Supplier address" },
  { name: "description", label: "Description", type: "textarea", placeholder: "What they supply, terms, notes" },
];

const EMPTY_SUPPLIER = { name: "", contact_name: "", email: "", phone: "", address: "", description: "" };

const hasContact = (s) => Boolean(s.contact_name || s.email || s.phone);

// Optional fields left blank aren't sent, as before
const toPayload = (values) => Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ""));

// Main Supplier Management Component
export default function SupplierManagement() {
  // Several roles can look at suppliers; only procurement (and admins) change them
  const { can } = useAuth();
  const canManage = can("suppliers.manage");
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [contactFilter, setContactFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formSupplier, setFormSupplier] = useState(null); // {} = new, supplier = edit
  const [supplierToDelete, setSupplierToDelete] = useState(null);
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

  // ---- Save / delete -------------------------------------------------------

  const isEditing = Boolean(formSupplier?.id);

  const handleSave = async (values) => {
    const payload = toPayload(values);
    if (isEditing) {
      const saved = unwrap(await supplierAPI.updateSupplier(formSupplier.id, payload), "supplier");
      // Merge so a wrapped or partial response can't blank the row
      setSuppliers((prev) =>
        prev.map((s) =>
          s.id === formSupplier.id
            ? { ...s, ...values, updated_at: new Date().toISOString(), ...(saved?.id ? saved : {}) }
            : s
        )
      );
      notify("success", `${values.name} was saved.`, "Supplier updated");
    } else {
      await supplierAPI.createSupplier(payload);
      await fetchSuppliers();
      notify("success", `${values.name} was added.`, "Supplier added");
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

  // ---- Filtering -------------------------------------------------------------

  const term = searchTerm.trim().toLowerCase();
  const filteredSuppliers = suppliers.filter(
    (s) =>
      matchesTerm(term, [s.name, s.contact_name, s.email, s.phone, s.address, s.description]) &&
      (!contactFilter || (contactFilter === "with" ? hasContact(s) : !hasContact(s)))
  );

  const hasFilters = Boolean(searchTerm || contactFilter);
  const clearFilters = () => {
    setSearchTerm("");
    setContactFilter("");
  };

  const pager = usePagination(filteredSuppliers, 25, `${searchTerm}|${contactFilter}`);

  const withContact = suppliers.filter(hasContact).length;
  const tiles = [
    { icon: Building2, iconClass: "bg-blue-50 text-blue-700", label: "Total Suppliers", value: suppliers.length },
    { icon: Contact, iconClass: "bg-green-50 text-green-700", label: "With Contact Info", value: withContact },
    {
      icon: UserX,
      iconClass: "bg-amber-50 text-amber-700",
      label: "Missing Contact Info",
      value: suppliers.length - withContact,
      hint: suppliers.length - withContact > 0 ? "Add a phone or email to reach them" : null,
    },
  ];

  // ---- Render ----------------------------------------------------------------

  const contactLines = (s) => (
    <>
      {s.email ? (
        <a
          href={`mailto:${s.email}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 text-blue-600 truncate hover:underline"
        >
          <Mail size={12} className="shrink-0" />
          <span className="truncate">{s.email}</span>
        </a>
      ) : null}
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
      {!s.email && !s.phone && <span className="text-gray-400">—</span>}
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
              <col className="w-[15%]" />
              <col className="w-[22%]" />
              <col />
              <col className="w-[11%]" />
              {canManage && <col className="w-[5.5rem]" />}
            </colgroup>
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr className="text-left">
                <th className={`px-5 py-2.5 ${statLabelClass}`}>Supplier</th>
                <th className={`px-3 py-2.5 ${statLabelClass}`}>Contact Person</th>
                <th className={`px-3 py-2.5 ${statLabelClass}`}>Email / Phone</th>
                <th className={`px-3 py-2.5 ${statLabelClass}`}>Address</th>
                <th className={`px-3 py-2.5 ${statLabelClass}`}>Updated</th>
                {canManage && <th className={`px-5 py-2.5 text-right ${statLabelClass}`}>Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pager.pageRows.map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-blue-50/50">
                  <td className="px-5 py-3">
                    <div className="font-medium text-gray-900 truncate">{s.name}</div>
                    <div className="text-xs text-gray-500 truncate" title={s.description}>
                      {s.description || "No description"}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-gray-700 truncate">{s.contact_name || "—"}</td>
                  <td className="px-3 py-3">{contactLines(s)}</td>
                  <td className="px-3 py-3 text-gray-600 truncate" title={s.address}>
                    {s.address || "—"}
                  </td>
                  <td className="px-3 py-3 text-gray-700 truncate">{formatDay(s.updated_at)}</td>
                  {canManage && (
                    <td className="px-5 py-2">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setFormSupplier(s)} className={iconButtonClass()} title="Edit" aria-label={`Edit ${s.name}`}>
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setSupplierToDelete(s)}
                          className={iconButtonClass("red")}
                          title="Delete"
                          aria-label={`Delete ${s.name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  )}
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
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{s.name}</p>
                  {s.contact_name && (
                    <p className="flex items-center gap-1 text-xs text-gray-500 truncate">
                      <User size={11} className="shrink-0" />
                      {s.contact_name}
                    </p>
                  )}
                </div>
                <span className="text-[11px] text-gray-400 whitespace-nowrap">{formatDay(s.updated_at)}</span>
              </div>
              <div className="mt-2 space-y-1 text-sm">{contactLines(s)}</div>
              {s.address && (
                <p className="flex items-start gap-1.5 mt-1 text-xs text-gray-600">
                  <MapPin size={11} className="mt-0.5 shrink-0" />
                  {s.address}
                </p>
              )}
              {s.description && <p className="mt-2 text-xs text-gray-600">{s.description}</p>}
              {canManage && (
                <div className="grid grid-cols-2 mt-3 border border-gray-200 divide-x divide-gray-200">
                  <button
                    onClick={() => setFormSupplier(s)}
                    className="flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  <button
                    onClick={() => setSupplierToDelete(s)}
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

      <PageTitle title="Supplier Management" description="The businesses you buy stock from" />
      <FolioNav />

      <div className="mt-5 space-y-5">
        <StatTiles tiles={tiles} loading={loading && suppliers.length === 0} />

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
            placeholder="Search by name, contact, email, phone or address"
            filtersActive={Boolean(contactFilter)}
            filters={
              <FilterSelect value={contactFilter} onChange={(e) => setContactFilter(e.target.value)} aria-label="Filter by contact info">
                <option value="">All Suppliers</option>
                <option value="with">With contact info</option>
                <option value="missing">Missing contact info</option>
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
          subtitle={isEditing ? formSupplier.name : "Save who you buy stock from"}
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
    </div>
  );
}
