import React, { useState } from "react";

// Composant Tabs principal
const Tabs = ({ defaultValue, children, className = "" }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  // On clone les enfants pour injecter l'état actif
  const enhancedChildren = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;
    return React.cloneElement(child, {
      activeTab,
      setActiveTab,
    });
  });

  return <div className={className}>{enhancedChildren}</div>;
};

// Liste des onglets
const TabsList = ({ children, className = "" }) => {
  return (
    <div
      className={`inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground ${className}`.trim()}
    >
      {children}
    </div>
  );
};

// Bouton déclencheur d'un onglet
const TabsTrigger = ({
  value,
  activeTab,
  setActiveTab,
  children,
  className = "",
}) => {
  const isActive = activeTab === value;

  const classes = `
    inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium
    transition-all focus:outline-none focus:ring-2 focus:ring-offset-2
    ${isActive ? "bg-background text-foreground shadow" : ""}
    ${className}
  `.trim();

  return (
    <button
      className={classes}
      onClick={() => setActiveTab(value)}
      disabled={isActive}
    >
      {children}
    </button>
  );
};

// Contenu d'un onglet
const TabsContent = ({ value, activeTab, children, className = "" }) => {
  if (activeTab !== value) return null;

  return (
    <div
      className={`mt-2 focus:outline-none focus:ring-2 focus:ring-offset-2 ${className}`.trim()}
    >
      {children}
    </div>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };
