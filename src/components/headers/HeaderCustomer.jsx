import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useData } from '../../components/context/DataContext';
import { useUI } from '../../components/context/UIContext';
import { useNavigate, useLocation } from 'react-router-dom';
import ProjectSwitcher from './ProjectSwitcher';
import ProjectCollaborators from '../../pages/clients/projets/ProjectCollaborators';
import { Share2, Menu, Palette, Check } from 'lucide-react';
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
const HeaderCustomer = () => {
    const { dataState } = useData();
    const { uiState, uiDispatch } = useUI();
    const { profile, projects, consolidatedViews, session } = dataState;
    const { language, setLanguage, currency, setCurrency, languages, currencies, theme, setTheme, getAllThemes } = useSettings();
    const { activeProjectId } = uiState;
    const navigate = useNavigate();
    const location = useLocation();
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
        if (!activeProjectOrView) {
            return null;
        }

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
        if (activeProjectOrView.type === 'event') {
            projectTypeLabel = "de l'événement";
        }

        if (location.pathname.startsWith('/client/budget')) {
            prefix = "Budget prévisionnel";
        } else if (location.pathname.startsWith('/client/trezo')) {
            prefix = "Tableau de trésorerie";
        } else if (location.pathname.startsWith('/client/flux')) {
            prefix = "Flux de trésorerie";
        }

        return `${prefix} ${projectTypeLabel} : "${projectName}"`;
    }, [activeProjectOrView, location.pathname, profile]);

    const canShareProject = useMemo(() => {
        if (!activeProjectOrView || activeProjectId === 'consolidated' || activeProjectId.startsWith('consolidated_view_')) {
            return false;
        }
        return activeProjectOrView.user_id === session?.user?.id;
    }, [activeProjectOrView, activeProjectId, session]);

    const handleShareClick = () => {
        // CORRECTION : Utilisez la bonne route pour les collaborateurs
        // Essayez l'une de ces routes selon votre configuration :

        // Option 1 : Si vous avez une page dédiée aux collaborateurs
        navigate('/app/collaborateurs');

        // Option 2 : Si c'est dans les paramètres du projet
        // navigate('/app/parametres-projet?tab=collaborateurs');

        // Option 3 : Ouvrir un modal/drawer directement
        // uiDispatch({ type: 'OPEN_COLLABORATORS_MODAL' });

        // Option 4 : Pour debugger, affichez dans la console
        console.log('Share clicked - Active project:', activeProjectOrView);
        console.log('Current path:', location.pathname);
    };

    // Pour debugger, affichez les informations dans la console
    useEffect(() => {
        console.log('Header Debug:');
        console.log('- Active Project:', activeProjectOrView);
        console.log('- Can Share:', canShareProject);
        console.log('- Session User ID:', session?.user?.id);
        console.log('- Project User ID:', activeProjectOrView?.user_id);
    }, [activeProjectOrView, canShareProject, session]);

    return (
        <div className="sticky top-0 z-30 bg-gray-100 border-b border-gray-200">
            <div className="w-full px-4 md:px-6">
                <div className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <button onClick={handleOpenMobileNav} className="p-2 text-gray-600 hover:bg-gray-200 rounded-full transition-colors md:hidden">
                            <Menu size={20} />
                        </button>
                        <div className="w-full md:w-72">
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
                                    <Palette className="w-5 h-5" />
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
        </div>
    );
};

export default HeaderCustomer;