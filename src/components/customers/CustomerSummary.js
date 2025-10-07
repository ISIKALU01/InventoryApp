import { FaUsers, FaMoneyBillWave, FaHandHoldingUsd } from "react-icons/fa";
import { formatCurrency } from "../../utils/formatters";

const CustomerSummary = ({ customers }) => {
  // Calculate summary statistics from customers data
  const calculateSummary = () => {
    if (!customers || !Array.isArray(customers)) {
      return {
        total: 0,
        debtors: 0,
        creditors: 0,
        totalDebts: 0,
        totalCredits: 0
      };
    }

    const summary = customers.reduce(
      (acc, customer) => {
        const balance = customer.balance || 0;
        
        // Count total customers
        acc.total++;
        
        // Check if debtor (negative balance)
        if (balance < 0) {
          acc.debtors++;
          acc.totalDebts += Math.abs(balance); // Store as positive number for display
        }
        // Check if creditor (positive balance)
        else if (balance > 0) {
          acc.creditors++;
          acc.totalCredits += balance;
        }
        
        return acc;
      },
      {
        total: 0,
        debtors: 0,
        creditors: 0,
        totalDebts: 0,
        totalCredits: 0
      }
    );

    return summary;
  };

  const summary = calculateSummary();

  return (
    <div className="p-2 bg-white rounded shadow">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-nowrap sm:overflow-x-auto sm:justify-between sm:space-x-1 md:space-x-2">
        {/* TOTAL CUSTOMERS */}
        <div className="flex-1 p-2 rounded sm:flex-shrink-0 sm:min-w-[120px] md:min-w-[140px] md:p-3">
          <div className="flex items-center">
            <div className="p-1 mr-1 rounded bg-blue-100 md:mr-2 md:p-1.5">
              <FaUsers className="text-xs text-blue-600 md:text-sm" />
            </div>
            <div>
              <h3 className="text-[10px] font-medium text-gray-600 md:text-xs">
                Total Customers
              </h3>
              <p className="text-sm font-bold text-gray-800 md:text-lg">
                {summary.total}
              </p>
            </div>
          </div>
        </div>

        {/* DEBTORS */}
        <div className="flex-1 p-2 rounded sm:flex-shrink-0 sm:min-w-[120px] md:min-w-[140px] md:p-3">
          <div className="flex items-center">
            <div className="p-1 mr-1 rounded bg-red-100 md:mr-2 md:p-1.5">
              <FaMoneyBillWave className="text-xs text-red-600 md:text-sm" />
            </div>
            <div>
              <h3 className="text-[10px] font-medium text-gray-600 md:text-xs">
                Debtors
              </h3>
              <p className="text-sm font-bold text-gray-800 md:text-lg">
                {summary.debtors}
              </p>
            </div>
          </div>
        </div>

        {/* CREDITORS */}
        <div className="flex-1 p-2 rounded sm:flex-shrink-0 sm:min-w-[120px] md:min-w-[140px] md:p-3">
          <div className="flex items-center">
            <div className="p-1 mr-1 rounded bg-green-100 md:mr-2 md:p-1.5">
              <FaHandHoldingUsd className="text-xs text-green-600 md:text-sm" />
            </div>
            <div>
              <h3 className="text-[10px] font-medium text-gray-600 md:text-xs">
                Creditors
              </h3>
              <p className="text-sm font-bold text-gray-800 md:text-lg">
                {summary.creditors}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerSummary;