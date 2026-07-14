import React from 'react';
import { CreditCard, Plus, Building2 } from 'lucide-react';

const PaymentMethods = () => {
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 pt-6 pb-4 border-b border-neutral-200 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-navy-900">Payment Methods</h3>
          <p className="text-sm text-neutral-500 mt-1">Manage your connected bank accounts and cards.</p>
        </div>
        <button 
          className="btn btn-primary bg-neutral-100 text-navy-900 border-none hover:bg-neutral-200 opacity-50 cursor-not-allowed"
          disabled
          title="Payment method management coming soon"
        >
          <Plus size={16} className="mr-1" /> Add Method
        </button>
      </div>
      
      <div className="p-10 flex flex-col items-center justify-center text-center bg-neutral-50/50">
        <div className="w-16 h-16 bg-white border border-neutral-200 rounded-full flex items-center justify-center text-neutral-400 mb-4 shadow-sm">
          <CreditCard size={28} />
        </div>
        <h4 className="text-base font-bold text-navy-900 mb-2">No payment methods added</h4>
        <p className="text-sm text-neutral-500 max-w-sm mb-6">
          Connect a bank account or credit card to easily add funds or withdraw your earnings.
        </p>
        <button 
          className="px-6 py-2 bg-white border border-neutral-200 rounded-xl text-sm font-bold text-navy-900 shadow-sm hover:shadow-md hover:border-primary-200 transition-all opacity-50 cursor-not-allowed"
          disabled
        >
          Add Bank Account
        </button>
      </div>
    </div>
  );
};

export default PaymentMethods;
