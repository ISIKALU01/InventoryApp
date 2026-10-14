import BASE_URL from "../config";

const NO_TOKEN_MESSAGE = "No authentication token found. Please log in again.";
const AUTH_FAILED_MESSAGE = "Authentication failed. Please log in again.";

const redirectToLogin = () => {
  if (typeof window !== "undefined") {
    window.location.href = "/";
  }
};

export const getAuthHeaders = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) {
    redirectToLogin();
    throw new Error(NO_TOKEN_MESSAGE);
  }

  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// Authenticated JSON request against the backend.
// Redirects to login on a missing token or 401, and surfaces the server's
// `message` (falling back to `${errorLabel}: <status>`) on other failures.
export const apiRequest = async (path, { method = "GET", body, errorLabel = "Request failed" } = {}) => {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: getAuthHeaders(),
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 401) {
    redirectToLogin();
    throw new Error(AUTH_FAILED_MESSAGE);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    // The server's message is already readable ("The account number must be
    // ...", "(and 1 more error)"), so it's shown as is, without the raw field list
    const message = errorData?.message || `${errorLabel}: ${response.status}`;
    throw new Error(message);
  }

  const text = await response.text();
  if (!text) {
    return { success: true };
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    // Some DELETE endpoints reply with a non-JSON body
    if (method === "DELETE") {
      return { success: true };
    }
    throw error;
  }
};

// Products
// `stock` is optional and left out of the body when not given, so an
// update doesn't overwrite the product's current stock
const toProductPayload = (productData) => ({
  sku: productData.sku || "",
  // Left out when not given, so saving a product elsewhere keeps its barcode;
  // an empty value removes it
  barcode: productData.barcode === undefined ? undefined : String(productData.barcode ?? "").trim() || null,
  name: productData.name,
  description: productData.description || "",
  price: productData.price,
  cost_price: productData.cost_price,
  stock: productData.stock,
});

export const productAPI = {
  getAllProducts: () => apiRequest("/products", { errorLabel: "Failed to fetch products" }),

  // Give products without a barcode an in-store one; pass ids to do only some
  generateBarcodes: (productIds) =>
    apiRequest("/products/barcodes/generate", {
      method: "POST",
      body: productIds ? { product_ids: productIds } : {},
      errorLabel: "Failed to create barcodes",
    }),

  createProduct: (productData) =>
    apiRequest("/products", {
      method: "POST",
      errorLabel: "Failed to create product",
      body: toProductPayload(productData),
    }),

  updateProduct: (id, productData) =>
    apiRequest(`/products/${id}`, {
      method: "PUT",
      errorLabel: "Failed to update product",
      body: toProductPayload(productData),
    }),

  deleteProduct: (id) =>
    apiRequest(`/products/${id}`, { method: "DELETE", errorLabel: "Failed to delete product" }),
};

// Product categories
export const categoryAPI = {
  getAllCategories: () =>
    apiRequest("/product-categories", { errorLabel: "Failed to fetch categories" }),

  createCategory: (categoryData) =>
    apiRequest("/product-categories", {
      method: "POST",
      errorLabel: "Failed to create category",
      body: {
        name: categoryData.name,
        description: categoryData.description || `${categoryData.name} category`,
      },
    }),

  updateCategory: (id, categoryData) =>
    apiRequest(`/product-categories/${id}`, {
      method: "PUT",
      errorLabel: "Failed to update category",
      body: {
        name: categoryData.name,
        description: categoryData.description || `${categoryData.name} category`,
      },
    }),

  deleteCategory: (id) =>
    apiRequest(`/product-categories/${id}`, {
      method: "DELETE",
      errorLabel: "Failed to delete category",
    }),
};

// Inventory
export const inventoryAPI = {
  getAllInventory: () => apiRequest("/inventory", { errorLabel: "Failed to fetch inventory" }),

  createInventory: (inventoryData) =>
    apiRequest("/inventory", {
      method: "POST",
      body: inventoryData,
      errorLabel: "Failed to create inventory",
    }),

  updateInventory: (id, inventoryData) =>
    apiRequest(`/inventory/${id}`, {
      method: "PUT",
      body: inventoryData,
      errorLabel: "Failed to update inventory",
    }),

  deleteInventory: (id) =>
    apiRequest(`/inventory/${id}`, { method: "DELETE", errorLabel: "Failed to delete inventory" }),

  // Goods coming in: adds `quantity` units, optionally with expiry_date and batch_number
  receiveStock: (id, data) =>
    apiRequest(`/inventory/${id}/receive`, {
      method: "POST",
      body: data,
      errorLabel: "Failed to receive stock",
    }),
};

// Stores
export const storeAPI = {
  getAllStores: () => apiRequest("/stores", { errorLabel: "Failed to fetch stores" }),

  createStore: (storeData) =>
    apiRequest("/stores", { method: "POST", body: storeData, errorLabel: "Failed to create store" }),

  updateStore: (id, storeData) =>
    apiRequest(`/stores/${id}`, {
      method: "PUT",
      body: storeData,
      errorLabel: "Failed to update store",
    }),

  deleteStore: (id) =>
    apiRequest(`/stores/${id}`, { method: "DELETE", errorLabel: "Failed to delete store" }),
};

// Customers
const toCustomerPayload = (customerData) => ({
  name: customerData.name,
  gender: customerData.gender,
  phone: customerData.phone,
  email: customerData.email,
  address: customerData.address,
  birthday: customerData.birthday,
  balance: customerData.balance,
  credit_limit: customerData.credit_limit,
  notes: customerData.notes,
});

export const customerAPI = {
  getAllCustomers: () => apiRequest("/customers", { errorLabel: "Failed to fetch customers" }),

  getCustomerById: (id) =>
    apiRequest(`/customers/${id}`, { errorLabel: "Failed to fetch customer" }),

  createCustomer: (customerData) =>
    apiRequest("/customers", {
      method: "POST",
      body: toCustomerPayload(customerData),
      errorLabel: "Failed to create customer",
    }),

  updateCustomer: (id, customerData) =>
    apiRequest(`/customers/${id}`, {
      method: "PUT",
      body: toCustomerPayload(customerData),
      errorLabel: "Failed to update customer",
    }),

  deleteCustomer: (id) =>
    apiRequest(`/customers/${id}`, { method: "DELETE", errorLabel: "Failed to delete customer" }),

  getCustomerDeposits: (customerId) =>
    apiRequest(`/customers/${customerId}/deposits`, { errorLabel: "Failed to fetch deposits" }),

  addDeposit: (customerId, depositData) =>
    apiRequest(`/customers/${customerId}/deposit`, {
      method: "POST",
      errorLabel: "Failed to add deposit",
      body: {
        amount: parseFloat(depositData.amount),
        description: depositData.description || "",
        customer_id: customerId,
      },
    }),
};

// Bank accounts
export const bankAPI = {
  getAllBanks: () => apiRequest("/bank-accounts", { errorLabel: "Failed to fetch banks" }),

  createBank: (bankData) =>
    apiRequest("/bank-accounts", {
      method: "POST",
      body: bankData,
      errorLabel: "Failed to create bank",
    }),

  updateBank: (id, bankData) =>
    apiRequest(`/bank-accounts/${id}`, {
      method: "PUT",
      body: bankData,
      errorLabel: "Failed to update bank",
    }),

  deleteBank: (id) =>
    apiRequest(`/bank-accounts/${id}`, { method: "DELETE", errorLabel: "Failed to delete bank" }),
};

// Suppliers
export const supplierAPI = {
  getAllSuppliers: () => apiRequest("/suppliers", { errorLabel: "Failed to fetch suppliers" }),

  createSupplier: (supplierData) =>
    apiRequest("/suppliers", {
      method: "POST",
      body: supplierData,
      errorLabel: "Failed to create supplier",
    }),

  updateSupplier: (id, supplierData) =>
    apiRequest(`/suppliers/${id}`, {
      method: "PUT",
      body: supplierData,
      errorLabel: "Failed to update supplier",
    }),

  deleteSupplier: (id) =>
    apiRequest(`/suppliers/${id}`, { method: "DELETE", errorLabel: "Failed to delete supplier" }),

  // Junior accountant: confirm the bank details ({ method, reference })
  verifySupplier: (id, data) =>
    apiRequest(`/suppliers/${id}/verify`, { method: "POST", body: data, errorLabel: "Failed to verify supplier" }),

  suspendSupplier: (id, reason) =>
    apiRequest(`/suppliers/${id}/suspend`, { method: "POST", body: { reason }, errorLabel: "Failed to suspend supplier" }),

  getSupplierHistory: (id) =>
    apiRequest(`/suppliers/${id}/history`, { errorLabel: "Failed to load supplier history" }),
};

// Purchase orders
export const purchaseOrderAPI = {
  // Paginated: { data: [...], current_page, last_page, ... }
  getAllPurchaseOrders: (page = 1) =>
    apiRequest(`/purchase-orders?page=${page}`, { errorLabel: "Failed to fetch purchase orders" }),

  createPurchaseOrder: (orderData) =>
    apiRequest("/purchase-orders", {
      method: "POST",
      body: orderData,
      errorLabel: "Failed to create purchase order",
    }),

  updatePurchaseOrder: (id, orderData) =>
    apiRequest(`/purchase-orders/${id}`, {
      method: "PUT",
      body: orderData,
      errorLabel: "Failed to update purchase order",
    }),

  deletePurchaseOrder: (id) =>
    apiRequest(`/purchase-orders/${id}`, {
      method: "DELETE",
      errorLabel: "Failed to delete purchase order",
    }),

  issuePurchaseOrder: (id) =>
    apiRequest(`/purchase-orders/${id}/issue`, { method: "POST", errorLabel: "Failed to issue purchase order" }),

  cancelPurchaseOrder: (id, reason) =>
    apiRequest(`/purchase-orders/${id}/cancel`, {
      method: "POST",
      body: { reason },
      errorLabel: "Failed to cancel purchase order",
    }),

  getPurchaseOrderHistory: (id) =>
    apiRequest(`/purchase-orders/${id}/history`, { errorLabel: "Failed to load purchase order history" }),
};

// Expenses
export const expenseAPI = {
  getAllExpenses: () => apiRequest("/expenses", { errorLabel: "Failed to fetch expenses" }),

  createExpense: (expenseData) =>
    apiRequest("/expenses", {
      method: "POST",
      body: expenseData,
      errorLabel: "Failed to create expense",
    }),

  updateExpense: (id, expenseData) =>
    apiRequest(`/expenses/${id}`, {
      method: "PUT",
      body: expenseData,
      errorLabel: "Failed to update expense",
    }),

  deleteExpense: (id) =>
    apiRequest(`/expenses/${id}`, { method: "DELETE", errorLabel: "Failed to delete expense" }),
};

// Users
export const userAPI = {
  getCurrentUser: () => apiRequest("/user", { errorLabel: "Failed to fetch current user" }),

  getAllUsers: () => apiRequest("/users", { errorLabel: "Failed to fetch users" }),
};

// Order items (sales cart)
export const orderItemAPI = {
  createOrderItem: (orderItemData) =>
    apiRequest("/order-items", {
      method: "POST",
      body: orderItemData,
      errorLabel: "Failed to create order item",
    }),

  updateOrderItem: (id, orderItemData) =>
    apiRequest(`/order-items/${id}`, {
      method: "PUT",
      body: orderItemData,
      errorLabel: "Failed to update order item",
    }),

  deleteOrderItem: (id) =>
    apiRequest(`/order-items/${id}`, {
      method: "DELETE",
      errorLabel: "Failed to delete order item",
    }),
};
