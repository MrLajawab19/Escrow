import React from 'react';

const STEPS = [
  {
    key: 'PLACED',
    label: 'Order Placed',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    key: 'ESCROW_FUNDED',
    label: 'Payment Secured',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    key: 'IN_PROGRESS',
    label: 'Work In Progress',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    key: 'SUBMITTED',
    label: 'Delivered',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    key: 'RELEASED',
    label: 'Completed',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

// Maps any status to the step index it represents
const STATUS_STEP_MAP = {
  PLACED: 0,
  ESCROW_FUNDED: 1,
  ACCEPTED: 1,
  IN_PROGRESS: 2,
  CHANGES_REQUESTED: 2,
  SUBMITTED: 3,
  DISPUTED: 3,
  APPROVED: 4,
  RELEASED: 4,
  REFUNDED: 4,
  CANCELLED: 0,
};

const OrderTimeline = ({ status }) => {
  const currentStep = STATUS_STEP_MAP[status] ?? 0;
  const percentage = Math.round((currentStep / (STEPS.length - 1)) * 100);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-bold text-[#0A2540] font-inter">Order Timeline</h2>
        <div className="flex items-center gap-2">
          <div className="text-xs text-neutral-400 font-inter">{percentage}% complete</div>
          <div className="w-20 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-700"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Desktop: Horizontal stepper */}
      <div className="hidden sm:flex items-start relative">
        {/* Progress Track */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-neutral-200 z-0">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-700 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {STEPS.map((step, i) => {
          const isDone = i < currentStep;
          const isCurrent = i === currentStep;
          const isPending = i > currentStep;
          return (
            <div key={step.key} className="flex-1 flex flex-col items-center relative z-10">
              {/* Circle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-all duration-300 ring-4
                  ${isDone
                    ? 'bg-emerald-500 ring-emerald-100 text-white shadow-md shadow-emerald-200'
                    : isCurrent
                    ? 'bg-indigo-600 ring-indigo-100 text-white shadow-md shadow-indigo-200 scale-110'
                    : 'bg-white ring-neutral-100 text-neutral-300 border border-neutral-200'
                  }`}
              >
                {isDone ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.icon
                )}
              </div>
              {/* Label */}
              <span
                className={`text-xs font-semibold font-inter text-center leading-tight max-w-[80px]
                  ${isDone ? 'text-emerald-600'
                  : isCurrent ? 'text-indigo-600'
                  : 'text-neutral-400'}`}
              >
                {step.label}
              </span>
              {isCurrent && (
                <span className="mt-1.5 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full font-inter uppercase tracking-wide">
                  Current
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: Vertical stepper */}
      <div className="sm:hidden space-y-3">
        {STEPS.map((step, i) => {
          const isDone = i < currentStep;
          const isCurrent = i === currentStep;
          return (
            <div key={step.key} className="flex items-center gap-4">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0
                  ${isDone ? 'bg-emerald-500 text-white'
                  : isCurrent ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                  : 'bg-neutral-100 text-neutral-400'}`}
              >
                {isDone ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : step.icon}
              </div>
              <div>
                <p className={`text-sm font-semibold font-inter
                  ${isDone ? 'text-emerald-600' : isCurrent ? 'text-indigo-600' : 'text-neutral-400'}`}>
                  {step.label}
                </p>
                {isCurrent && (
                  <p className="text-[10px] text-indigo-400 font-inter font-semibold uppercase tracking-wide">
                    Current Step
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Disputed/Cancelled special notice */}
      {(status === 'DISPUTED' || status === 'CANCELLED' || status === 'REFUNDED') && (
        <div className={`mt-4 px-4 py-3 rounded-xl text-sm font-inter flex items-center gap-2
          ${status === 'DISPUTED' ? 'bg-red-50 text-red-700 border border-red-100'
          : status === 'REFUNDED' ? 'bg-amber-50 text-amber-700 border border-amber-100'
          : 'bg-neutral-50 text-neutral-600 border border-neutral-200'}`}>
          <span>{status === 'DISPUTED' ? '⚠️' : status === 'REFUNDED' ? '↩️' : '❌'}</span>
          <span>
            {status === 'DISPUTED' && 'This order has an active dispute under review.'}
            {status === 'CANCELLED' && 'This order was cancelled.'}
            {status === 'REFUNDED' && 'This order was refunded.'}
          </span>
        </div>
      )}
    </div>
  );
};

export default OrderTimeline;
