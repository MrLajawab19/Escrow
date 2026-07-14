import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  FilePlus2,
  Box,
  AlertTriangle,
  Wallet,
  ArrowLeftRight,
  RotateCcw,
  UserCircle,
  ShieldCheck,
  Bell,
  Settings,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';

const navSections = [
  {
    label: '',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'ORDERS',
    items: [
      { key: 'orders', label: 'My Orders', icon: ShoppingBag },
      { key: 'new-order', label: 'New Order', icon: FilePlus2, route: '/buyer/new-order' },
      { key: 'scopebox', label: 'ScopeBox Requests', icon: Box },
      { key: 'disputes', label: 'Disputes', icon: AlertTriangle },
    ],
  },
  {
    label: 'FINANCE',
    items: [
      { key: 'wallet', label: 'Wallet & Ledger', icon: Wallet },
      { key: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
      { key: 'refunds', label: 'Refunds', icon: RotateCcw },
    ],
  },
  {
    label: 'ACCOUNT',
    items: [
      { key: 'profile', label: 'Profile & KYC', icon: UserCircle },
      { key: 'security', label: 'Security', icon: ShieldCheck },
      { key: 'notifications', label: 'Notifications', icon: Bell },
      { key: 'settings', label: 'Settings', icon: Settings },
    ],
  },
];

const DashboardSidebar = ({ activeTab, setActiveTab, onNewOrder, onDisputesClick, userId }) => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleItemClick = (item) => {
    if (item.route) {
      navigate(item.route);
    } else if (item.key === 'disputes') {
      onDisputesClick?.();
    } else if (item.key === 'profile') {
      if (userId) navigate(`/buyer/profile/${userId}`);
    } else {
      setActiveTab(item.key);
    }
    setMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 pt-5 pb-4 flex items-center gap-2.5">
        <img
          src="/Logo.png"
          alt="ScrowX"
          className="h-8 w-auto object-contain"
        />
        <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center">
          <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className={sIdx > 0 ? 'mt-5' : ''}>
            {section.label && (
              <p className="px-3 mb-1.5 text-[10px] font-bold tracking-[0.12em] text-neutral-400 uppercase">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => handleItemClick(item)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                      ${isActive
                        ? 'bg-primary-500 text-white shadow-sm shadow-primary-500/20'
                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-navy-900'
                      }
                    `}
                  >
                    <Icon
                      size={18}
                      strokeWidth={isActive ? 2.2 : 1.8}
                      className={`flex-shrink-0 transition-colors duration-200 ${isActive ? 'text-white' : 'text-neutral-400 group-hover:text-neutral-600'}`}
                    />
                    <span className="flex-1 text-left">{item.label}</span>
                    {isActive && (
                      <ChevronRight size={14} className="text-white/70" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom CTA Card */}
      <div className="px-3 pb-4">
        <div className="bg-gradient-to-br from-primary-50 to-primary-100/60 border border-primary-200/50 rounded-2xl p-4">
          <h4 className="text-sm font-bold text-navy-900 mb-1 leading-tight">
            Secure every deal with ScrowX
          </h4>
          <p className="text-xs text-neutral-500 mb-3 leading-relaxed">
            Your trust is protected with escrow.
          </p>
          <button
            onClick={() => {
              onNewOrder?.();
              navigate('/buyer/new-order');
            }}
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-all duration-200 hover:-translate-y-0.5 shadow-sm shadow-emerald-500/20"
          >
            Start New Order
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-[60] p-2 bg-white border border-neutral-200 rounded-xl shadow-md hover:shadow-lg transition-shadow"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-navy-900/30 backdrop-blur-sm z-[45]"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-[50] h-screen w-[260px] bg-white border-r border-neutral-200 
          flex-shrink-0 transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default DashboardSidebar;
