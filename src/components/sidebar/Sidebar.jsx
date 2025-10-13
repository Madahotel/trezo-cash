import React, { useState, useMemo, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
// import { supabase } from '../utils/supabase';
import {
    LayoutDashboard, ListChecks, Table, AreaChart, Calendar, Layers, PieChart, AlertTriangle,
    ChevronDown, ChevronsLeftRight, Wallet, LogOut, User, Shield, CreditCard, FileText,
    HelpCircle, Trash2, FolderCog, Hash, Banknote, LayoutTemplate, Lock, FolderKanban,
    Users as UsersIcon, Archive, Settings,
    DollarSign
} from 'lucide-react';
import NavTooltip from './NavTooltip';
import { useActiveProjectData, useScheduleData } from '../../utils/selectors';
import { AnimatePresence, motion } from 'framer-motion';
import AmbassadorIcon from './AmbassadorIcon';
import TrezocashLogo from '../../components/logo/TrezocashLogo';
import { useSettings } from '../context/SettingsContext';

const Sidebar = ({ isCollapsed, onToggleCollapse }) => {
    const { dataState } = useData();
    const { uiState, uiDispatch } = useUI();
    const { profile, session } = dataState;
    const { activeProjectOrView } = useActiveProjectData(dataState, uiState);
    const { actualTransactions } = useActiveProjectData(dataState, uiState);
    const { overdueTransactions } = useScheduleData(actualTransactions, dataState.settings);
    const overdueCount = overdueTransactions.length;
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, getAllThemes } = useSettings();
    const [activeTooltip, setActiveTooltip] = useState(null);
    const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
    const avatarMenuRef = useRef(null);
    const [themeActive, setThemeActive] = useState("");
    // Close menu when clicking outside


    useEffect(() => {
        const selectedTheme = getAllThemes().find(themeOption => theme === themeOption.id);
        if (selectedTheme) {
            setThemeActive(selectedTheme.colors.primary);
        } else {
            setThemeActive("bg-blue-600");
        }
    }, [theme, getAllThemes]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (avatarMenuRef.current && !avatarMenuRef.current.contains(event.target)) {
                setIsAvatarMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Close menu on route change
    useEffect(() => {
        setIsAvatarMenuOpen(false);
    }, [location.pathname]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    const handleNavigate = (path) => {
        navigate(path);
        setIsAvatarMenuOpen(false);
    };

    const handleSettingsItemClick = (itemId) => {
        if (itemId.startsWith('/client/')) {
            handleNavigate(itemId);
        } else {
            uiDispatch({ type: 'SET_ACTIVE_SETTINGS_DRAWER', payload: itemId });
        }
        setIsAvatarMenuOpen(false);
    };

    const getInitials = (name) => {
        if (!name) return '?';
        const words = name.split(' ').filter(word => word.length > 0);
        if (words.length > 1) {
            return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    // Tooltip content with improved descriptions
    const tooltipContent = useMemo(() => ({
        dashboard: {
            title: 'Dashboard',
            description: "Vue d'ensemble de la santé financière de votre projet avec indicateurs clés.",
            imageUrl: 'https://i.imgur.com/nJbC2a2.png'
        },
        budget: {
            title: 'Budget',
            description: "Créez et gérez votre budget prévisionnel avec suivi des écarts.",
            imageUrl: 'https://i.imgur.com/rF9gYtK.png'
        },
        trezo: {
            title: 'Trezo',
            description: "Tableau de bord trésorerie : du quotidien à la vision long terme (10 ans).",
            imageUrl: 'https://i.imgur.com/dAmf2u2.png'
        },
        flux: {
            title: 'Flux',
            description: "Analysez l'évolution de votre trésorerie avec des visualisations claires.",
            imageUrl: 'https://i.imgur.com/e5B3q2b.png'
        },
        echeancier: {
            title: 'Échéancier',
            description: "Gérez vos échéances et paiements pour un suivi optimal.",
            imageUrl: 'https://i.imgur.com/sZ3v4fH.png'
        },
        analyse: {
            title: 'Analyse',
            description: "Analysez vos dépenses et revenus pour des décisions éclairées.",
            imageUrl: 'https://i.imgur.com/jV7fL4c.png'
        },
        scenarios: {
            title: 'Scénarios',
            description: "Simulez l'impact de vos décisions sur votre trésorerie future.",
            imageUrl: 'https://i.imgur.com/tY8wP9d.png'
        },
        comptes: {
            title: 'Comptes',
            description: "Gérez vos comptes bancaires, caisse et autres instruments de trésorerie.",
            imageUrl: 'https://i.imgur.com/9y8Z8bH.png'
        },
        enRetard: {
            title: 'Échéances en Retard',
            description: `${overdueCount} transaction(s) nécessitent votre attention.`,
            imageUrl: 'https://i.imgur.com/sZ3v4fH.png'
        },
    }), [overdueCount]);

    // Navigation items with improved structure
    const mainNavItems = useMemo(() => [
        { label: 'Dashboard', id: 'dashboard', path: '/client/dashboard', icon: LayoutDashboard },
        { label: 'Budget', id: 'budget', path: '/client/budget', icon: ListChecks },
        { label: 'Trezo', id: 'trezo', path: '/client/trezo', icon: Table },
        { label: 'Flux', id: 'flux', path: '/client/flux', icon: AreaChart },
        { label: 'Échéancier', id: 'echeancier', path: '/client/echeancier', icon: Calendar },
        { label: 'Analyse', id: 'analyse', path: '/client/analyse', icon: PieChart },
        { label: 'Scénarios', id: 'scenarios', path: '/client/scenarios', icon: Layers },
        { label: 'Comptes', id: 'comptes', path: '/client/comptes', icon: Wallet },
    ], []);

    const profileMenuItems = useMemo(() => [
        { title: 'Mon profil', icon: User, path: '/client/profil' },
        { title: 'Programme Ambassadeur', icon: AmbassadorIcon, path: '/client/parrainage' },
        { title: 'Mot de passe et sécurité', icon: Shield, path: '/client/securite' },
        { title: 'Mon abonnement', icon: CreditCard, path: '/client/abonnement' },
        { title: 'Factures', icon: FileText, path: '/client/factures' },
        { title: 'Supprimer mon compte', icon: Trash2, path: '/client/delete-account', isDestructive: true },
        { title: 'Centre d\'aide', icon: HelpCircle, path: '/client/aide' },
    ], []);

    const settingsItems = useMemo(() => [
        { id: '/client/parametres-projet', label: 'Paramètres du Projet', icon: FolderCog, color: 'text-blue-500' },
        { id: '/client/tableau-tva', label: 'Tableau TVA', icon: Hash, color: 'text-green-500' },
        { id: '/client/emprunts-prets', label: 'Emprunts & Prêts', icon: Banknote, color: 'text-green-500' },
        { id: '/client/templates', label: 'Mes Modèles', icon: LayoutTemplate, color: 'text-indigo-500' },
        { id: '/client/provisions', label: 'Suivi des Provisions', icon: Lock, color: 'text-orange-500' },
        { id: '/client/categories', label: 'Catégories', icon: FolderKanban, color: 'text-orange-500' },
        { id: '/client/tiers', label: 'Tiers', icon: UsersIcon, color: 'text-pink-500' },
        { id: '/client/comptes', label: 'Comptes', icon: Wallet, color: 'text-teal-500' },
        { id: '/client/archives', label: 'Archives', icon: Archive, color: 'text-slate-500' },
    ], []);

    const subscriptionDetails = useMemo(() => {
        if (!profile) return null;
        const status = profile.subscriptionStatus;
        if (status === 'lifetime') return { text: 'Accès à Vie', color: 'text-purple-600', bgColor: 'bg-purple-100' };
        if (status === 'active') return { text: 'Abonnement Pro', color: 'text-green-600', bgColor: 'bg-green-100' };
        if (status === 'trialing') return null;
        return { text: 'Essai terminé', color: 'text-red-600', bgColor: 'bg-red-100' };
    }, [profile]);


    // Enhanced navigation link classes with light theme
    const navLinkClasses = ({ isActive }) => {

        const baseClasses = `flex items-center w-full h-12 rounded-xl transition-all duration-200 group relative overflow-hidden ${isCollapsed ? 'justify-center' : 'px-3'
            }`;

        // 2. Définir les classes actives/inactives (couleur de texte, ombre)
        const activeText = isActive ? 'text-white' : 'text-gray-700';
        const activeShadow = isActive ? 'shadow-lg shadow-blue-500/25' : 'hover:shadow-md';

        // 3. Définir la classe de couleur de fond pour l'état INACTIF
        const inactiveBgClass = 'bg-transparent'; // Votre couleur par défaut pour l'état inactif

        // 4. Définir la classe de fond et de hover inactif
        const inactiveStateClasses = !isActive
            ? `${inactiveBgClass} hover:bg-white hover:text-blue-600 border border-transparent hover:border-blue-200`
            : '';


        const activeStateClasses = isActive ? 'bg-transparent' : inactiveStateClasses; // Utilisez `bg-transparent` si actif pour éviter toute classe `bg-*`

        return `${baseClasses} ${activeText} ${activeShadow} ${activeStateClasses}`;
    };


    // Enhanced overdue badge classes for light theme
    const getOverdueBadgeClasses = (isActive = false) =>
        `flex items-center w-full h-12 rounded-xl transition-all duration-200 group ${isCollapsed ? 'justify-center' : 'px-3'
        } ${isActive
            ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
            : 'text-red-600 hover:bg-red-50 hover:text-red-700 hover:shadow-md border border-transparent hover:border-red-200'
        }`;

    return (
        // Dans Sidebar.jsx
        <motion.div
            initial={false}
            animate={{ width: isCollapsed ? 80 : 280 }} // <-- Ici, la largeur dépliée est 280
            className="fixed top-0 left-0 h-full bg-gray-100 z-40 flex flex-col transition-all duration-300 border-r border-gray-200 shadow-lg"
        >
            {/* Header Section */}
            <div className="flex items-center justify-between h-19 px-4 py-4 border-b border-gray-200 bg-white/50 backdrop-blur-sm">
                <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-10' : 'w-full'
                    }`}>
                    <NavLink
                        to="/client/dashboard"
                        className="flex items-center justify-center rounded-xl text-gray-900 shrink-0 transition-transform hover:scale-105"
                        style={{ color: themeActive }}
                    >
                        <DollarSign
                            className="w-8 h-8"
                            style={{ color: themeActive }}
                        />
                    </NavLink>
                    <AnimatePresence>
                        {!isCollapsed && (
                            <motion.span
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="text-xl font-bold whitespace-nowrap"
                                style={{ color: themeActive }}
                            >
                                Trezocash
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>

                {!isCollapsed && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onToggleCollapse}
                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors duration-200"
                        title="Réduire la sidebar"
                    >
                        <ChevronsLeftRight size={18} />
                    </motion.button>
                )}
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                {mainNavItems.map(item => {
                    const IconComponent = item.icon;
                    return (
                        <div
                            key={item.id}
                            className="relative mx-1"
                            onMouseEnter={() => isCollapsed && setActiveTooltip(item.id)}
                            onMouseLeave={() => setActiveTooltip(null)}
                        >
                            <NavLink
                                to={item.path}
                                className={navLinkClasses} // Les classes Tailwind gèrent tout SAUF la couleur de fond active
                                style={({ isActive }) => ({
                                    // La couleur de fond dynamique est appliquée seulement si ACTIF.
                                    backgroundColor: isActive ? themeActive : undefined, // `undefined` permet à la classe Tailwind de prendre le relais
                                })}
                                title={isCollapsed ? item.label : ''}
                            >
                                <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="flex items-center"
                                >
                                    <IconComponent
                                        size={20}
                                        className="transition-all duration-200"
                                    />
                                    {!isCollapsed && (
                                        <motion.span
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="ml-3 font-medium text-sm"
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </motion.div>

                                {/* Active indicator */}
                                <motion.div
                                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full ${navLinkClasses({ isActive: false }).includes('bg-blue-500')
                                        ? 'bg-blue-500'
                                        : 'bg-transparent'
                                        }`}
                                    initial={false}
                                    animate={{
                                        scale: navLinkClasses({ isActive: true }).includes('bg-blue-500') ? 1 : 0
                                    }}
                                    transition={{ duration: 0.2 }}
                                />
                            </NavLink>
                            <AnimatePresence>
                                {isCollapsed && activeTooltip === item.id && (
                                    <NavTooltip {...tooltipContent[item.id]} />
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </nav>

            {/* Footer Section */}
            <div className="px-2 py-4 border-t border-gray-200 bg-white/30 space-y-2">
                {/* Overdue Transactions Alert */}
                {overdueCount > 0 && (
                    <div
                        className="relative mx-1"
                        onMouseEnter={() => isCollapsed && setActiveTooltip('enRetard')}
                        onMouseLeave={() => setActiveTooltip(null)}
                    >
                        <NavLink
                            to="/client/en-retard"
                            className={({ isActive }) => getOverdueBadgeClasses(isActive)}
                            title={isCollapsed ? 'Échéances en retard' : ''}
                        >
                            <div className="relative">
                                <AlertTriangle size={20} />
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold border-2 border-gray-50"
                                >
                                    {overdueCount}
                                </motion.span>
                            </div>
                            {!isCollapsed && (
                                <span className="ml-3 font-medium text-sm">En retard</span>
                            )}
                        </NavLink>
                        <AnimatePresence>
                            {isCollapsed && activeTooltip === 'enRetard' && (
                                <NavTooltip {...tooltipContent.enRetard} />
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* User Profile Menu */}
                <div className="relative mx-1" ref={avatarMenuRef}>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsAvatarMenuOpen(!isAvatarMenuOpen)}
                        className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all duration-200 group ${isCollapsed ? 'justify-center' : ''
                            } ${isAvatarMenuOpen
                                ? 'bg-white shadow-md border border-gray-200'
                                : 'hover:bg-white hover:shadow-sm hover:border hover:border-gray-200'
                            }`}
                    >
                        <div className="relative">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shrink-0 shadow-md"
                            >
                                {getInitials(profile?.fullName)}
                            </motion.div>
                            {subscriptionDetails && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className={`absolute -bottom-1 -right-1 w-2 h-2 rounded-full border-2 border-gray-50 ${subscriptionDetails.bgColor}`}
                                />
                            )}
                        </div>

                        {!isCollapsed && (
                            <div className="text-left overflow-hidden flex-grow min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                    {profile?.fullName}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                    {session?.user?.email}
                                </p>
                            </div>
                        )}

                        {!isCollapsed && (
                            <motion.div
                                animate={{ rotate: isAvatarMenuOpen ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ChevronDown size={16} className="text-gray-400" />
                            </motion.div>
                        )}
                    </motion.button>

                    {/* Profile Dropdown Menu */}
                    <AnimatePresence>
                        {isAvatarMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                transition={{ duration: 0.15 }}
                                className={`absolute left-0 mb-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-50 ${isCollapsed ? 'bottom-full' : 'bottom-full'
                                    }`}
                            >
                                {/* User Info Header */}
                                <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white rounded-t-xl">
                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                        {profile?.fullName || 'Utilisateur'}
                                    </p>
                                    <p className="text-xs text-gray-600 truncate mt-1">
                                        {session?.user?.email}
                                    </p>
                                    {subscriptionDetails && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`text-xs font-semibold ${subscriptionDetails.color} mt-2 px-2 py-1 ${subscriptionDetails.bgColor} rounded-full inline-block`}
                                        >
                                            {subscriptionDetails.text}
                                        </motion.p>
                                    )}
                                </div>

                                {/* Menu Content */}
                                <div className="p-1 max-h-80 overflow-y-auto">
                                    {/* Profile Section */}
                                    <div className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Profil
                                    </div>
                                    {profileMenuItems.map((item) => (
                                        <motion.button
                                            key={item.title}
                                            whileHover={{ x: 4 }}
                                            onClick={() => handleNavigate(item.path)}
                                            className={`w-full text-left flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-150 ${item.isDestructive
                                                ? 'text-red-600 hover:bg-red-50'
                                                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                                                }`}
                                        >
                                            <item.icon className="w-4 h-4 shrink-0" />
                                            <span className="truncate">{item.title}</span>
                                        </motion.button>
                                    ))}

                                    <div className="h-px bg-gray-200 my-2 mx-2" />

                                    {/* Advanced Settings Section */}
                                    <div className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Paramètres Avancés
                                    </div>
                                    {settingsItems.map(item => (
                                        <motion.button
                                            key={item.id}
                                            whileHover={{ x: 4 }}
                                            onClick={() => handleSettingsItemClick(item.id)}
                                            className="w-full text-left flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-150"
                                        >
                                            <item.icon className={`w-4 h-4 shrink-0 ${item.color}`} />
                                            <span className="truncate">{item.label}</span>
                                        </motion.button>
                                    ))}

                                    <div className="h-px bg-gray-200 my-2 mx-2" />

                                    {/* Logout */}
                                    <motion.button
                                        whileHover={{ x: 4 }}
                                        onClick={handleLogout}
                                        className="w-full text-left flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-all duration-150"
                                    >
                                        <LogOut className="w-4 h-4 shrink-0" />
                                        <span>Se déconnecter</span>
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Collapse Button for collapsed state */}
                {isCollapsed && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onToggleCollapse}
                        className="w-full p-2 rounded-lg text-gray-500 hover:bg-white hover:text-gray-700 transition-colors duration-200 flex justify-center mx-1 border border-transparent hover:border-gray-200"
                        title="Développer la sidebar"
                    >
                        <ChevronsLeftRight size={18} />
                    </motion.button>
                )}
            </div>
        </motion.div>
    );
};

export default Sidebar;