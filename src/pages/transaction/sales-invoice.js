// pages/transaction/sales-invoice.js
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import TransactionNav from '../../components/TransactionNav';

export default function SalesInvoice() {
  const router = useRouter();
  
  return (
      <div className="pt-0 mt-0">
        <h1 class="text-xl font-normal text-gray-800 mb-2 hidden md:block">Sales Point</h1>        
        <TransactionNav />
        <div className="bg-white p-6 rounded-lg shadow-md mt-6">
          <p className="text-gray-600">Sales Invoice content goes here...</p>
        </div>
      </div>
  );
}