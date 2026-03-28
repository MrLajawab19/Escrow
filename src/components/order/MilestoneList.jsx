import React from 'react';

const STATUS_MAP = {
  pending:   { label: 'Pending',   cls: 'bg-neutral-100 text-neutral-600 border-neutral-200' },
  active:    { label: 'Active',    cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  completed: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

const MilestoneList = ({ milestones = [] }) => {
  if (!milestones.length) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <h2 className="text-base font-bold text-[#0A2540] font-inter">Milestones</h2>
        <span className="ml-auto text-xs px-2.5 py-1 bg-purple-50 text-purple-600 rounded-full font-inter font-semibold">
          {milestones.filter(m => m.status === 'completed').length}/{milestones.length} done
        </span>
      </div>

      <div className="space-y-3">
        {milestones.map((m, i) => {
          const badge = STATUS_MAP[m.status] || STATUS_MAP.pending;
          return (
            <div
              key={i}
              className={`flex items-start gap-4 p-4 rounded-xl border transition-all
                ${m.status === 'completed'
                  ? 'bg-emerald-50/40 border-emerald-100'
                  : m.status === 'active'
                  ? 'bg-blue-50/40 border-blue-100'
                  : 'bg-neutral-50 border-neutral-100'}`}
            >
              {/* Index circle */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold font-inter
                ${m.status === 'completed' ? 'bg-emerald-500 text-white' : 'bg-neutral-200 text-neutral-500'}`}>
                {m.status === 'completed' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className={`font-semibold text-sm font-inter ${m.status === 'completed' ? 'line-through text-neutral-400' : 'text-[#0A2540]'}`}>
                    {m.title}
                  </p>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border font-inter uppercase tracking-wide ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>
                {m.description && (
                  <p className="text-xs text-neutral-500 font-inter mt-1 leading-relaxed">{m.description}</p>
                )}
                {m.amount && (
                  <p className="text-sm font-bold text-[#0A2540] font-inter mt-1.5">${m.amount}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MilestoneList;
