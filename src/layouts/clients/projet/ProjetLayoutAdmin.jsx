import React from 'react';
import { Outlet, Link } from 'react-router-dom';

const ProjetLayoutClient = () => {
  return (
    <div className="min-h-screen flex flex-col">
    
      <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Espace Admin</h1>
        <nav className="space-x-4">
          <Link to="/admin/dashboard" className="hover:underline">
            Dashboard
          </Link>
          <Link to="/admin/users" className="hover:underline">
            Utilisateurs
          </Link>
          <Link to="/admin/settings" className="hover:underline">
            Paramètres
          </Link>
        </nav>
      </header>

      {/* Contenu principal */}
      <main className="flex-1 bg-gray-100 p-6">
        <Outlet /> 
      </main>


    </div>
  );
};

export default ProjetLayoutClient;