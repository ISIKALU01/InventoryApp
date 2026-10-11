import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import {
  FaStore,
  FaCog,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaBuilding,
  FaMapMarkerAlt,
  FaPhone,
  FaGlobe,
  FaUserCog,
  FaUserShield,
  FaBell,
  FaShieldAlt,
  FaPalette,
  FaDatabase,
  FaCheck,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaUndo,
  FaSun,
  FaMoon,
  FaDesktop,
} from "react-icons/fa";

import { storeAPI } from "../../services/api";
import { useAuth } from "../context/AuthContext";
import UsersSection from "../components/settings/UsersSection";
import RolesSection from "../components/settings/RolesSection";
import {
  ModalFooter,
  ModalShell,
  Panel,
  Spinner,
  TOAST_DURATION,
  Toast,
  secondaryButtonClass,
  statLabelClass,
} from "../components/settings/ui";
import {
  ACCENTS,
  DEFAULT_APPEARANCE,
  SCALES,
  THEMES,
  APPEARANCE_EVENT,
  loadAppearance,
  saveAppearance,
} from "../../utils/appearance";

// ---------------------------------------------------------------------------
// Store form modal
// ---------------------------------------------------------------------------

// A shop sells to customers; a back store only keeps stock until it is moved to a shop
const STORE_TYPES = [
  { value: "shop", label: "Shop", help: "Customers buy here. The sales point sells from it." },
  { value: "back_store", label: "Back store", help: "A stock room. Goods are kept here and moved to a shop to be sold." },
];

const StoreFormModal = ({ isOpen, onClose, onSave, isLoading, store = null }) => {
  const [formData, setFormData] = useState({ name: "", type: "shop", address: "", phone: "", website: "" });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    setFormData({
      name: store?.name || "",
      type: store?.type || "shop",
      address: store?.address || "",
      phone: store?.phone || "",
      website: store?.website || "",
    });
    setErrors({});
  }, [store, isOpen]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Store name is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    await onSave(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  if (!isOpen) return null;

  const fieldClass = (hasError) =>
    `block w-full px-3 py-2.5 text-sm text-gray-800 bg-white border rounded-none outline-none transition-colors placeholder:text-gray-400 disabled:opacity-50 disabled:bg-gray-50 ${
      hasError
        ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
        : "border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
    }`;

  const labelClass =
    "flex items-center gap-2 mb-1.5 text-xs font-semibold tracking-wide text-gray-600 uppercase";

  return (
    <ModalShell
      title={store ? "Edit Store" : "Create New Store"}
      subtitle={store ? "Update store information" : "Add a new store to your account"}
      icon={FaStore}
      onClose={onClose}
      busy={isLoading}
    >
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-5 px-6 py-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass}>
              <FaBuilding className="text-gray-400" />
              Store Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              autoFocus
              disabled={isLoading}
              className={fieldClass(errors.name)}
              placeholder="Enter store name"
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          <fieldset className="sm:col-span-2">
            <legend className={labelClass}>
              <FaStore className="text-gray-400" />
              Type of store
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {STORE_TYPES.map((option) => (
                <label
                  key={option.value}
                  className={`flex gap-3 p-3 border cursor-pointer ${
                    formData.type === option.value ? "border-blue-600 bg-blue-50" : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="type"
                    value={option.value}
                    checked={formData.type === option.value}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="mt-0.5 accent-blue-600"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-gray-900">{option.label}</span>
                    <span className="block text-xs text-gray-500">{option.help}</span>
                  </span>
                </label>
              ))}
            </div>
            {store && store.type !== formData.type && (
              <p className="mt-2 text-xs text-amber-700">
                {formData.type === "back_store"
                  ? "The sales point will stop selling this store's stock. The stock stays here; move it to a shop to sell it."
                  : "The sales point will be able to sell this store's stock."}
              </p>
            )}
          </fieldset>

          <div className="sm:col-span-2">
            <label className={labelClass}>
              <FaMapMarkerAlt className="text-gray-400" />
              Address <span className="text-red-500">*</span>
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              disabled={isLoading}
              rows="3"
              className={`${fieldClass(errors.address)} resize-none`}
              placeholder="Enter store address"
            />
            {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address}</p>}
          </div>

          <div>
            <label className={labelClass}>
              <FaPhone className="text-gray-400" />
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              disabled={isLoading}
              className={fieldClass(errors.phone)}
              placeholder="Enter phone number"
            />
            {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
          </div>

          <div>
            <label className={labelClass}>
              <FaGlobe className="text-gray-400" />
              Website <span className="font-normal text-gray-400 normal-case">(optional)</span>
            </label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              disabled={isLoading}
              className={fieldClass(false)}
              placeholder="https://example.com"
            />
          </div>
        </div>

        <ModalFooter>
          <button type="button" onClick={onClose} disabled={isLoading} className={secondaryButtonClass}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-none transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Spinner />
                {store ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <FaSave className="mr-2" />
                {store ? "Update Store" : "Create Store"}
              </>
            )}
          </button>
        </ModalFooter>
      </form>
    </ModalShell>
  );
};

// ---------------------------------------------------------------------------
// Appearance pieces
// ---------------------------------------------------------------------------

const THEME_ICONS = { light: FaSun, dark: FaMoon, system: FaDesktop };

// Fixed colours so each card shows its theme whatever the current one is
const MINI = {
  light: { canvas: "#f3f4f6", panel: "#ffffff", line: "#e5e7eb", text: "#d1d5db" },
  dark: { canvas: "#0d1117", panel: "#161b22", line: "#2d3643", text: "#3b4553" },
};

const MiniWindow = ({ palette, sidebar, accent }) => (
  <div className="flex h-full" style={{ background: palette.canvas }}>
    <div className="w-1/5 h-full" style={{ background: sidebar }} />
    <div className="flex-1 p-2 space-y-1.5">
      <div className="h-2 w-2/3" style={{ background: palette.text }} />
      <div className="p-1.5 space-y-1" style={{ background: palette.panel, border: `1px solid ${palette.line}` }}>
        <div className="h-1.5 w-full" style={{ background: palette.line }} />
        <div className="h-1.5 w-4/5" style={{ background: palette.line }} />
        <div className="w-1/3 h-2" style={{ background: accent }} />
      </div>
    </div>
  </div>
);

const ThemePreview = ({ theme, accent }) => {
  const { swatch, sidebar } = ACCENTS.find((a) => a.id === accent) || ACCENTS[0];
  if (theme === "system") {
    return (
      <div className="relative h-full">
        <div className="absolute inset-0" style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}>
          <MiniWindow palette={MINI.light} sidebar={sidebar} accent={swatch} />
        </div>
        <div className="absolute inset-0" style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}>
          <MiniWindow palette={MINI.dark} sidebar={sidebar} accent={swatch} />
        </div>
      </div>
    );
  }
  return <MiniWindow palette={MINI[theme]} sidebar={sidebar} accent={swatch} />;
};

const SelectedTick = () => (
  <span className="absolute flex items-center justify-center w-5 h-5 text-white bg-blue-600 top-2 right-2">
    <FaCheck className="text-[10px]" />
  </span>
);

// Square on/off switch
const Switch = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex items-center w-11 h-6 shrink-0 transition-colors ${
      checked ? "bg-blue-600" : "bg-gray-300"
    }`}
  >
    <span
      className={`absolute top-1 w-4 h-4 bg-white transition-transform ${
        checked ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
);

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const SECTIONS = [
  { id: "general", name: "General", icon: FaCog, description: "Stores and regional settings" },
  { id: "appearance", name: "Appearance", icon: FaPalette, description: "Theme, colour and size" },
  { id: "notifications", name: "Notifications", icon: FaBell, description: "Alerts and reminders" },
  { id: "security", name: "Security", icon: FaShieldAlt, description: "Security and privacy" },
  { id: "users", name: "Users", icon: FaUserCog, description: "Accounts and roles", permission: "users.manage" },
  { id: "roles", name: "Roles & permissions", icon: FaUserShield, description: "What each role may do", permission: "users.manage" },
  { id: "data", name: "Data Management", icon: FaDatabase, description: "Backup and data handling" },
];

export default function Settings() {
  const router = useRouter();
  const { can } = useAuth();
  const canManageStores = can("stores.manage");
  // Every user can open Settings (appearance is personal); some sections need a permission
  const sections = SECTIONS.filter((section) => !section.permission || can(section.permission));
  const [activeSection, setActiveSection] = useState("general");
  const [stores, setStores] = useState([]);
  const [showStoreForm, setShowStoreForm] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [appearance, setAppearance] = useState(DEFAULT_APPEARANCE);
  const [regional, setRegional] = useState({ timeZone: "", sample: "" });

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const notify = (type, message, title) => {
    clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), type, message, title });
    toastTimer.current = setTimeout(() => setToast(null), TOAST_DURATION[type]);
  };

  const closeToast = () => {
    clearTimeout(toastTimer.current);
    setToast(null);
  };

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // ?section=appearance opens that section directly
  useEffect(() => {
    if (!router.isReady) return;
    const requested = router.query.section;
    if (requested === "stores") setActiveSection("general");
    else if (sections.some((s) => s.id === requested)) setActiveSection(requested);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sections only changes with the user's permissions
  }, [router.isReady, router.query.section, sections.length]);

  const openSection = (id) => {
    setActiveSection(id);
    router.replace({ pathname: router.pathname, query: { section: id } }, undefined, { shallow: true });
  };

  // Browser-only values, read after mount
  useEffect(() => {
    setAppearance(loadAppearance());
    const now = new Date();
    setRegional({
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Device default",
      sample: `${now.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })} · ${now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`,
    });

    const onChange = (e) => setAppearance(e.detail);
    window.addEventListener(APPEARANCE_EVENT, onChange);
    return () => window.removeEventListener(APPEARANCE_EVENT, onChange);
  }, []);

  const updateAppearance = (changes) => setAppearance(saveAppearance({ ...appearance, ...changes }));

  const resetAppearance = () => {
    setAppearance(saveAppearance(DEFAULT_APPEARANCE));
    notify("success", "Theme, colour and size are back to their defaults.", "Appearance reset");
  };

  // ---- Stores --------------------------------------------------------------

  const unwrap = (res) => (res?.data && typeof res.data === "object" && !Array.isArray(res.data) ? res.data : res);

  const loadStores = async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const storesData = await storeAPI.getAllStores();
      setStores(Array.isArray(storesData) ? storesData : Array.isArray(storesData?.data) ? storesData.data : []);
    } catch (err) {
      setLoadError(err.message);
      console.error("Error loading stores:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStores();
  }, []);

  const handleCreateStore = async (storeData) => {
    setIsSubmitting(true);
    try {
      const newStore = unwrap(await storeAPI.createStore(storeData));
      setStores((prev) => [...prev, { ...storeData, ...newStore }]);
      setShowStoreForm(false);
      notify("success", `${storeData.name} was added.`, "Store created");
    } catch (err) {
      console.error("Error creating store:", err);
      notify("error", err.message || "Could not create the store.", "Store not created");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditStore = async (storeData) => {
    if (!editingStore) return;
    setIsSubmitting(true);
    try {
      const updated = unwrap(await storeAPI.updateStore(editingStore.id, storeData));
      setStores((prev) =>
        prev.map((store) => (store.id === editingStore.id ? { ...store, ...storeData, ...updated } : store))
      );
      setShowStoreForm(false);
      setEditingStore(null);
      notify("success", `${storeData.name} was saved.`, "Store updated");
    } catch (err) {
      console.error("Error updating store:", err);
      notify("error", err.message || "Could not update the store.", "Store not updated");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteStore = async () => {
    const store = storeToDelete;
    setDeleting(true);
    setDeleteError("");
    try {
      await storeAPI.deleteStore(store.id);
      setStores((prev) => prev.filter((s) => s.id !== store.id));
      setStoreToDelete(null);
      notify("success", `${store.name} was deleted.`, "Store deleted");
    } catch (err) {
      console.error("Error deleting store:", err);
      setDeleteError(err.message || "Could not delete this store.");
    } finally {
      setDeleting(false);
    }
  };

  const openStoreForm = (store = null) => {
    setEditingStore(store);
    setShowStoreForm(true);
  };

  const closeStoreForm = () => {
    if (isSubmitting) return;
    setShowStoreForm(false);
    setEditingStore(null);
  };

  // ---- Sections ------------------------------------------------------------

  // Only admins add, edit or delete stores; everyone else sees the list
  const addStoreButton = canManageStores && (
    <button
      onClick={() => openStoreForm()}
      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white transition-colors bg-blue-600 hover:bg-blue-700"
    >
      <FaPlus className="text-[11px]" />
      Add Store
    </button>
  );

  const renderGeneralSection = () => (
    <>
      <Panel
        title="Stores"
        description={
          isLoading && stores.length === 0
            ? "Loading…"
            : `${stores.length} store${stores.length === 1 ? "" : "s"} · locations you sell and stock from`
        }
        action={addStoreButton}
        bodyClass=""
      >
        {isLoading && stores.length === 0 ? (
          <div className="flex items-center justify-center gap-3 text-sm text-gray-500 py-14">
            <div className="w-5 h-5 border-2 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            Loading stores…
          </div>
        ) : loadError && stores.length === 0 ? (
          <div className="flex flex-col items-center px-5 text-center py-14">
            <div className="flex items-center justify-center w-12 h-12 mb-3 text-red-500 bg-red-50">
              <FaExclamationTriangle className="text-xl" />
            </div>
            <p className="text-sm font-medium text-gray-700">Couldn&apos;t load stores</p>
            <p className="mt-1 text-xs text-red-600">{loadError}</p>
            <button onClick={loadStores} className={`${secondaryButtonClass} mt-4`}>
              Try Again
            </button>
          </div>
        ) : stores.length === 0 ? (
          <div className="flex flex-col items-center px-5 text-center py-14">
            <div className="flex items-center justify-center w-12 h-12 mb-3 text-gray-400 bg-gray-100">
              <FaStore className="text-xl" />
            </div>
            <p className="text-sm font-medium text-gray-700">No stores yet</p>
            <p className="mt-1 text-xs text-gray-500">
              {canManageStores
                ? "Create your first store location to start stocking products."
                : "An admin needs to add the first store."}
            </p>
            {canManageStores && <div className="mt-4">{addStoreButton}</div>}
          </div>
        ) : (
          <ul className="grid gap-px bg-gray-200 sm:grid-cols-2">
            {stores.map((store) => (
              <li key={store.id} className="flex gap-3 p-4 bg-white">
                <div className="flex items-center justify-center w-10 h-10 text-blue-700 shrink-0 bg-blue-50">
                  <FaStore className="text-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="flex items-center min-w-0 gap-2 text-sm font-semibold text-gray-900">
                      <span className="truncate">{store.name}</span>
                      <span
                        className={`shrink-0 px-1.5 py-px text-[10px] font-semibold ${
                          store.type === "back_store" ? "text-amber-800 bg-amber-50" : "text-green-800 bg-green-50"
                        }`}
                      >
                        {store.type === "back_store" ? "Back store" : "Shop"}
                      </span>
                    </h3>
                    {canManageStores && (
                    <div className="flex -mt-1 -mr-1 shrink-0">
                      <button
                        onClick={() => openStoreForm(store)}
                        className="flex items-center justify-center w-8 h-8 text-gray-500 transition-colors hover:bg-gray-100 hover:text-blue-600"
                        title="Edit store"
                        aria-label={`Edit ${store.name}`}
                      >
                        <FaEdit className="text-sm" />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteError("");
                          setStoreToDelete(store);
                        }}
                        className="flex items-center justify-center w-8 h-8 text-gray-500 transition-colors hover:bg-gray-100 hover:text-red-600"
                        title="Delete store"
                        aria-label={`Delete ${store.name}`}
                      >
                        <FaTrash className="text-sm" />
                      </button>
                    </div>
                    )}
                  </div>
                  <div className="mt-1 space-y-1 text-xs text-gray-600">
                    {store.address && (
                      <p className="flex items-start gap-2">
                        <FaMapMarkerAlt className="mt-0.5 text-gray-400 shrink-0" />
                        <span className="break-words">{store.address}</span>
                      </p>
                    )}
                    {store.phone && (
                      <p className="flex items-center gap-2">
                        <FaPhone className="text-gray-400 shrink-0" />
                        {store.phone}
                      </p>
                    )}
                    {store.website && (
                      <p className="flex items-center min-w-0 gap-2">
                        <FaGlobe className="text-gray-400 shrink-0" />
                        <a href={store.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 truncate hover:underline">
                          {store.website}
                        </a>
                      </p>
                    )}
                  </div>
                  {store.created_at && (
                    <p className="mt-2 text-[11px] text-gray-400">
                      Created {new Date(store.created_at).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel
        title="Regional"
        description="Follows your business account and this device. Changing these isn't supported yet."
        bodyClass=""
      >
        <dl className="grid gap-px bg-gray-200 sm:grid-cols-2">
          {[
            ["Currency", "Nigerian Naira (₦)"],
            ["Language", "English"],
            ["Time zone", regional.timeZone || "…"],
            ["Date & time format", regional.sample || "…"],
          ].map(([label, value]) => (
            <div key={label} className="px-5 py-3.5 bg-white">
              <dt className={statLabelClass}>{label}</dt>
              <dd className="mt-0.5 text-sm font-medium text-gray-900">{value}</dd>
            </div>
          ))}
        </dl>
      </Panel>
    </>
  );

  const renderAppearanceSection = () => (
    <>
      <Panel title="Theme" description="Changes apply instantly and are saved on this device.">
        <div className="grid gap-3 sm:grid-cols-3">
          {THEMES.map((theme) => {
            const selected = appearance.theme === theme.id;
            const Icon = THEME_ICONS[theme.id];
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => updateAppearance({ theme: theme.id })}
                aria-pressed={selected}
                className={`relative text-left bg-white border transition-colors ${
                  selected ? "border-blue-600 ring-1 ring-blue-600" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="h-24 overflow-hidden border-b border-gray-200">
                  <ThemePreview theme={theme.id} accent={appearance.accent} />
                </div>
                <div className="flex items-start gap-2.5 px-3 py-2.5">
                  <Icon className={`mt-0.5 text-sm shrink-0 ${selected ? "text-blue-600" : "text-gray-400"}`} />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{theme.label}</p>
                    <p className="text-xs text-gray-500">{theme.hint}</p>
                  </div>
                </div>
                {selected && <SelectedTick />}
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel title="Accent colour" description="Used for buttons, highlights and the sidebar.">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {ACCENTS.map((accent) => {
            const selected = appearance.accent === accent.id;
            return (
              <button
                key={accent.id}
                type="button"
                onClick={() => updateAppearance({ accent: accent.id })}
                aria-pressed={selected}
                className={`relative flex flex-col items-center gap-2 p-3 bg-white border transition-colors ${
                  selected ? "border-blue-600 ring-1 ring-blue-600" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="flex w-full h-8 overflow-hidden">
                  <span className="w-1/3 h-full" style={{ background: accent.sidebar }} />
                  <span className="flex-1 h-full" style={{ background: accent.swatch }} />
                </span>
                <span className="text-xs font-medium text-gray-700">{accent.label}</span>
                {selected && <SelectedTick />}
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel title="Interface size" description="Scales text, spacing and buttons across the app.">
        <div className="grid grid-cols-3 gap-px bg-gray-200 border border-gray-200">
          {SCALES.map((scale) => {
            const selected = appearance.scale === scale.id;
            return (
              <button
                key={scale.id}
                type="button"
                onClick={() => updateAppearance({ scale: scale.id })}
                aria-pressed={selected}
                className={`px-3 py-3 text-left transition-colors ${
                  selected ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className={`block font-semibold ${scale.sample}`}>Aa</span>
                <span className="block mt-1 text-sm font-medium">{scale.label}</span>
                <span className={`block text-[11px] ${selected ? "text-blue-100" : "text-gray-500"}`}>
                  {scale.hint}
                </span>
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel title="Accessibility">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-900">Reduce motion</p>
            <p className="text-xs text-gray-500">
              Turns off sliding and fading animations. Loading spinners still turn.
            </p>
          </div>
          <Switch
            checked={appearance.reduceMotion}
            onChange={(value) => updateAppearance({ reduceMotion: value })}
            label="Reduce motion"
          />
        </div>
      </Panel>

      <Panel
        title="Preview"
        description="How pages look with your current settings."
        action={
          <button
            onClick={resetAppearance}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 transition-colors bg-white border border-gray-300 hover:bg-gray-100"
          >
            <FaUndo className="text-[11px]" />
            Reset to defaults
          </button>
        }
      >
        <div className="border border-gray-200 bg-gray-50">
          <div className="grid grid-cols-2 gap-px bg-gray-200 border-b border-gray-200">
            <div className="px-4 py-3 bg-white">
              <div className={statLabelClass}>Total Sales Today</div>
              <div className="text-lg font-bold text-gray-900">₦184,500.00</div>
            </div>
            <div className="px-4 py-3 bg-white">
              <div className={statLabelClass}>Low Stock</div>
              <div className="text-lg font-bold text-gray-900">4</div>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {[
              ["Golden Penny Semovita 1kg", "In Stock", "bg-green-50 text-green-700", "₦1,850.00"],
              ["Peak Milk Tin 400g", "Low Stock", "bg-amber-50 text-amber-700", "₦2,300.00"],
            ].map(([name, status, badge, price]) => (
              <div key={name} className="flex items-center justify-between gap-3 px-4 py-2.5 bg-white">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                  <span className={`inline-block mt-0.5 px-1.5 py-px text-[10px] font-semibold ${badge}`}>{status}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{price}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-t border-gray-200">
            <input
              readOnly
              value="Search products…"
              aria-label="Sample field"
              className="flex-1 min-w-[8rem] h-8 px-2.5 text-xs text-gray-500 bg-gray-100 border-0 outline-none"
            />
            <span className="px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300">Cancel</span>
            <span className="px-3 py-2 text-xs font-medium text-white bg-blue-600">Process Order</span>
          </div>
        </div>
      </Panel>
    </>
  );

  const renderSectionContent = () => {
    if (activeSection === "general") return renderGeneralSection();
    if (activeSection === "appearance") return renderAppearanceSection();
    if (activeSection === "users" && can("users.manage")) return <UsersSection notify={notify} />;
    if (activeSection === "roles" && can("users.manage")) return <RolesSection notify={notify} />;

    const section = sections.find((s) => s.id === activeSection);
    return (
      <Panel title={section?.name || "Settings"} description={section?.description}>
        <div className="flex flex-col items-center py-10 text-center">
          <div className="flex items-center justify-center w-12 h-12 mb-3 text-gray-400 bg-gray-100">
            {section ? <section.icon className="text-xl" /> : <FaCog className="text-xl" />}
          </div>
          <p className="text-sm font-medium text-gray-700">Coming soon</p>
          <p className="mt-1 text-xs text-gray-500">This section is under development.</p>
        </div>
      </Panel>
    );
  };

  return (
    <div className="pb-6 font-raleway">
      {toast && <Toast key={toast.id} toast={toast} onClose={closeToast} />}

      <h1 className="hidden mb-1 text-xl font-normal text-gray-800 md:block">Settings</h1>
      <p className="hidden mb-5 text-sm text-gray-500 md:block">
        Manage your stores, preferences and how the app looks
      </p>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        {/* Section navigation: a row that scrolls on phones, a column from lg */}
        <nav className="flex overflow-x-auto bg-white border border-gray-200 lg:flex-col lg:w-60 lg:shrink-0 lg:sticky lg:top-4">
          {sections.map((section) => {
            const active = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => openSection(section.id)}
                className={`flex items-center gap-3 px-4 py-3 text-left transition-colors whitespace-nowrap border-b-2 lg:border-b-0 lg:border-l-2 ${
                  active
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-transparent text-gray-700 hover:bg-gray-50"
                }`}
              >
                <section.icon className={`shrink-0 text-sm ${active ? "text-blue-600" : "text-gray-400"}`} />
                <span>
                  <span className="block text-sm font-medium">{section.name}</span>
                  <span className="hidden text-[11px] text-gray-500 lg:block">{section.description}</span>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="flex-1 min-w-0 space-y-5">{renderSectionContent()}</div>
      </div>

      <StoreFormModal
        isOpen={showStoreForm}
        onClose={closeStoreForm}
        onSave={editingStore ? handleEditStore : handleCreateStore}
        isLoading={isSubmitting}
        store={editingStore}
      />

      {storeToDelete && (
        <ModalShell
          title="Delete Store"
          subtitle="This can't be undone"
          icon={FaTrash}
          iconClass="bg-red-600"
          onClose={() => !deleting && setStoreToDelete(null)}
          busy={deleting}
          maxWidth="max-w-md"
        >
          <div className="px-6 py-5 space-y-4">
            {deleteError && (
              <div className="flex items-start gap-3 px-4 py-3 text-sm text-red-800 border border-red-200 bg-red-50">
                <FaExclamationTriangle className="mt-0.5 shrink-0 text-red-600" />
                <div>
                  <p className="font-semibold">Not deleted</p>
                  <p className="mt-0.5 text-red-700">{deleteError}</p>
                </div>
              </div>
            )}
            <p className="text-sm text-gray-600">
              Delete <span className="font-semibold text-gray-900">{storeToDelete.name}</span>? Stock records
              and sales tied to this store may stop showing its details.
            </p>
          </div>
          <ModalFooter>
            <button onClick={() => setStoreToDelete(null)} disabled={deleting} className={secondaryButtonClass}>
              Cancel
            </button>
            <button
              onClick={confirmDeleteStore}
              disabled={deleting}
              className="flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-none transition-colors hover:bg-red-700 disabled:opacity-60"
            >
              {deleting ? <Spinner /> : <FaTrash className="mr-2 text-xs" />}
              {deleting ? "Deleting…" : "Delete Store"}
            </button>
          </ModalFooter>
        </ModalShell>
      )}

      <style jsx global>{`
        @keyframes toast-in {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes toast-progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        .toast-in {
          animation: toast-in 0.2s ease-out;
        }
        .toast-progress {
          animation-name: toast-progress;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }
      `}</style>
    </div>
  );
}
