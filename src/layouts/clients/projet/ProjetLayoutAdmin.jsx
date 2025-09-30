import { Outlet } from "react-router-dom";
import HeaderCustomer from "../../../components/headers/HeaderCustomer";

const ProjetLayoutClient = () => {
  return (
    <div className="min-h-screen justify-center w-screen  ">
      <HeaderCustomer />
      <Outlet />
    </div>
  );
};

export default ProjetLayoutClient;
