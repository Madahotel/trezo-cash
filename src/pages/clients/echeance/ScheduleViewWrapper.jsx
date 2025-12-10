import React, { useMemo } from 'react';
import { useUI } from '../../../components/context/UIContext';
import ScheduleView from './ScheduleView';
import ConsolidatedScheduleView from './ConsolidatedScheduleView';

const ScheduleViewWrapper = () => {
  const { uiState } = useUI();
  
  const activeProject = uiState.activeProject;

  const displayMode = useMemo(() => {
    if (!activeProject) return { type: 'none' };
    
    const activeId = String(activeProject.id || '');
    
    if (activeId === 'consolidated' || activeId.startsWith('consolidated_view_')) {
      let consolidationId = null;
      
      if (activeId.startsWith('consolidated_view_')) {
        consolidationId = activeId.replace('consolidated_view_', '');
      }
      
      return {
        type: 'consolidated',
        consolidationId: consolidationId,
        projectName: activeProject.name
      };
    }
    
    return {
      type: 'project',
      projectId: activeProject.id,
      projectName: activeProject.name
    };
  }, [activeProject]);

  if (!activeProject || displayMode.type === 'none') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="mb-4 text-gray-400">📅</div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            Aucun projet sélectionné
          </h3>
          <p className="text-gray-600">
            Sélectionnez un projet ou une consolidation depuis le sélecteur
          </p>
        </div>
      </div>
    );
  }

  if (displayMode.type === 'consolidated') {
    if (!displayMode.consolidationId) {
      return (
        <div className="min-h-screen p-6 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">
                Échéancier - {displayMode.projectName}
              </h1>
              <p className="mt-2 text-gray-600">
                Vue consolidée globale de tous les projets
              </p>
            </div>
            <div className="p-8 text-center border-2 border-gray-300 border-dashed rounded-lg">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-16 h-16 mb-4 bg-purple-100 rounded-full">
                  <span className="text-2xl font-bold text-purple-600">📊</span>
                </div>
                <h3 className="mb-2 text-lg font-medium text-gray-900">
                  Vue consolidée globale
                </h3>
                <p className="mb-4 text-gray-600">
                  Tous vos projets combinés
                </p>
                <div className="grid w-full max-w-md grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-green-50">
                    <div className="text-sm font-medium text-green-700">Revenus</div>
                    <div className="text-lg font-bold text-green-800">Tous projets</div>
                  </div>
                  <div className="p-3 rounded-lg bg-red-50">
                    <div className="text-sm font-medium text-red-700">Dépenses</div>
                    <div className="text-lg font-bold text-red-800">Tous projets</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return <ConsolidatedScheduleView consolidationId={displayMode.consolidationId} />;
  }

  return <ScheduleView />;
};

export default ScheduleViewWrapper;