import { Outlet } from "react-router-dom";
import HeaderCustomer from "../../../components/headers/HeaderCustomer";

const ProjetLayoutClient = () => {
  return (
    <div className="  ">
      <HeaderCustomer />
      <Outlet />
    </div>
  );
};

export default ProjetLayoutClient;
