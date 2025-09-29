import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import GlobalHeaderAdmin from '../../../components/headers/GlobalHeaderAdmin';

const ProjetLayoutAdmin = () => {
  return (
    <div className="min-h-screen flex flex-col">
    
      <GlobalHeaderAdmin/>

      {/* Contenu principal */}
      <main className="flex-1 bg-gray-100 p-6">
        <Outlet /> 
      </main>


    </div>
  );
};

export default ProjetLayoutAdmin;