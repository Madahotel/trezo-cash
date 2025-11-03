import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useData } from '../../../components/context/DataContext';
import { useUI } from '../../../components/context/UIContext';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign } from 'lucide-react';
import { projectInitializationService } from '../../../services/ProjectInitializationService';
import { fetchTemplates } from '../../../services/fetchTemplates';

// Import des sous-composants
import OnboardingHeader from './OnboardingHeader';
import OnboardingNavigation from './OnboardingNavigation';
import ProjectTypeStep from './steps/ProjectTypeStep';
import ProjectDetailsStep from './steps/ProjectDetailsStep';
import TemplateSelectionStep from './steps/TemplateSelectionStep';
import StartOptionStep from './steps/StartOptionStep';
import FinishStep from './steps/FinishStep';

const OnboardingView = () => {
  const [templatesLoading, setTemplatesLoading] = useState(true);
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
    isDurationUndetermined: true, 
    templateId: 'blank',
    startOption: 'blank',
    projectTypeId: null,
    projectClass: 'treasury',
  });

  // Chargement des templates
  useEffect(() => {
    const loadTemplates = async () => {
      if (!userAndCommunityTemplates || userAndCommunityTemplates.length === 0) {
        await fetchTemplates({ dataDispatch, uiDispatch });
      } else {
        setTemplatesLoading(false);
      }
    };
    loadTemplates();
  }, [userAndCommunityTemplates, dataDispatch, uiDispatch]);

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

  const handleNext = () => {
    if (step === 1 && !data.projectName.trim()) {
      uiDispatch({ type: 'ADD_TOAST', payload: { message: "Le nom du projet est obligatoire.", type: 'error' } });
      return;
    }
    if (step === 2 && data.templateId === 'blank') {
      setData(prev => ({ ...prev, startOption: 'blank' }));
      setDirection(1);
      setStep(4);
      return;
    }
    if (step < steps.length - 1) {
      setDirection(1);
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step === 4 && data.templateId === 'blank') {
      setDirection(-1);
      setStep(2);
      return;
    }
    if (step > 0) {
      setDirection(-1);
      setStep(step - 1);
    }
  };

  const handleCancel = () => uiDispatch({ type: 'CANCEL_ONBOARDING' });

  // Fonction pour gérer la sélection du type de projet
  const handleProjectTypeSelect = (projectType) => {
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

    const projectClass = getProjectClassFromType(projectType.name);
    
    setData(prev => ({ 
      ...prev, 
      projectTypeId: projectType.id,
      projectClass: projectClass
    }));
    
    handleNext();
  };

  const handleFinish = async () => {
    setIsLoading(true);
    try {
      const payload = {
        projectName: data.projectName,
        projectDescription: data.projectDescription,
        projectStartDate: data.projectStartDate,
        projectEndDate: data.projectEndDate,
        isDurationUndetermined: data.isDurationUndetermined,
        templateId: data.templateId,
        startOption: data.startOption,
        projectTypeId: data.projectTypeId,
        projectClass: data.projectClass,
        description: data.projectDescription
      };

      const result = await projectInitializationService.initializeProject(
        { dataDispatch, uiDispatch },
        payload,
        currentUser,
        tiers,
        userAndCommunityTemplates
      );

      setIsLoading(false);
      if (result?.success) navigate("/client/projets");
    } catch (error) {
      console.error("Erreur lors de la création du projet:", error);
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    const stepProps = {
      data,
      setData,
      currentUser,
      userAndCommunityTemplates,
      templatesLoading,
      projectTypes,
      loadingTypes,
      setProjectTypes,
      setLoadingTypes,
      handleNext,
      handleProjectTypeSelect
    };

    switch (currentStepInfo.id) {
      case 'type':
        return <ProjectTypeStep {...stepProps} />;
      case 'details':
        return <ProjectDetailsStep {...stepProps} />;
      case 'template':
        return <TemplateSelectionStep {...stepProps} />;
      case 'start':
        return <StartOptionStep {...stepProps} />;
      case 'finish':
        return <FinishStep isLoading={isLoading} handleFinish={handleFinish} />;
      default:
        return null;
    }
  };

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

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center p-4 antialiased">
      <OnboardingHeader />
      
      <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl flex flex-col" style={{ minHeight: '600px' }}>
        <div className="p-8 border-b">
          {/* Progress bar peut être ajoutée ici */}
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

        <OnboardingNavigation
          step={step}
          steps={steps}
          isLoading={isLoading}
          data={data}
          hasExistingProjects={hasExistingProjects}
          handleBack={handleBack}
          handleCancel={handleCancel}
          handleNext={handleNext}
        />
      </div>
    </div>
  );
};

export default OnboardingView;