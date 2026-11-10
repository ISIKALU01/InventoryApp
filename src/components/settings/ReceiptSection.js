// Settings > Receipts: how this computer prints customer receipts (its own
// printer, so the settings are kept per computer).
import { useEffect, useState } from "react";
import { FaPrint } from "react-icons/fa";
import {
  DEFAULT_RECEIPT_SETTINGS,
  PAPER_SIZES,
  buildReceiptHtml,
  loadReceiptSettings,
  printReceipt,
  saveReceiptSettings,
} from "../../../utils/receipt";
import { useAuth } from "../../context/AuthContext";
import { Panel, secondaryButtonClass, statLabelClass } from "./ui";

const fieldClass = "w-full px-3 py-2.5 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500";

const sample = (cashier) => ({
  number: "TEST-0001",
  date: new Date().toISOString(),
  shop: { name: "Your Shop", address: "12 Market Road, Lekki, Lagos", phone: "0800 000 0000" },
  cashier,
  items: [
    { name: "Peak Milk 400g", quantity: 2, unit_price: 2300 },
    { name: "Agege Bread", quantity: 1, unit_price: 1200 },
  ],
  payment: "Cash",
});

export default function ReceiptSection({ notify }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState(DEFAULT_RECEIPT_SETTINGS);

  useEffect(() => setSettings(loadReceiptSettings()), []);

  const update = (changes) => setSettings(saveReceiptSettings({ ...settings, ...changes }));

  return (
    <div className="space-y-5">
      <Panel title="Printing" description="Saved on this computer only, since each till has its own printer.">
        <div className="grid gap-5 text-sm sm:grid-cols-2">
          <label className="flex items-start gap-3 cursor-pointer sm:col-span-2">
            <input type="checkbox" checked={settings.autoPrint} onChange={(e) => update({ autoPrint: e.target.checked })} className="mt-0.5 accent-blue-600" />
            <span>
              <span className="font-medium text-gray-900">Print a receipt after every sale</span>
              <span className="block text-xs text-gray-500">Online and offline. A second copy can be printed from the sale&apos;s screen or the sales list.</span>
            </span>
          </label>
          <div>
            <label htmlFor="receipt-paper" className={`${statLabelClass} block mb-1.5`}>Paper</label>
            <select id="receipt-paper" value={settings.paper} onChange={(e) => update({ paper: e.target.value })} className={fieldClass}>
              {Object.entries(PAPER_SIZES).map(([value, size]) => (
                <option key={value} value={value}>{size.label}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-3 cursor-pointer sm:mt-6">
            <input type="checkbox" checked={settings.showCashier} onChange={(e) => update({ showCashier: e.target.checked })} className="accent-blue-600" />
            <span className="text-gray-900">Show the cashier&apos;s name</span>
          </label>
          <div>
            <label htmlFor="receipt-business" className={`${statLabelClass} block mb-1.5`}>Business name (top of the receipt)</label>
            <input id="receipt-business" value={settings.businessName} maxLength={60} onChange={(e) => update({ businessName: e.target.value })} placeholder="Leave empty to use the shop's name" className={fieldClass} />
          </div>
          <div>
            <label htmlFor="receipt-footer" className={`${statLabelClass} block mb-1.5`}>Message at the bottom</label>
            <textarea id="receipt-footer" rows={3} value={settings.footer} maxLength={300} onChange={(e) => update({ footer: e.target.value })} className={fieldClass} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-5">
          <button
            type="button"
            onClick={() => {
              printReceipt(sample(user?.name), settings);
              notify("success", "A test receipt was sent to the printer.", "Test print");
            }}
            className={`${secondaryButtonClass} flex items-center`}
          >
            <FaPrint className="mr-2 text-xs" /> Print a test receipt
          </button>
          <p className="text-xs text-gray-500">The shop&apos;s address and phone come from Settings → General → Stores.</p>
        </div>
      </Panel>

      <Panel title="Preview">
        <iframe title="Receipt preview" srcDoc={buildReceiptHtml(sample(user?.name), settings)} className="w-full bg-white border border-gray-200 h-[28rem]" />
      </Panel>

      <Panel title="Print without the dialog (receipt printers)">
        <div className="space-y-2 text-sm text-gray-700">
          <p>Browsers ask &quot;Print?&quot; every time. To print straight to the receipt printer at the till:</p>
          <ol className="pl-5 space-y-1 list-decimal">
            <li>Make the receipt printer the computer&apos;s <span className="font-semibold">default printer</span> (Windows Settings → Printers).</li>
            <li>Right-click the SellaPad shortcut → <span className="font-semibold">Properties</span>.</li>
            <li>At the end of <span className="font-semibold">Target</span>, add a space and <code className="px-1 bg-gray-100">--kiosk-printing</code>, then OK.</li>
            <li>Close SellaPad completely and open it from that shortcut.</li>
          </ol>
        </div>
      </Panel>
    </div>
  );
}
