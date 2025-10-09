import React, { useState } from "react";

// Composant principal
const AlertDialog = ({ children }) => {
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
const AlertDialogTrigger = ({ children, open, setOpen }) => (
  <button
    onClick={() => setOpen(!open)}
    className="px-4 py-2 bg-primary text-white rounded-md"
  >
    {children}
  </button>
);

// Overlay
const AlertDialogOverlay = ({ open }) => {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 bg-black/80 animate-fadeIn"></div>;
};

// Content du dialog
const AlertDialogContent = ({ children, open }) => {
  if (!open) return null;
  return (
    <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg animate-scaleIn">
      {children}
    </div>
  );
};

// Header et Footer
const AlertDialogHeader = ({ children }) => (
  <div className="flex flex-col space-y-2 text-center sm:text-left">
    {children}
  </div>
);

const AlertDialogFooter = ({ children }) => (
  <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
    {children}
  </div>
);

// Title et Description
const AlertDialogTitle = ({ children }) => (
  <h2 className="text-lg font-semibold">{children}</h2>
);

const AlertDialogDescription = ({ children }) => (
  <p className="text-sm text-gray-500">{children}</p>
);

// Actions (valider ou annuler)
const AlertDialogAction = ({ children, setOpen }) => (
  <button
    onClick={() => setOpen(false)}
    className="px-4 py-2 bg-primary text-white rounded-md"
  >
    {children}
  </button>
);

const AlertDialogCancel = ({ children, setOpen }) => (
  <button
    onClick={() => setOpen(false)}
    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 mt-2 sm:mt-0"
  >
    {children}
  </button>
);

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
