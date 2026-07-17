import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useCurrency } from '../../context/CurrencyContext';
import TopUpModal from '../TopUpModal';
import WithdrawalModal from '../WithdrawalModal';
import { Wallet, ArrowUpRight, ArrowLeftRight, MoreHorizontal, ChevronDown } from 'lucide-react';

const WalletOverviewCard = ({ userId, walletSummary, walletLoading, onNavigateToWallet, onRefreshWallet, userType = 'buyer' }) => {
  const { formatCurrency, currency, changeCurrency, availableCurrencies, currencySymbol, loadingRates } = useCurrency();
  const [showTopUp, setShowTopUp] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  const balance = walletSummary?.balance || 0;
  const lockedBalance = walletSummary?.lockedEscrowBalance || 0;
  const totalBalance = balance + lockedBalance;

  const quickActions = [
    {
      label: 'Add Funds',
      icon: <Wallet size={18} className="text-primary-500" />,
      onClick: () => setShowTopUp(true),
    },
    {
      label: 'Withdraw',
      icon: <ArrowUpRight size={18} className="text-primary-500" />,
      onClick: () => setShowWithdraw(true),
    },
    {
      label: 'Transactions',
      icon: <ArrowLeftRight size={18} className="text-primary-500" />,
      onClick: onNavigateToWallet,
    },
    {
      label: 'More',
      icon: <MoreHorizontal size={18} className="text-primary-500" />,
      onClick: onNavigateToWallet,
    },
  ];

  return (
    <>
      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-navy-900">Wallet Overview</h3>
          <div className="relative">
            <select
              value={currency}
              onChange={(e) => changeCurrency(e.target.value)}
              disabled={loadingRates}
              className="appearance-none bg-neutral-100 text-xs font-semibold text-neutral-600 pl-2.5 pr-7 py-1.5 rounded-lg border-none focus:outline-none focus:ring-1 focus:ring-primary-400 cursor-pointer"
            >
              {availableCurrencies.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          </div>
        </div>

        {/* Balance Card */}
        <div className="mx-5 mb-4">
          <div className="bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-2xl p-5 relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-white/10" />
            <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-white/5" />

            <p className="text-xs text-primary-200 font-medium mb-1">Available Balance</p>
            <p className="text-2xl font-bold text-white mb-4">
              {walletLoading ? '...' : formatCurrency(balance, walletSummary?.currency || 'INR')}
            </p>

            <div className="flex items-center justify-between text-xs">
              <div>
                <p className="text-primary-300">Locked in Orders</p>
                <p className="text-white font-semibold">
                  {walletLoading ? '...' : formatCurrency(lockedBalance, walletSummary?.currency || 'INR')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-primary-300">Total Balance</p>
                <p className="text-white font-semibold">
                  {walletLoading ? '...' : formatCurrency(totalBalance, walletSummary?.currency || 'INR')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-5 pb-5">
          <div className="flex items-center justify-between">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={action.onClick}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors duration-200">
                  {action.icon}
                </div>
                <span className="text-[10px] font-medium text-neutral-500 group-hover:text-navy-900 transition-colors">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showTopUp && (
        <TopUpModal
          isOpen={showTopUp}
          onClose={() => setShowTopUp(false)}
          onSuccess={() => { setShowTopUp(false); if(onRefreshWallet) onRefreshWallet(); }}
        />
      )}
      {showWithdraw && (
        <WithdrawalModal
          isOpen={showWithdraw}
          onClose={() => setShowWithdraw(false)}
          onSuccess={() => { setShowWithdraw(false); if(onRefreshWallet) onRefreshWallet(); }}
          maxAmount={(balance || 0) / 100}
          userType={userType}
        />
      )}
    </>
  );
};

export default React.memo(WalletOverviewCard);
