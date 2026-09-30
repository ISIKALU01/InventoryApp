import { useState, useEffect } from "react";
import { 
  FaArrowLeft, 
  FaUser, 
  FaPhone, 
  FaEnvelope, 
  FaMapMarkerAlt, 
  FaBirthdayCake,
  FaDollarSign,
  FaCreditCard,
  FaHistory,
  FaPlus,
  FaCalendar,
  FaMoneyBillWave,
  FaStickyNote
} from "react-icons/fa";

const API_BASE_URL = "https://pgimsapp-production.up.railway.app";

// Customer API Service functions
const customerAPI = {
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

  async getCustomerById(id) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch customer: ${response.status}`);
    }

    return response.json();
  },

  async getCustomerDeposits(customerId) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/customers/${customerId}/deposits`, {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch deposits: ${response.status}`);
    }

    return response.json();
  },

  async addDeposit(customerId, depositData) {
    const headers = await this.getAuthHeaders();
    
    const apiDepositData = {
      amount: parseFloat(depositData.amount),
      description: depositData.description || "",
      customer_id: customerId
    };

    const response = await fetch(`${API_BASE_URL}/customers/${customerId}/deposit`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(apiDepositData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message || `Failed to add deposit: ${response.status}`
      );
    }

    return response.json();
  }
};

// Helper function to format currency in Naira
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN'
  }).format(amount || 0);
};

// Helper function to format Naira without currency symbol
const formatNaira = (amount) => {
  return new Intl.NumberFormat('en-NG').format(amount || 0);
};

const CustomerProfile = ({ customerId, onBack }) => {
  const [customer, setCustomer] = useState(null);
  const [deposits, setDeposits] = useState([]);
  const [showAddDeposit, setShowAddDeposit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [depositLoading, setDepositLoading] = useState(false);
  const [error, setError] = useState("");

  // Simplified deposit form state - only amount and description
  const [depositForm, setDepositForm] = useState({
    amount: "",
    description: ""
  });

  // Fetch customer details and deposits
  const fetchCustomerData = async () => {
    setLoading(true);
    setError("");
    try {
      const [customerData, depositsData] = await Promise.all([
        customerAPI.getCustomerById(customerId),
        customerAPI.getCustomerDeposits(customerId)
      ]);
      setCustomer(customerData);
      setDeposits(depositsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      fetchCustomerData();
    }
  }, [customerId]);

  const handleAddDeposit = async (e) => {
    e.preventDefault();
    setDepositLoading(true);
    setError("");

    try {
      await customerAPI.addDeposit(customerId, depositForm);
      
      // Refresh customer data and deposits
      await fetchCustomerData();
      
      // Reset form and close modal
      setDepositForm({
        amount: "",
        description: ""
      });
      setShowAddDeposit(false);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setDepositLoading(false);
    }
  };

  const handleDepositFormChange = (e) => {
    setDepositForm({
      ...depositForm,
      [e.target.name]: e.target.value,
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="py-8 text-center">
          <p className="text-gray-600">Loading customer profile...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="py-8 text-center">
          <p className="text-red-600">Customer not found</p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 text-blue-600 hover:text-blue-800"
          >
            ←
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <FaArrowLeft className="mr-2" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Customer Profile</h1>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 text-sm text-red-600 bg-red-100 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Basic Information</h2>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FaUser className="text-blue-600 text-xl" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Full Name</label>
                <p className="text-lg font-semibold text-gray-800">{customer.name}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Gender</label>
                <p className="text-lg font-semibold text-gray-800 capitalize">{customer.gender}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600 flex items-center">
                  <FaPhone className="mr-2 text-gray-400" />
                  Phone
                </label>
                <p className="text-lg font-semibold text-gray-800">{customer.phone}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600 flex items-center">
                  <FaEnvelope className="mr-2 text-gray-400" />
                  Email
                </label>
                <p className="text-lg font-semibold text-gray-800">{customer.email}</p>
              </div>
              
              {customer.birthday && (
                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center">
                    <FaBirthdayCake className="mr-2 text-gray-400" />
                    Birthday
                  </label>
                  <p className="text-lg font-semibold text-gray-800">
                    {new Date(customer.birthday).toLocaleDateString()}
                  </p>
                </div>
              )}
              
              {customer.address && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-600 flex items-center">
                    <FaMapMarkerAlt className="mr-2 text-gray-400" />
                    Address
                  </label>
                  <p className="text-lg font-semibold text-gray-800">{customer.address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Deposit History Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <FaHistory className="mr-2 text-gray-400" />
                Deposit History
              </h2>
              <button
                onClick={() => setShowAddDeposit(true)}
                className="flex items-center px-4 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
              >
                <FaPlus className="mr-2" />
                Add Deposit
              </button>
            </div>

            {deposits.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FaHistory className="mx-auto text-3xl mb-2 text-gray-300" />
                <p>No deposit history found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {deposits.map((deposit) => (
                      <tr key={deposit.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="flex items-center">
                            <FaCalendar className="mr-2 text-gray-400" />
                            {formatDate(deposit.created_at)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-green-600">
                          <div className="flex items-center">
                            ₦{formatNaira(deposit.amount)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {deposit.description || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Financial Summary */}
        <div className="space-y-6">
          {/* Balance Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Financial Summary</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Current Balance</p>
                  <p className={`text-2xl font-bold ${parseFloat(customer.balance || 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ₦{formatNaira(Math.abs(parseFloat(customer.balance || 0)))}
                  </p>
                </div>
                <FaMoneyBillWave className="text-2xl text-blue-600" />
              </div>
              
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Credit Limit</p>
                  <p className="text-2xl font-bold text-purple-600">
                    ₦{formatNaira(customer.credit_limit)}
                  </p>
                </div>
                <FaCreditCard className="text-2xl text-purple-600" />
              </div>
              
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Total Deposits</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₦{formatNaira(deposits.reduce((sum, deposit) => sum + parseFloat(deposit.amount || 0), 0))}
                  </p>
                </div>
                <FaMoneyBillWave className="text-2xl text-green-600" />
              </div>
            </div>
          </div>

          {/* Notes Card */}
          {customer.notes && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FaStickyNote className="mr-2 text-gray-400" />
                Notes
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">{customer.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Deposit Modal - FIXED: Only amount and description fields */}
      {showAddDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Add Deposit</h2>
              <button
                onClick={() => setShowAddDeposit(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={depositLoading}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddDeposit} className="p-4 space-y-4">
              {/* Only Amount field - required */}
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Amount (₦) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="amount"
                  value={depositForm.amount}
                  onChange={handleDepositFormChange}
                  required
                  disabled={depositLoading}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>

              {/* Only Description field - optional */}
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  value={depositForm.description}
                  onChange={handleDepositFormChange}
                  disabled={depositLoading}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Deposit description (optional)"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDeposit(false)}
                  disabled={depositLoading}
                  className="flex-1 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={depositLoading}
                  className="flex-1 px-4 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {depositLoading ? "Processing..." : "Add Deposit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerProfile;