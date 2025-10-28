import React from 'react';
import { useApiActions } from '../hooks/useApiActions';

const ProjectForm = () => {
  const { initializeProject } = useApiActions();

  const handleSubmit = async (formData) => {
    try {
      const result = await initializeProject(formData, currentUser);
      if (result.success) {
        // Redirection ou mise à jour de l'état
      }
    } catch (error) {
      // Gestion d'erreur déjà faite dans le hook
    }
  };

//   return (
//     // JSX du formulaire
//   );
};