import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import HeaderCustomer from '../../../components/headers/HeaderCustomer';
import Sidebar from '../../../components/sidebar/Sidebar';
import CollaborationBanner from '../../../components/collaboratioBanner/CollaborationBanner';

const ProjetLayoutClient = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleOpenPaymentTerms = () => {
    console.log('Open payment terms');
  };

  // Calcul de la largeur basé sur l'état de la sidebar
  const sidebarWidth = isSidebarCollapsed ? 80 : 256;

  return (
    <>
      <div className="h-screen flex bg-gray-50 overflow-hidden">
        {/* Sidebar fixe avec ombre subtile */}
        <div className="fixed top-0 left-0 h-full z-40 shadow-lg">
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={handleToggleSidebar}
          />
        </div>

        {/* Contenu principal avec transition fluide */}
        <div
          className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out"
          style={{
            marginLeft: `${sidebarWidth}px`,
            width: `calc(100% - ${sidebarWidth}px)`,
          }}
        >
          {/* Header fixe avec fond blanc */}
          <div className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-100">
            <HeaderCustomer />
          </div>

          {/* Contenu scrollable avec style amélioré */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Bannière de collaboration */}
            <div className="shrink-0 bg-white">
              <CollaborationBanner />
            </div>

            {/* Zone de contenu principale avec défilement amélioré */}
            <div className="flex-1 overflow-y-auto">
              <main className="min-h-full pb-20 md:pb-0">
                <div className="bg-white">
                  <Outlet
                    context={{ onOpenPaymentTerms: handleOpenPaymentTerms }}
                  />
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProjetLayoutClient;
