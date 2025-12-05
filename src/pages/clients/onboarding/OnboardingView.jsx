import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from "react-router-dom";
import { useUI } from '../../../components/context/UIContext';
import { useAuth } from '../../../components/context/AuthContext';
import { useProjects } from '../../../hooks/useProjects';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign } from 'lucide-react';
import { projectInitializationService } from '../../../services/ProjectInitializationService';
import { fetchTemplates } from '../../../services/fetchTemplates';
import { fetchProjectTypes } from '../../../services/fetchProjectTypes';

import OnboardingHeader from './OnboardingHeader';
import OnboardingNavigation from './OnboardingNavigation';
import ProjectTypeStep from './steps/ProjectTypeStep';
import ProjectDetailsStep from './steps/ProjectDetailsStep';
import TemplateSelectionStep from './steps/TemplateSelectionStep';
import StartOptionStep from './steps/StartOptionStep';
import FinishStep from './steps/FinishStep';

const DEFAULT_PROJECT_TYPES = [
  { id: 1, name: 'Business', description: 'Projet professionnel ou commercial', icon: '💼' },
  { id: 2, name: 'Événement', description: 'Organisation d\'événements', icon: '🎪' },
  { id: 3, name: 'Ménage', description: 'Gestion du budget familial', icon: '🏠' },
];

const OnboardingView = () => {
  const navigate = useNavigate();
  const { uiDispatch } = useUI();
  const { user: currentUser } = useAuth();
  const { refetch: fetchProjects } = useProjects();

  const [templates, setTemplates] = useState([]);
  const [projectTypes, setProjectTypes] = useState(DEFAULT_PROJECT_TYPES);
  const [loadingStates, setLoadingStates] = useState({
    templates: false,
    projectTypes: false,
    submission: false
  });

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

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

  const steps = [
    { id: 'type', title: 'Type de projet' },
    { id: 'details', title: 'Détails de votre projet' },
    { id: 'template', title: 'Choisissez un modèle' },
    { id: 'start', title: 'Comment voulez-vous commencer ?' },
    { id: 'finish', title: 'Finalisation' },
  ];

  const currentStepInfo = steps[step];

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [templatesData, projectTypesData] = await Promise.allSettled([
          fetchTemplates(),
          fetchProjectTypes()
        ]);

        if (templatesData.status === 'fulfilled') {
          setTemplates(templatesData.value || []);
        } else {
          setTemplates([]);
        }

        if (projectTypesData.status === 'fulfilled' && projectTypesData.value?.length > 0) {
          setProjectTypes(projectTypesData.value);
        } else {
        }

      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoadingStates(prev => ({ ...prev, templates: false, projectTypes: false }));
      }
    };

    loadInitialData();
  }, []);

  const hasExistingProjects = false;

  const variants = {
    enter: (direction) => ({ x: direction > 0 ? 100 : -100, opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (direction) => ({ zIndex: 0, x: direction < 0 ? 100 : -100, opacity: 0 }),
  };

  const handleNext = useCallback(() => {
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
  }, [step, data.projectName, data.templateId, uiDispatch]);

  const handleBack = useCallback(() => {
    if (step === 4 && data.templateId === 'blank') {
      setDirection(-1);
      setStep(2);
      return;
    }
    if (step > 0) {
      setDirection(-1);
      setStep(step - 1);
    }
  }, [step, data.templateId]);

  const handleCancel = useCallback(() => {
    uiDispatch({ type: 'CANCEL_ONBOARDING' });
  }, [uiDispatch]);

  const handleProjectTypeSelect = useCallback((projectType) => {
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
  }, [handleNext]);

  const handleFinish = useCallback(async () => {
    setLoadingStates(prev => ({ ...prev, submission: true }));

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
      };

      const result = await projectInitializationService.initializeProject(
        payload,
        currentUser,
        [],
        templates
      );

      if (result?.success) {
        const projectCreatedEvent = new CustomEvent('projectCreated', {
          detail: {
            project: result.project,
            source: 'onboarding'
          }
        });
        window.dispatchEvent(projectCreatedEvent);

        const projectsUpdatedEvent = new CustomEvent('projectsUpdated', {
          detail: {
            newProject: result.project,
            action: 'created'
          }
        });
        window.dispatchEvent(projectsUpdatedEvent);

        const switcherEvent = new CustomEvent('projectCreatedInSwitcher', {
          detail: result.project
        });
        window.dispatchEvent(switcherEvent);

        fetchProjects().catch(error =>
          console.warn("Erreur rafraîchissement projets:", error)
        );

        if (result.project) {
          uiDispatch({
            type: 'SET_ACTIVE_PROJECT',
            payload: result.project
          });

          navigate(`/client/dashboard`);
        }
      } else {
        throw new Error(result?.message || "Échec de la création du projet");
      }
    } catch (error) {
      console.error("Erreur lors de la création du projet:", error);
      uiDispatch({
        type: 'ADD_TOAST',
        payload: {
          message: error.message,
          type: 'error',
        },
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, submission: false }));
    }
  }, [data, currentUser, templates, uiDispatch, navigate, fetchProjects]);

  const renderStepContent = useCallback(() => {
    const stepProps = {
      data,
      setData,
      currentUser,
      userAndCommunityTemplates: templates,
      templatesLoading: loadingStates.templates,
      projectTypes,
      loadingTypes: loadingStates.projectTypes,
      setProjectTypes,
      setLoadingTypes: (loading) => setLoadingStates(prev => ({ ...prev, projectTypes: loading })),
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
        return <FinishStep isLoading={loadingStates.submission} handleFinish={handleFinish} />;
      default:
        return null;
    }
  }, [currentStepInfo.id, data, currentUser, templates, loadingStates, projectTypes, handleNext, handleProjectTypeSelect, handleFinish]);

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
        <div className="p-8 text-center bg-white shadow-xl rounded-2xl">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 text-white rounded-full bg-gradient-to-r from-blue-400 to-blue-700">
            <DollarSign className="w-6 h-6" />
          </div>
          <h1 className="mb-4 text-2xl font-bold text-gray-800">Erreur de session</h1>
          <p className="mb-6 text-gray-600">Vous devez être connecté pour créer un projet.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Recharger la page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 antialiased bg-gray-100">
      <OnboardingHeader />

      <div className="flex flex-col w-full max-w-4xl mx-auto bg-white shadow-xl rounded-2xl" style={{ minHeight: '600px' }}>
        <div className="p-8 border-b">
        </div>

        <div className="flex flex-col items-center justify-center flex-grow p-8">
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
          isLoading={loadingStates.submission}
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

export default React.memo(OnboardingView);