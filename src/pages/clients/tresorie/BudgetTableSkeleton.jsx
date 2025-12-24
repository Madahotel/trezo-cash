import React from 'react';

const BudgetTableSkeleton = ({ isMobile = false }) => {
  if (isMobile) {
    return <MobileSkeleton />;
  }

  return <DesktopSkeleton />;
};

const DesktopSkeleton = () => {
  return (
    <div className="p-6 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-24 h-8 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
        <div className="flex gap-4">
          <div className="w-48 h-10 bg-gray-200 rounded-lg"></div>
          <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-20 h-8 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="flex gap-2">
          {[1, 2].map((i) => (
            <div key={i} className="w-8 h-8 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
      <div className="flex mb-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-1 h-8 mr-2 bg-gray-200 rounded last:mr-0"></div>
        ))}
      </div>
      {[1, 2, 3, 4, 5, 6].map((row) => (
        <div key={row} className="flex mb-2">
          {[1, 2, 3, 4].map((col) => (
            <div key={col} className="flex-1 h-12 mr-2 bg-gray-100 rounded last:mr-0"></div>
          ))}
        </div>
      ))}
      <div className="flex mt-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-1 h-8 mr-2 bg-gray-200 rounded last:mr-0"></div>
        ))}
      </div>
    </div>
  );
};

const MobileSkeleton = () => {
  return (
    <div className="p-4 animate-pulse">
      <div className="flex justify-between mb-4">
        <div className="w-32 h-8 bg-gray-200 rounded"></div>
        <div className="w-20 h-8 bg-gray-200 rounded"></div>
      </div>
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="w-20 h-10 bg-gray-200 rounded-lg shrink-0"></div>
        ))}
      </div>
      {[1, 2, 3, 4, 5].map((item) => (
        <div key={item} className="p-4 mb-3 bg-white rounded-lg shadow">
          <div className="flex justify-between mb-2">
            <div className="w-32 h-5 bg-gray-200 rounded"></div>
            <div className="w-20 h-5 bg-gray-200 rounded"></div>
          </div>
          <div className="w-48 h-4 mb-2 bg-gray-200 rounded"></div>
          <div className="flex justify-between">
            <div className="w-16 h-6 bg-gray-200 rounded"></div>
            <div className="w-16 h-6 bg-gray-200 rounded"></div>
            <div className="w-16 h-6 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BudgetTableSkeleton;