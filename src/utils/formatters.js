export const formatCurrency = (value) => {
  if (value === null || value === undefined) return "$0.00";
  const num = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(num) ? "N0.00" : `N${num.toFixed(2)}`;
};

export const calculateCustomerSummary = (customers) => {
  const totalCustomers = customers.length;
  
  // Calculate debtors based on negative balance OR customerType = "debtor"
  const debtors = customers.filter((customer) => {
    const balance = typeof customer.currentBalance === "string" 
      ? parseFloat(customer.currentBalance) 
      : customer.currentBalance || 0;
    return balance < 0 || customer.customerType === "debtor";
  });

  // Calculate creditors based on positive balance OR customerType = "creditor"
  const creditors = customers.filter((customer) => {
    const balance = typeof customer.currentBalance === "string" 
      ? parseFloat(customer.currentBalance) 
      : customer.currentBalance || 0;
    return balance > 0 || customer.customerType === "creditor";
  });

  // Calculate total debts (only negative amounts)
  const totalDebts = customers.reduce((sum, customer) => {
    const balance = typeof customer.currentBalance === "string" 
      ? parseFloat(customer.currentBalance) 
      : customer.currentBalance || 0;
    return balance < 0 ? sum + Math.abs(balance) : sum;
  }, 0);

  // Calculate total credits (only positive amounts)
  const totalCredits = customers.reduce((sum, customer) => {
    const balance = typeof customer.currentBalance === "string" 
      ? parseFloat(customer.currentBalance) 
      : customer.currentBalance || 0;
    return balance > 0 ? sum + balance : sum;
  }, 0);

  return {
    total: totalCustomers,
    debtors: debtors.length,
    creditors: creditors.length,
    totalDebts,
    totalCredits,
  };
};