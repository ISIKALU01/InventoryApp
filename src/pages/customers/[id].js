import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { 
  FaPhone, FaEnvelope, FaMapMarkerAlt, FaCalendarAlt,
  FaArrowLeft, FaEdit, FaMoneyBillWave, FaUserTag
} from 'react-icons/fa';
import { customerAPI } from '../../services/customerApi';
import { formatCurrency } from '../../utils/formatters';
import DepositHistoryTable from '../../components/DepositHistoryTable';

const CustomerProfile = () => {
  const router = useRouter();
  const { id } = router.query;
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [depositHistory, setDepositHistory] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchCustomerData();
    }
  }, [id]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch all customers and find the specific one
      const customers = await customerAPI.getAllCustomers();
      const foundCustomer = customers.find(c => c.id.toString() === id.toString());
      
      if (!foundCustomer) {
        setError('Customer not found');
        setLoading(false);
        return;
      }
      
      setCustomer(foundCustomer);
      await fetchDepositHistory(foundCustomer.id);
    } catch (error) {
      console.error("Error fetching customer:", error);
      setError(error.message || 'Failed to load customer data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepositHistory = async (customerId) => {
    try {
      // Since your API doesn't have a direct deposit history endpoint,
      // you might need to implement this based on your backend
      // For now, we'll set empty array
      setDepositHistory([]);
    } catch (error) {
      console.error("Error fetching deposit history:", error);
      setDepositHistory([]);
    }
  };

  const getTypeBadgeClass = (customerType) => {
    switch (customerType) {
      case "debtor": return "bg-red-100 text-red-800 border-red-200";
      case "creditor": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  const getBalanceColor = (balance) => {
    if ((balance || 0) < 0) return "text-red-600";
    if ((balance || 0) > 0) return "text-green-600";
    return "text-gray-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {error || 'Customer not found'}
          </h2>
          <button 
            onClick={() => router.push('/customers')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Customers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            Back to Customers
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Customer Profile
            </h1>
            <div className="flex gap-3 mt-3 sm:mt-0">
              <button 
                onClick={() => router.push(`/customers/edit/${customer.id}`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <FaEdit className="mr-2" />
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Details Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Customer Information</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Personal Details
                    </h3>
                    
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-8">
                        <FaUserTag className="text-gray-400 mt-1" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Full Name</p>
                        <p className="text-lg font-semibold text-gray-900">{customer.name}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-8">
                        <FaPhone className="text-gray-400 mt-1" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Phone Number</p>
                        <p className="text-lg text-gray-900">{customer.phone}</p>
                      </div>
                    </div>

                    {customer.email && (
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-8">
                          <FaEnvelope className="text-gray-400 mt-1" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Email Address</p>
                          <p className="text-lg text-gray-900">{customer.email}</p>
                        </div>
                      </div>
                    )}

                    {customer.address && (
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-8">
                          <FaMapMarkerAlt className="text-gray-400 mt-1" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Address</p>
                          <p className="text-lg text-gray-900">{customer.address}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Account Information */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Account Details
                    </h3>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-8">
                        <FaMoneyBillWave className="text-gray-400 mt-1" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Current Balance</p>
                        <p className={`text-2xl font-bold ${getBalanceColor(customer.balance)}`}>
                          {formatCurrency(customer.balance || 0)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-8">
                        <div className={`w-3 h-3 rounded-full mt-2 ${
                          customer.customerType === 'debtor' ? 'bg-red-500' : 
                          customer.customerType === 'creditor' ? 'bg-green-500' : 'bg-blue-500'
                        }`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Customer Type</p>
                        <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full border ${getTypeBadgeClass(customer.customerType)}`}>
                          {customer.customerType || "regular"}
                        </span>
                      </div>
                    </div>

                    {customer.createdAt && (
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-8">
                          <FaCalendarAlt className="text-gray-400 mt-1" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Member Since</p>
                          <p className="text-lg text-gray-900">
                            {new Date(customer.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}

                    {customer.updatedAt && (
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-8">
                          <FaCalendarAlt className="text-gray-400 mt-1" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Last Updated</p>
                          <p className="text-lg text-gray-900">
                            {new Date(customer.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes Section */}
                {customer.notes && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                      Additional Notes
                    </h3>
                    <p className="text-gray-700 bg-gray-50 rounded-lg p-4">
                      {customer.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Deposit History Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
              </div>
              <div className="p-6">
                <DepositHistoryTable 
                  deposits={depositHistory}
                  customerId={customer.id}
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Total Balance</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(customer.balance || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Customer Type</p>
                  <p className="text-xl font-bold text-gray-900 capitalize">
                    {customer.customerType || "regular"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Account Status</p>
                  <p className="text-xl font-bold text-green-600">
                    Active
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => router.push(`/customers/${customer.id}/deposit`)}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <FaMoneyBillWave className="mr-2" />
                  New Deposit
                </button>
                
                <button 
                  onClick={() => router.push(`/customers/edit/${customer.id}`)}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <FaEdit className="mr-2" />
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;