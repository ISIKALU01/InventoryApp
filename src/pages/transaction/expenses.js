// pages/transaction/expenses.js
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import TransactionNav from '../../components/TransactionNav';

export default function Expenses() {
  const router = useRouter();
  
  return (
      <div className="max-w-6xl mx-auto font-raleway">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Expenses</h1>
        <TransactionNav />
        <div className="bg-white p-6 rounded-lg shadow-md mt-6">
          <p className="text-gray-600">Expenses content goes here...</p>
        </div>
      </div>
  );
}