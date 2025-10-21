import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import HeaderCustomer from '../../../components/headers/HeaderCustomer';
import Sidebar from '../../../components/sidebar/Sidebar';
import CollaborationBanner from '../../../components/collaboratioBanner/CollaborationBanner';
import { useSettings } from '../../../components/context/SettingsContext';
// Hook simple pour détecter si on est sur mobile
const useIsMobile = () => {
  // On utilise 1024px pour une meilleure distinction desktop/mobile/tablet
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    // Utilisez une valeur standard pour Tailwind 'lg' ou 'md' si vous en utilisez
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
  // Close menu when clicking outside
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
  // Utilisons 1024px comme breakpoint pour 'desktop' (lg:...)
  const isMobile = useIsMobile();

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleOpenPaymentTerms = () => {
    console.log('Open payment terms');
  };

  const themeMap = {
    // Clé : la valeur hexadécimale
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
  // Largeur de la sidebar : 80px (réduite) ou 280px (dépliée) - ajustée à 280 pour coller à la sidebar
  const sidebarWidth = isSidebarCollapsed ? 80 : 280;

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* ======== Sidebar ======== */}
      {isMobile ? (
        // ✅ Mobile : sidebar dans un drawer (overlay)
        <>
          {isMobileMenuOpen && (
            <div
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}
          <div
            // Le drawer est un overlay, donc il n'affecte pas le layout du contenu principal
            className={`fixed top-0 left-0 h-full bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
              isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
            style={{ width: 280 }}
          >
            <Sidebar
              isCollapsed={false} // Toujours dépliée en mode mobile pour un usage optimal
              onToggleCollapse={() => setIsMobileMenuOpen(false)} // Ferme le drawer
            />
          </div>
        </>
      ) : (
        // ✅ Desktop : sidebar fixe
        <div
          className="fixed top-0 left-0 h-full z-40 shadow-lg bg-white"
          // Utiliser la transition ici pour le resize desktop
          style={{ width: sidebarWidth, transition: 'width 300ms ease-in-out' }}
        >
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={handleToggleSidebar}
          />
        </div>
      )}

      {/* ======== Contenu principal (Main Content) ======== */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out`}
        style={
          // Uniquement sur desktop, appliquer la marge et la largeur calculée
          !isMobile
            ? {
                marginLeft: `${sidebarWidth}px`, // Pousse le contenu
                // Retirer la width calculée, laisser flex-1 faire son travail sur desktop
                // width: `calc(100% - ${sidebarWidth}px)`,
              }
            : {}
        }
      >
        {/* ======== Header ======== */}
        <div className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-100 flex items-center justify-between">
          {/* Sur mobile : bouton pour ouvrir le menu */}
          <div className="flex-1">
            <HeaderCustomer setIsMobileMenuOpen={setIsMobileMenuOpen} />
          </div>
        </div>

        {/* ======== Contenu (Outlet) ======== */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Bannière */}
          <div className="shrink-0 bg-white">
            <CollaborationBanner />
          </div>

          {/* Zone principale */}
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
