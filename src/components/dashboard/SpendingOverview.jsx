import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useCurrency } from '../../context/CurrencyContext';

const SpendingOverview = ({ userId, walletSummary, walletLoading }) => {
  const { formatCurrency, currencySymbol } = useCurrency();

  const deposits = Number(walletSummary?.monthlyStats?.monthlyIncome || 0) / 100;
  const purchases = Number(walletSummary?.monthlyStats?.monthlyExpense || 0) / 100;
  const withdrawals = Number(walletSummary?.totalDeposited || 0) / 100; // Leaving as is unless backend API differs

  const totalSpent = deposits + purchases + withdrawals || 1;

  // Calculate percentages for donut chart
  const depositsPercent = (deposits / totalSpent) * 100;
  const purchasesPercent = (purchases / totalSpent) * 100;
  const withdrawalsPercent = (withdrawals / totalSpent) * 100;

  // SVG donut chart params
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const gap = 4;

  // Calculate stroke dash arrays
  const seg1 = (depositsPercent / 100) * circumference;
  const seg2 = (purchasesPercent / 100) * circumference;
  const seg3 = (withdrawalsPercent / 100) * circumference;

  const offset1 = 0;
  const offset2 = seg1 + gap;
  const offset3 = seg1 + seg2 + gap * 2;

  const formatAmount = (amount) => {
    return `${currencySymbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden mt-4">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-navy-900">Spending Overview</h3>
        <span className="text-[10px] font-medium text-neutral-400 bg-neutral-100 px-2 py-1 rounded-md">This Month</span>
      </div>

      {/* Chart + Legend */}
      <div className="px-5 pb-5">
        <div className="flex items-center gap-4">
          {/* Donut Chart */}
          <div className="relative flex-shrink-0">
            <svg width="130" height="130" viewBox="0 0 140 140">
              {/* Background circle */}
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke="#F1F5F9"
                strokeWidth="14"
              />

              {/* Deposits (green) */}
              {depositsPercent > 0 && (
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={`${seg1} ${circumference - seg1}`}
                  strokeDashoffset={-offset1}
                  transform="rotate(-90 70 70)"
                  className="transition-all duration-700"
                />
              )}

              {/* Purchases (purple) */}
              {purchasesPercent > 0 && (
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke="#635BFF"
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={`${seg2} ${circumference - seg2}`}
                  strokeDashoffset={-offset2}
                  transform="rotate(-90 70 70)"
                  className="transition-all duration-700"
                />
              )}

              {/* Withdrawals (orange) */}
              {withdrawalsPercent > 0 && (
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={`${seg3} ${circumference - seg3}`}
                  strokeDashoffset={-offset3}
                  transform="rotate(-90 70 70)"
                  className="transition-all duration-700"
                />
              )}
            </svg>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-base font-bold text-navy-900">
                {walletLoading ? '...' : formatAmount(totalSpent)}
              </p>
              <p className="text-[10px] text-neutral-400">Total Spent</p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs text-neutral-500">Deposits</span>
              </div>
              <span className="text-xs font-semibold text-navy-900">{formatAmount(deposits)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                <span className="text-xs text-neutral-500">Purchases</span>
              </div>
              <span className="text-xs font-semibold text-navy-900">{formatAmount(purchases)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-xs text-neutral-500">Withdrawals</span>
              </div>
              <span className="text-xs font-semibold text-navy-900">{formatAmount(withdrawals)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpendingOverview;
