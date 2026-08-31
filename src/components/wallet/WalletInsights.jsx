import React from 'react';
import { useCurrency } from '../../context/CurrencyContext';
import { ArrowDownLeft, ArrowUpRight, Activity, Clock } from 'lucide-react';

const InsightCard = ({ icon: Icon, label, value, colorClass, subtitle }) => (
  <div className="bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
        <Icon size={18} />
      </div>
      <h3 className="text-xs font-semibold text-neutral-500 dark:text-dark-muted uppercase tracking-wider">{label}</h3>
    </div>
    <div>
      <p className="text-2xl font-black text-navy-900 dark:text-dark-primary">{value}</p>
      {subtitle && <p className="text-xs font-medium text-neutral-400 dark:text-dark-muted mt-1">{subtitle}</p>}
    </div>
  </div>
);

const WalletInsights = ({ walletSummary, walletLoading, isBuyer }) => {
  const { formatCurrency, currencySymbol } = useCurrency();

  const totalEarnings = walletSummary?.lifetimeEarnings || 0;
  const totalWithdrawn = walletSummary?.totalWithdrawn || 0;
  const netFlow = totalEarnings - totalWithdrawn;
  const activeOrders = walletSummary?.activeOrders || 0;
  const completedOrders = walletSummary?.completedOrders || 0;

  if (walletLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-neutral-200 dark:bg-dark-border rounded-2xl"></div>
        ))}
      </div>
    );
  }

  if (isBuyer) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <InsightCard
          icon={ArrowUpRight}
          label="Total Withdrawn"
          value={formatCurrency(totalWithdrawn, walletSummary?.currency || 'INR')}
          colorClass="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
          subtitle="Refunds withdrawn to bank"
        />
        <InsightCard
          icon={Activity}
          label="Active Purchases"
          value={activeOrders.toLocaleString()}
          colorClass="bg-primary-50 text-primary-600"
          subtitle="Orders currently in progress"
        />
        <InsightCard
          icon={Clock}
          label="Completed Purchases"
          value={completedOrders.toLocaleString()}
          colorClass="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
          subtitle="Total successful purchases"
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <InsightCard
        icon={ArrowDownLeft}
        label="Lifetime Earnings"
        value={formatCurrency(totalEarnings, walletSummary?.currency || 'INR')}
        colorClass="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
        subtitle="All-time earnings"
      />
      <InsightCard
        icon={ArrowUpRight}
        label="Total Withdrawn"
        value={formatCurrency(totalWithdrawn, walletSummary?.currency || 'INR')}
        colorClass="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
        subtitle="All-time funds withdrawn"
      />
      <InsightCard
        icon={Activity}
        label="Net Retained"
        value={formatCurrency(Math.abs(netFlow), walletSummary?.currency || 'INR')}
        colorClass="bg-primary-50 text-primary-600"
        subtitle={netFlow >= 0 ? "Currently held in wallet" : ""}
      />
      <InsightCard
        icon={Clock}
        label="Completed Orders"
        value={completedOrders.toLocaleString()}
        colorClass="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
        subtitle="Total successful deeds"
      />
    </div>
  );
};

export default WalletInsights;
