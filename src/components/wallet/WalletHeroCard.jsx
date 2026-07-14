import React from 'react';
import { useCurrency } from '../../context/CurrencyContext';
import { Wallet, ShieldCheck, ArrowUpRight, ArrowDownRight, Clock, Activity } from 'lucide-react';

const WalletHeroCard = ({ walletSummary, isBuyer }) => {
  const { formatCurrency, currencySymbol } = useCurrency();

  const balance = walletSummary?.balance || 0;
  const lockedBalance = walletSummary?.lockedEscrowBalance || 0;
  const pendingBalance = isBuyer ? (walletSummary?.pendingRefundBalance || 0) : (walletSummary?.pendingEarnings || 0);
  const totalBalance = balance + lockedBalance + pendingBalance;

  const monthlyDeposits = Number(walletSummary?.monthlyStats?.monthlyIncome || 0);
  const monthlyWithdrawals = Number(walletSummary?.monthlyStats?.monthlyExpense || 0);
  const lifetimeVolume = walletSummary?.totalTransactions > 0 ? (walletSummary?.totalCredit || 0) : 0; // Approximate

  return (
    <div className="bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-2xl p-6 md:p-8 text-white shadow-lg shadow-primary-500/20 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4">
        <Wallet size={160} />
      </div>
      <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/10 to-transparent pointer-events-none"></div>

      <div className="relative z-10 flex flex-col lg:flex-row gap-8 justify-between">
        {/* Left Side: Primary Balances */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 text-primary-100">
            <span className="text-sm font-semibold uppercase tracking-wider">Available Balance</span>
            <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center cursor-help" title="Funds available to use or withdraw">
              <span className="text-[10px] font-bold">?</span>
            </div>
          </div>
          
          <div className="flex items-end gap-3 mb-8">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
              {formatCurrency(balance, walletSummary?.currency || 'INR')}
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-6 border-t border-white/10">
            <div>
              <div className="flex items-center gap-1.5 text-primary-200 mb-1">
                <ShieldCheck size={14} />
                <span className="text-xs font-medium uppercase tracking-wider">Escrow Locked</span>
              </div>
              <p className="text-lg font-bold">
                {formatCurrency(lockedBalance, walletSummary?.currency || 'INR')}
              </p>
            </div>
            
            <div>
              <div className="flex items-center gap-1.5 text-primary-200 mb-1">
                <Clock size={14} />
                <span className="text-xs font-medium uppercase tracking-wider">Pending Release</span>
              </div>
              <p className="text-lg font-bold">
                {formatCurrency(pendingBalance, walletSummary?.currency || 'INR')}
              </p>
            </div>
            
            <div>
              <div className="flex items-center gap-1.5 text-primary-200 mb-1">
                <Wallet size={14} />
                <span className="text-xs font-medium uppercase tracking-wider">Total Balance</span>
              </div>
              <p className="text-lg font-bold">
                {formatCurrency(totalBalance, walletSummary?.currency || 'INR')}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Secondary Metrics */}
        <div className="lg:w-72 flex flex-col justify-between bg-white/10 rounded-2xl p-5 backdrop-blur-sm border border-white/10">
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-primary-100">
                <Activity size={16} />
                <span className="text-sm font-medium">Lifetime Volume</span>
              </div>
              <span className="font-bold">{formatCurrency(lifetimeVolume, walletSummary?.currency || 'INR')}</span>
            </div>
            
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-emerald-300">
                <ArrowDownRight size={16} />
                <span className="text-sm font-medium text-primary-100">Monthly Deposits</span>
              </div>
              <span className="font-bold">{formatCurrency(monthlyDeposits, walletSummary?.currency || 'INR')}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-red-300">
                <ArrowUpRight size={16} />
                <span className="text-sm font-medium text-primary-100">Monthly Withdrawals</span>
              </div>
              <span className="font-bold">{formatCurrency(monthlyWithdrawals, walletSummary?.currency || 'INR')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletHeroCard;
