import React, { useState, useRef, forwardRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";

// Composant Select principal
const Select = ({
  children,
  value,
  onValueChange,
  placeholder = "Select...",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  // Ferme le menu si on clique en dehors
  useEffect(() => {
    function handleClickOutside(event) {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (selectedValue) => {
    onValueChange?.(selectedValue);
    setIsOpen(false);
  };

  return (
    <div ref={selectRef} className="relative w-full">
      {/* Bouton principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </button>

      {/* Menu déroulant */}
      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {React.Children.map(children, (child) =>
            React.isValidElement(child)
              ? React.cloneElement(child, {
                  isSelected: child.props.value === value,
                  onSelect: handleSelect,
                })
              : child
          )}
        </div>
      )}
    </div>
  );
};

// Option du Select
const SelectItem = ({
  children,
  value,
  isSelected,
  onSelect,
  disabled = false,
}) => {
  const handleClick = () => {
    if (!disabled && onSelect) {
      onSelect(value);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        relative flex cursor-pointer items-center py-2 px-3 text-sm
        ${isSelected ? "bg-blue-500 text-white" : "hover:bg-gray-100"}
        ${disabled ? "cursor-not-allowed opacity-50" : ""}
      `}
    >
      <span className="flex-1">{children}</span>
      {isSelected && <Check className="h-4 w-4 ml-2" />}
    </div>
  );
};

// Label pour grouper des options
const SelectLabel = ({ children }) => (
  <div className="px-3 py-2 text-sm font-semibold text-gray-700 bg-gray-50">
    {children}
  </div>
);

// Séparateur entre les options
const SelectSeparator = () => <div className="h-px bg-gray-200 my-1" />;

// Group pour organiser les options
const SelectGroup = ({ children }) => <div className="py-1">{children}</div>;

// Composants de compatibilité (simplifiés)
const SelectValue = ({ children }) => <span>{children}</span>;
const SelectTrigger = ({ children }) => <>{children}</>;
const SelectContent = ({ children }) => <>{children}</>;
const SelectScrollUpButton = () => null;
const SelectScrollDownButton = () => null;

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
