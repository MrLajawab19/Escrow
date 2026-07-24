import React from 'react';
import { useCurrency } from '../../context/CurrencyContext';
import { Wallet, ShieldCheck, Clock, Activity } from 'lucide-react';

const WalletHeroCard = ({ walletSummary, isBuyer }) => {
  const { formatCurrency, currencySymbol } = useCurrency();

  const balance = walletSummary?.balance || 0;
  const lockedBalance = walletSummary?.lockedBalance || 0;
  const pendingBalance = walletSummary?.pendingWithdrawalAmount || 0;
  const totalBalance = balance + lockedBalance + pendingBalance;

  const lifetimeEarnings = walletSummary?.lifetimeEarnings || 0;

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
                <span className="text-xs font-medium uppercase tracking-wider">Pending Withdrawals</span>
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

        {/* Right Side: Secondary Metrics (Seller Only) */}
        {!isBuyer && (
          <div className="lg:w-72 flex flex-col justify-center bg-white/10 rounded-2xl p-5 backdrop-blur-sm border border-white/10">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-primary-100">
                  <Activity size={16} />
                  <span className="text-sm font-medium">Lifetime Earnings</span>
                </div>
                <span className="font-bold">{formatCurrency(lifetimeEarnings, walletSummary?.currency || 'INR')}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletHeroCard;
