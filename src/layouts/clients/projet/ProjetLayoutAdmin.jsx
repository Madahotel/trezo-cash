import React from "react";
import { Outlet, Link } from "react-router-dom";
import GlobalHeaderAdmin from "../../../components/headers/GlobalHeaderAdmin";

const ProjetLayoutClient = () => {
  return (
    <div className="min-h-screen justify-center w-screen  ">
      <GlobalHeaderAdmin />
      <Outlet />
    </div>
  );
};

export default ProjetLayoutClient;
