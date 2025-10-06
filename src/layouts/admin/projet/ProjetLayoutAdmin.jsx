import React from "react";
import { Outlet, Link } from "react-router-dom";
import Sidebar from "../sidebar/Sidebar";

const ProjetLayoutAdmin = () => {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      {/* Contenu principal */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default ProjetLayoutAdmin;
