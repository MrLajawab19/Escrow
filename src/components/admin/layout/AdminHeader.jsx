import React, { memo } from 'react';
import { Search, Bell, Calendar, Filter, Command } from 'lucide-react';

function AdminHeader({ adminData, onLogout }) {
  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 sticky top-0 z-40">
      
      {/* Search */}
      <div className="flex-1 max-w-xl relative hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Search users, orders, disputes, deeds..."
          className="w-full bg-slate-50 border border-slate-200 rounded-full pl-10 pr-16 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-200 bg-white text-[10px] font-medium text-slate-400">
            <Command size={10} />
            <span>K</span>
          </kbd>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4 ml-auto">
        <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-50">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-white" />
        </button>
        
        <div className="h-6 w-px bg-slate-200 hidden sm:block" />
        
        <div className="flex items-center gap-3 pl-2">
          <div className="hidden sm:block text-right">
            <p className="text-sm text-slate-600 font-medium">Welcome, <span className="text-slate-900 font-bold">{adminData?.name || 'Admin'}</span></p>
            <p className="text-xs text-slate-400">Super Administrator</p>
          </div>
          
          <button onClick={onLogout} className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none group">
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm border border-indigo-200 group-hover:shadow-md transition-all">
              {adminData?.name?.charAt(0) || 'A'}
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}

export default memo(AdminHeader);
