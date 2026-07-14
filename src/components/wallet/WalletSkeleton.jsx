import React from 'react';

const WalletSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-end">
        <div>
          <div className="h-8 w-48 bg-neutral-200 rounded-lg mb-2"></div>
          <div className="h-4 w-64 bg-neutral-200 rounded-lg"></div>
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-10 bg-neutral-200 rounded-full"></div>
          <div className="h-10 w-10 bg-neutral-200 rounded-full"></div>
        </div>
      </div>

      {/* Hero Card Skeleton */}
      <div className="h-[240px] w-full bg-neutral-200 rounded-2xl"></div>

      {/* Metrics Row Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-[100px] bg-neutral-200 rounded-2xl"></div>
        ))}
      </div>

      {/* Quick Actions Skeleton */}
      <div className="flex gap-4 overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-14 w-32 bg-neutral-200 rounded-xl flex-shrink-0"></div>
        ))}
      </div>

      {/* Two Column Layout Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        <div className="lg:col-span-8 space-y-4">
          <div className="h-12 w-full bg-neutral-200 rounded-xl"></div>
          <div className="h-[400px] w-full bg-neutral-200 rounded-2xl"></div>
        </div>
        <div className="lg:col-span-4 space-y-6">
          <div className="h-[200px] w-full bg-neutral-200 rounded-2xl"></div>
          <div className="h-[300px] w-full bg-neutral-200 rounded-2xl"></div>
        </div>
      </div>
    </div>
  );
};

export default WalletSkeleton;
