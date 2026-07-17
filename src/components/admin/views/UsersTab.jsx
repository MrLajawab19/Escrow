import React, { memo, useState } from 'react';
import { Users, Filter } from 'lucide-react';
import AdminTable from '../shared/tables/AdminTable';
import AdminPagination from '../shared/tables/AdminPagination';
import { fmtDate } from '../utils/format';

function UsersTab({
  buyers,
  buyersLoading,
  buyersPage,
  setBuyersPage,
  totalBuyers,
  sellers,
  sellersLoading,
  sellersPage,
  setSellersPage,
  totalSellers
}) {
  const [activeView, setActiveView] = useState('buyers');

  const headers = [
    { label: 'User Details' },
    { label: 'Role' },
    { label: 'Status' },
    { label: 'KYC Status' },
    { label: 'Joined', align: 'right' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">User Management</h1>
          <p className="text-slate-500 text-sm mt-1">Manage platform users, roles, and access controls.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button 
            onClick={() => setActiveView('buyers')}
            className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeView === 'buyers' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Buyers ({totalBuyers})
          </button>
          <button 
            onClick={() => setActiveView('sellers')}
            className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeView === 'sellers' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Sellers ({totalSellers})
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        {activeView === 'buyers' ? (
          <>
            <AdminTable 
              headers={headers} 
              loading={buyersLoading} 
              isEmpty={buyers.length === 0}
              emptyMessage="No buyers found."
            >
              {buyers.map(u => (
                <UserRow key={u.id} user={u} type="BUYER" />
              ))}
            </AdminTable>
            <AdminPagination 
              currentPage={buyersPage} 
              totalItems={totalBuyers} 
              onPageChange={setBuyersPage} 
            />
          </>
        ) : (
          <>
            <AdminTable 
              headers={headers} 
              loading={sellersLoading} 
              isEmpty={sellers.length === 0}
              emptyMessage="No sellers found."
            >
              {sellers.map(u => (
                <UserRow key={u.id} user={u} type="SELLER" />
              ))}
            </AdminTable>
            <AdminPagination 
              currentPage={sellersPage} 
              totalItems={totalSellers} 
              onPageChange={setSellersPage} 
            />
          </>
        )}
      </div>
    </div>
  );
}

function UserRow({ user, type }) {
  return (
    <tr className="hover:bg-slate-50/80 transition-colors group cursor-pointer">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${type === 'BUYER' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
            {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">{user.firstName} {user.lastName}</p>
            <p className="text-xs font-medium text-slate-500">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider ${type === 'BUYER' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
          {type}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${user.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
          {user.status || 'Active'}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${user.kycStatus === 'APPROVED' ? 'bg-teal-50 text-teal-700 border border-teal-200' : user.kycStatus === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>
          {user.kycStatus || 'NONE'}
        </span>
      </td>
      <td className="px-6 py-4 text-sm font-medium text-slate-500 text-right">
        {fmtDate(user.createdAt)}
      </td>
    </tr>
  );
}

export default memo(UsersTab);