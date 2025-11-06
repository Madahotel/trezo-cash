import * as React from 'react';

// Contexte pour gérer l'état des onglets
const TabsContext = React.createContext();

const Tabs = React.forwardRef(
  (
    { defaultValue, value, onValueChange, className = '', children, ...props },
    ref
  ) => {
    const [activeTab, setActiveTab] = React.useState(value || defaultValue);

    React.useEffect(() => {
      if (value !== undefined) {
        setActiveTab(value);
      }
    }, [value]);

    const handleTabChange = (newValue) => {
      if (value === undefined) {
        setActiveTab(newValue);
      }
      onValueChange?.(newValue);
    };

    const contextValue = React.useMemo(
      () => ({
        activeTab,
        setActiveTab: handleTabChange,
      }),
      [activeTab, handleTabChange]
    );

    return (
      <TabsContext.Provider value={contextValue}>
        <div ref={ref} className={className} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);
Tabs.displayName = 'Tabs';

const TabsList = React.forwardRef(({ className = '', ...props }, ref) => (
  <div
    ref={ref}
    className={`inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground ${className}`}
    role="tablist"
    {...props}
  />
));
TabsList.displayName = 'TabsList';

const TabsTrigger = React.forwardRef(
  ({ value, className = '', disabled, ...props }, ref) => {
    const { activeTab, setActiveTab } = React.useContext(TabsContext);
    const isActive = activeTab === value;

    const handleClick = () => {
      if (!disabled) {
        setActiveTab(value);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!disabled) {
          setActiveTab(value);
        }
      }
    };

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={isActive}
        aria-controls={`tab-content-${value}`}
        data-state={isActive ? 'active' : 'inactive'}
        disabled={disabled}
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
          isActive
            ? 'bg-background text-foreground shadow'
            : 'text-muted-foreground'
        } ${className}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        {...props}
      />
    );
  }
);
TabsTrigger.displayName = 'TabsTrigger';

const TabsContent = React.forwardRef(
  ({ value, className = '', forceMount, ...props }, ref) => {
    const { activeTab } = React.useContext(TabsContext);
    const isActive = activeTab === value;

    // Ne pas rendre le contenu si ce n'est pas l'onglet actif et pas forcé
    if (!isActive && !forceMount) {
      return null;
    }

    return (
      <div
        ref={ref}
        role="tabpanel"
        aria-labelledby={`tab-trigger-${value}`}
        id={`tab-content-${value}`}
        data-state={isActive ? 'active' : 'inactive'}
        className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
          !isActive ? 'hidden' : ''
        } ${className}`}
        {...props}
      />
    );
  }
);
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };
