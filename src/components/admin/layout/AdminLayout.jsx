import React from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

export default function AdminLayout({ 
  children, 
  activeTab, 
  onTabChange, 
  adminData, 
  onLogout 
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-inter text-slate-800">
      <AdminSidebar activeTab={activeTab} onTabChange={onTabChange} />
      
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <AdminHeader adminData={adminData} onLogout={onLogout} />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
