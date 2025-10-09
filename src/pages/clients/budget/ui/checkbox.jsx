import React, { forwardRef } from "react";

const Checkbox = forwardRef(
  ({ className = "", checked, onChange, ...props }, ref) => {
    return (
      <label className="inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          onChange={onChange}
          className={`peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50
          ${checked ? "bg-primary text-white" : "bg-white"} ${className}`}
          {...props}
        />
        <span className="absolute flex h-4 w-4 items-center justify-center pointer-events-none">
          {checked && (
            <svg
              className="h-4 w-4"
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
