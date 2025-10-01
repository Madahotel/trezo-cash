import React, { useState, useMemo, useRef, useEffect } from "react";
// import { useData } from "../context/DataContext";
// import { useUI } from "../context/UIContext";
import {
  User,
  Shield,
  CreditCard,
  FileText,
  HelpCircle,
  LogOut,
  Cog,
  Users,
  FolderKanban,
  Wallet,
  Archive,
  Globe,
  LayoutTemplate,
  Trash2,
  FolderCog,
  Lock,
  LayoutDashboard,
  ListChecks,
  Table,
  AreaChart,
  Calendar,
  Layers,
  PieChart,
  BookOpen,
  Receipt,
  Hash,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, NavLink, useLocation } from "react-router-dom";
import ProjectSwitcher from "./ProjectSwitcher";
// import SubscriptionBadge from "./SubscriptionBadge";
// import ProjectSwitcher from "./ProjectSwitcher";
// import StaticAppLogo from "./StaticAppLogo";

export default function HeaderCustomer() {
  //   const { dataState } = useData();
  //   const { uiDispatch } = useUI();
  //   const { profile, session, taxConfigs } = dataState;
  const navigate = useNavigate();
  const location = useLocation();

  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const avatarMenuRef = useRef(null);
  const settingsPopoverRef = useRef(null);

  const currentPage = useMemo(() => {
    const path = location.pathname;

    const pages = {
      "/client/dashboard": { title: "Tableau de Bord", icon: LayoutDashboard },
      "/client/budget": { title: "Budget / État des Lieux", icon: ListChecks },
      "/client/trezo": { title: "Tableau de Trésorerie", icon: Table },
      "/client/flux": { title: "Flux de Trésorerie", icon: AreaChart },
      "/app/echeancier": { title: "Échéancier", icon: Calendar },
      "/app/scenarios": { title: "Gestion de Scénarios", icon: Layers },
      "/app/analyse": { title: "Analyse", icon: PieChart },
      "/app/journal-budget": { title: "Journal du Budget", icon: BookOpen },
      "/app/journal-paiements": {
        title: "Journal des Paiements",
        icon: Receipt,
      },
      "/app/parametres-projet": {
        title: "Paramètres du Projet",
        icon: FolderCog,
      },
      "/app/templates": { title: "Mes Modèles", icon: LayoutTemplate },
      "/app/provisions": { title: "Suivi des Provisions", icon: Lock },
      "/app/categories": {
        title: "Gestion des Catégories",
        icon: FolderKanban,
      },
      "/app/tiers": { title: "Gestion des Tiers", icon: Users },
      "/app/comptes": { title: "Comptes de Trésorerie", icon: Wallet },
      "/app/archives": { title: "Archives", icon: Archive },
      "/app/tva": { title: "Gestion de la TVA", icon: Hash },
      "/app/fiscalite": { title: "Gestion de la Fiscalité", icon: Hash },
      "/app/profil": { title: "Mon Profil", icon: User },
      "/app/securite": { title: "Mot de Passe et Sécurité", icon: Shield },
      "/app/abonnement": { title: "Mon Abonnement", icon: CreditCard },
      "/app/delete-account": { title: "Supprimer Mon Compte", icon: Trash2 },
    };

    return pages[path];
  }, [location.pathname]); // ✅ mise à jour quand on change de page

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target))
        setIsAvatarMenuOpen(false);
      if (
        settingsPopoverRef.current &&
        !settingsPopoverRef.current.contains(e.target)
      )
        setIsSettingsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNavigate = (path) => {
    navigate(path);
    setIsSettingsOpen(false);
    setIsAvatarMenuOpen(false);
  };

  //   const subscriptionDetails = useMemo(() => {
  //     if (!profile) return null;
  //     if (profile.subscriptionStatus === "lifetime") return "Statut : Accès à Vie";
  //     if (profile.subscriptionStatus === "active") return "Statut : Abonnement Pro";
  //     if (profile.subscriptionStatus === "trialing") return null;
  //     return "Statut : Essai terminé";
  //   }, [profile]);

  const navItems = [
    { label: "Dashboard", path: "/client/dashboard", icon: LayoutDashboard },
    { label: "Budget", path: "/client/budget", icon: ListChecks },
    { label: "Trezo", path: "/client/trezo", icon: Table },
    { label: "Flux", path: "/client/flux", icon: AreaChart },
    { label: "Echeancier", path: "/app/echeancier", icon: Calendar },
    { label: "Scénarios", path: "/app/scenarios", icon: Layers },
    { label: "Analyse", path: "/app/analyse", icon: PieChart },
  ];

  const settingsItems = [
    {
      id: "/app/parametres-projet",
      label: "Paramètres du Projet",
      icon: FolderCog,
    },
    { id: "/app/templates", label: "Mes Modèles", icon: LayoutTemplate },
    { id: "/app/provisions", label: "Suivi des Provisions", icon: Lock },
    { id: "/app/categories", label: "Catégories", icon: FolderKanban },
    { id: "/app/tiers", label: "Tiers", icon: Users },
    { id: "/app/comptes", label: "Comptes", icon: Wallet },
    { id: "timezoneSettings", label: "Fuseau Horaire", icon: Globe },
    { id: "/app/archives", label: "Archives", icon: Archive },
  ];

  const menuItems = [
    { title: "Mon profil", icon: User, path: "/app/profil" },
    { title: "Mot de passe et sécurité", icon: Shield, path: "/app/securite" },
    { title: "Mon abonnement", icon: CreditCard, path: "/app/abonnement" },
    { title: "Factures", icon: FileText, path: "/app/factures" },
    {
      title: "Supprimer mon compte",
      icon: Trash2,
      path: "/app/delete-account",
      destructive: true,
    },
    { title: "Centre d'aide", icon: HelpCircle, path: "/app/aide" },
  ];

  return (
    <div className="sticky top-0 z-30 bg-gray-100 border-b border-gray-200">
      <div className="w-full px-6">
        <div className="py-2 grid grid-cols-[auto_1fr_auto] items-center gap-6">
          {/* Logo + Switcher */}
          <div className="flex items-center gap-4">
            <NavLink
              aria-current="page"
              class="flex items-center gap-2 text-gray-700 hover:text-blue-600 active"
              to="/client/dashboard"
              data-discover="true"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
                class="w-6 h-6"
              >
                <path d="M4 4H20V12H12V20H4V4Z"></path>
              </svg>
            </NavLink>
            <NavLink
              to="/client/dashboard"
              className="flex items-center gap-2 text-gray-700 hover:text-blue-600"
            >
              {/* <StaticAppLogo className="w-6 h-6" /> */}
            </NavLink>
            <div className="h-6 w-px bg-gray-300"></div>
            <div className="w-auto min-w-[10rem] max-w-xs">
              <ProjectSwitcher />
            </div>
          </div>

          {/* Page Title */}
          <div className="flex items-center justify-center gap-3">
            {currentPage && (
              <>
                <currentPage.icon className="w-6 h-6 text-gray-500" />
                <h1 className="text-xl font-semibold text-gray-800">
                  {currentPage.title}
                </h1>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 justify-end">
            <nav className="flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `p-2 rounded-md transition-colors ${
                      isActive
                        ? "bg-gray-200 text-blue-600"
                        : "text-gray-600 hover:bg-gray-200"
                    }`
                  }
                  title={item.label}
                >
                  <item.icon size={20} />
                </NavLink>
              ))}
            </nav>

            <div className="h-6 w-px bg-gray-300"></div>

            {/* Settings */}
            <div className="relative" ref={settingsPopoverRef}>
              <button
                onClick={() => setIsSettingsOpen((p) => !p)}
                className="p-2 text-gray-600 hover:text-gray-900"
              >
                <Cog className="w-5 h-5" />
              </button>
              <AnimatePresence>
                {isSettingsOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border z-20"
                  >
                    <ul className="p-2 space-y-1">
                      {settingsItems.map((s) => (
                        <li key={s.id}>
                          <button
                            // onClick={() => (s.id.startsWith("/app/") ? handleNavigate(s.id) : uiDispatch({ type: "SET_ACTIVE_SETTINGS_DRAWER", payload: s.id }))}
                            className="flex items-center w-full h-10 px-4 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
                          >
                            <s.icon className="w-5 h-5 mr-3" />
                            {s.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profil */}
            <div className="flex items-center gap-2">
              {/* <SubscriptionBadge /> */}
              <div className="relative" ref={avatarMenuRef}>
                <button
                  onClick={() => setIsAvatarMenuOpen((p) => !p)}
                  className="p-2 text-gray-600 hover:text-gray-900"
                >
                  <User className="w-5 h-5" />
                </button>
                <AnimatePresence>
                  {isAvatarMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -10 }}
                      className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border z-20"
                    >
                      <div className="px-4 py-3 border-b">
                        {/* <p className="text-sm font-semibold">{profile?.fullName || "Utilisateur"}</p>
                        <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
                        {subscriptionDetails && (
                          <p className="text-xs font-semibold text-blue-600 mt-1">{subscriptionDetails}</p>
                        )} */}
                      </div>
                      <div className="p-1">
                        {menuItems.map((m) => (
                          <button
                            key={m.title}
                            onClick={() => handleNavigate(m.path)}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md ${
                              m.destructive
                                ? "text-red-600 hover:bg-red-50"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            <m.icon className="w-4 h-4" />
                            {m.title}
                          </button>
                        ))}
                        <div className="h-px bg-gray-200 my-1"></div>
                        <button
                          onClick={() => console.log("deconnexion")}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 rounded-md hover:bg-red-50"
                        >
                          <LogOut className="w-4 h-4" /> Se déconnecter
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
