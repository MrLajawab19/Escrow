import React from 'react';
import { Plus, ArrowUpRight, ArrowRightLeft, Download, CreditCard, FileText } from 'lucide-react';

const QuickActionButton = ({ icon: Icon, label, onClick, disabled, badge }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 group
      ${disabled 
        ? 'bg-neutral-50 border-neutral-100 cursor-not-allowed opacity-60' 
        : 'bg-white border-neutral-200 shadow-sm hover:shadow-md hover:border-primary-200 hover:-translate-y-1'
      }
    `}
  >
    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors duration-300
      ${disabled ? 'bg-neutral-100 text-neutral-400' : 'bg-primary-50 text-primary-600 group-hover:bg-primary-100'}
    `}>
      <Icon size={20} />
    </div>
    <span className={`text-sm font-semibold text-center
      ${disabled ? 'text-neutral-400' : 'text-navy-900'}
    `}>
      {label}
    </span>
    {badge && (
      <span className="mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500">
        {badge}
      </span>
    )}
  </button>
);

const QuickActions = ({ onAddFunds, onWithdraw, onPaymentMethods, onViewLedger }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <QuickActionButton 
        icon={Plus} 
        label="Add Funds" 
        onClick={onAddFunds} 
      />
      <QuickActionButton 
        icon={ArrowUpRight} 
        label="Withdraw" 
        onClick={onWithdraw} 
      />
      <QuickActionButton 
        icon={ArrowRightLeft} 
        label="Transfer" 
        disabled={true} 
        badge="Coming Soon"
      />
      <QuickActionButton 
        icon={Download} 
        label="Export Statement" 
        disabled={true} // Re-enable once export logic is connected
        badge="Coming Soon"
      />
      <QuickActionButton 
        icon={CreditCard} 
        label="Payment Methods" 
        onClick={onPaymentMethods} 
      />
      <QuickActionButton 
        icon={FileText} 
        label="View Ledger" 
        onClick={onViewLedger} 
      />
    </div>
  );
};

export default QuickActions;
