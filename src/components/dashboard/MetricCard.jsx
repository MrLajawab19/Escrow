import React from 'react';

const MetricCard = ({ icon, iconBg, value, label, subtitle }) => {
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group cursor-default">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg} transition-transform duration-300 group-hover:scale-105`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-500 mb-0.5">{label}</p>
          <p className="text-2xl font-bold text-navy-900 leading-tight">{value}</p>
          <p className="text-xs text-neutral-400 mt-0.5">{subtitle}</p>
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
