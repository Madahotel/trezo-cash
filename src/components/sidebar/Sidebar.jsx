import React, { useState, useMemo, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
// import { supabase } from '../utils/supabase';
import { 
    LayoutDashboard, ListChecks, Table, AreaChart, Calendar, Layers, PieChart, AlertTriangle,
    ChevronDown, ChevronsLeftRight, Wallet, LogOut, User, Shield, CreditCard, FileText, 
    HelpCircle, Trash2, FolderCog, Hash, Banknote, LayoutTemplate, Lock, FolderKanban, 
    Users as UsersIcon, Archive
} from 'lucide-react';
import NavTooltip from './NavTooltip';
import { useActiveProjectData, useScheduleData } from '../../utils/selectors';
import { AnimatePresence, motion } from 'framer-motion';
import AmbassadorIcon from './AmbassadorIcon';
import TrezocashLogo from '../../components/logo/TrezocashLogo';

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

    const [activeTooltip, setActiveTooltip] = useState(null);
    const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
    const avatarMenuRef = useRef(null);

    // Close menu when clicking outside
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
        if (status === 'lifetime') return { text: 'Accès à Vie', color: 'text-purple-600' };
        if (status === 'active') return { text: 'Abonnement Pro', color: 'text-green-600' };
        if (status === 'trialing') return null;
        return { text: 'Essai terminé', color: 'text-red-600' };
    }, [profile]);

    // Enhanced navigation link classes with better hover states
    const navLinkClasses = ({ isActive }) => 
        `flex items-center w-full h-14 rounded-2xl transition-all duration-200 group ${
            isCollapsed ? 'justify-center' : 'px-4'
        } ${
            isActive
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white hover:shadow-md'
        }`;

    // Enhanced overdue badge classes
    const getOverdueBadgeClasses = (isActive = false) =>
        `flex items-center w-full h-14 rounded-2xl transition-all duration-200 group ${
            isCollapsed ? 'justify-center' : 'px-4'
        } ${
            isActive
                ? 'bg-red-600 text-white shadow-lg shadow-red-500/25'
                : 'text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:shadow-md'
        }`;

    return (
        <div className={`fixed top-0 left-0 h-full bg-gray-900 z-40 flex flex-col transition-all duration-300 border-r border-gray-800 ${
            isCollapsed ? 'w-20' : 'w-64'
        }`}>
            
            {/* Header Section */}
            <div className="flex items-center justify-between h-20 px-4 border-b border-gray-800">
                <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${
                    isCollapsed ? 'w-10' : 'w-full'
                }`}>
                    <NavLink 
                        to="/client/projets" 
                        className="flex items-center justify-center rounded-2xl text-white shrink-0 transition-transform hover:scale-105"
                    >
                        <TrezocashLogo className="w-10 h-10" />
                    </NavLink>
                    <AnimatePresence>
                        {!isCollapsed && (
                            <motion.span 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="text-xl font-bold text-white whitespace-nowrap"
                            >
                                Trezocash
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
                
                {!isCollapsed && (
                    <button 
                        onClick={onToggleCollapse}
                        className="p-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors duration-200"
                        title="Réduire la sidebar"
                    >
                        <ChevronsLeftRight size={20} />
                    </button>
                )}
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                {mainNavItems.map(item => {
                    const IconComponent = item.icon;
                    return (
                        <div 
                            key={item.id}
                            className="relative"
                            onMouseEnter={() => isCollapsed && setActiveTooltip(item.id)}
                            onMouseLeave={() => setActiveTooltip(null)}
                        >
                            <NavLink 
                                to={item.path} 
                                className={navLinkClasses}
                                title={isCollapsed ? item.label : ''}
                            >
                                <IconComponent 
                                    size={24} 
                                    className="transition-transform group-hover:scale-110" 
                                />
                                {!isCollapsed && (
                                    <motion.span 
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="ml-4 font-medium"
                                    >
                                        {item.label}
                                    </motion.span>
                                )}
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
            <div className="px-3 py-4 border-t border-gray-800 space-y-3">
                {/* Overdue Transactions Alert */}
                {overdueCount > 0 && (
                    <div 
                        className="relative"
                        onMouseEnter={() => isCollapsed && setActiveTooltip('enRetard')}
                        onMouseLeave={() => setActiveTooltip(null)}
                    >
                        <NavLink 
                            to="/client/en-retard" 
                            className={({ isActive }) => getOverdueBadgeClasses(isActive)}
                            title={isCollapsed ? 'Échéances en retard' : ''}
                        >
                            <div className="relative">
                                <AlertTriangle size={24} />
                                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white text-xs font-bold border-2 border-gray-900">
                                    {overdueCount}
                                </span>
                            </div>
                            {!isCollapsed && (
                                <span className="ml-4 font-medium">En retard</span>
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
                <div className="relative" ref={avatarMenuRef}>
                    <button 
                        onClick={() => setIsAvatarMenuOpen(!isAvatarMenuOpen)}
                        className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all duration-200 hover:bg-gray-800 group ${
                            isCollapsed ? 'justify-center' : ''
                        } ${isAvatarMenuOpen ? 'bg-gray-800' : ''}`}
                    >
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg group-hover:shadow-indigo-500/25 transition-shadow">
                                {getInitials(profile?.fullName)}
                            </div>
                            {subscriptionDetails && (
                                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-900 ${subscriptionDetails.color.replace('text-', 'bg-')}`} />
                            )}
                        </div>
                        
                        {!isCollapsed && (
                            <div className="text-left overflow-hidden flex-grow min-w-0">
                                <p className="text-sm font-semibold text-white truncate">
                                    {profile?.fullName}
                                </p>
                                <p className="text-xs text-gray-400 truncate">
                                    {session?.user?.email}
                                </p>
                            </div>
                        )}
                        
                        {!isCollapsed && (
                            <ChevronDown 
                                size={16} 
                                className={`text-gray-400 transition-transform duration-200 ${
                                    isAvatarMenuOpen ? 'rotate-180' : ''
                                }`} 
                            />
                        )}
                    </button>

                    {/* Profile Dropdown Menu */}
                    <AnimatePresence>
                        {isAvatarMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                transition={{ duration: 0.15 }}
                                className={`absolute left-0 mb-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-50 ${
                                    isCollapsed ? 'bottom-full' : 'bottom-full'
                                }`}
                            >
                                {/* User Info Header */}
                                <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white rounded-t-xl">
                                    <p className="text-sm font-semibold text-gray-800 truncate">
                                        {profile?.fullName || 'Utilisateur'}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate mt-1">
                                        {session?.user?.email}
                                    </p>
                                    {subscriptionDetails && (
                                        <p className={`text-xs font-semibold ${subscriptionDetails.color} mt-2`}>
                                            {subscriptionDetails.text}
                                        </p>
                                    )}
                                </div>

                                {/* Menu Content */}
                                <div className="p-1 max-h-80 overflow-y-auto custom-scrollbar">
                                    {/* Profile Section */}
                                    <div className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                        Profil
                                    </div>
                                    {profileMenuItems.map((item) => (
                                        <button 
                                            key={item.title}
                                            onClick={() => handleNavigate(item.path)}
                                            className={`w-full text-left flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors duration-150 ${
                                                item.isDestructive 
                                                ? 'text-red-600 hover:bg-red-50' 
                                                : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            <item.icon className="w-4 h-4 shrink-0" />
                                            <span className="truncate">{item.title}</span>
                                        </button>
                                    ))}

                                    <div className="h-px bg-gray-200 my-2 mx-2" />

                                    {/* Advanced Settings Section */}
                                    <div className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                        Paramètres Avancés
                                    </div>
                                    {settingsItems.map(item => (
                                        <button 
                                            key={item.id} 
                                            onClick={() => handleSettingsItemClick(item.id)}
                                            className="w-full text-left flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                                        >
                                            <item.icon className={`w-4 h-4 shrink-0 ${item.color}`} />
                                            <span className="truncate">{item.label}</span>
                                        </button>
                                    ))}

                                    <div className="h-px bg-gray-200 my-2 mx-2" />

                                    {/* Logout */}
                                    <button 
                                        onClick={handleLogout}
                                        className="w-full text-left flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors duration-150"
                                    >
                                        <LogOut className="w-4 h-4 shrink-0" />
                                        <span>Se déconnecter</span>
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Collapse Button for collapsed state */}
                {isCollapsed && (
                    <button 
                        onClick={onToggleCollapse}
                        className="w-full p-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors duration-200 flex justify-center"
                        title="Développer la sidebar"
                    >
                        <ChevronsLeftRight size={20} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default Sidebar;