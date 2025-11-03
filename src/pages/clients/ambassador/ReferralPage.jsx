import React from "react";
import ReferralDashboard from "./ReferralDashboard";
import { Gift, Users, Share2, History, Info } from "lucide-react";
import { NavLink } from "react-router-dom";

const AmbassadorMenu = () => {
    const navLinkClass = ({ isActive }) =>
        [
            "flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors duration-200 border-b-2",
            isActive
                ? "text-blue-600 border-blue-600"
                : "text-gray-600 border-transparent hover:text-blue-600 hover:border-blue-200",
        ].join(" ");

    return (
        <nav className="flex flex-col mb-6 overflow-hidden bg-gray-100 border-b rounded-md shadow-sm md:flex-row md:items-center md:justify-end md:divide-x md:border-none">
            <NavLink to="/client/parrainage" className={navLinkClass} end>
                <Users className="w-5 h-5" />
                <span>Tableau de bord</span>
            </NavLink>

            <NavLink to="/referrals" className={navLinkClass}>
                <Share2 className="w-5 h-5" />
                <span>Mes Filleuls</span>
            </NavLink>

            <NavLink to="/history" className={navLinkClass}>
                <History className="w-5 h-5" />
                <span>Paiements</span>
            </NavLink>

            <NavLink to="/program-info" className={navLinkClass}>
                <Info className="w-5 h-5" />
                <span>Le Programme</span>
            </NavLink>
        </nav>
    );
};

const ReferralPage = () => {
    return (
        <div className="p-6 mx-auto max-w-7xl">
            <AmbassadorMenu />

            <div className="mb-8">
                <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
                    <Gift className="w-8 h-8 text-amber-500" />
                    Programme Ambassadeur
                </h1>
                <p className="mt-2 text-gray-600">
                    Parrainez vos amis et soyez récompensé pour votre soutien !
                </p>
            </div>

            <ReferralDashboard />
        </div>
    );
};

export default ReferralPage;
