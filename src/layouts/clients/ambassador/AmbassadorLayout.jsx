import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Users, Share2, History, Info, Gift } from 'lucide-react';

const AmbassadorLayout = () => {
    const navLinkClass = ({ isActive }) =>
        `relative flex items-center px-3 py-2 text-sm font-medium transition-colors duration-200 ${isActive
            ? 'text-blue-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-blue-600'
            : 'text-gray-600 hover:text-blue-600 hover:after:absolute hover:after:bottom-0 hover:after:left-0 hover:after:right-0 hover:after:h-[2px] hover:after:bg-blue-300'
        }`;

    return (
        <div className="p-6 mx-auto max-w-7xl">
            {/* --- Barre supérieure avec titre + navbar --- */}
            <div className="flex items-center justify-between px-6 py-3 mb-4 bg-white border border-gray-100 rounded-lg shadow-sm">
                {/* Titre */}
                <div className="flex items-center gap-3">
                    <Gift className="w-7 h-7 text-amber-500" />
                    <h1 className="text-xl font-bold text-gray-600">
                        Programme Ambassadeur
                    </h1>
                </div>

                {/* Navbar à droite */}
                <nav className="flex items-center gap-6">
                    <NavLink to="/client/parrainage" className={navLinkClass} end>
                        <Users className="w-5 h-5 mr-2" />
                        Tableau de bord
                    </NavLink>
                    <NavLink to="/client/parrainage/refferals" className={navLinkClass}>
                        <Share2 className="w-5 h-5 mr-2" />
                        Mes Filleuls
                    </NavLink>
                    <NavLink to="/client/parrainage/history" className={navLinkClass}>
                        <History className="w-5 h-5 mr-2" />
                        Paiements
                    </NavLink>
                    <NavLink to="/client/parrainage/program-info" className={navLinkClass}>
                        <Info className="w-5 h-5 mr-2" />
                        Le Programme
                    </NavLink>
                </nav>
            </div>

            {/* Zone de contenu dynamique */}
            <Outlet />
        </div>
    );
};

export default AmbassadorLayout;