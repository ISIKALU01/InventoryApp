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
    let message = errorData?.message || `${errorLabel}: ${response.status}`;
    if (errorData?.errors) {
      message += ` - ${JSON.stringify(errorData.errors)}`;
    }
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
export const productAPI = {
  getAllProducts: () => apiRequest("/products", { errorLabel: "Failed to fetch products" }),

  createProduct: (productData) =>
    apiRequest("/products", {
      method: "POST",
      errorLabel: "Failed to create product",
      body: {
        sku: productData.sku || "",
        name: productData.name,
        description: productData.description || "",
        price: productData.price,
        cost_price: productData.cost_price,
      },
    }),

  updateProduct: (id, productData) =>
    apiRequest(`/products/${id}`, {
      method: "PUT",
      errorLabel: "Failed to update product",
      body: {
        sku: productData.sku || "",
        name: productData.name,
        description: productData.description || "",
        price: productData.price,
        stock: productData.stock,
      },
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
};

// Purchase orders
export const purchaseOrderAPI = {
  getAllPurchaseOrders: () =>
    apiRequest("/purchase-orders", { errorLabel: "Failed to fetch purchase orders" }),

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
