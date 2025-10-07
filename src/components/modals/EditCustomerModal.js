import { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";

const EditCustomerModal = ({ isOpen, onClose, onEdit, isLoading, customer }) => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    customerType: "regular",
    creditLimit: "0",
    currentBalance: "0",
    birthday: "",
    gender: ""
  });

  // Pre-fill form when customer data changes
  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || "",
        phone: customer.phone || "",
        email: customer.email || "",
        address: customer.address || "",
        customerType: customer.customerType || "regular",
        creditLimit: customer.creditLimit?.toString() || "0",
        currentBalance: customer.currentBalance?.toString() || "0",
        birthday: customer.birthday || "",
        gender: customer.gender || ""
      });
    }
  }, [customer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customer) return;
    
    await onEdit(customer.id, formData);
    onClose();
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-opacity-50">
      <div className="relative w-full max-w-md mx-4 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            Edit Customer
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
            disabled={isLoading}
          >
            <FaTimes className="text-sm" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Customer Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={isLoading}
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              placeholder="Enter customer name"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                disabled={isLoading}
                className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                placeholder="Phone number"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                placeholder="Email (optional)"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Birthday
              </label>
              <input
                type="date"
                name="birthday"
                value={formData.birthday}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              disabled={isLoading}
              rows="2"
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              placeholder="Customer address (optional)"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Customer Type *
            </label>
            <select
              name="customerType"
              value={formData.customerType}
              onChange={handleChange}
              required
              disabled={isLoading}
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            >
              <option value="regular">Regular Customer</option>
              <option value="debtor">Debtor</option>
              <option value="creditor">Creditor</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Credit Limit
              </label>
              <input
                type="number"
                step="0.01"
                name="creditLimit"
                value={formData.creditLimit}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Current Balance
              </label>
              <input
                type="number"
                step="0.01"
                name="balance"
                value={formData.balance}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-sm text-white bg-blue-600 rounded-md transition-colors hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Updating...
                </>
              ) : (
                "Update Customer"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCustomerModal;