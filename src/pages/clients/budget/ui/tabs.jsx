// SimpleTabs.jsx
import React, { useState } from "react";

export const SimpleTabs = ({ defaultTab, children }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <div>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { activeTab, setActiveTab })
      )}
    </div>
  );
};

export const SimpleTabsList = ({
  activeTab,
  setActiveTab,
  children,
  className,
}) => {
  return (
    <div className={`flex space-x-1 rounded-lg bg-gray-100 p-1 ${className}`}>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { activeTab, setActiveTab })
      )}
    </div>
  );
};

export const SimpleTabsTrigger = ({
  value,
  activeTab,
  setActiveTab,
  children,
}) => {
  const isActive = activeTab === value;

  return (
    <button
      className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        isActive
          ? "bg-white text-gray-900 shadow-sm"
          : "text-gray-600 hover:bg-white/50"
      }`}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  );
};

export const SimpleTabsContent = ({ value, activeTab, children }) => {
  if (value !== activeTab) return null;
  return <div className="mt-4">{children}</div>;
};
