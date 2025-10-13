import React, { useState } from "react";

// Composant principal
const Dialog = ({ children }) => {
  const [open, setOpen] = useState(false);

  return (
    <div>
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child, { open, setOpen })
          : child
      )}
    </div>
  );
};

// Trigger pour ouvrir le dialog
const DialogTrigger = ({ children, open, setOpen }) => (
  <button
    onClick={() => setOpen(!open)}
    className="px-4 py-2 bg-primary text-white rounded-md"
  >
    {children}
  </button>
);

// Overlay
const DialogOverlay = ({ open }) => {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 bg-black/80 animate-fadeIn"></div>;
};

// Content
const DialogContent = ({ children, open, setOpen }) => {
  if (!open) return null;
  return (
    <>
      <DialogOverlay open={open} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg animate-scaleIn relative">
        {children}
        <button
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          ✕ <span className="sr-only">Close</span>
        </button>
      </div>
    </>
  );
};

// Header et Footer
const DialogHeader = ({ children, className = "" }) => (
  <div
    className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`}
  >
    {children}
  </div>
);

const DialogFooter = ({ children, className = "" }) => (
  <div
    className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`}
  >
    {children}
  </div>
);

// Title et Description
const DialogTitle = ({ children, className = "" }) => (
  <h2
    className={`text-lg font-semibold leading-none tracking-tight ${className}`}
  >
    {children}
  </h2>
);

const DialogDescription = ({ children, className = "" }) => (
  <p className={`text-sm text-gray-500 ${className}`}>{children}</p>
);

export {
  Dialog,
  DialogTrigger,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
