import React from 'react';
import { Wallet } from 'lucide-react';

const WalletEmptyState = ({ title, description, actionLabel, onAction, icon: Icon = Wallet }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center bg-white border border-neutral-200 rounded-2xl shadow-sm">
      <div className="w-16 h-16 bg-primary-50 text-primary-500 rounded-2xl flex items-center justify-center mb-6">
        <Icon size={32} />
      </div>
      <h3 className="text-lg font-bold text-navy-900 mb-2">{title}</h3>
      <p className="text-neutral-500 text-sm max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2.5 bg-primary-500 text-white font-medium rounded-xl shadow-sm hover:bg-primary-600 hover:-translate-y-0.5 transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default WalletEmptyState;
