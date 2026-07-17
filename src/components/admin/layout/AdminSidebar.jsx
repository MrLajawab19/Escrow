import React, { memo } from 'react';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  ShoppingBag, 
  FileText, 
  Wallet, 
  Landmark, 
  UserCheck, 
  Users, 
  History, 
  BarChart, 
  Settings,
  ShieldCheck,
  ChevronRight,
  LifeBuoy,
  LogOut
} from 'lucide-react';

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'disputes', label: 'Disputes', icon: AlertTriangle },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'deeds', label: 'Deeds', icon: FileText },
  { id: 'financials', label: 'Financials', icon: Wallet },
  { id: 'settlements', label: 'Settlements', icon: Landmark },
  { id: 'kyc', label: 'KYC Queue', icon: UserCheck, badge: 20 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'audit', label: 'Audit Logs', icon: History },
  { id: 'reports', label: 'Reports', icon: BarChart },
  { id: 'settings', label: 'System Settings', icon: Settings },
];

function AdminSidebar({ activeTab, onTabChange }) {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen sticky top-0 flex flex-col hidden lg:flex">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100">
        <img src="/Logo.png" alt="ScrowX" className="h-8 w-auto object-contain" />
      </div>

      <div className="px-6 py-4 flex-1 overflow-y-auto custom-scrollbar">
        <h2 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-4">
          Admin Panel
        </h2>
        
        <nav className="flex flex-col space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`
                  flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                  ${isActive 
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-200' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <item.icon 
                    size={18} 
                    className={`transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500'}`} 
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-red-50 text-red-600'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-slate-100">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={18} className="text-indigo-600" />
            <span className="text-sm font-bold text-slate-800">ScrowX Pro</span>
          </div>
          <p className="text-xs text-slate-500 mb-3 leading-relaxed">
            Advanced analytics, priority support & more.
          </p>
          <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 rounded-xl transition-colors shadow-sm shadow-indigo-200">
            Upgrade Now
          </button>
        </div>
        
        <button className="flex items-center justify-between w-full mt-4 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 group">
          <div className="flex items-center gap-3">
            <LifeBuoy size={18} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
            <span className="text-left">Need Help?<br/><span className="text-xs text-slate-400 font-normal">Visit Help Center</span></span>
          </div>
          <ChevronRight size={16} className="text-slate-400" />
        </button>

        <button 
          onClick={() => {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminData');
            window.location.href = '/';
          }}
          className="flex items-center w-full mt-4 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors group"
        >
          <div className="flex items-center gap-3">
            <LogOut size={18} className="text-red-500" />
            <span>Logout</span>
          </div>
        </button>
      </div>
    </aside>
  );
}

export default memo(AdminSidebar);
