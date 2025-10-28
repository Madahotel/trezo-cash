import { apiService } from '../utils/ApiService';

export const deleteTemplate = async (
  { dataDispatch, uiDispatch },
  templateId
) => {
  try {
    uiDispatch({ type: 'SET_LOADING', payload: true });

    const response = await apiService.delete(`/templates/${templateId}`);

    if (response.data.status === 200) {
      // Rafraîchir la liste
      await fetchTemplates({ dataDispatch, uiDispatch });

      uiDispatch({
        type: 'ADD_TOAST',
        payload: {
          message: 'Template supprimé avec succès!',
          type: 'success',
        },
      });
    }
  } catch (error) {
    console.error('Erreur suppression template:', error);
    uiDispatch({
      type: 'ADD_TOAST',
      payload: {
        message:
          error.response?.data?.message || 'Erreur lors de la suppression',
        type: 'error',
      },
    });
  } finally {
    uiDispatch({ type: "SET_LOADING", payload: false });
  }
};