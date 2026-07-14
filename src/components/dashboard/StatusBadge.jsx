import React from 'react';

const statusConfig = {
  IN_PROGRESS: {
    label: 'In Progress',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
    border: 'border-blue-200',
  },
  ESCROW_FUNDED: {
    label: 'In Progress',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
    border: 'border-blue-200',
  },
  ACCEPTED: {
    label: 'Accepted',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
    border: 'border-blue-200',
  },
  SUBMITTED: {
    label: 'Pending Review',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    border: 'border-amber-200',
  },
  PENDING: {
    label: 'Pending',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    border: 'border-amber-200',
  },
  RELEASED: {
    label: 'Completed',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    border: 'border-emerald-200',
  },
  COMPLETED: {
    label: 'Completed',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    border: 'border-emerald-200',
  },
  DISPUTED: {
    label: 'Disputed',
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-500',
    border: 'border-red-200',
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: 'bg-neutral-100',
    text: 'text-neutral-600',
    dot: 'bg-neutral-400',
    border: 'border-neutral-200',
  },
  REFUNDED: {
    label: 'Refunded',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    dot: 'bg-purple-500',
    border: 'border-purple-200',
  },
  DRAFT: {
    label: 'Draft',
    bg: 'bg-neutral-100',
    text: 'text-neutral-500',
    dot: 'bg-neutral-400',
    border: 'border-neutral-200',
  },
};

const StatusBadge = ({ status, customLabel }) => {
  const config = statusConfig[status] || statusConfig.PENDING;
  const label = customLabel || config.label;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {label}
    </span>
  );
};

export default StatusBadge;
