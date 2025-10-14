import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useData } from '../../../components/context/DataContext';
import { useUI } from '../../../components/context/UIContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Sparkles, Loader, Search, Star, Users, LayoutTemplate, FilePlus, DollarSign, Briefcase, Home, PartyPopper } from 'lucide-react';
import { initializeProject } from '../../../components/context/actions';
import { templates as officialTemplates } from '../../../utils/templates';
import TemplateIcon from '../template/TemplateIcon';
import axios from '../../../components/config/Axios';


// Icônes mapping pour les types de projet
const projectTypeIcons = {
  'Business': Briefcase,
  'Événement': PartyPopper,
  'Ménages': Home,
  'Professionnel': Briefcase,
  'Evènement': PartyPopper,
  'Ménage': Home,
  'default': Briefcase
};

// Couleurs pour les types de projet
const projectTypeColors = {
  'Business': 'blue',
  'Événement': 'pink', 
  'Ménages': 'green',
  'Professionnel': 'blue',
  'Evènement': 'pink',
  'Ménage': 'green',
  'default': 'gray'
};

const OnboardingView = () => {
  const navigate = useNavigate();
  const { dataState, dataDispatch } = useData();
  const { uiDispatch } = useUI();
  const { projects, session, tiers, templates: userAndCommunityTemplates } = dataState;

  const currentUser = session?.user;

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [projectTypes, setProjectTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  
  const [data, setData] = useState({
    projectName: '',
    projectDescription: '',
    projectStartDate: new Date().toISOString().split('T')[0],
    projectEndDate: '',
    isEndDateIndefinite: true,
    templateId: 'blank',
    startOption: 'blank',
    projectTypeId: null, // Maintenant on utilise l'ID du type
    projectClass: 'treasury',
  });
  
  const [activeTab, setActiveTab] = useState('official');
  const [searchTerm, setSearchTerm] = useState('');

  // Récupérer les types de projet au chargement du composant
  useEffect(() => {
    const fetchProjectTypes = async () => {
      try {
        setLoadingTypes(true);
        const response = await axios.get('/projects_type'); // Assurez-vous que cette route existe
        console.log('📋 Types de projet récupérés:', response.data);
        setProjectTypes(response.data);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des types de projet:', error);
        // Types par défaut en cas d'erreur
        setProjectTypes([
          {
            id: 1,
            name: "Business",
            description: "Pour piloter la trésorerie de votre activité"
          },
          {
            id: 2,
            name: "Événement", 
            description: "Pour un projet ponctuel (mariage, voyage...)."
          },
          {
            id: 3,
            name: "Ménages",
            description: "Pour gérer votre budget personnel ou familial."
          }
        ]);
      } finally {
        setLoadingTypes(false);
      }
    };

    fetchProjectTypes();
  }, []);

  // Mapping des classes de projet basé sur le type
  const getProjectClassFromType = (typeName) => {
    const classMapping = {
      'Business': 'treasury',
      'Professionnel': 'treasury',
      'Ménages': 'treasury', 
      'Ménage': 'treasury',
      'Événement': 'event',
      'Evènement': 'event'
    };
    return classMapping[typeName] || 'treasury';
  };

  // Fonction pour gérer la sélection d'un type de projet
  const handleProjectTypeSelect = (projectType) => {
    const projectClass = getProjectClassFromType(projectType.name);
    
    setData(prev => ({ 
      ...prev, 
      projectTypeId: projectType.id,
      projectClass: projectClass
    }));
    
    handleNext();
  };

  // Obtenir l'icône pour un type de projet
  const getProjectTypeIcon = (typeName) => {
    const IconComponent = projectTypeIcons[typeName] || projectTypeIcons.default;
    return IconComponent;
  };

  // Obtenir la couleur pour un type de projet
  const getProjectTypeColor = (typeName) => {
    return projectTypeColors[typeName] || projectTypeColors.default;
  };

  // Obtenir les classes CSS pour la couleur
  const getColorClasses = (color, isSelected = false) => {
    const colorMap = {
      blue: {
        border: isSelected ? 'border-blue-500' : 'hover:border-blue-500',
        bg: isSelected ? 'bg-blue-50' : 'hover:bg-blue-50',
        text: 'text-blue-600'
      },
      green: {
        border: isSelected ? 'border-green-500' : 'hover:border-green-500', 
        bg: isSelected ? 'bg-green-50' : 'hover:bg-green-50',
        text: 'text-green-600'
      },
      pink: {
        border: isSelected ? 'border-pink-500' : 'hover:border-pink-500',
        bg: isSelected ? 'bg-pink-50' : 'hover:bg-pink-50',
        text: 'text-pink-600'
      },
      gray: {
        border: isSelected ? 'border-gray-500' : 'hover:border-gray-500',
        bg: isSelected ? 'bg-gray-50' : 'hover:bg-gray-50',
        text: 'text-gray-600'
      }
    };
    
    return colorMap[color] || colorMap.gray;
  };

  // Le reste de votre code reste inchangé...
const allOfficialTemplates = useMemo(() => {
  const blankTemplate = {
    id: 'blank',
    name: 'Projet Vierge',
    description: 'Commencez avec une structure de base sans aucune donnée pré-remplie.',
    icon: 'FilePlus',
    color: 'gray',
    type: 'blank',
  };

  if (!userAndCommunityTemplates) return [blankTemplate];
  
  const templatesData = userAndCommunityTemplates.data || userAndCommunityTemplates;
  
  let officialTemplatesList = [];
  
  // Structure paginée
  if (templatesData.officials?.template_official_items?.data) {
    officialTemplatesList = templatesData.officials.template_official_items.data.map(template => ({
      ...template,
      type: 'official',
      structure: template.data?.structure || template.structure
    }));
  }
  
  return [blankTemplate, ...officialTemplatesList];
}, [userAndCommunityTemplates]);

  // Le reste des useMemo pour les templates est conservé

const communityTemplates = useMemo(() => {
  if (!userAndCommunityTemplates) return [];
  const templatesData = userAndCommunityTemplates.data || userAndCommunityTemplates;
  
  // Structure paginée
  if (templatesData.communities?.template_community_items?.data) {
    return templatesData.communities.template_community_items.data.map(template => ({
      ...template,
      structure: template.data?.structure || template.structure
    }));
  }
  
  // Structure simple
  return templatesData
    .filter(t => t.is_public === true || t.type === 'community')
    .map(template => ({
      ...template,
      structure: template.data?.structure || template.structure
    }));
}, [userAndCommunityTemplates]);

const myTemplates = useMemo(() => {
  if (!userAndCommunityTemplates) return [];
  
  // Adapter selon la structure de votre réponse API
  const templatesData = userAndCommunityTemplates.data || userAndCommunityTemplates;
  
  // Si c'est la structure paginée de votre API
  if (templatesData.personals?.template_personal_items?.data) {
    return templatesData.personals.template_personal_items.data.map(template => ({
      ...template,
      structure: template.data?.structure || template.structure
    }));
  }
  
  // Si c'est un tableau simple
  return templatesData
    .filter(t => t.user_id === currentUser?.id || t.user_subscriber_id === currentUser?.id)
    .map(template => ({
      ...template,
      structure: template.data?.structure || template.structure
    }));
}, [userAndCommunityTemplates, currentUser]);

  const filteredTemplates = useMemo(() => {
    let currentList = [];
    if (activeTab === 'official') currentList = allOfficialTemplates;
    else if (activeTab === 'community') currentList = communityTemplates;
    else currentList = myTemplates;

    if (!searchTerm) return currentList;
    return currentList.filter(t =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [activeTab, searchTerm, allOfficialTemplates, communityTemplates, myTemplates]);

  const steps = [
    { id: 'type', title: 'Type de projet' },
    { id: 'details', title: 'Détails de votre projet' },
    { id: 'template', title: 'Choisissez un modèle' },
    { id: 'start', title: 'Comment voulez-vous commencer ?' },
    { id: 'finish', title: 'Finalisation' },
  ];
  const currentStepInfo = steps[step];

  const hasExistingProjects = useMemo(() => {
    if (!projects) return false;
    return projects.filter(p => !p.isArchived).length > 0;
  }, [projects]);


  const variants = {
    enter: (direction) => ({ x: direction > 0 ? 100 : -100, opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (direction) => ({ zIndex: 0, x: direction < 0 ? 100 : -100, opacity: 0 }),
  };

  // Logique de navigation ajustée pour le nouveau nombre d'étapes et la nouvelle logique
  const handleNext = () => {
    if (step === 1 && !data.projectName.trim()) {
      uiDispatch({ type: 'ADD_TOAST', payload: { message: "Le nom du projet est obligatoire.", type: 'error' } });
      return;
    }

    // Changement : le template est à l'étape 2 (index 2)
    if (step === 2 && data.templateId === 'blank') {
      setData(prev => ({ ...prev, startOption: 'blank' }));
      setDirection(1);
      setStep(4); // Skip to 'finish' step (index 4)
      return;
    }

    if (step < steps.length - 1) {
      setDirection(1);
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    // Changement : le template est à l'étape 2 (index 2), finish à 4
    if (step === 4 && data.templateId === 'blank') {
      setDirection(-1);
      setStep(2); // Go back to template selection (index 2)
      return;
    }
    if (step > 0) {
      setDirection(-1);
      setStep(step - 1);
    }
  };

  const handleCancel = () => uiDispatch({ type: 'CANCEL_ONBOARDING' });

const handleFinish = async () => {
  setIsLoading(true);
  try {
    const result = await initializeProject(
      { dataDispatch, uiDispatch },
      data,
      currentUser,
      tiers,
      userAndCommunityTemplates 
    );
    
    // CORRECTION : S'assurer que le loading s'arrête même en cas de succès
    setIsLoading(false);
    
    // CORRECTION : Navigation optionnelle - vérifier si nécessaire
    if (result?.success) {
      console.log('✅ Navigation vers le dashboard...');
       navigate("/client/dashboard"); // Décommentez si nécessaire
    }
    
  } catch (error) {
    console.error("Erreur lors de la création du projet:", error);
    
    // CORRECTION : IMPORTANT - Réinitialiser l'état de loading en cas d'erreur
    setIsLoading(false);
    
    // Optionnel : permettre à l'utilisateur de réessayer
    uiDispatch({
      type: 'ADD_TOAST', 
      payload: { 
        message: `Erreur lors de la création: ${error.message}`, 
        type: 'error' 
      }
    });
  }
};

  // ✅ Early return pour session après tous les hooks
  if (!session || !currentUser) {
    return (
      <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-700 text-white rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Erreur de session</h1>
          <p className="text-gray-600 mb-6">Vous devez être connecté pour créer un projet.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Recharger la page
          </button>
        </div>
      </div>
    );
  }

  // Render dynamique des steps
  const renderStepContent = () => {
    switch (currentStepInfo.id) {
      case 'type':
  return (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Quel type de projet souhaitez-vous créer ?</h2>
            
            {loadingTypes ? (
              <div className="flex justify-center items-center py-12">
                <Loader className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600">Chargement des types de projet...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {projectTypes.map((projectType) => {
                  const IconComponent = getProjectTypeIcon(projectType.name);
                  const color = getProjectTypeColor(projectType.name);
                  const colorClasses = getColorClasses(color, data.projectTypeId === projectType.id);
                  const isSelected = data.projectTypeId === projectType.id;
                  
                  return (
                    <button 
                      key={projectType.id}
                      onClick={() => handleProjectTypeSelect(projectType)}
                      className={`p-8 border-2 rounded-lg text-left transition-all ${colorClasses.border} ${colorClasses.bg} ${isSelected ? 'ring-2 ring-opacity-50' : ''}`}
                      style={{ 
                        borderColor: isSelected ? `var(--color-${color}-500)` : undefined,
                        backgroundColor: isSelected ? `var(--color-${color}-50)` : undefined 
                      }}
                    >
                      <IconComponent className={`w-8 h-8 ${colorClasses.text} mb-4`} />
                      <h3 className="font-semibold text-lg text-gray-800">{projectType.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{projectType.description}</p>
                    </button>
                  );
                })}
              </div>
            )}
            
            {projectTypes.length === 0 && !loadingTypes && (
              <div className="text-center py-8">
                <p className="text-gray-500">Aucun type de projet disponible</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Réessayer
                </button>
              </div>
            )}
          </div>
        );
      case 'details':
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{currentStepInfo.title}</h2>
            <div className="space-y-6 max-w-md mx-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 text-left mb-1">Nom du projet *</label>
                <input 
                  type="text" 
                  value={data.projectName} 
                  onChange={(e) => setData(prev => ({ ...prev, projectName: e.target.value }))} 
                  placeholder="Ex: Mon Budget 2025" 
                  className="w-full text-lg p-2 border-b-2 focus:border-blue-500 outline-none transition bg-transparent text-gray-700" 
                  autoFocus 
                  required 
                />
              </div>
              {/* Ajout du champ description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 text-left mb-1">Description (optionnel)</label>
                <textarea 
                  value={data.projectDescription} 
                  onChange={(e) => setData(prev => ({ ...prev, projectDescription: e.target.value }))} 
                  placeholder="Quel est l'objectif de ce projet ?" 
                  className="w-full text-base p-2 border-b-2 focus:border-blue-500 outline-none transition bg-transparent text-gray-700" 
                  rows="2"
                ></textarea>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-left mb-1">Date de début</label>
                  <input 
                    type="date" 
                    value={data.projectStartDate} 
                    onChange={(e) => setData(prev => ({ ...prev, projectStartDate: e.target.value }))} 
                    className="w-full text-lg p-2 border-b-2 focus:border-blue-500 outline-none transition bg-transparent text-gray-700" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-left mb-1">Date de fin</label>
                  <input 
                    type="date" 
                    value={data.projectEndDate} 
                    onChange={(e) => setData(prev => ({ ...prev, projectEndDate: e.target.value }))} 
                    className="w-full text-lg p-2 border-b-2 focus:border-blue-500 outline-none transition bg-transparent disabled:bg-gray-100 text-gray-700" 
                    disabled={data.isEndDateIndefinite} 
                    min={data.projectStartDate} 
                  />
                </div>
              </div>
              <div className="flex items-center justify-end">
                <input 
                  type="checkbox" 
                  id="indefinite-date" 
                  checked={data.isEndDateIndefinite} 
                  onChange={(e) => setData(prev => ({ 
                    ...prev, 
                    isEndDateIndefinite: e.target.checked, 
                    projectEndDate: e.target.checked ? '' : prev.projectEndDate 
                  }))} 
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
                />
                <label htmlFor="indefinite-date" className="ml-2 block text-sm text-gray-900">
                  Durée indéterminée
                </label>
              </div>
            </div>
          </div>
        );
      case 'template':
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{currentStepInfo.title}</h2>
            <p className="text-gray-600 mb-6">Commencez avec un projet vierge ou choisissez un modèle pour démarrer plus rapidement.</p>

            <div className="flex justify-center border-b mb-6">
              <button 
                onClick={() => setActiveTab('official')} 
                className={`px-4 py-2 text-sm font-semibold flex items-center gap-2 ${activeTab === 'official' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
              >
                <Star className="w-4 h-4"/>Modèles Officiels
              </button>
              <button 
                onClick={() => setActiveTab('community')} 
                className={`px-4 py-2 text-sm font-semibold flex items-center gap-2 ${activeTab === 'community' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
              >
                <Users className="w-4 h-4"/>Communauté
              </button>
              <button 
                onClick={() => setActiveTab('my-templates')} 
                className={`px-4 py-2 text-sm font-semibold flex items-center gap-2 ${activeTab === 'my-templates' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
              >
                <LayoutTemplate className="w-4 h-4"/>Mes Modèles
              </button>
            </div>

            <div className="relative max-w-md mx-auto mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Rechercher un modèle..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full pl-10 pr-4 py-2 border rounded-full text-gray-700" 
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 max-h-[300px] overflow-y-auto p-2">
              {filteredTemplates.length > 0 ? (
                filteredTemplates.map(template => {
                  const isSelected = data.templateId === template.id;
                  return (
                    <button 
                      key={template.id} 
                      onClick={() => setData(prev => ({...prev, templateId: template.id}))} 
                      className={`p-4 border-2 rounded-lg text-left transition-all ${isSelected ? 'border-blue-500 bg-blue-50' : 'hover:border-blue-400'}`}
                    >
                      <TemplateIcon icon={template.icon} color={template.color} className="w-7 h-7 mb-2" />
                      <h4 className="font-semibold text-gray-800">{template.name}</h4>
                      <p className="text-xs text-gray-500">{template.description}</p>
                      <div className="mt-2 flex justify-between items-center text-xs text-gray-400">
                        <span>{template.type}</span>
                        <span>{template.user_id === currentUser.id ? 'Personnel' : 'Communauté'}</span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="col-span-3 text-center py-8 text-gray-500">
                  Aucun modèle trouvé
                </div>
              )}
            </div>
          </div>
        );
      case 'start':
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Comment voulez-vous commencer ?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <button 
                onClick={() => { setData(prev => ({...prev, startOption: 'populated'})); handleNext(); }} 
                className={`p-6 border rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-all text-left ${data.startOption === 'populated' ? 'border-blue-500 bg-blue-50' : ''}`}
              >
                <h3 className="font-semibold text-lg">Avec des données d'exemple</h3>
                <p className="text-sm text-gray-600">Idéal pour démarrer vite avec des exemples concrets que vous pourrez modifier.</p>
              </button>
              <button 
                onClick={() => { setData(prev => ({...prev, startOption: 'blank'})); handleNext(); }} 
                className={`p-6 border rounded-lg hover:bg-gray-100 hover:border-gray-400 transition-all text-left ${data.startOption === 'blank' ? 'border-gray-400 bg-gray-100' : ''}`}
              >
                <h3 className="font-semibold text-lg">Avec une structure vierge</h3>
                <p className="text-sm text-gray-600">Parfait si vous préférez tout configurer vous-même de A à Z.</p>
              </button>
            </div>
          </div>
        );
      case 'finish':
        return (
          <div className="text-center">
            <Sparkles className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Tout est prêt !</h2>
            <p className="text-gray-600 mb-8">Votre projet est sur le point d'être créé. Prêt à prendre le contrôle ?</p>
            <button 
              onClick={handleFinish} 
              disabled={isLoading} 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-wait"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader className="animate-spin" /> Création en cours...
                </span>
              ) : "Lancer l'application"}
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center p-4 antialiased">
      <div className="flex flex-col items-center mb-6">
        {/* Icône et Nom de l'application (style conservé) */}
        <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-700 text-white rounded-full flex items-center justify-center">
          <DollarSign className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2 mt-4">
          <h1 
            className="text-5xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500"
            style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}
          >
            Trezocash
          </h1>
        </div>
      </div>
      <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl flex flex-col" style={{ minHeight: '600px' }}>
        <div className="p-8 border-b">
          {/* <OnboardingProgress current={step + 1} total={steps.length} /> */}
        </div>
        <div className="flex-grow flex flex-col items-center justify-center p-8">
          <div className="w-full">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div 
                key={step} 
                custom={direction} 
                variants={variants} 
                initial="enter" 
                animate="center" 
                exit="exit" 
                transition={{ type: "spring", stiffness: 300, damping: 30 }} 
                className="w-full"
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        <div className="p-6 bg-gray-50 border-t flex justify-between items-center">
          <button 
            onClick={handleBack} 
            disabled={step === 0 || isLoading} 
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" /> Précédent
          </button>
          {hasExistingProjects && (
            <button 
              onClick={handleCancel} 
              disabled={isLoading} 
              className="px-4 py-2 rounded-lg text-red-600 hover:bg-red-100 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
          )}
          {step < steps.length - 1 && (
            <button 
              onClick={handleNext} 
              disabled={isLoading || (step === 1 && !data.projectName.trim()) || (step === 2 && !data.templateId)} 
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold disabled:bg-gray-400"
            >
              Suivant <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingView;