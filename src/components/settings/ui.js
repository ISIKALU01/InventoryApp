// Building blocks shared by the Settings sections: same boxy look as the
// transaction and inventory pages.
import { FaCheckCircle, FaTimes, FaTimesCircle } from "react-icons/fa";

export const TOAST_DURATION = { success: 3000, error: 5000 };

export const statLabelClass = "text-[10px] font-semibold tracking-wide text-gray-500 uppercase";

export const secondaryButtonClass =
  "flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-none transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed";

export const Spinner = () => (
  <div className="w-4 h-4 mr-2 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
);

export const Toast = ({ toast, onClose }) => {
  const isError = toast.type === "error";
  const Icon = isError ? FaTimesCircle : FaCheckCircle;

  return (
    <div
      role={isError ? "alert" : "status"}
      className="fixed z-[60] top-4 right-4 left-4 sm:left-auto sm:w-96 toast-in"
    >
      <div
        className={`relative overflow-hidden bg-white border border-gray-200 border-l-4 shadow-xl ${
          isError ? "border-l-red-600" : "border-l-green-600"
        }`}
      >
        <div className="flex items-start gap-3 px-4 py-3.5">
          <Icon className={`mt-0.5 shrink-0 text-lg ${isError ? "text-red-600" : "text-green-600"}`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">
              {toast.title || (isError ? "Something went wrong" : "Done")}
            </p>
            <p className="mt-0.5 text-sm text-gray-600 break-words">{toast.message}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Dismiss"
            className="flex items-center justify-center -mr-1 text-gray-400 transition-colors w-7 h-7 shrink-0 hover:bg-gray-100 hover:text-gray-700"
          >
            <FaTimes className="text-xs" />
          </button>
        </div>
        <div
          className={`h-1 toast-progress ${isError ? "bg-red-600/30" : "bg-green-600/30"}`}
          style={{ animationDuration: `${TOAST_DURATION[toast.type]}ms` }}
        />
      </div>
    </div>
  );
};

// Floating panel over a lightly blurred page
export const ModalShell = ({ title, subtitle, icon: Icon, iconClass = "bg-blue-600", onClose, busy, maxWidth = "max-w-lg", children }) => (
  <div
    className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 overflow-y-auto bg-gray-900/10 backdrop-blur-[2px]"
    onClick={(e) => {
      if (e.target === e.currentTarget && !busy) onClose();
    }}
  >
    <div role="dialog" aria-modal="true" className={`relative w-full ${maxWidth} bg-white border border-gray-300 rounded-none shadow-2xl`}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center w-10 h-10 ${iconClass}`}>
            <Icon className="text-base text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold leading-tight text-gray-900">{title}</h2>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          aria-label="Close"
          className="flex items-center justify-center w-8 h-8 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
        >
          <FaTimes className="text-sm" />
        </button>
      </div>
      {children}
    </div>
  </div>
);

export const ModalFooter = ({ children }) => (
  <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">{children}</div>
);

// Boxy panel with a header bar
export const Panel = ({ title, description, action, children, bodyClass = "p-5" }) => (
  <section className="bg-white border border-gray-200">
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-200">
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
      {action}
    </div>
    <div className={bodyClass}>{children}</div>
  </section>
);
