import React from 'react';
import { useCurrency } from '../../context/CurrencyContext';
import { ArrowDownLeft, ArrowUpRight, Activity, Clock } from 'lucide-react';

const InsightCard = ({ icon: Icon, label, value, colorClass, subtitle }) => (
  <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
        <Icon size={18} />
      </div>
      <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">{label}</h3>
    </div>
    <div>
      <p className="text-2xl font-black text-navy-900">{value}</p>
      {subtitle && <p className="text-xs font-medium text-neutral-400 mt-1">{subtitle}</p>}
    </div>
  </div>
);

const WalletInsights = ({ walletSummary, walletLoading }) => {
  const { formatCurrency, currencySymbol } = useCurrency();

  const totalCredit = walletSummary?.totalCredit || 0;
  const totalDeposited = walletSummary?.totalDeposited || 0;
  const netFlow = totalCredit - totalDeposited;
  const totalTransactions = walletSummary?.totalTransactions || 0;
  const pendingFunds = walletSummary?.pendingRefundBalance || walletSummary?.pendingEarnings || 0;

  if (walletLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-neutral-200 rounded-2xl"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <InsightCard
        icon={ArrowDownLeft}
        label="Total Deposits"
        value={formatCurrency(totalCredit, walletSummary?.currency || 'INR')}
        colorClass="bg-emerald-50 text-emerald-600"
        subtitle="All-time funds added"
      />
      <InsightCard
        icon={ArrowUpRight}
        label="Total Withdrawn"
        value={formatCurrency(totalDeposited, walletSummary?.currency || 'INR')}
        colorClass="bg-amber-50 text-amber-600"
        subtitle="All-time funds withdrawn"
      />
      <InsightCard
        icon={Activity}
        label="Net Flow"
        value={formatCurrency(Math.abs(netFlow), walletSummary?.currency || 'INR')}
        colorClass="bg-primary-50 text-primary-600"
        subtitle={netFlow >= 0 ? "Positive cash flow" : "Negative cash flow"}
      />
      <InsightCard
        icon={Clock}
        label="Total Transactions"
        value={totalTransactions.toLocaleString()}
        colorClass="bg-blue-50 text-blue-600"
        subtitle="Lifetime activities"
      />
    </div>
  );
};

export default WalletInsights;
