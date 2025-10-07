const API_BASE_URL = "https://pgims-production.up.railway.app/api";

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
};
