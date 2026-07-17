import React, { memo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function AdminPagination({ currentPage, totalItems, itemsPerPage = 20, onPageChange }) {
  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalItems === 0) return null;

  return (
    <div className="p-4 border-t border-slate-200 bg-white rounded-b-2xl flex items-center justify-between">
      <p className="text-sm text-slate-500 font-medium">
        Showing <span className="font-bold text-slate-700">{start}</span> to <span className="font-bold text-slate-700">{end}</span> of <span className="font-bold text-slate-700">{totalItems}</span> results
      </p>
      
      <div className="flex items-center gap-1.5">
        <button 
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
        </button>
        
        <div className="px-3 py-1.5 text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg">
          {currentPage} / {Math.max(1, totalPages)}
        </div>

        <button 
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

export default memo(AdminPagination);
