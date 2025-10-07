import { useState, useEffect } from "react";
import FolioNav from "../../components/FolioNav";
import { customerAPI } from "../../services/customerApi";
import { calculateCustomerSummary } from "../../utils/formatters";
import CustomerSummary from "../../components/customers/CustomerSummary";
import CustomerFilters from "../../components/customers/CustomerFilters";
import CustomerTable from "../../components/customers/CustomerTable";
import ActionButtons from "../../components/customers/ActionButtons";
import ErrorDisplay from "../../components/ui/ErrorDisplay";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import ImportCSVModal from "../../components/modals/ImportCsvModal";
import AddCustomerModal from "../../components/modals/AddCustomerModal";
import EditCustomerModal from "../../components/modals/EditCustomerModal";
import SuccessDisplay from "../../components/ui/SuccessDisplay";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(""); // Add success message state
  const [error, setError] = useState("");
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [depositLoadingId, setDepositLoadingId] = useState(null); // Add deposit loading state

  // Load customers on component mount
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setIsLoading(true);
    setError("");
    try {
      const customersData = await customerAPI.getAllCustomers();
      setCustomers(customersData);
    } catch (err) {
      setError(err.message);
      console.error("Error loading customers:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Detect mobile screen size
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // Filter customers based on filters
  useEffect(() => {
    let filtered = customers;

    if (searchTerm) {
      filtered = filtered.filter(
        (customer) =>
          customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedType) {
      filtered = filtered.filter(
        (customer) => customer.customerType === selectedType
      );
    }

    setFilteredCustomers(filtered);
  }, [customers, searchTerm, selectedType]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedType("");
  };

  const handleImportCSV = (importData) => {
    console.log("Importing CSV data:", importData);
  };

  const handleAddCustomer = async (customerData) => {
    setIsLoading(true);
    setError("");
    try {
      const newCustomer = await customerAPI.createCustomer(customerData);
      setCustomers((prev) => [...prev, newCustomer]);
      setShowAddCustomerModal(false);
    } catch (err) {
      setError(err.message);
      console.error("Error adding customer:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (customer) => {
    setSelectedCustomer(customer);
    setShowEditCustomerModal(true);
  };

  const handleEditCustomer = async (id, customerData) => {
    setIsLoading(true);
    setError("");
    try {
      const updatedCustomer = await customerAPI.updateCustomer(
        id,
        customerData
      );
      setCustomers((prev) =>
        prev.map((customer) =>
          customer.id === id ? updatedCustomer : customer
        )
      );
      setShowEditCustomerModal(false);
      setSelectedCustomer(null);
    } catch (err) {
      setError(err.message);
      console.error("Error updating customer:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) {
      return;
    }

    setDeleteLoadingId(id);
    setError("");
    try {
      await customerAPI.deleteCustomer(id);
      setCustomers((prev) => prev.filter((customer) => customer.id !== id));
    } catch (err) {
      setError(err.message);
      console.error("Error deleting customer:", err);
      await loadCustomers();
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerAPI.getAllCustomers();
      setCustomers(data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  // Add deposit handler
  const handleDeposit = async (customerId, depositData) => {
    setDepositLoadingId(customerId);
    setError("");
    setSuccessMessage(""); // Clear previous success messages
    try {
      const response = await customerAPI.makeDeposit(customerId, depositData);
      fetchCustomers();

      // Update the customer's balance in the local state
      setCustomers((prev) =>
        prev.map((customer) =>
          customer.id === customerId
            ? { ...customer, balance: response.customer.balance }
            : customer
        )
      );

      // Set success message
      setSuccessMessage(response.message);

      // Auto-clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      setError(err.message);
      console.error("Error making deposit:", err);
    } finally {
      setDepositLoadingId(null);
    }
  };

  const summary = calculateCustomerSummary(customers);

  return (
    <div className="relative max-w-6xl mx-auto pb-16 md:pb-0">
      <h1 className="hidden mb-6 text-xl font-normal text-gray-800 md:block font-raleway">
        Customers
      </h1>
      <FolioNav />

      <ErrorDisplay error={error} onClear={() => setError("")} />

      <div className="mt-4 space-y-4 px-2 md:px-0">
        <CustomerSummary customers={customers} />

        <CustomerFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          isMobile={isMobile}
          clearFilters={clearFilters}
          onImport={() => setShowImportModal(true)}
          onAdd={() => setShowAddCustomerModal(true)}
          onRefresh={loadCustomers}
          isLoading={isLoading}
        />

        {/* Customers Table */}
        <div className="overflow-hidden bg-white rounded shadow">
          {isLoading && customers.length === 0 ? (
            <LoadingSpinner message="Loading customers..." />
          ) : (
            <CustomerTable
              customers={customers}
              onEdit={handleEditClick}
              onDelete={handleDeleteCustomer}
              onDeposit={handleDeposit} // Add this prop
              isLoading={isLoading}
              deleteLoadingId={deleteLoadingId}
              depositLoadingId={depositLoadingId} // Add this prop
            />
          )}
        </div>
      </div>

      {/* Mobile Action Buttons */}
      <ActionButtons
        onImport={() => setShowImportModal(true)}
        onAdd={() => setShowAddCustomerModal(true)}
        onRefresh={loadCustomers}
        isLoading={isLoading}
        isMobile={isMobile}
      />

      {/* Modals */}
      <ImportCSVModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportCSV}
      />

      <AddCustomerModal
        isOpen={showAddCustomerModal}
        onClose={() => setShowAddCustomerModal(false)}
        onAdd={handleAddCustomer}
        isLoading={isLoading}
      />

      <EditCustomerModal
        isOpen={showEditCustomerModal}
        onClose={() => {
          setShowEditCustomerModal(false);
          setSelectedCustomer(null);
        }}
        onEdit={handleEditCustomer}
        isLoading={isLoading}
        customer={selectedCustomer}
      />
    </div>
  );
}
