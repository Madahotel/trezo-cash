import React, { useEffect } from 'react';
import { Loader } from 'lucide-react';
import axios from '../../../../components/config/Axios';
import ProjectTypeCard from './ProjectTypeCard';

const projectTypeIcons = {
  'Business': 'Briefcase',
  'Événement': 'PartyPopper', 
  'Ménages': 'Home',
  'Professionnel': 'Briefcase',
  'Evènement': 'PartyPopper',
  'Ménage': 'Home',
  'default': 'Briefcase'
};

const projectTypeColors = {
  'Business': 'blue',
  'Événement': 'pink',
  'Ménages': 'green',
  'Professionnel': 'blue',
  'Evènement': 'pink',
  'Ménage': 'green',
  'default': 'gray'
};

const ProjectTypeStep = ({ projectTypes, loadingTypes, setProjectTypes, setLoadingTypes, handleProjectTypeSelect }) => {
  useEffect(() => {
    const fetchProjectTypes = async () => {
      try {
        setLoadingTypes(true);
        const response = await axios.get('/project-types');
        setProjectTypes(response.data);
      } catch (error) {
        console.error('Erreur lors du chargement des types de projet:', error);
        setProjectTypes([
          { id: 1, name: "Business", description: "Pour piloter la trésorerie de votre activité" },
          { id: 2, name: "Événement", description: "Pour un projet ponctuel (mariage, voyage...)." },
          { id: 3, name: "Ménages", description: "Pour gérer votre budget personnel ou familial." }
        ]);
      } finally {
        setLoadingTypes(false);
      }
    };

    if (projectTypes.length === 0) {
      fetchProjectTypes();
    }
  }, []);

  if (loadingTypes) {
    return (
      <div className="text-center">
        <h2 className="mb-6 text-2xl font-bold text-gray-800">Quel type de projet souhaitez-vous créer ?</h2>
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-3 text-gray-600">Chargement des types de projet...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <h2 className="mb-6 text-2xl font-bold text-gray-800">Quel type de projet souhaitez-vous créer ? </h2>
      
      <div className="grid max-w-4xl grid-cols-1 gap-6 mx-auto md:grid-cols-3">
        {projectTypes.map((projectType) => (
          <ProjectTypeCard
            key={projectType.id}
            projectType={projectType}
            icon={projectTypeIcons[projectType.name] || projectTypeIcons.default}
            color={projectTypeColors[projectType.name] || projectTypeColors.default}
            onSelect={handleProjectTypeSelect}
          />
        ))}
      </div>
    </div>
  );
};

export default ProjectTypeStep;