const API_BASE_URL = "https://pgimsapp-production.up.railway.app/api";

// API Service functions with authentication
export const inventoryAPI = {
  async getAuthHeaders() {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token found. Please log in again.");
    }

    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };
  },

  async getAllInventory() {
    try {
      const headers = await this.getAuthHeaders();
      console.log("Fetching inventory from:", `${API_BASE_URL}/inventory`);

      const response = await fetch(`${API_BASE_URL}/inventory`, {
        method: "GET",
        headers,
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.");
        }

        let errorMessage = `Failed to fetch inventory: ${response.status}`;
        try {
          const errorData = await response.json();
          console.log("Error response data:", errorData);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.log("Could not parse error response as JSON");
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("Inventory data received:", data);
      return data;
    } catch (error) {
      console.error("Error in getAllInventory:", error);
      if (
        error.message.includes("No authentication token") ||
        error.message.includes("Authentication failed")
      ) {
        window.location.href = "/";
      }
      throw error;
    }
  },

  async createInventory(inventoryData) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/inventory`, {
        method: "POST",
        headers,
        body: JSON.stringify(inventoryData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.");
        }
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Failed to create inventory: ${response.status}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (
        error.message.includes("No authentication token") ||
        error.message.includes("Authentication failed")
      ) {
        window.location.href = "/";
      }
      throw error;
    }
  },

  async updateInventory(id, inventoryData) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/inventory/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(inventoryData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.");
        }
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Failed to update inventory: ${response.status}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (
        error.message.includes("No authentication token") ||
        error.message.includes("Authentication failed")
      ) {
        window.location.href = "/";
      }
      throw error;
    }
  },

  async deleteInventory(id) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/inventory/${id}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.");
        }
        throw new Error(`Failed to delete inventory: ${response.status}`);
      }

      return true;
    } catch (error) {
      if (
        error.message.includes("No authentication token") ||
        error.message.includes("Authentication failed")
      ) {
        window.location.href = "/";
      }
      throw error;
    }
  },
};

export const storeAPI = {
  async getAuthHeaders() {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token found. Please log in again.");
    }

    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };
  },

  async getAllStores() {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/stores`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.");
        }
        throw new Error(`Failed to fetch stores: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (
        error.message.includes("No authentication token") ||
        error.message.includes("Authentication failed")
      ) {
        window.location.href = "/";
      }
      throw error;
    }
  },
};

export const productAPI = {
  async getAuthHeaders() {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token found. Please log in again.");
    }

    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };
  },

  async getAllProducts() {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/products`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.");
        }
        throw new Error(`Failed to fetch products: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (
        error.message.includes("No authentication token") ||
        error.message.includes("Authentication failed")
      ) {
        window.location.href = "/";
      }
      throw error;
    }
  },
};

export const customerAPI = {
  async getAuthHeaders() {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token found. Please log in again.");
    }

    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };
  },

  async getAllCustomers() {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/customers`, {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch customers: ${response.status}`);
    }

    return response.json();
  },

  async createCustomer(customerData) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/customers`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(customerData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message || `Failed to create customer: ${response.status}`
      );
    }

    return response.json();
  },

  async updateCustomer(id, customerData) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
      method: "PUT",
      headers: headers,
      body: JSON.stringify(customerData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update customer: ${response.status}`);
    }

    return response.json();
  },

  async deleteCustomer(id) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
      method: "DELETE",
      headers: headers,
    });

    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = `Failed to delete customer: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData?.message || errorMessage;
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    // For 204 No Content responses, don't try to parse JSON
    if (response.status === 204) {
      return { success: true, message: "Customer deleted successfully" };
    }

    // For other success responses, try to parse JSON
    try {
      return await response.json();
    } catch {
      return { success: true, message: "Customer deleted successfully" };
    }
  },

  // Add deposit method
  async makeDeposit(customerId, depositData) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(
      `${API_BASE_URL}/customers/${customerId}/deposit`,
      {
        method: "POST",
        headers: headers,
        body: JSON.stringify(depositData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message || `Failed to make deposit: ${response.status}`
      );
    }

    return response.json();
  },

  // Add this to your existing customerAPI object
  async getCustomerDeposits(customerId) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(
      `${API_BASE_URL}/customers/${customerId}/deposits`,
      {
        method: "GET",
        headers: headers,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message || `Failed to fetch deposits: ${response.status}`
      );
    }

    return response.json();
  },
};

const getAuthHeaders = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No authentication token found. Please log in again.");
  }
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const orderItemAPI = {
  async getAuthHeaders() {
    return getAuthHeaders();
  },

  // Create a new order item
  async createOrderItem(orderItemData) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/order-items`, {
        method: "POST",
        headers,
        body: JSON.stringify(orderItemData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/";
          throw new Error("Authentication failed. Please log in again.");
        }

        let errorMessage = `Failed to create order item: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.log("Could not parse error response as JSON");
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  },

  // Update an order item
  async updateOrderItem(id, orderItemData) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/order-items/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(orderItemData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/";
          throw new Error("Authentication failed. Please log in again.");
        }

        let errorMessage = `Failed to update order item: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.log("Could not parse error response as JSON");
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  },

  // Delete an order item
  async deleteOrderItem(id) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/order-items/${id}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/";
          throw new Error("Authentication failed. Please log in again.");
        }

        let errorMessage = `Failed to delete order item: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.log("Could not parse error response as JSON");
        }

        throw new Error(errorMessage);
      }

      return { success: true, message: "Order item deleted successfully" };
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  },
};

export const orderAPI = {
  async createOrder() {
    try {
      const headers = await getAuthHeaders();

      // Use a valid product that exists and has stock
      const orderData = {
        customer_id: 1,
        items: [
          {
            product_id: 1, // Make sure this product exists and has stock
            quantity: 100,
          },
        ],
        payment_method: "cash",
      };

      console.log("Creating order with data:", orderData);

      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers,
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        let errorMessage = `Failed to create order: ${response.status}`;
        try {
          const errorData = await response.json();
          console.log("Order creation error details:", errorData);
          errorMessage = errorData.message || errorMessage;

          if (errorData.errors) {
            errorMessage += ` - ${JSON.stringify(errorData.errors)}`;
          }
        } catch (e) {
          console.log("Could not parse error response as JSON");
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("Order created successfully:", data);
      return data;
    } catch (error) {
      console.error("Order API Error:", error);
      throw error;
    }
  },

  // Get order by ID
  async getOrder(id) {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch order: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Order API Error:", error);
      throw error;
    }
  },

  // Update order
  async updateOrder(id, orderData) {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update order: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Order API Error:", error);
      throw error;
    }
  },

  // Delete order
  async deleteOrder(id) {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to delete order: ${response.status}`);
      }

      return { success: true, message: "Order deleted successfully" };
    } catch (error) {
      console.error("Order API Error:", error);
      throw error;
    }
  },
};