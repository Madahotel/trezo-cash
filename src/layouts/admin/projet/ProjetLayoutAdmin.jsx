// src/pages/admin/ProjetLayoutAdmin.jsx
import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../sidebar/Sidebar";

const ProjetLayoutAdmin = () => {
  useEffect(() => {
    // Import dynamique an'ny style admin fotsiny rehefa misokatra ny admin
    import("../../../../src/admin.css");
  }, []);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default ProjetLayoutAdmin;
