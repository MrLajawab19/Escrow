import React from 'react';
import { useCurrency } from '../../context/CurrencyContext';

const SpendingDonut = ({ walletSummary, walletLoading }) => {
  const { formatCurrency, currencySymbol } = useCurrency();

  const deposits = Number(walletSummary?.monthlyStats?.deposits || 0) / 100;
  const purchases = Number(walletSummary?.monthlyStats?.purchases || 0) / 100;
  const withdrawals = Number(walletSummary?.monthlyStats?.withdrawals || 0) / 100; 

  const totalSpent = purchases + withdrawals;

  const purchasesPercent = totalSpent > 0 ? (purchases / totalSpent) * 100 : 0;
  const withdrawalsPercent = totalSpent > 0 ? (withdrawals / totalSpent) * 100 : 0;

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const gap = 4;

  const seg2 = (purchasesPercent / 100) * circumference;
  const seg3 = (withdrawalsPercent / 100) * circumference;

  const offset2 = 0;
  const offset3 = seg2 + gap;

  const formatAmount = (amount) => {
    return `${currencySymbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border rounded-2xl shadow-sm p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-navy-900 dark:text-dark-primary">Spending Overview</h3>
        <select className="bg-neutral-50 dark:bg-dark-bg border border-neutral-200 dark:border-dark-border text-neutral-600 dark:text-dark-muted text-xs font-semibold py-1.5 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option>This Month</option>
          <option disabled>Last Month</option>
          <option disabled>This Year</option>
        </select>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-8 flex-1">
        <div className="relative flex-shrink-0">
          <svg width="160" height="160" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r={radius} fill="none" stroke="#F1F5F9" strokeWidth="16" />
            
            {purchasesPercent > 0 && (
              <circle cx="70" cy="70" r={radius} fill="none" stroke="#635BFF" strokeWidth="16" strokeLinecap="round" strokeDasharray={`${seg2} ${circumference - seg2}`} strokeDashoffset={-offset2} transform="rotate(-90 70 70)" className="transition-all duration-700" />
            )}
            {withdrawalsPercent > 0 && (
              <circle cx="70" cy="70" r={radius} fill="none" stroke="#F59E0B" strokeWidth="16" strokeLinecap="round" strokeDasharray={`${seg3} ${circumference - seg3}`} strokeDashoffset={-offset3} transform="rotate(-90 70 70)" className="transition-all duration-700" />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-xl font-black text-navy-900 dark:text-dark-primary">
              {walletLoading ? '...' : formatAmount(totalSpent)}
            </p>
            <p className="text-xs font-medium text-neutral-400 dark:text-dark-muted">Total Spent</p>
          </div>
        </div>

        <div className="flex-1 w-full space-y-4">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary-500"></div>
              <span className="font-medium text-neutral-600 dark:text-dark-muted">Purchases</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-navy-900 dark:text-dark-primary">{walletLoading ? '...' : formatAmount(purchases)}</span>
              <span className="text-xs text-neutral-400 dark:text-dark-muted w-8 text-right">{purchasesPercent.toFixed(1)}%</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="font-medium text-neutral-600 dark:text-dark-muted">Withdrawals</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-navy-900 dark:text-dark-primary">{walletLoading ? '...' : formatAmount(withdrawals)}</span>
              <span className="text-xs text-neutral-400 dark:text-dark-muted w-8 text-right">{withdrawalsPercent.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpendingDonut;
