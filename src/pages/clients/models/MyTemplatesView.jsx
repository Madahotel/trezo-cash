import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../../../components/context/DataContext';
import { useUI } from '../../../components/context/UIContext';
import { LayoutTemplate, Plus, Edit, Trash2, RefreshCw, User, ArrowUp } from 'lucide-react';
import EmptyState from '../../../components/emptystate/EmptyState';
import SaveTemplateModal from '../../../components/modal/SaveTemplateModal';
import { apiService } from '../../../utils/ApiService';
import DynamicIcon from '../../../components/dynamicIcon/DynamicIcon';

const MyTemplatesView = () => {
    const { dataState, dataDispatch } = useData();
    const { uiDispatch } = useUI();
    const { templates, session } = dataState;
    const [isSaveTemplateModal, setIsSaveTemplateModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshCount, setRefreshCount] = useState(0);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [visibleActions, setVisibleActions] = useState({});
    const listRef = useRef(null);

    // Fonction pour normaliser les IDs (gère les strings et numbers)
    const normalizeId = (id) => {
        if (id === null || id === undefined) return null;
        return typeof id === 'string' ? parseInt(id) || id : id;
    };

    // Fonction pour charger les templates
    const loadTemplates = async () => {
        try {
            setIsLoading(true);
            uiDispatch({ type: 'SET_LOADING', payload: true });
            console.log('🔄 Début du chargement des templates...');

            const response = await apiService.get('/templates');
            console.log('📡 Réponse API templates:', response);

            if (response.status === 200) {
                const apiData = response.templates;

                // Extraire les données de la structure paginée
                const allTemplates = [
                    ...(apiData.officials?.template_official_items?.data || []),
                    ...(apiData.personals?.template_personal_items?.data || []),
                    ...(apiData.communities?.template_community_items?.data || []),
                ];

                console.log('📦 Templates extraits:', allTemplates);

                // Éliminer les doublons avec Map
                const templateMap = new Map();
                const duplicates = [];

                allTemplates.forEach((template) => {
                    if (templateMap.has(template.id)) {
                        duplicates.push(template.id);
                        console.log(`⚠️ Template dupliqué: ID ${template.id} - ${template.name}`);
                    } else {
                        templateMap.set(template.id, template);
                    }
                });

                const uniqueTemplates = Array.from(templateMap.values());

                console.log('✨ Templates uniques:', uniqueTemplates);
                if (duplicates.length > 0) {
                    console.log(`🗑️ Doublons ignorés: ${duplicates.join(", ")}`);
                }

                dataDispatch({
                    type: 'SET_TEMPLATES',
                    payload: uniqueTemplates,
                });

                uiDispatch({
                    type: 'ADD_TOAST',
                    payload: {
                        message: `${uniqueTemplates.length} modèles chargés`,
                        type: 'success',
                    },
                });
            } else if (response.status === 204) {
                console.log('ℹ️ Aucun template trouvé');
                dataDispatch({
                    type: 'SET_TEMPLATES',
                    payload: [],
                });
            }
        } catch (error) {
            console.error('❌ Erreur chargement templates:', error);
            uiDispatch({
                type: 'ADD_TOAST',
                payload: {
                    message: error.error || 'Erreur lors du chargement des templates',
                    type: 'error',
                },
            });
        } finally {
            setIsLoading(false);
            uiDispatch({ type: "SET_LOADING", payload: false });
        }
    };

    // Fonction pour supprimer un template
    const handleDeleteTemplate = async (templateId) => {
        try {
            uiDispatch({ type: 'SET_LOADING', payload: true });

            const response = await apiService.delete(`/templates/${templateId}`);

            if (response.status === 200) {
                // Recharger la liste après suppression
                await loadTemplates();

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
                    message: error.error || 'Erreur lors de la suppression',
                    type: 'error',
                },
            });
        } finally {
            uiDispatch({ type: "SET_LOADING", payload: false });
        }
    };

    // Filtrer les templates de l'utilisateur connecté
    const myTemplates = templates.filter(t => {
        if (!session || !session.user || !session.user.id) {
            console.log('❌ Session ou user manquant:', { session, userId: session?.user?.id });
            return false;
        }

        const sessionUserId = normalizeId(session.user.id);
        const templateUserId = normalizeId(t.user_subscriber_id);

        const isUserTemplate = sessionUserId === templateUserId;

        return isUserTemplate;
    });

    // Gestion du scroll
    const handleScroll = () => {
        if (listRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = listRef.current;
            setShowScrollTop(scrollTop > 100);

            // Mettre à jour les actions visibles en fonction de la position de scroll
            const newVisibleActions = {};
            myTemplates.forEach((template, index) => {
                const element = document.getElementById(`template-${template.id}`);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    newVisibleActions[template.id] = rect.top < window.innerHeight && rect.bottom > 0;
                }
            });
            setVisibleActions(newVisibleActions);
        }
    };

    const scrollToTop = () => {
        listRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Charger les templates au montage du composant
    useEffect(() => {
        loadTemplates();
    }, [refreshCount]);

    // Gestionnaire d'événements de scroll
    useEffect(() => {
        const listElement = listRef.current;
        if (listElement) {
            listElement.addEventListener('scroll', handleScroll);
            return () => listElement.removeEventListener('scroll', handleScroll);
        }
    }, [myTemplates]);

    const handleRefresh = () => {
        setRefreshCount(prev => prev + 1);
    };

    const handleCreateTemplate = () => {
        setEditingTemplate(null);
        setIsSaveTemplateModal(true);
    };

    const handleEditTemplate = (template) => {
        setEditingTemplate(template);
        setIsSaveTemplateModal(true);
    };

    const handleCloseModal = () => {
        setIsSaveTemplateModal(false);
        setEditingTemplate(null);
        handleRefresh();
    };

    if (isLoading) {
        return (
            <div className="flex flex-col justify-center items-center py-12 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="text-lg text-gray-600">Chargement des modèles...</span>
                <button
                    onClick={handleRefresh}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                    <RefreshCw size={16} />
                    Actualiser
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header fixe */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Mes Modèles</h1>
                            <p className="text-gray-600 mt-1 text-sm">
                                {myTemplates.length} modèle(s) personnel(s) sur {templates.length} au total
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleRefresh}
                                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                            >
                                <RefreshCw size={16} />
                                Actualiser
                            </button>
                            <button
                                onClick={handleCreateTemplate}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors text-sm"
                            >
                                <Plus size={16} />
                                Créer un modèle
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenu principal avec scroll */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div
                    ref={listRef}
                    className="bg-white rounded-lg shadow-sm border overflow-hidden max-h-[calc(100vh-200px)] overflow-y-auto"
                >
                    <div className="p-6 border-b border-gray-200 bg-white sticky top-0 z-5">
                        <h2 className="text-xl font-bold text-gray-800">Mes Modèles Personnels</h2>
                        <p className="text-gray-600 text-sm mt-1">
                            Gérer vos modèles personnalisés
                        </p>
                    </div>

                    {myTemplates.length > 0 ? (
                        <ul className="divide-y divide-gray-200">
                            {myTemplates.map((template, index) => (
                                <li
                                    key={template.id}
                                    id={`template-${template.id}`}
                                    className="group transition-all duration-200 hover:bg-blue-50"
                                >
                                    <div className="p-6 flex justify-between items-center h-20">
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            {/* Icône dynamique */}
                                            <div
                                                className="w-5 h-5 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                                                style={{
                                                    backgroundColor: `${template.color || '#3B82F6'}15`,
                                                    border: `2px solid ${template.color || '#3B82F6'}20`
                                                }}
                                            >
                                                <DynamicIcon
                                                    iconName={template.icon || 'Briefcase'}
                                                    color={template.color || '#3B82F6'}
                                                    size={20}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-medium text-gray-900 text-sm truncate">
                                                        {template.name}
                                                    </p>
                                                    <div className="flex gap-0.5 flex-shrink-0">
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${template.is_public
                                                                ? 'bg-green-100 text-green-700 border border-green-200'
                                                                : 'bg-gray-100 text-gray-700 border border-gray-200'
                                                            }`}>
                                                            {template.is_public ? '🌍 Public' : '🔒 Privé'}
                                                        </span>
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                                                            {template.template_type_id === 2 ? '👤 Perso' : '💼 Pro'}
                                                        </span>
                                                        {template.template_type_id === 1 && (
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                                                                ⭐ Officiel
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <p className="text-gray-600 text-xs leading-snug">
                                                    {template.description || 'Aucune description fournie'}
                                                </p>

                                                <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-500">
                                                    <span>Créé le: {new Date(template.created_at).toLocaleDateString()}</span>
                                                    {template.updated_at && (
                                                        <span>Modifié le: {new Date(template.updated_at).toLocaleDateString()}</span>
                                                    )}
                                                </div>
                                            </div>

                                        </div>

                                        {/* Boutons d'action - Toujours visibles mais avec animation */}
                                        <div className={`
                                            flex items-center gap-2 transition-all duration-300 ml-4
                                            ${visibleActions[template.id]
                                                ? 'opacity-100 translate-x-0'
                                                : 'opacity-70 translate-x-2'
                                            }
                                        `}>
                                            <button
                                                onClick={() => handleEditTemplate(template)}
                                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors group/btn"
                                                title="Modifier le modèle"
                                            >
                                                <Edit size={18} />
                                                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap">
                                                    Modifier
                                                </span>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTemplate(template.id)}
                                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors group/btn"
                                                title="Supprimer le modèle"
                                            >
                                                <Trash2 size={18} />
                                                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap">
                                                    Supprimer
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-12">
                            <EmptyState
                                icon={LayoutTemplate}
                                title="Aucun modèle personnel trouvé"
                                message={
                                    <div className="text-center">
                                        <p className="text-gray-600 mb-4">
                                            Vous n'avez pas encore créé de modèles personnels.
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Créez votre premier modèle pour commencer à organiser vos projets.
                                        </p>
                                    </div>
                                }
                                actionText="Créer mon premier modèle"
                                onActionClick={handleCreateTemplate}
                            />
                        </div>
                    )}
                </div>

                {/* Bouton scroll to top */}
                {showScrollTop && (
                    <button
                        onClick={scrollToTop}
                        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 z-20"
                    >
                        <ArrowUp size={20} />
                    </button>
                )}
            </div>

            {isSaveTemplateModal && (
                <SaveTemplateModal
                    isOpen={isSaveTemplateModal}
                    onClose={handleCloseModal}
                    editingTemplate={editingTemplate}
                />
            )}
        </div>
    );
};

export default MyTemplatesView;