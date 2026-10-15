// Export the business's records from the backend as CSV or one JSON backup.
// Used by Settings > Data Management. Each dataset needs the same permission
// as the page that shows it; the backend checks again on every request.
import http from "../services/http";

export { scrubRecords, toCsv } from "./csv";

// `key` is where a list sits when the response wraps it ({ products: [...] })
export const DATASETS = [
  { id: "products", label: "Products", path: "/products", key: "products", permission: "inventory.view", hint: "Prices, SKUs, barcodes and stock per store" },
  { id: "product-categories", label: "Product categories", path: "/product-categories", key: "categories", permission: "inventory.view" },
  { id: "stores", label: "Stores", path: "/stores", key: "stores", permission: null, hint: "Shops and back stores" },
  { id: "stock-movements", label: "Stock ledger", path: "/stock-movements", key: "movements", permission: "inventory.view", hint: "Every stock movement" },
  { id: "stock-batches", label: "Stock batches", path: "/stock-batches", key: "batches", permission: "inventory.view", hint: "Batches and expiry dates" },
  { id: "orders", label: "Sales", path: "/orders", key: "orders", permission: "sales.view", hint: "Orders, items and payment methods" },
  { id: "expenses", label: "Expenses", path: "/expenses", key: "expenses", permission: "expenses.manage" },
  { id: "customers", label: "Customers", path: "/customers", key: "customers", permission: ["customers.manage", "customers.deposit"], hint: "Balances and credit limits" },
  { id: "suppliers", label: "Suppliers", path: "/suppliers", key: "suppliers", permission: "suppliers.view" },
  { id: "purchase-orders", label: "Purchase orders", path: "/purchase-orders", key: "purchase_orders", permission: "purchase-orders.view" },
  { id: "goods-receipts", label: "Goods received", path: "/goods-receipts", key: "goods_receipts", permission: "goods-receipts.view" },
  { id: "supplier-payments", label: "Supplier payments", path: "/supplier-payments", key: "supplier_payments", permission: "supplier-payments.view" },
  { id: "bank-accounts", label: "Bank accounts", path: "/bank-accounts", key: "bank_accounts", permission: "banking.view", hint: "Accounts and balances" },
  { id: "users", label: "Users", path: "/users", key: "users", permission: "users.manage", hint: "Names, emails and roles (no passwords)" },
];

// A runaway paginator must not hang the export
const MAX_PAGES = 500;

const listFrom = (body, key) => {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.[key])) return body[key];
  if (Array.isArray(body?.data?.data)) return body.data.data;
  return [];
};

const lastPageOf = (body) => Number(body?.last_page ?? body?.meta?.last_page ?? body?.data?.last_page ?? 1) || 1;

// Every record of a dataset, following the pages when the list is paginated
export const fetchDataset = async (dataset, onPage) => {
  const rows = [];
  let page = 1;
  let lastPage = 1;
  do {
    const { data } = await http.get(dataset.path, { params: { page } });
    rows.push(...listFrom(data, dataset.key));
    lastPage = lastPageOf(data);
    onPage?.(page, lastPage);
    page += 1;
  } while (page <= lastPage && page <= MAX_PAGES);
  return rows;
};

// ---- Files -----------------------------------------------------------------

export const todayStamp = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const downloadFile = (content, filename, type) => {
  const url = window.URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => window.URL.revokeObjectURL(url), 1000);
};

export const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};
