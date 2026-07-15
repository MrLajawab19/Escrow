import React from 'react';
import { Clock, Shield, AlertTriangle, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

const DeedCard = ({ deed, onClick }) => {
  const { formatCurrency } = useCurrency();
  
  if (!deed) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING_SELLER':
      case 'PENDING_SIGNATURES':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'ACTIVE':
      case 'IN_PROGRESS':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'ESCROW_LOCKED':
      case 'SUBMITTED':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'CHANGES_REQUESTED':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'CONFIRMED':
      case 'CLOSED':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'DISPUTED':
      case 'ARBITRATING':
      case 'ARBITRATED':
      case 'ESCALATED':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'CANCELLED':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      case 'DRAFT':
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING_SELLER':
      case 'PENDING_SIGNATURES':
        return <Clock className="w-4 h-4" />;
      case 'ACTIVE':
      case 'IN_PROGRESS':
      case 'ESCROW_LOCKED':
        return <Shield className="w-4 h-4" />;
      case 'SUBMITTED':
        return <FileText className="w-4 h-4" />;
      case 'DISPUTED':
      case 'ARBITRATING':
      case 'ARBITRATED':
      case 'ESCALATED':
        return <AlertTriangle className="w-4 h-4" />;
      case 'CONFIRMED':
      case 'CLOSED':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'CANCELLED':
        return <XCircle className="w-4 h-4" />;
      case 'CHANGES_REQUESTED':
        return <AlertTriangle className="w-4 h-4" />;
      case 'DRAFT':
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };
  
  const getDisplayStatus = (status) => {
    if (!status) return 'UNKNOWN';
    return status.replace(/_/g, ' ');
  };

  return (
    <div 
      onClick={() => onClick && onClick(deed)}
      className="bg-[#0B0F19] border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-all cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
              {deed.title || 'Untitled Deed'}
            </h3>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${getStatusColor(deed.status)}`}>
              {getStatusIcon(deed.status)}
              {getDisplayStatus(deed.status)}
            </span>
          </div>
          <p className="text-sm text-gray-400 line-clamp-2">{deed.description}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-white">
            {formatCurrency(deed.amount, deed.currency)}
          </p>
          <p className="text-xs text-gray-500 mt-1 uppercase">
            {deed.transactionType}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-gray-800/50">
        <div>
          <p className="text-xs text-gray-500 mb-1">Created</p>
          <p className="text-sm text-gray-300">
            {deed.createdAt ? new Date(deed.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Deadline</p>
          <p className="text-sm text-gray-300">
            {deed.deadline ? new Date(deed.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'No deadline'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DeedCard;
