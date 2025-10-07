import { useState } from "react";
import { useRouter } from 'next/router';
import { FaPhone, FaEnvelope, FaEdit, FaTrash, FaPlus, FaEye } from "react-icons/fa";
import { formatCurrency } from "../../utils/formatters";

const CustomerTable = ({
  customers,
  onEdit,
  onDelete,
  onDeposit,
  isLoading,
  deleteLoadingId,
  depositLoadingId,
}) => {
  const router = useRouter();
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [depositData, setDepositData] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    purpose: "",
  });
  const [depositLoading, setDepositLoading] = useState(false);

  const getTypeBadgeClass = (customerType) => {
    switch (customerType) {
      case "debtor":
        return "bg-red-100 text-red-800";
      case "creditor":
        return "bg-green-100 text-green-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getBalanceColor = (balance) => {
    if ((balance || 0) < 0) return "text-red-600";
    if ((balance || 0) > 0) return "text-green-600";
    return "text-gray-600";
  };

  const handleCustomerClick = (customer) => {
    router.push(`/customers/${customer.id}`);
  };

  const handleDepositClick = (customer, e) => {
    e.stopPropagation();
    setSelectedCustomer(customer);
    setDepositData({
      date: new Date().toISOString().split("T")[0],
      amount: "",
      purpose: "",
    });
    setDepositModalOpen(true);
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomer || !depositData.amount || !depositData.date) return;

    setDepositLoading(true);
    try {
      await onDeposit(selectedCustomer.id, depositData);
      setDepositModalOpen(false);
      setSelectedCustomer(null);
      setDepositData({ date: "", amount: "", purpose: "" });
    } catch (error) {
      console.error("Deposit failed:", error);
    } finally {
      setDepositLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDepositData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const closeModal = () => {
    setDepositModalOpen(false);
    setSelectedCustomer(null);
    setDepositData({ date: "", amount: "", purpose: "" });
  };

  const handleActionClick = (action, customer, e) => {
    e.stopPropagation();
    action(customer);
  };

  return (
    <>
      <div className="overflow-hidden bg-white rounded-lg shadow">
        {/* Desktop Table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-700 uppercase">
                  Name
                </th>
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-700 uppercase">
                  Phone Number
                </th>
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-700 uppercase">
                  Email
                </th>
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-700 uppercase">
                  Type
                </th>
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-700 uppercase">
                  Balance
                </th>
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-700 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr 
                  key={customer.id} 
                  className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                  onClick={() => handleCustomerClick(customer)}
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    <div className="flex items-center">
                      {customer.name}
                      <FaEye className="ml-2 text-gray-400 text-xs" />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <div className="flex items-center">
                      <FaPhone className="mr-2 text-xs text-gray-400" />
                      {customer.phone}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {customer.email ? (
                      <div className="flex items-center">
                        <FaEnvelope className="mr-2 text-xs text-gray-400" />
                        {customer.email}
                      </div>
                    ) : (
                      <span className="text-gray-400">No email</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeBadgeClass(
                        customer.customerType
                      )}`}
                    >
                      {customer.customerType || "regular"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    <span className={getBalanceColor(customer.balance)}>
                      {formatCurrency(customer.balance || 0)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => handleDepositClick(customer, e)}
                        className="flex items-center px-3 py-1 text-xs text-green-700 transition-colors bg-green-100 rounded-lg hover:bg-green-200 disabled:opacity-50"
                        disabled={isLoading || deleteLoadingId === customer.id}
                      >
                        <FaPlus className="mr-1" />
                        Deposit
                      </button>
                      <button
                        onClick={(e) => handleActionClick(onEdit, customer, e)}
                        className="flex items-center px-3 py-1 text-xs text-blue-700 transition-colors bg-blue-100 rounded-lg hover:bg-blue-200 disabled:opacity-50"
                        disabled={isLoading || deleteLoadingId === customer.id}
                      >
                        <FaEdit className="mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={(e) => handleActionClick(() => onDelete(customer.id), customer, e)}
                        className="flex items-center px-3 py-1 text-xs text-red-700 transition-colors bg-red-100 rounded-lg hover:bg-red-200 disabled:opacity-50"
                        disabled={isLoading || deleteLoadingId === customer.id}
                      >
                        {deleteLoadingId === customer.id ? (
                          <>
                            <div className="w-3 h-3 border-2 border-red-700 border-t-transparent rounded-full animate-spin mr-1"></div>
                            Deleting...
                          </>
                        ) : (
                          <>
                            <FaTrash className="mr-1" />
                            Delete
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden">
          {customers.map((customer) => (
            <div 
              key={customer.id} 
              className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors duration-150"
              onClick={() => handleCustomerClick(customer)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900">
                        {customer.name}
                      </span>
                      <FaEye className="ml-2 text-gray-400 text-xs" />
                    </div>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeBadgeClass(
                        customer.customerType
                      )}`}
                    >
                      {customer.customerType || "regular"}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <div className="flex items-center">
                      <FaPhone className="mr-2 text-xs" />
                      {customer.phone}
                    </div>
                    {customer.email && (
                      <div className="flex items-center">
                        <FaEnvelope className="mr-2 text-xs" />
                        {customer.email}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between mt-3">
                    <div className="text-sm font-medium">
                      Balance:
                      <span
                        className={`${getBalanceColor(customer.balance)} ml-1`}
                      >
                        {formatCurrency(customer.balance || 0)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={(e) => handleDepositClick(customer, e)}
                      className="flex-1 px-2 py-1 text-xs text-green-700 transition-colors bg-green-100 rounded-lg hover:bg-green-200 flex items-center justify-center disabled:opacity-50"
                      disabled={isLoading || deleteLoadingId === customer.id}
                    >
                      <FaPlus className="mr-1" />
                      Deposit
                    </button>
                    <button
                      onClick={(e) => handleActionClick(onEdit, customer, e)}
                      className="flex-1 px-2 py-1 text-xs text-blue-700 transition-colors bg-blue-100 rounded-lg hover:bg-blue-200 flex items-center justify-center disabled:opacity-50"
                      disabled={isLoading || deleteLoadingId === customer.id}
                    >
                      <FaEdit className="mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={(e) => handleActionClick(() => onDelete(customer.id), customer, e)}
                      className="flex-1 px-2 py-1 text-xs text-red-700 transition-colors bg-red-100 rounded-lg hover:bg-red-200 flex items-center justify-center disabled:opacity-50"
                      disabled={isLoading || deleteLoadingId === customer.id}
                    >
                      {deleteLoadingId === customer.id ? (
                        <>
                          <div className="w-3 h-3 border-2 border-red-700 border-t-transparent rounded-full animate-spin mr-1"></div>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <FaTrash className="mr-1" />
                          Delete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {customers.length === 0 && !isLoading && (
          <div className="py-8 text-center">
            <p className="text-gray-500">No customers found</p>
          </div>
        )}
      </div>

      {/* Deposit Modal */}
      {depositModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Make Deposit - {selectedCustomer?.name}
              </h3>
            </div>

            <form onSubmit={handleDepositSubmit}>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={depositData.date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={depositData.amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-1">
                    Purpose
                  </label>
                  <textarea
                    id="purpose"
                    name="purpose"
                    value={depositData.purpose}
                    onChange={handleInputChange}
                    placeholder="Enter purpose of transaction"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={depositLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 flex items-center"
                  disabled={depositLoading || !depositData.amount || !depositData.date}
                >
                  {depositLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaPlus className="mr-2" />
                      Deposit
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default CustomerTable;