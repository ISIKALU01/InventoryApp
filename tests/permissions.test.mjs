// Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import {
  ANY_USER_PATHS,
  PAGE_PERMISSIONS,
  PUBLIC_PATHS,
  canAccessPath,
  hasPermission,
  homePathFor,
  normalizePath,
} from "../utils/permissions.js";

// Copy of the backend defaults (PGIMS_APP app/Support/Permissions.php, DEFAULTS), as
// GET /api/user returns them until an admin edits a role. Admin holds all of them.
const ALL = [
  "users.manage", "dashboard.view", "reports.view", "sales.create", "sales.view", "sales.manage",
  "sales.audit", "customers.view", "customers.manage", "customers.deposit", "expenses.manage",
  "catalog.view", "inventory.view", "products.manage", "inventory.manage", "stores.manage",
  "stock-transfers.manage", "requisitions.view", "requisitions.create", "requisitions.approve",
  "suppliers.view", "suppliers.manage", "suppliers.verify", "suppliers.senior-check", "suppliers.approve", "purchase-orders.view",
  "purchase-orders.manage", "goods-receipts.view", "goods-receipts.create", "goods-receipts.store-check",
  "goods-receipts.post-stock", "goods-receipts.procurement-check", "sor.view", "sor.count", "sor.store-sign",
  "sor.stock-sign", "sor.return", "supplier-payments.view", "supplier-payments.request",
  "supplier-payments.check", "supplier-payments.approve", "supplier-payments.pay", "follow-up.view", "follow-up.manage", "banking.view", "banking.manage", "payments.manage", "notifications.manage",
];

const ROLE_PERMISSIONS = {
  admin: ALL,
  store_manager: [
    "sales.create", "sales.view", "customers.view", "expenses.manage", "catalog.view",
    "inventory.view", "stock-transfers.manage", "suppliers.view", "purchase-orders.view",
    "requisitions.view", "requisitions.create",
    "goods-receipts.view", "goods-receipts.create", "goods-receipts.store-check",
    "sor.view", "sor.count", "sor.store-sign", "follow-up.view",
  ],
  inventory_officer: [
    "catalog.view", "inventory.view", "products.manage", "inventory.manage",
    "stock-transfers.manage", "suppliers.view", "purchase-orders.view", "requisitions.view", "requisitions.create",
    "goods-receipts.view", "goods-receipts.create", "goods-receipts.post-stock",
    "sor.view", "sor.count", "sor.stock-sign", "sor.return", "follow-up.view",
  ],
  procurement_officer: [
    "catalog.view", "inventory.view", "suppliers.view", "suppliers.manage",
    "purchase-orders.view", "purchase-orders.manage", "requisitions.view", "requisitions.approve",
    "goods-receipts.view", "goods-receipts.procurement-check", "sor.view",
    "supplier-payments.view", "supplier-payments.request", "follow-up.view", "follow-up.manage",
  ],
  junior_accountant: [
    "dashboard.view", "reports.view", "sales.view", "customers.view", "customers.deposit",
    "expenses.manage", "catalog.view", "suppliers.view", "suppliers.verify", "purchase-orders.view", "banking.view", "payments.manage",
    "goods-receipts.view", "sor.view", "supplier-payments.view", "supplier-payments.check", "follow-up.view",
  ],
  senior_accountant: [
    "dashboard.view", "reports.view", "sales.view", "sales.audit", "customers.view", "customers.deposit",
    "expenses.manage", "catalog.view", "suppliers.view", "suppliers.senior-check", "purchase-orders.view", "banking.view",
    "banking.manage", "payments.manage", "goods-receipts.view", "sor.view",
    "supplier-payments.view", "supplier-payments.approve", "supplier-payments.pay",
    "follow-up.view", "follow-up.manage",
  ],
  staff: ["sales.create", "sales.view", "customers.view", "expenses.manage", "catalog.view"],
};

const userWith = (role) => ({ id: 1, name: role, role, permissions: ROLE_PERMISSIONS[role] });

// Pages in the sidebar, as a user of each role should see them
const SIDEBAR_PAGES = [
  "/dashboard", "/authorizeUser", "/team", "/transaction/sales-invoice", "/transaction/expenses",
  "/transaction/sales-list", "/inventory/product-category", "/inventory/manage-products",
  "/inventory/inventory", "/inventory/stock-ledger", "/inventory/purchase-log", "/inventory/goods-received", "/inventory/sor", "/inventory/follow-up", "/inventory/requisitions", "/inventory/stock-transfers", "/inventory/expiry", "/inventory/labels", "/deletedTransactions", "/settings",
  "/folio/bank-management", "/folio/customer-management", "/folio/supply-management", "/folio/supplier-payments",
];

const visibleFor = (role) => SIDEBAR_PAGES.filter((page) => canAccessPath(userWith(role), page));

test("hasPermission handles a single permission, any-of lists and missing data", () => {
  const user = { permissions: ["sales.view"] };
  assert.equal(hasPermission(user, "sales.view"), true);
  assert.equal(hasPermission(user, "sales.manage"), false);
  assert.equal(hasPermission(user, ["sales.manage", "sales.view"]), true);
  assert.equal(hasPermission(null, "sales.view"), false);
  assert.equal(hasPermission({}, "sales.view"), false);
  assert.equal(hasPermission({ permissions: "sales.view" }, "sales.view"), false);
  assert.equal(hasPermission(user, undefined), false);
});

test("public pages are open to everyone, other pages need a login", () => {
  for (const page of PUBLIC_PATHS) {
    assert.equal(canAccessPath(null, page), true, page);
  }
  assert.equal(canAccessPath(null, "/settings"), false);
  assert.equal(canAccessPath(null, "/dashboard"), false);
});

test("settings is open to every logged-in user, even with no permissions", () => {
  assert.equal(canAccessPath({ permissions: [] }, "/settings"), true);
});

test("every logged-in user has an inbox", () => {
  for (const role of Object.keys(ROLE_PERMISSIONS)) {
    assert.equal(canAccessPath(userWith(role), "/inbox"), true, role);
  }
  assert.equal(canAccessPath({ permissions: [] }, "/inbox"), true);
  assert.equal(canAccessPath(null, "/inbox"), false);
});

test("pages nobody has classified are closed, even to admins", () => {
  assert.equal(canAccessPath(userWith("admin"), "/inventory/view-adjustment"), false);
  assert.equal(canAccessPath(userWith("admin"), "/some-new-page"), false);
});

test("query strings, hashes and trailing slashes don't open a closed page", () => {
  assert.equal(normalizePath("/settings/?section=users#top"), "/settings");
  assert.equal(normalizePath("/"), "/");
  const cashier = userWith("staff");
  assert.equal(canAccessPath(cashier, "/dashboard?x=1"), false);
  assert.equal(canAccessPath(cashier, "/authorizeUser/"), false);
  assert.equal(canAccessPath(cashier, "/transaction/sales-invoice?store=2"), true);
});

test("admin sees every page in the sidebar", () => {
  assert.deepEqual(visibleFor("admin"), SIDEBAR_PAGES);
});

test("cashier (staff) only sells, records expenses and sees sales", () => {
  assert.deepEqual(visibleFor("staff"), [
    "/transaction/sales-invoice", "/transaction/expenses", "/transaction/sales-list", "/settings",
  ]);
});

test("store manager sells and watches stock and suppliers", () => {
  assert.deepEqual(visibleFor("store_manager"), [
    "/transaction/sales-invoice", "/transaction/expenses", "/transaction/sales-list",
    "/inventory/product-category", "/inventory/manage-products", "/inventory/inventory", "/inventory/stock-ledger",
    "/inventory/purchase-log", "/inventory/goods-received", "/inventory/sor", "/inventory/follow-up", "/inventory/requisitions", "/inventory/stock-transfers", "/inventory/expiry", "/inventory/labels", "/settings", "/folio/supply-management",
  ]);
});

test("inventory officer works on stock, not sales or money", () => {
  assert.deepEqual(visibleFor("inventory_officer"), [
    "/inventory/product-category", "/inventory/manage-products", "/inventory/inventory", "/inventory/stock-ledger",
    "/inventory/purchase-log", "/inventory/goods-received", "/inventory/sor", "/inventory/follow-up", "/inventory/requisitions", "/inventory/stock-transfers", "/inventory/expiry", "/inventory/labels", "/settings", "/folio/supply-management",
  ]);
});

test("procurement officer works on suppliers and purchase orders", () => {
  assert.deepEqual(visibleFor("procurement_officer"), [
    "/inventory/product-category", "/inventory/manage-products", "/inventory/inventory", "/inventory/stock-ledger",
    "/inventory/purchase-log", "/inventory/goods-received", "/inventory/sor", "/inventory/follow-up", "/inventory/requisitions", "/inventory/expiry", "/inventory/labels", "/settings", "/folio/supply-management", "/folio/supplier-payments",
  ]);
});

test("junior accountant sees the money side but not deleted sales", () => {
  assert.deepEqual(visibleFor("junior_accountant"), [
    "/dashboard", "/transaction/expenses", "/transaction/sales-list", "/inventory/purchase-log", "/inventory/goods-received", "/inventory/sor", "/inventory/follow-up",
    "/settings", "/folio/bank-management", "/folio/customer-management", "/folio/supply-management",
    "/folio/supplier-payments",
  ]);
});

test("senior accountant also sees deleted sales", () => {
  assert.deepEqual(visibleFor("senior_accountant"), [
    "/dashboard", "/transaction/expenses", "/transaction/sales-list", "/inventory/purchase-log", "/inventory/goods-received", "/inventory/sor", "/inventory/follow-up",
    "/deletedTransactions", "/settings", "/folio/bank-management", "/folio/customer-management",
    "/folio/supply-management", "/folio/supplier-payments",
  ]);
});

test("a custom role works from its permissions alone, whatever it is called", () => {
  const supervisor = { role: "branch_supervisor", role_label: "Branch supervisor", permissions: ["sales.view", "suppliers.view"] };
  assert.deepEqual(
    SIDEBAR_PAGES.filter((page) => canAccessPath(supervisor, page)),
    ["/transaction/sales-list", "/settings", "/folio/supply-management"]
  );
  assert.equal(homePathFor(supervisor), "/transaction/sales-list");

  // A role literally named "admin" in the label gets nothing extra
  const fakeAdmin = { role: "admin_helper", role_label: "Admin", permissions: [] };
  assert.equal(canAccessPath(fakeAdmin, "/authorizeUser"), false);
});

test("only admins reach user management", () => {
  for (const role of Object.keys(ROLE_PERMISSIONS)) {
    assert.equal(canAccessPath(userWith(role), "/authorizeUser"), role === "admin", role);
  }
});

test("each role lands on a page it can open", () => {
  const expected = {
    admin: "/dashboard",
    store_manager: "/transaction/sales-invoice",
    inventory_officer: "/inventory/inventory",
    procurement_officer: "/inventory/inventory",
    junior_accountant: "/dashboard",
    senior_accountant: "/dashboard",
    staff: "/transaction/sales-invoice",
  };
  for (const [role, home] of Object.entries(expected)) {
    const user = userWith(role);
    assert.equal(homePathFor(user), home, role);
    assert.equal(canAccessPath(user, home), true, role);
  }
});

test("a user with no permissions lands on settings, never on a page they'd be bounced from", () => {
  assert.equal(homePathFor({ permissions: [] }), "/settings");
});

test("page permissions only use permission names the backend knows", () => {
  for (const [page, needed] of Object.entries(PAGE_PERMISSIONS)) {
    for (const permission of [].concat(needed)) {
      assert.ok(ALL.includes(permission), `${page} uses unknown permission ${permission}`);
    }
  }
});

// Every file under src/pages must either be listed (so someone decided who may
// open it) or be one of the framework/public files.
const PAGES_DIR = join(import.meta.dirname, "..", "src", "pages");
const NOT_PAGES = new Set(["/_app", "/_document"]);

const pageRoutes = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return name === "api" ? [] : pageRoutes(full);
    if (!name.endsWith(".js")) return [];
    const route = "/" + relative(PAGES_DIR, full).split(sep).join("/").replace(/\.js$/, "");
    return [route === "/index" ? "/" : route];
  });

test("every page has an access rule", () => {
  const classified = new Set([...PUBLIC_PATHS, ...ANY_USER_PATHS, ...Object.keys(PAGE_PERMISSIONS)]);
  for (const route of pageRoutes(PAGES_DIR)) {
    if (NOT_PAGES.has(route)) continue;
    assert.ok(classified.has(route), `${route} has no entry in utils/permissions.js`);
  }
});

test("every page with an access rule exists", () => {
  for (const page of Object.keys(PAGE_PERMISSIONS)) {
    assert.ok(existsSync(join(PAGES_DIR, `${page}.js`)), `${page} is listed but src/pages${page}.js doesn't exist`);
  }
});
