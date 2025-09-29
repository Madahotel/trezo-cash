

import React from 'react';
import { Outlet, Link } from 'react-router-dom';

const GlobalHeaderAdmin = () => {
    return (
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
    );
};

export default GlobalHeaderAdmin;
