import { Outlet } from "react-router-dom";
import HeaderCustomer from "../../../components/headers/HeaderCustomer";

const ProjetLayoutClient = () => {
  const handleOpenPaymentTerms = () => {
    console.log("Open payment terms");
  };

  return (
    <div className="  ">
      <HeaderCustomer />
      <Outlet context={{ onOpenPaymentTerms: handleOpenPaymentTerms }} />
    </div>
  );
};

export default ProjetLayoutClient;
