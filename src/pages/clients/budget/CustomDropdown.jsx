import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { Label } from './ui/label';

const CustomDropdown = forwardRef(
  (
    { label, id, isOpen, onToggle, selectedLabel, disabled = false, children },
    ref
  ) => {
    return (
      <div className="space-y-2">
        {label && <Label htmlFor={id}>{label}</Label>}
        <div ref={ref} className="relative w-full">
          <button
            id={id}
            onClick={onToggle}
            disabled={disabled}
            className={`
            flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500
            ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}
          `}
          >
            <span className="truncate">{selectedLabel}</span>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>
          {children}
        </div>
      </div>
    );
  }
);

CustomDropdown.displayName = 'CustomDropdown';

export default CustomDropdown;
