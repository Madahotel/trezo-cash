import React, { useState, createContext, useContext } from "react";
import { Check, ChevronRight, Circle } from "lucide-react";

// Contexte pour partager l'état du menu
const DropdownContext = createContext();

const DropdownMenu = ({ children }) => {
  const [open, setOpen] = useState(false);

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block text-left">{children}</div>
    </DropdownContext.Provider>
  );
};

const DropdownMenuTrigger = ({ children }) => {
  const { open, setOpen } = useContext(DropdownContext);

  return (
    <button
      onClick={() => setOpen(!open)}
      className="inline-flex items-center justify-center rounded-md px-3 py-1 text-sm font-medium bg-muted text-muted-foreground"
    >
      {children}
      <ChevronRight className="ml-2 h-4 w-4" />
    </button>
  );
};

const DropdownMenuContent = ({ children, className = "" }) => {
  const { open } = useContext(DropdownContext);

  if (!open) return null;

  return (
    <div
      className={`absolute left-0 mt-2 min-w-[8rem] rounded-md border bg-popover p-1 shadow-md ${className}`}
    >
      {children}
    </div>
  );
};

const DropdownMenuItem = ({ children, onClick, className = "" }) => (
  <div
    onClick={onClick}
    className={`flex items-center px-2 py-1.5 text-sm rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground ${className}`}
  >
    {children}
  </div>
);

const DropdownMenuCheckboxItem = ({ children, checked, onClick }) => (
  <DropdownMenuItem onClick={onClick} className="pl-8 relative">
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      {checked && <Check className="h-4 w-4" />}
    </span>
    {children}
  </DropdownMenuItem>
);

const DropdownMenuRadioItem = ({ children, selected, onClick }) => (
  <DropdownMenuItem onClick={onClick} className="pl-8 relative">
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      {selected && <Circle className="h-2 w-2 fill-current" />}
    </span>
    {children}
  </DropdownMenuItem>
);

const DropdownMenuLabel = ({ children, className = "" }) => (
  <div className={`px-2 py-1.5 text-sm font-semibold ${className}`}>
    {children}
  </div>
);

const DropdownMenuSeparator = ({ className = "" }) => (
  <div className={`-mx-1 my-1 h-px bg-muted ${className}`} />
);

const DropdownMenuShortcut = ({ children, className = "" }) => (
  <span className={`ml-auto text-xs tracking-widest opacity-60 ${className}`}>
    {children}
  </span>
);

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
};
