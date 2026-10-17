// components/guide/script.js
// The app guide's running order. Each chapter has its scene, a caption,
// where to find it in the menu, and which sidebar item is lit (`menu`, an
// index into MENU in AppGuide.js). `full` chapters fill the stage without the
// app's sidebar and top bar.
import { DashboardScene, InboxScene, IntroScene, OutroScene, dashboardCursor, inboxCursor } from "./startScenes";
import {
  CustomersScene,
  DeletedSalesScene,
  ExpensesScene,
  SalesListScene,
  SalesPointScene,
  customersCursor,
  deletedSalesCursor,
  expensesCursor,
  salesListCursor,
  salesPointCursor,
} from "./salesScenes";
import {
  ExpiryScene,
  LedgerScene,
  ProductsScene,
  StockLevelsScene,
  TransfersScene,
  expiryCursor,
  ledgerCursor,
  productsCursor,
  stockLevelsCursor,
  transfersCursor,
} from "./stockScenes";
import {
  FollowUpScene,
  GoodsReceivedScene,
  PaymentsScene,
  PurchasingScene,
  RequisitionsScene,
  SorScene,
  SuppliersScene,
  followUpCursor,
  goodsReceivedCursor,
  paymentsCursor,
  requisitionsCursor,
  sorCursor,
  suppliersCursor,
} from "./purchasingScenes";
import {
  AdminSettingsScene,
  AppearanceScene,
  StaffScene,
  accentColor,
  adminSettingsCursor,
  appearanceCursor,
  staffCursor,
} from "./adminScenes";

export { accentTour } from "./adminScenes";

const CHAPTERS = [
  // Getting started
  {
    section: "Getting started",
    title: "Welcome to SellaPad",
    caption: "A guided tour of the whole app: selling, stock, purchasing, money and your team. Use Chapters to jump to any topic.",
    duration: 5,
    full: true,
    Component: IntroScene,
  },
  {
    section: "Getting started",
    title: "Your day at a glance",
    caption: "The dashboard adds up today's sales, cost of goods, expenses and profit as they happen, with the sales trend and top categories.",
    where: "Dashboard",
    duration: 8,
    menu: 0,
    page: "Dashboard",
    Component: DashboardScene,
    cursor: dashboardCursor,
  },
  {
    section: "Getting started",
    title: "Your inbox",
    caption: "Everything that needs you lands here. “Your turn” marks the steps you must do next; admins can message everyone, a role, or chosen people.",
    where: "Inbox, or the bell in the top bar",
    duration: 8,
    menu: 1,
    page: "Inbox",
    Component: InboxScene,
    cursor: inboxCursor,
  },

  // Selling
  {
    section: "Selling",
    title: "Sell in seconds",
    caption: "Scan a barcode or search, scan again to add more, choose how the customer pays, and the sale is saved with a receipt.",
    where: "Sales › Sales point",
    duration: 10,
    menu: 2,
    page: "Sales",
    Component: SalesPointScene,
    cursor: salesPointCursor,
  },
  {
    section: "Selling",
    title: "Find any sale",
    caption: "The sales list shows today's totals and every transaction. Search by receipt number, customer, product, store or user, then reprint the receipt.",
    where: "Sales › Sales list",
    duration: 8,
    menu: 2,
    page: "Sales",
    Component: SalesListScene,
    cursor: salesListCursor,
  },
  {
    section: "Selling",
    title: "Nothing quietly disappears",
    caption: "Deleting a sale asks for a reason, puts the items back into stock and keeps a record of who did it and when.",
    where: "Sales › Deleted sales",
    duration: 7.5,
    menu: 2,
    page: "Sales",
    Component: DeletedSalesScene,
    cursor: deletedSalesCursor,
  },
  {
    section: "Selling",
    title: "Expenses, approved",
    caption: "Stores request expenses, an approver approves them, and cash at hand and this month's spending update straight away.",
    where: "Sales › Expenses",
    duration: 9,
    menu: 2,
    page: "Sales",
    Component: ExpensesScene,
    cursor: expensesCursor,
  },
  {
    section: "Selling",
    title: "Customers and deposits",
    caption: "Keep customer accounts. Record deposits, set a credit limit, and let customers pay from their balance at the till.",
    where: "Folio › Customers",
    duration: 8.5,
    menu: 5,
    page: "Folio",
    Component: CustomersScene,
    cursor: customersCursor,
  },

  // Stock
  {
    section: "Stock",
    title: "Build your catalogue",
    caption: "Add a product with its SKU, barcode, category, cost and selling price, and see the margin. Bulk lists come in by CSV.",
    where: "Inventory › Products",
    duration: 8.5,
    menu: 3,
    page: "Inventory",
    Component: ProductsScene,
    cursor: productsCursor,
  },
  {
    section: "Stock",
    title: "Know what's on the shelf",
    caption: "Stock levels flag low stock and items close to expiry, per store. Print barcode labels for any product.",
    where: "Inventory › Stock levels · Print labels",
    duration: 8.5,
    menu: 3,
    page: "Inventory",
    Component: StockLevelsScene,
    cursor: stockLevelsCursor,
  },
  {
    section: "Stock",
    title: "Catch expiry early",
    caption: "See what has expired and what is about to. Sales skip expired units; dispose of them and the stock ledger records it.",
    where: "Inventory › Expiry",
    duration: 7.5,
    menu: 3,
    page: "Inventory",
    Component: ExpiryScene,
    cursor: expiryCursor,
  },
  {
    section: "Stock",
    title: "Move stock between stores",
    caption: "Send stock from the back store to the shop floor or another branch. Both counts and the stock ledger update together.",
    where: "Inventory › Stock transfers",
    duration: 7,
    menu: 3,
    page: "Inventory",
    Component: TransfersScene,
    cursor: transfersCursor,
  },
  {
    section: "Stock",
    title: "Every movement, explained",
    caption: "The stock ledger lists every unit in or out with its reason, document and person. Filter by product, store, reason or dates.",
    where: "Inventory › Stock ledger",
    duration: 7.5,
    menu: 3,
    page: "Inventory",
    Component: LedgerScene,
    cursor: ledgerCursor,
  },

  // Purchasing
  {
    section: "Purchasing",
    title: "Buying, end to end",
    caption: "Requisition, purchase order, goods received, SOR reconciliation and payment: one order follows the same path every time.",
    where: "Purchasing",
    duration: 9,
    menu: 4,
    page: "Purchasing",
    Component: PurchasingScene,
  },
  {
    section: "Purchasing",
    title: "Check suppliers first",
    caption: "A junior check, a senior check and a final approval, by three different people, before a supplier can be paid.",
    where: "Purchasing › Suppliers",
    duration: 8.5,
    menu: 4,
    page: "Purchasing",
    Component: SuppliersScene,
    cursor: suppliersCursor,
  },
  {
    section: "Purchasing",
    title: "Stores ask for stock",
    caption: "A store scans what it needs into a requisition. Once approved, it becomes a purchase order.",
    where: "Purchasing › Store requisitions",
    duration: 8.5,
    menu: 4,
    page: "Purchasing",
    Component: RequisitionsScene,
    cursor: requisitionsCursor,
  },
  {
    section: "Purchasing",
    title: "Receive deliveries properly",
    caption: "The store manager checks the goods, the inventory officer posts them into stock, and procurement matches PO, invoice and GRN.",
    where: "Purchasing › Goods received",
    duration: 8,
    menu: 4,
    page: "Purchasing",
    Component: GoodsReceivedScene,
    cursor: goodsReceivedCursor,
  },
  {
    section: "Purchasing",
    title: "Pay only for what sold",
    caption: "For sale-or-return goods, record what sold, what goes back and what was damaged. The amount due works itself out.",
    where: "Purchasing › SOR reconciliation",
    duration: 8,
    menu: 4,
    page: "Purchasing",
    Component: SorScene,
    cursor: sorCursor,
  },
  {
    section: "Purchasing",
    title: "Pay suppliers safely",
    caption: "Automatic checks on operations, bank details and amount, then a junior check and a senior approval before the money goes.",
    where: "Purchasing › Supplier payments",
    duration: 8.5,
    menu: 4,
    page: "Purchasing",
    Component: PaymentsScene,
    cursor: paymentsCursor,
  },
  {
    section: "Purchasing",
    title: "Follow every order",
    caption: "One row per purchase order: its stage, the next action and who owns it. Filter by owner to see what is waiting on you.",
    where: "Purchasing › Order follow-up",
    duration: 7.5,
    menu: 4,
    page: "Purchasing",
    Component: FollowUpScene,
    cursor: followUpCursor,
  },

  // Team and settings
  {
    section: "Team & settings",
    title: "Approve who works today",
    caption: "Staff request to sign in each day and a manager approves them. Force a logout from every device when needed.",
    where: "User Management › Authorize users · Staff & Roles",
    duration: 8.5,
    menu: 6,
    page: "User Management",
    Component: StaffScene,
    cursor: staffCursor,
  },
  {
    section: "Team & settings",
    title: "Set it up your way",
    caption: "Admins give people their stores, choose who approves expenses, manage expense categories, and pick what reaches each inbox.",
    where: "Settings › Users · Expenses · Notifications",
    duration: 8.5,
    menu: 7,
    page: "Settings",
    Component: AdminSettingsScene,
    cursor: adminSettingsCursor,
  },
  {
    section: "Team & settings",
    title: "Make it yours",
    caption: "Pick a theme, accent colour, interface size and motion setting. Changes apply on this device.",
    where: "Settings › Appearance",
    duration: 7,
    menu: 7,
    page: "Settings",
    Component: AppearanceScene,
    cursor: appearanceCursor,
    sidebarColor: (t, ctx) => accentColor(ctx.tour, t, "sidebar"),
  },
  {
    section: "Team & settings",
    title: "You're ready",
    caption: "That's the tour. Open this guide again any time from the top bar, and jump straight to the chapter you need.",
    duration: 5.5,
    full: true,
    Component: OutroScene,
  },
];

export const SCENES = (() => {
  let start = 0;
  return CHAPTERS.map((chapter) => {
    const timed = { ...chapter, start };
    start += chapter.duration;
    return timed;
  });
})();

export const TOTAL = SCENES.reduce((sum, s) => sum + s.duration, 0);

export const SECTIONS = [...new Set(SCENES.map((s) => s.section))];

export const sceneIndexAt = (time) => {
  for (let i = SCENES.length - 1; i >= 0; i--) if (time >= SCENES[i].start) return i;
  return 0;
};
