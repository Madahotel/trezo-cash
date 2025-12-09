import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import HeaderCustomer from '../../../components/headers/HeaderCustomer';
import Sidebar from '../../../components/sidebar/Sidebar';
import CollaborationBanner from '../../../components/collaboratioBanner/CollaborationBanner';
import { useSettings } from '../../../components/context/SettingsContext';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
};

const ProjetLayoutClient = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, getAllThemes } = useSettings();
  const [themeActive, setThemeActive] = useState('');
  
  useEffect(() => {
    const selectedTheme = getAllThemes().find(
      (themeOption) => theme === themeOption.id
    );
    if (selectedTheme) {
      setThemeActive(selectedTheme.colors.primary);
    } else {
      setThemeActive('bg-blue-600');
    }
  }, [theme, getAllThemes]);

  const isMobile = useIsMobile();

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleOpenPaymentTerms = () => {
    console.log('Open payment terms');
  };

  const themeMap = {
    "#f472b6": "bg-[rgba(244, 114, 182, 0.015)]",
    "#1f2937": "bg-[rgba(31, 41, 55, 0.02)]",
    "#22c55e": "bg-[rgba(34, 197, 94, 0.015)]",
    "#2563eb":"bg-[rgba(37, 99, 235, 0.015)]",
    "#ea580c":"bg-[rgba(234, 88, 12, 0.015)]",
    "#7c3aed":"bg-[rgba(124, 58, 237, 0.015)]",
    "#10b981":"bg-[rgba(16, 185, 129, 0.015)]",
    "#0ea5e9":"bg-[rgba(14, 165, 233, 0.015)]"
   
};
const className = `${themeMap[themeActive] || "bg-white"} h-full`;

  const sidebarWidth = isSidebarCollapsed ? 80 : 280;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {isMobile ? (
        <>
          {isMobileMenuOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}
          <div
            className={`fixed top-0 left-0 h-full bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
              isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
            style={{ width: 280 }}
          >
            <Sidebar
              isCollapsed={false} 
              onToggleCollapse={() => setIsMobileMenuOpen(false)} 
            />
          </div>
        </>
      ) : (
        <div
          className="fixed top-0 left-0 z-40 h-full bg-white shadow-lg"
          style={{ width: sidebarWidth, transition: 'width 300ms ease-in-out' }}
        >
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={handleToggleSidebar}
          />
        </div>
      )}

      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out`}
        style={
          !isMobile
            ? {
                marginLeft: `${sidebarWidth}px`, 
              }
            : {}
        }
      >

        <div className="sticky top-0 z-30 flex items-center justify-between bg-white border-b border-gray-100 shadow-sm">
          <div className="flex-1">
            <HeaderCustomer setIsMobileMenuOpen={setIsMobileMenuOpen} />
          </div>
        </div>

        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Bannière */}
          <div className="bg-white shrink-0">
            <CollaborationBanner />
          </div>
          <div className="flex-1 overflow-y-auto">
            <main className="h-full pb-20 md:pb-0">
              <div className={className}  >
                <Outlet context={{ onOpenPaymentTerms: handleOpenPaymentTerms }} />
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjetLayoutClient;
