import React, { forwardRef } from "react";

const Checkbox = forwardRef(
  ({ className = "", checked, onCheckedChange, ...props }, ref) => {
    return (
      <label className="inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          className={`
            peer h-4 w-4 shrink-0 rounded-sm border border-gray-300 shadow 
            focus:outline-none focus:ring-2 focus:ring-blue-500 
            disabled:cursor-not-allowed disabled:opacity-50
            ${checked ? "bg-blue-600 border-blue-600" : "bg-white"} 
            ${className}
          `}
          {...props}
        />
        <span className="absolute pointer-events-none flex h-4 w-4 items-center justify-center text-white">
          {checked && (
            <svg
              className="h-3 w-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </span>
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
