import { Outlet } from "react-router-dom";
import HeaderCustomer from "../../../components/headers/HeaderCustomer";
import Sidebar from "../../../components/sidebar/sidebar";
import CollaborationBanner from "../../../components/collaboratioBanner/CollaborationBanner";

const ProjetLayoutClient = () => {
  const handleOpenPaymentTerms = () => {
    console.log("Open payment terms");
  };

  return (
      <div className="h-screen flex bg-background">
            <Sidebar />
            <div className="flex-1 flex flex-col pl-24">
                  <HeaderCustomer />
                <div className="flex-1 overflow-y-auto bg-gray-50">
                    <CollaborationBanner />
                    <main>
                        <Outlet context={{ onOpenPaymentTerms: handleOpenPaymentTerms }} />
                    </main>
                </div>
            </div>
          
        </div>
  );
};

export default ProjetLayoutClient;
