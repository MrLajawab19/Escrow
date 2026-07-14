import React from 'react';
import { Clock, Bell, User } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import NotificationDropdown from '../NotificationDropdown'; // Import if reusable

const WalletHeader = ({ buyerData, onNotificationClick, onProfileClick }) => {
  const { currency, changeCurrency, availableCurrencies, loadingRates } = useCurrency();
  const lastUpdated = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-navy-900 tracking-tight flex items-center gap-2">
          Wallet & Ledger
        </h1>
        <p className="text-sm font-medium text-neutral-500 mt-1">
          Manage your funds, escrow balances, withdrawals and transaction history securely.
        </p>
        <div className="flex items-center gap-1.5 mt-3 text-xs font-medium text-neutral-400">
          <Clock size={12} />
          <span>Last Updated • Today, {lastUpdated}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Currency Selector */}
        <div className="relative">
          <select
            value={currency}
            onChange={(e) => changeCurrency(e.target.value)}
            className="appearance-none bg-white border border-neutral-200 text-navy-900 font-semibold py-2 pl-4 pr-10 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all cursor-pointer text-sm"
            disabled={loadingRates}
          >
            {availableCurrencies.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-neutral-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>

        {/* Separator */}
        <div className="w-px h-8 bg-neutral-200 hidden md:block"></div>

        {/* Action Icons */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onNotificationClick}
            className="w-10 h-10 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-600 hover:text-primary-600 hover:border-primary-200 transition-colors relative"
          >
            <Bell size={18} />
            {/* Optional dot indicator */}
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          
          <button 
            onClick={onProfileClick}
            className="flex items-center gap-2 pl-1 pr-3 py-1 bg-white border border-neutral-200 rounded-full hover:border-primary-200 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm">
              {buyerData?.firstName?.charAt(0) || <User size={16} />}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-navy-900 leading-tight">
                {buyerData?.firstName || 'User'}
              </p>
              <p className="text-[10px] text-neutral-500">Buyer</p>
            </div>
            <svg className="w-3 h-3 text-neutral-400 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletHeader;
