// lib/api.js
const API_BASE_URL = "https://pgimsapp-production.up.railway.app/api";

// Common function to get auth headers
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

// Common error handler
const handleApiError = (error) => {
  if (
    error.message.includes("No authentication token") ||
    error.message.includes("Authentication failed")
  ) {
    window.location.href = "/";
  }
  throw error;
};

// Products API
export const productAPI = {
  async getAllProducts() {
    try {
      const headers = await getAuthHeaders();
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

      return response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  async createProduct(productData) {
    try {
      const headers = await getAuthHeaders();

      const apiProductData = {
        sku: productData.sku,
        name: productData.name,
        description:
          productData.description ||
          `${productData.name} - ${productData.category}`,
        price: productData.price.toString(),
        stock: parseInt(productData.sold) || 0,
      };

      const response = await fetch(`${API_BASE_URL}/products`, {
        method: "POST",
        headers,
        body: JSON.stringify(apiProductData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.");
        }
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `Failed to create product: ${response.status}`
        );
      }

      return response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  async updateProduct(id, productData) {
    try {
      const headers = await getAuthHeaders();

      const apiProductData = {
        sku: productData.sku,
        name: productData.name,
        description:
          productData.description ||
          `${productData.name} - ${productData.category}`,
        price: productData.price.toString(),
        stock: parseInt(productData.sold) || 0,
      };

      const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(apiProductData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.");
        }
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `Failed to update product: ${response.status}`
        );
      }

      return response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  async deleteProduct(id) {
    try {
      const headers = await getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.");
        }
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `Failed to delete product: ${response.status}`
        );
      }

      if (response.status === 204) {
        return { success: true };
      }

      return response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// Categories API
export const categoryAPI = {
  async getAllCategories() {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/product-categories`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.");
        }
        throw new Error(`Failed to fetch categories: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  async createCategory(categoryData) {
    try {
      const headers = await getAuthHeaders();

      const apiCategoryData = {
        name: categoryData.name,
        description: categoryData.description || `${categoryData.name} category`,
      };

      const response = await fetch(`${API_BASE_URL}/product-categories`, {
        method: "POST",
        headers,
        body: JSON.stringify(apiCategoryData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.");
        }
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `Failed to create category: ${response.status}`
        );
      }

      return response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  async updateCategory(id, categoryData) {
    try {
      const headers = await getAuthHeaders();

      const apiCategoryData = {
        name: categoryData.name,
        description: categoryData.description || `${categoryData.name} category`,
      };

      const response = await fetch(`${API_BASE_URL}/product-categories/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(apiCategoryData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.");
        }
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `Failed to update category: ${response.status}`
        );
      }

      return response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  async deleteCategory(id) {
    try {
      const headers = await getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/product-categories/${id}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.");
        }
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `Failed to delete category: ${response.status}`
        );
      }

      if (response.status === 204) {
        return { success: true };
      }

      return response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },
};