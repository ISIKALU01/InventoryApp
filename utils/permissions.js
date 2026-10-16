// Who may open which page.
//
// The backend decides what each role may do (App\Support\Permissions) and
// sends the logged-in user's list as `user.permissions`. The app only reads
// that list: it never decides access from the role name. The backend checks
// every request again, so hiding a page or button here is for a clean
// screen, not for security.

// Pages anyone may open, logged in or not
export const PUBLIC_PATHS = ["/", "/unauthorized"];

// Pages every logged-in user may open
export const ANY_USER_PATHS = ["/settings", "/inbox"];

// Page -> permission needed. An array means "any one of these".
export const PAGE_PERMISSIONS = {
  "/dashboard": "dashboard.view",
  "/authorizeUser": "users.manage",
  "/team": "users.manage",
  "/transaction/sales-invoice": "sales.create",
  "/transaction/expenses": ["expenses.view", "expenses.manage"],
  "/transaction/sales-list": "sales.view",
  "/transaction/sales-summary": "reports.view",
  "/transaction/payment-analysis": "reports.view",
  "/transaction/payments": "payments.manage",
  "/inventory/product-category": "inventory.view",
  "/inventory/manage-products": "inventory.view",
  "/inventory/inventory": "inventory.view",
  "/inventory/purchase-log": "purchase-orders.view",
  "/inventory/goods-received": "goods-receipts.view",
  "/inventory/sor": "sor.view",
  "/inventory/follow-up": "follow-up.view",
  "/inventory/stock-ledger": "inventory.view",
  "/inventory/requisitions": "requisitions.view",
  "/inventory/stock-transfers": "stock-transfers.manage",
  "/inventory/expiry": "inventory.view",
  "/inventory/labels": "inventory.view",
  "/deletedTransactions": "sales.audit",
  "/folio/bank-management": "banking.view",
  "/folio/customer-management": ["customers.manage", "customers.deposit"],
  "/customerProfile": ["customers.manage", "customers.deposit"],
  "/folio/supply-management": "suppliers.view",
  "/folio/supplier-payments": "supplier-payments.view",
};

// Where a user lands after logging in: the first page here they may open
export const HOME_PATHS = [
  "/dashboard",
  "/transaction/sales-invoice",
  "/inventory/inventory",
  "/inventory/purchase-log",
  "/transaction/sales-list",
  "/folio/supply-management",
  "/settings",
];

// The stores this person works at, out of a list from GET /stores. Admins and
// people with "all stores" get the whole list.
export function storesFor(user, stores) {
  const access = user?.store_access;
  if (!access || access.all) return stores || [];
  const mine = new Set((access.stores || []).map((s) => String(s.id)));
  return (stores || []).filter((store) => mine.has(String(store.id)));
}

export function hasPermission(user, permission) {
  if (!permission) return false;
  const granted = Array.isArray(user?.permissions) ? user.permissions : [];
  const wanted = Array.isArray(permission) ? permission : [permission];
  return wanted.some((p) => granted.includes(p));
}

// Strip query string, hash and trailing slash: "/settings/?tab=1" -> "/settings"
export function normalizePath(path) {
  const clean = String(path || "/").split(/[?#]/)[0];
  return clean.length > 1 ? clean.replace(/\/+$/, "") : clean;
}

export function isPublicPath(path) {
  return PUBLIC_PATHS.includes(normalizePath(path));
}

// Pages not listed anywhere are closed to everyone: a new page stays hidden
// until someone decides who may open it.
export function canAccessPath(user, path) {
  const page = normalizePath(path);
  if (PUBLIC_PATHS.includes(page)) return true;
  if (!user) return false;
  if (ANY_USER_PATHS.includes(page)) return true;
  return hasPermission(user, PAGE_PERMISSIONS[page]);
}

export function homePathFor(user) {
  return HOME_PATHS.find((path) => canAccessPath(user, path)) || "/unauthorized";
}
