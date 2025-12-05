import React, { useMemo, useEffect, useState } from 'react';
import { useData } from '../../components/context/DataContext';
import { useUI } from '../../components/context/UIContext';
import { useNavigate, useLocation } from 'react-router-dom';
import ProjectSwitcher from './ProjectSwitcher';
import ProjectCollaborators from '../../pages/clients/projets/ProjectCollaborators';
import {
  Share2,
  Menu,
  Palette,
  Check,
  Search,
  Home,
  Heart,
  User,
  Coins,
} from 'lucide-react';
import AmbassadorIcon from '../../components/sidebar/AmbassadorIcon';

import { useAuth } from '../context/AuthContext';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/Button';
import { useSettings } from '../../contexts/SettingsContext';

const HeaderCustomer = ({ setIsMobileMenuOpen }) => {
  const { uiState, uiDispatch } = useUI();
  const { activeProject } = uiState; 
  const activeProjectId = activeProject?.id || null; 
  const { dataState, fetchProjects } = useData();

  const { user, token } = useAuth();
  const { profile, projects, consolidatedViews } = dataState;
  const {
    theme,
    setTheme,
    currencies,
    selectedCurrency,
    setSelectedCurrency,
    getAllThemes,
  } = useSettings();

  const navigate = useNavigate();
  const location = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [themeActive, setThemeActive] = useState('');

  useEffect(() => {
    if (user?.id && token) {
      fetchProjects();
    }
  }, [user?.id, token, fetchProjects]);

  useEffect(() => {
    const selectedTheme = getAllThemes().find(
      (themeOption) => theme === themeOption.id
    );
    if (selectedTheme) {
      setThemeActive(selectedTheme.colors.primary);
    } else {
      setThemeActive('bg-blue-600');
    }
  }, [theme, getAllThemes]);

  const handleOpenMobileNav = () => {
    uiDispatch({ type: 'OPEN_NAV_DRAWER' });
  };

  const userProjects = useMemo(() => {
    if (!user?.id || !projects?.length) return [];

    return projects.filter((project) => {
      const isOwner = project.user_id === user.id;
      const isSubscriber = project.user_subscriber_id === user.id;
      const isCollaborator = project.collaborators?.some(
        (collab) => collab.user_id === user.id
      );

      return isOwner || isSubscriber || isCollaborator;
    });
  }, [projects, user?.id]);

  const getProjectIdInfo = (projectId) => {
    if (!projectId)
      return { string: '', isConsolidated: false, isCustomConsolidated: false };

    const idString = String(projectId);
    return {
      string: idString,
      isConsolidated: idString === 'consolidated',
      isCustomConsolidated: idString.startsWith('consolidated_view_'),
    };
  };

  const activeProjectOrView = useMemo(() => {
    if (!activeProject) return null;

    // Si activeProject a déjà un id, c'est un projet normal
    if (activeProject.id && typeof activeProject.id !== 'object') {
      return activeProject;
    }

    // Sinon, chercher dans userProjects
    return (
      userProjects?.find((p) => String(p.id) === String(activeProjectId)) ||
      null
    );
  }, [activeProject, activeProjectId, userProjects]);
  const pageTitle = useMemo(() => {
    if (location.pathname.startsWith('/client/projets')) {
      const name =
        profile?.fullName?.split(' ')[0] || user?.name || 'Utilisateur';
      return `Bonjour ${name},`;
    }
    if (!activeProjectOrView) return 'Sélectionnez un projet';

    const projectName = activeProjectOrView.name || 'Projet sans nom';
    let prefix = 'Tableau de bord';
    let projectTypeLabel = 'du projet';

    if (activeProjectOrView.type === 'consolidated') {
      if (location.pathname.startsWith('/client/budget'))
        prefix = 'Budget prévisionnel';
      else if (location.pathname.startsWith('/client/trezo'))
        prefix = 'Tableau de trésorerie';
      else if (location.pathname.startsWith('/client/flux'))
        prefix = 'Flux de trésorerie';
      else prefix = 'Tableau de bord';
      return `${prefix} de tous les projets`;
    }

    if (activeProjectOrView.type === 'custom_consolidated') {
      if (location.pathname.startsWith('/client/budget'))
        prefix = 'Budget prévisionnel';
      else if (location.pathname.startsWith('/client/trezo'))
        prefix = 'Tableau de trésorerie';
      else if (location.pathname.startsWith('/client/flux'))
        prefix = 'Flux de trésorerie';
      else prefix = 'Tableau de bord';
      return `${prefix} de la vue : "${projectName}"`;
    }

    if (activeProjectOrView.type === 'event')
      projectTypeLabel = "de l'événement";
    if (location.pathname.startsWith('/client/budget'))
      prefix = 'Budget prévisionnel';
    else if (location.pathname.startsWith('/client/trezo'))
      prefix = 'Tableau de trésorerie';
    else if (location.pathname.startsWith('/client/flux'))
      prefix = 'Flux de trésorerie';
    else if (location.pathname.startsWith('/client/echeancier'))
      prefix = 'Échéancier de trésorerie';
    else if (location.pathname.startsWith('/client/analyse'))
      prefix = 'Analyse trésorerie';
    else if (location.pathname.startsWith('/client/scenarios'))
      prefix = 'Scenarios trésorerie';
    else if (location.pathname.startsWith('/client/Collaborators'))
      prefix = 'Collaborators ';
    else if (location.pathname.startsWith('/client/comptes'))
      prefix = 'Comptes associé';
    
    return `${prefix} ${projectTypeLabel} : "${projectName}"`;
  }, [activeProjectOrView, location.pathname, profile, user]);

  // CORRECTION : Utiliser userProjects au lieu de projects
  const canShareProject = useMemo(() => {
    if (!activeProjectOrView || !user?.id) {
      return false;
    }

    // CORRECTION : Utiliser la fonction utilitaire pour vérifier le type de projet
    const projectIdInfo = getProjectIdInfo(activeProjectId);

    if (projectIdInfo.isConsolidated || projectIdInfo.isCustomConsolidated) {
      return false;
    }

    // Vérifier si l'utilisateur est propriétaire du projet
    const isOwner = activeProjectOrView.user_id === user.id;

    // Vérifier si l'utilisateur a les droits de partage (propriétaire ou admin)
    const userRole = activeProjectOrView.collaborators?.find(
      (collab) => collab.user_id === user.id
    )?.role;

    const canShareAsCollaborator = userRole === 'admin' || userRole === 'owner';

    return isOwner || canShareAsCollaborator;
  }, [activeProjectOrView, activeProjectId, user]);

  const handleShareClick = () => {
    navigate('/app/collaborateurs');
  };


  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      {/* --- VERSION DESKTOP --- */}
      <div className="items-center justify-between hidden w-full px-6 py-4 md:flex">
        <div className="flex items-center flex-1 min-w-0 gap-4">
          <div className="flex items-center flex-1 min-w-0 gap-2">
            <button
              onClick={handleOpenMobileNav}
              className="p-2 text-gray-600 transition-colors rounded-full hover:bg-gray-200 md:hidden"
            >
              <Menu size={20} />
            </button>
            <div className="w-full md:w-70">
              <ProjectSwitcher />
            </div>
          </div>

          <div className="flex-grow hidden text-center md:block">
            {pageTitle && (
              <h1 className="text-base font-semibold text-gray-800 truncate md:text-lg">
                {pageTitle}
              </h1>
            )}
          </div>

          <div className="flex items-center justify-end flex-1 min-w-0 gap-4">
            <ProjectCollaborators />
            {canShareProject && (
              <button
                onClick={handleShareClick}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 transition-all duration-200 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400"
                title="Partager et gérer les collaborateurs"
              >
                <Share2 size={16} />
                <span className="text-sm font-medium">Partager</span>
              </button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Thème"
                  className="text-purple-600"
                >
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
                          className="w-6 h-6 border-2 border-white rounded-full shadow-sm"
                          style={{
                            backgroundColor: themeOption.colors.primary,
                          }}
                        ></div>
                        <IconComponent
                          className="w-4 h-4"
                          style={{ color: themeOption.colors.primary }}
                        />
                        <div>
                          <div className="font-medium">{themeOption.name}</div>
                          <div className="text-xs text-gray-500">
                            {themeOption.category}
                          </div>
                        </div>
                      </div>
                      {theme === themeOption.id && (
                        <Check
                          className="w-4 h-4"
                          style={{ color: themeOption.colors.primary }}
                        />
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
            {/*Devise */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Devise"
                  className="text-purple-600"
                >
                  <Coins className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="flex items-center">
                  <Coins className="w-4 h-4 mr-2" />
                  Choisir votre devise
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {currencies.map((currency) => (
                  <DropdownMenuItem
                    key={currency.id}
                    onClick={() => setSelectedCurrency(currency.code)}
                    className="flex items-center justify-between p-3 cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-6 bg-gray-100 border rounded">
                        <span className="text-xs font-medium">
                          {currency.symbol}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{currency.name}</div>
                        <div className="text-xs text-gray-500">
                          {currency.code}
                        </div>
                      </div>
                    </div>
                    {selectedCurrency === currency.code && (
                      <Check className="w-4 h-4 text-purple-600" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              onClick={() => navigate('/client/parrainage')}
              className="p-2 text-purple-600 transition-colors rounded-full hover:bg-purple-100"
              title="Programme Ambassadeur"
            >
              <AmbassadorIcon size={20} />
            </button>
          </div>
        </div>
        <div className="px-4 pb-2 text-center md:hidden">
          {pageTitle && (
            <h1 className="text-sm font-semibold text-gray-800 truncate">
              {pageTitle}
            </h1>
          )}
        </div>
      </div>

      {/* --- VERSION MOBILE --- */}
      <div className="flex flex-col items-center justify-center w-full md:hidden">
        {/* Ligne supérieure : menu + logo + recherche */}
        <div className="flex items-center justify-between w-full px-4 py-2 border-b border-gray-200">
          <button
            className="p-2 rounded-md hover:bg-gray-100"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu size={22} />
          </button>

          <h1
            className="text-lg font-semibold text-gray-800 "
            style={{ color: themeActive }}
          >
            Trezo-cash
          </h1>

          <button
            className="p-2 rounded-md hover:bg-gray-100"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            <Search size={20} />
          </button>
        </div>

        {/* Ligne inférieure : icônes principales */}
        <div className="flex justify-around w-full py-3 bg-white border-t border-gray-100">
          <button
            onClick={() => navigate('/client/dashboard')}
            className="flex flex-col items-center text-gray-700 hover:text-purple-600"
          >
            <Home size={22} />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                title="Thème"
                className="text-purple-600"
              >
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
                        className="w-6 h-6 border-2 border-white rounded-full shadow-sm"
                        style={{ backgroundColor: themeOption.colors.primary }}
                      ></div>
                      <IconComponent
                        className="w-4 h-4"
                        style={{ color: themeOption.colors.primary }}
                      />
                      <div>
                        <div className="font-medium">{themeOption.name}</div>
                        <div className="text-xs text-gray-500">
                          {themeOption.category}
                        </div>
                      </div>
                    </div>
                    {theme === themeOption.id && (
                      <Check
                        className="w-4 h-4"
                        style={{ color: themeOption.colors.primary }}
                      />
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
            onClick={() => navigate('/client/comptes')}
            className="flex flex-col items-center text-gray-700 hover:text-purple-600"
          >
            <User size={22} />
          </button>
        </div>
      </div>

      {/* Barre de recherche (mobile) */}
      {isSearchOpen && (
        <div className="w-full px-4 py-2 border-b border-gray-200 bg-gray-50 animate-fadeIn">
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
              className="p-2 text-gray-500 rounded-md hover:text-gray-800"
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
