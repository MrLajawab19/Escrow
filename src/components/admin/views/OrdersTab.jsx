import React, { memo } from 'react';
import { Search } from 'lucide-react';
import AdminTable from '../shared/tables/AdminTable';
import AdminPagination from '../shared/tables/AdminPagination';
import AdminStatusBadge from '../shared/AdminStatusBadge';
import { fmtDate, fmtCurrency } from '../utils/format';

function OrdersTab({
  orders,
  ordersLoading,
  ordersPage,
  setOrdersPage,
  totalOrders
}) {
  const headers = [
    { label: 'Order ID' },
    { label: 'Buyer' },
    { label: 'Seller' },
    { label: 'Type' },
    { label: 'Amount' },
    { label: 'Status' },
    { label: 'Date', align: 'right' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Orders Management</h1>
          <p className="text-slate-500 text-sm mt-1">View and monitor all platform transactions.</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        <AdminTable 
          headers={headers} 
          loading={ordersLoading} 
          isEmpty={orders.length === 0}
          emptyMessage="No orders found."
        >
          {orders.map(o => (
            <tr key={o.id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer">
              <td className="px-6 py-4 font-mono text-sm font-bold text-slate-700">#{o.id?.slice(0,8)}</td>
              <td className="px-6 py-4 text-sm font-medium text-slate-600">{o.buyer?.firstName || 'N/A'}</td>
              <td className="px-6 py-4 text-sm font-medium text-slate-600">{o.seller?.firstName || 'N/A'}</td>
              <td className="px-6 py-4 text-sm font-semibold text-slate-500 capitalize">{o.productType?.replace(/_/g, ' ')}</td>
              <td className="px-6 py-4 text-sm font-bold text-slate-800">{fmtCurrency(o.price)}</td>
              <td className="px-6 py-4"><AdminStatusBadge status={o.status} /></td>
              <td className="px-6 py-4 text-sm font-medium text-slate-500 text-right">{fmtDate(o.createdAt)}</td>
            </tr>
          ))}
        </AdminTable>
        
        <AdminPagination 
          currentPage={ordersPage} 
          totalItems={totalOrders} 
          onPageChange={setOrdersPage} 
        />
      </div>
    </div>
  );
}

export default memo(OrdersTab);