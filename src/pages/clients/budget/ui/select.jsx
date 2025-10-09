import React, { useState, useRef, forwardRef } from "react";

// Utilitaire cn pour concaténer les classes
const cn = (...classes) => classes.filter(Boolean).join(" ");

// Composant Select principal
const Select = ({ children, value: controlledValue, onValueChange }) => {
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(controlledValue || "");
  const triggerRef = useRef(null);

  const handleSelect = (val) => {
    setSelectedValue(val);
    onValueChange?.(val);
    setOpen(false);
  };

  return (
    <div className="relative inline-block w-full text-left">
      <SelectTrigger ref={triggerRef} onClick={() => setOpen(!open)}>
        {selectedValue || "Select..."}
      </SelectTrigger>

      {open && (
        <SelectContent>
          {React.Children.map(children, (child) =>
            React.isValidElement(child)
              ? React.cloneElement(child, {
                  onSelect: handleSelect,
                  selectedValue,
                })
              : child
          )}
        </SelectContent>
      )}
    </div>
  );
};

// Trigger du Select
const SelectTrigger = forwardRef(({ children, className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "flex h-9 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500",
      className
    )}
    {...props}
  >
    <span className="truncate">{children}</span>
    <span className="ml-2">▼</span>
  </button>
));

// Content du Select
const SelectContent = forwardRef(({ children, className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-white shadow-md",
      className
    )}
    {...props}
  >
    {children}
  </div>
));

// Value du Select
const SelectValue = ({ value, placeholder = "Select..." }) => (
  <span>{value || placeholder}</span>
);

// Item du Select
const SelectItem = ({
  children,
  value,
  onSelect,
  selectedValue,
  className,
}) => {
  const isSelected = selectedValue === value;
  return (
    <div
      onClick={() => onSelect(value)}
      className={cn(
        "relative flex cursor-pointer items-center rounded-sm py-1.5 pl-2 pr-8 text-sm hover:bg-gray-100",
        isSelected && "bg-blue-500 text-white",
        className
      )}
    >
      <span className="absolute right-2">{isSelected ? "✔" : ""}</span>
      {children}
    </div>
  );
};

// Label du Select
const SelectLabel = ({ children, className }) => (
  <div className={cn("px-2 py-1.5 text-sm font-semibold", className)}>
    {children}
  </div>
);

// Separator du Select
const SelectSeparator = ({ className }) => (
  <div className={cn("-mx-1 my-1 h-px bg-gray-300", className)} />
);

// Scroll buttons (dummy pour compatibilité)
const SelectScrollUpButton = ({ className }) => (
  <div className={cn("hidden", className)} />
);
const SelectScrollDownButton = ({ className }) => (
  <div className={cn("hidden", className)} />
);

// Group (dummy pour compatibilité)
const SelectGroup = ({ children }) => <div>{children}</div>;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
