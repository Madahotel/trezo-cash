import React, { useMemo, useEffect, useState } from 'react';
import { useData } from '../../components/context/DataContext';
import { useUI } from '../../components/context/UIContext';
import { useNavigate, useLocation } from 'react-router-dom';
import ProjectSwitcher from './ProjectSwitcher';
import ProjectCollaborators from '../../pages/clients/projets/ProjectCollaborators';
import { Share2, Menu, Palette, Check, Search, Home, Heart, User } from 'lucide-react';
import AmbassadorIcon from '../../components/sidebar/AmbassadorIcon';
import { useSettings } from '../context/SettingsContext';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/Button';

const HeaderCustomer = ({ setIsMobileMenuOpen }) => {
    const { dataState } = useData();
    const { uiState, uiDispatch } = useUI();
    const { profile, projects, consolidatedViews, session } = dataState;
    const {
        theme,
        setTheme,
        getAllThemes,
    } = useSettings();
    const { activeProjectId } = uiState;
    const navigate = useNavigate();
    const location = useLocation();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

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
    const handleOpenMobileNav = () => {
        uiDispatch({ type: 'OPEN_NAV_DRAWER' });
    };

    const activeProjectOrView = useMemo(() => {
        if (!activeProjectId) return null;
        if (activeProjectId === 'consolidated') {
            return { id: 'consolidated', name: 'Mes projets consolidé', type: 'consolidated' };
        }
        if (activeProjectId.startsWith('consolidated_view_')) {
            const viewId = activeProjectId.replace('consolidated_view_', '');
            const view = consolidatedViews.find(v => v.id === viewId);
            return view ? { ...view, type: 'custom_consolidated' } : null;
        }
        return projects.find(p => p.id === activeProjectId);
    }, [activeProjectId, projects, consolidatedViews]);

    const pageTitle = useMemo(() => {
        if (location.pathname.startsWith('/client/projets')) {
            const name = profile?.fullName?.split(' ')[0] || 'Utilisateur';
            return `Bonjour ${name},`;
        }
        if (!activeProjectOrView) return null;

        const projectName = activeProjectOrView.name;
        let prefix = "Tableau de bord";
        let projectTypeLabel = "du projet";

        if (activeProjectOrView.type === 'consolidated') {
            if (location.pathname.startsWith('/client/budget')) prefix = "Budget prévisionnel";
            else if (location.pathname.startsWith('/client/trezo')) prefix = "Tableau de trésorerie";
            else if (location.pathname.startsWith('/client/flux')) prefix = "Flux de trésorerie";
            else prefix = "Tableau de bord";
            return `${prefix} de tous les projets`;
        }

        if (activeProjectOrView.type === 'custom_consolidated') {
            if (location.pathname.startsWith('/client/budget')) prefix = "Budget prévisionnel";
            else if (location.pathname.startsWith('/client/trezo')) prefix = "Tableau de trésorerie";
            else if (location.pathname.startsWith('/client/flux')) prefix = "Flux de trésorerie";
            else prefix = "Tableau de bord";
            return `${prefix} de la vue : "${projectName}"`;
        }

        if (activeProjectOrView.type === 'event') projectTypeLabel = "de l'événement";
        if (location.pathname.startsWith('/client/budget')) prefix = "Budget prévisionnel";
        else if (location.pathname.startsWith('/client/trezo')) prefix = "Tableau de trésorerie";
        else if (location.pathname.startsWith('/client/flux')) prefix = "Flux de trésorerie";

        return `${prefix} ${projectTypeLabel} : "${projectName}"`;
    }, [activeProjectOrView, location.pathname, profile]);

    // CORRECTION : Gérer les valeurs undefined
    const canShareProject = useMemo(() => {
        if (!activeProjectOrView || 
            activeProjectId === 'consolidated' || 
            activeProjectId.startsWith('consolidated_view_') ||
            !session?.user?.id) {
            return false;
        }
        return activeProjectOrView.user_id === session.user.id;
    }, [activeProjectOrView, activeProjectId, session]);

    const handleShareClick = () => {
        navigate('/app/collaborateurs');
    };

    useEffect(() => {
        console.log('Header Debug:', activeProjectOrView);
    }, [activeProjectOrView]);

    return (
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
            {/* --- VERSION DESKTOP --- */}
            <div className="hidden md:flex items-center justify-between px-6 py-4 w-full">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <button onClick={handleOpenMobileNav} className="p-2 text-gray-600 hover:bg-gray-200 rounded-full transition-colors md:hidden">
                            <Menu size={20} />
                        </button>
                        <div className="w-full md:w-70">
                            <ProjectSwitcher />
                        </div>
                    </div>

                    <div className="hidden md:block flex-grow text-center">
                        {pageTitle && (
                            <h1 className="text-base md:text-lg font-semibold text-gray-800 truncate">
                                {pageTitle}
                            </h1>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-4 flex-1 min-w-0">
                        <ProjectCollaborators />
                        {canShareProject && (
                            <button
                                onClick={handleShareClick}
                                className="flex items-center gap-2 px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
                                title="Partager et gérer les collaborateurs"
                            >
                                <Share2 size={16} />
                                <span className="text-sm font-medium">Partager</span>
                            </button>
                        )}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" title="Thème" className="text-purple-600">
                                    <Palette className="w-20 h-20" size={20} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64">
                                <DropdownMenuLabel className="flex items-center">
                                    <Palette className="w-4 h-4 mr-2" />
                                    Choisir un thème
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {getAllThemes().map((themeOption) => {
                                    const IconComponent = themeOption.icons.primary;

                                    return (
                                        <DropdownMenuItem
                                            key={themeOption.id}
                                            onClick={() => setTheme(themeOption.id)}
                                            className="flex items-center justify-between p-3 cursor-pointer"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div
                                                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                                                    style={{ backgroundColor: themeOption.colors.primary }}
                                                ></div>
                                                <IconComponent className="w-4 h-4" style={{ color: themeOption.colors.primary }} />
                                                <div>
                                                    <div className="font-medium">{themeOption.name}</div>
                                                    <div className="text-xs text-gray-500">{themeOption.category}</div>
                                                </div>
                                            </div>
                                            {theme === themeOption.id && (
                                                <Check className="w-4 h-4" style={{ color: themeOption.colors.primary }} />
                                            )}
                                        </DropdownMenuItem>
                                    );
                                })}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <button
                            onClick={() => navigate('/client/parrainage')}
                            className="p-2 text-purple-600 hover:bg-purple-100 rounded-full transition-colors"
                            title="Programme Ambassadeur"
                        >
                            <AmbassadorIcon size={20} />
                        </button>
                    </div>
                </div>
                <div className="px-4 pb-2 md:hidden text-center">
                    {pageTitle && (
                        <h1 className="text-sm font-semibold text-gray-800 truncate">
                            {pageTitle}
                        </h1>
                    )}
                </div>

            </div>

            {/* --- VERSION MOBILE --- */}
            <div className="md:hidden flex flex-col items-center justify-center w-full">
                {/* Ligne supérieure : menu + logo + recherche */}
                <div className="flex items-center justify-between w-full px-4 py-2 border-b border-gray-200">
                    <button
                        className="p-2 rounded-md hover:bg-gray-100"
                        onClick={() => setIsMobileMenuOpen(true)}
                    >
                        <Menu size={22} />
                    </button>

                    <h1 className="text-lg font-semibold text-gray-800 " style={{ color: themeActive }}>Trezo-cash</h1>

                    <button
                        className="p-2 rounded-md hover:bg-gray-100"
                        onClick={() => setIsSearchOpen(!isSearchOpen)}
                    >
                        <Search size={20} />
                    </button>

                </div>

                {/* Ligne inférieure : icônes principales */}
                <div className="flex justify-around w-full py-3 border-t border-gray-100 bg-white">
                    <button
                        onClick={() => navigate("/client/dashboard")}
                        className="flex flex-col items-center text-gray-700 hover:text-purple-600"
                    >
                        <Home size={22} />
                    </button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" title="Thème" className="text-purple-600">
                                <Palette className="w-22 h-22" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64">
                            <DropdownMenuLabel className="flex items-center">
                                <Palette className="w-4 h-4 mr-2" />
                                Choisir un thème
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {getAllThemes().map((themeOption) => {
                                const IconComponent = themeOption.icons.primary;
                                return (
                                    <DropdownMenuItem
                                        key={themeOption.id}
                                        onClick={() => setTheme(themeOption.id)}
                                        className="flex items-center justify-between p-3 cursor-pointer"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div
                                                className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                                                style={{ backgroundColor: themeOption.colors.primary }}
                                            ></div>
                                            <IconComponent className="w-4 h-4" style={{ color: themeOption.colors.primary }} />
                                            <div>
                                                <div className="font-medium">{themeOption.name}</div>
                                                <div className="text-xs text-gray-500">{themeOption.category}</div>
                                            </div>
                                        </div>
                                        {theme === themeOption.id && (
                                            <Check className="w-4 h-4" style={{ color: themeOption.colors.primary }} />
                                        )}
                                    </DropdownMenuItem>
                                );
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <button
                        onClick={() => navigate('/client/parrainage')}
                        className="flex flex-col items-center text-gray-700 hover:text-purple-600"
                    >
                        <AmbassadorIcon size={22} />
                    </button>

                    <button
                        onClick={() => navigate("/client/comptes")}
                        className="flex flex-col items-center text-gray-700 hover:text-purple-600"
                    >
                        <User size={22} />
                    </button>
                </div>
            </div>
            {/* Barre de recherche (mobile) */}
{isSearchOpen && (
  <div className="w-full px-4 py-2 bg-gray-50 border-b border-gray-200 animate-fadeIn">
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Rechercher..."
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
      />
      <button
        onClick={() => setIsSearchOpen(false)}
        className="p-2 rounded-md text-gray-500 hover:text-gray-800"
      >
        ✕
      </button>
    </div>
  </div>
)}

        </header>
        
    );
};

export default HeaderCustomer;
