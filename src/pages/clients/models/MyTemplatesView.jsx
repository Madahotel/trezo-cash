import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../../../components/context/DataContext';
import { useUI } from '../../../components/context/UIContext';
import { LayoutTemplate, Plus, Edit, Trash2, RefreshCw, User, ArrowUp, Crown, Users, Briefcase, Eye } from 'lucide-react';
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
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);
    const [refreshCount, setRefreshCount] = useState(0);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [visibleActions, setVisibleActions] = useState({});
    const listRef = useRef(null);

    const normalizeId = (id) => {
        if (id === null || id === undefined) return null;
        return typeof id === 'string' ? parseInt(id) || id : id;
    };

    const loadTemplates = async (isBackground = false) => {
        try {
            if (!isBackground) {
                setIsInitialLoading(true);
            } else {
                setIsBackgroundLoading(true);
            }
            
            const response = await apiService.get('/templates');
            
            if (response.status === 200) {
                const apiData = response.templates;

                const officialsData = apiData.officials?.template_official_items?.data || [];
                const personalsData = apiData.personals?.template_personal_items?.data || [];
                const communitiesData = apiData.communities?.template_community_items?.data || [];

                const allTemplates = [...officialsData, ...personalsData, ...communitiesData];

                const templateMap = new Map();

                allTemplates.forEach((template) => {
                    if (templateMap.has(template.id)) {
                        const existing = templateMap.get(template.id);
                        
                        if (template.template_type_id === 1) {
                            templateMap.set(template.id, template);
                        }
                        else if (template.template_type_id === 2 && existing.template_type_id !== 1) {
                            templateMap.set(template.id, template);
                        }
                    } else {
                        templateMap.set(template.id, template);
                    }
                });

                const uniqueTemplates = Array.from(templateMap.values());

                dataDispatch({
                    type: 'SET_TEMPLATES',
                    payload: uniqueTemplates,
                });

                if (!isBackground) {
                    uiDispatch({
                        type: 'ADD_TOAST',
                        payload: {
                            message: `${uniqueTemplates.length} modèles chargés`,
                            type: 'success',
                        },
                    });
                }
            } else if (response.status === 204) {
                dataDispatch({
                    type: 'SET_TEMPLATES',
                    payload: [],
                });
            }
        } catch (error) {
            console.error('Erreur chargement templates:', error);
            if (!isBackground) {
                uiDispatch({
                    type: 'ADD_TOAST',
                    payload: {
                        message: error.error || 'Erreur lors du chargement des templates',
                        type: 'error',
                    },
                });
            }
        } finally {
            if (!isBackground) {
                setIsInitialLoading(false);
            } else {
                setIsBackgroundLoading(false);
            }
        }
    };

    const handleDeleteTemplate = async (templateId) => {
        try {
            uiDispatch({ type: 'SET_LOADING', payload: true });

            const response = await apiService.delete(`/templates/${templateId}`);

            if (response.status === 200) {
                await loadTemplates(true);

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

    const getTemplateTypeInfo = (template) => {
        const typeId = template.template_type_id;

        switch (typeId) {
            case 1: 
                return {
                    label: 'Officiel',
                    icon: Crown,
                    color: 'purple',
                    bgColor: 'bg-purple-100',
                    textColor: 'text-purple-700',
                    borderColor: 'border-purple-200',
                    isEditable: false
                };
            case 2: 
                return {
                    label: 'Personnel',
                    icon: User,
                    color: 'blue',
                    bgColor: 'bg-blue-100',
                    textColor: 'text-blue-700',
                    borderColor: 'border-blue-200',
                    isEditable: true
                };
            case 3: 
                return {
                    label: 'Communauté',
                    icon: Users,
                    color: 'green',
                    bgColor: 'bg-green-100',
                    textColor: 'text-green-700',
                    borderColor: 'border-green-200',
                    isEditable: false
                };
            default:
                return {
                    label: 'Inconnu',
                    icon: Briefcase,
                    color: 'gray',
                    bgColor: 'bg-gray-100',
                    textColor: 'text-gray-700',
                    borderColor: 'border-gray-200',
                    isEditable: false
                };
        }
    };

    const canUserModifyTemplate = (template) => {
        const sessionUserId = normalizeId(session?.user?.id);
        const templateUserId = normalizeId(template.user_subscriber_id);
        const templateTypeId = template.template_type_id;
        
        return templateTypeId === 2 && sessionUserId === templateUserId;
    };

    const myTemplates = templates.filter(t => {
        if (!session || !session.user || !session.user.id) {
            return false;
        }

        const sessionUserId = normalizeId(session.user.id);
        const templateUserId = normalizeId(t.user_subscriber_id);
        const templateTypeId = t.template_type_id;

        return (templateTypeId === 2 && sessionUserId === templateUserId) ||
            (templateTypeId === 1);
    });

    const handleScroll = () => {
        if (listRef.current) {
            const { scrollTop } = listRef.current;
            setShowScrollTop(scrollTop > 100);

            const newVisibleActions = {};
            myTemplates.forEach((template) => {
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

    useEffect(() => {

        if (session?.user?.id) {
            loadTemplates();
        } else {
            console.log(' User ID non disponible');
            setIsInitialLoading(false);
        }
    }, [refreshCount, session?.user?.id]);
    
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
        const sessionUserId = normalizeId(session?.user?.id);
        const templateUserId = normalizeId(template.user_subscriber_id);
        const isPersonal = template.template_type_id === 2;

        if (sessionUserId === templateUserId && isPersonal) {
            setEditingTemplate(template);
            setIsSaveTemplateModal(true);
        } else {
            uiDispatch({
                type: 'ADD_TOAST',
                payload: {
                    message: 'Vous ne pouvez modifier que vos propres templates personnels',
                    type: 'warning',
                },
            });
        }
    };

    const handleViewTemplate = (template) => {
        uiDispatch({
            type: 'ADD_TOAST',
            payload: {
                message: `Visualisation du template "${template.name}"`,
                type: 'info',
            },
        });
    };

    const handleCloseModal = () => {
        setIsSaveTemplateModal(false);
        setEditingTemplate(null);
        loadTemplates(true);
    };

    if (isInitialLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-12 h-12 border-b-2 border-blue-600 rounded-full animate-spin"></div>
                <span className="text-lg text-gray-600">Chargement des modèles...</span>
                <div className="text-sm text-gray-500">
                    Vérification de votre session et chargement des templates
                </div>
                <button
                    onClick={handleRefresh}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                    <RefreshCw size={16} />
                    Actualiser
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
                <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Mes Modèles</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                {myTemplates.length} modèle(s) personnel(s) sur {templates.length} au total
                            </p>
                            <div className="mt-2 text-xs text-gray-500">
                                <p>ID utilisateur: {session?.user?.id || 'Non connecté'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {isBackgroundLoading && (
                                <div className="flex items-center gap-2 px-3 py-1 text-xs text-blue-600 rounded-full bg-blue-50">
                                    <div className="w-3 h-3 border-2 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                                    <span>Mise à jour...</span>
                                </div>
                            )}
                            <button
                                onClick={handleRefresh}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                <RefreshCw size={16} className={isBackgroundLoading ? 'animate-spin' : ''} />
                                Actualiser
                            </button>
                            <button
                                onClick={handleCreateTemplate}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                            >
                                <Plus size={16} />
                                Créer un modèle
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
                <div
                    ref={listRef}
                    className="bg-white rounded-lg shadow-sm border overflow-hidden max-h-[calc(100vh-220px)] overflow-y-auto"
                >
                    <div className="sticky top-0 p-6 bg-white border-b border-gray-200 z-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Mes Modèles Personnels</h2>
                                <p className="mt-1 text-sm text-gray-600">
                                    {myTemplates.length > 0
                                        ? 'Vos templates personnels'
                                        : 'Créez votre premier modèle personnel'}
                                </p>
                            </div>
                            {session?.user?.id && (
                                <div className="px-3 py-1 text-xs text-gray-600 bg-gray-100 rounded-full">
                                    ID: {session.user.id}
                                </div>
                            )}
                        </div>
                    </div>

                    {myTemplates.length > 0 ? (
                        <ul className="divide-y divide-gray-200">
                            {myTemplates.map((template) => {
                                const typeInfo = getTemplateTypeInfo(template);
                                const canModify = canUserModifyTemplate(template);

                                return (
                                    <li
                                        key={template.id}
                                        id={`template-${template.id}`}
                                        className="transition-all duration-200 group hover:bg-blue-50"
                                    >
                                        <div className="flex items-center justify-between h-20 p-6">
                                            <div className="flex items-center flex-1 min-w-0 gap-4">
                                                <div
                                                    className="flex items-center justify-center flex-shrink-0 w-5 h-5 transition-transform rounded-xl group-hover:scale-105"
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
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {template.name}
                                                        </p>
                                                        <div className="flex gap-0.5 flex-shrink-0">
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${template.is_public
                                                                ? 'bg-green-100 text-green-700 border border-green-200'
                                                                : 'bg-gray-100 text-gray-700 border border-gray-200'
                                                                }`}>
                                                                {template.is_public ? '🌍 Public' : '🔒 Privé'}
                                                            </span>
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${typeInfo.bgColor} ${typeInfo.textColor} border ${typeInfo.borderColor}`}>
                                                                {typeInfo.label}
                                                            </span>
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                                                                ID: {template.id}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <p className="text-xs leading-snug text-gray-600">
                                                        {template.description || 'Aucune description fournie'}
                                                    </p>

                                                    <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-500">
                                                        <span>Type: {template.template_type_name}</span>
                                                        <span>•</span>
                                                        <span>Créé par:  {template.user_last_name}</span>
                                                        {template.created_at && (
                                                            <>
                                                                <span>•</span>
                                                                <span>Créé le: {new Date(template.created_at).toLocaleDateString()}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {template.template_type_id === 1 ? (
                                                // Template officiel - aucun bouton d'action, seulement un badge informatif
                                                <div className="ml-4">
                                                    <div className="flex items-center gap-1 px-3 py-1 text-xs text-purple-600 rounded-full bg-purple-50">
                                                        <Crown size={12} />
                                                        <span>Modèle officiel</span>
                                                    </div>
                                                </div>
                                            ) : canModify ? (
                                                // Boutons Modifier/Supprimer pour les templates personnels de l'utilisateur
                                                <div className={`
                                                    flex items-center gap-2 transition-all duration-300 ml-4
                                                    ${visibleActions[template.id]
                                                        ? 'opacity-100 translate-x-0'
                                                        : 'opacity-70 translate-x-2'
                                                    }
                                                `}>
                                                    <button
                                                        onClick={() => handleEditTemplate(template)}
                                                        className="p-2 text-blue-600 transition-colors rounded-lg hover:text-blue-800 hover:bg-blue-100 group/btn"
                                                        title="Modifier le modèle"
                                                    >
                                                        <Edit size={18} />
                                                        <span className="absolute px-2 py-1 text-xs text-white transition-opacity transform -translate-x-1/2 bg-gray-800 rounded opacity-0 -top-8 left-1/2 group-hover/btn:opacity-100 whitespace-nowrap">
                                                            Modifier
                                                        </span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteTemplate(template.id)}
                                                        className="p-2 text-red-600 transition-colors rounded-lg hover:text-red-800 hover:bg-red-100 group/btn"
                                                        title="Supprimer le modèle"
                                                    >
                                                        <Trash2 size={18} />
                                                        <span className="absolute px-2 py-1 text-xs text-white transition-opacity transform -translate-x-1/2 bg-gray-800 rounded opacity-0 -top-8 left-1/2 group-hover/btn:opacity-100 whitespace-nowrap">
                                                            Supprimer
                                                        </span>
                                                    </button>
                                                </div>
                                            ) : (
                                                // Pour les autres templates non modifiables (communautaires ou personnels d'autres utilisateurs)
                                                <div className={`
                                                    flex items-center gap-2 transition-all duration-300 ml-4
                                                    ${visibleActions[template.id]
                                                        ? 'opacity-100 translate-x-0'
                                                        : 'opacity-70 translate-x-2'
                                                    }
                                                `}>
                                                    <button
                                                        onClick={() => handleViewTemplate(template)}
                                                        className="p-2 text-gray-600 transition-colors rounded-lg hover:text-gray-800 hover:bg-gray-100 group/btn"
                                                        title="Visualiser le modèle"
                                                    >
                                                        <Eye size={18} />
                                                        <span className="absolute px-2 py-1 text-xs text-white transition-opacity transform -translate-x-1/2 bg-gray-800 rounded opacity-0 -top-8 left-1/2 group-hover/btn:opacity-100 whitespace-nowrap">
                                                            Visualiser
                                                        </span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <div className="p-12">
                            <EmptyState
                                icon={LayoutTemplate}
                                title="Aucun modèle personnel trouvé"
                                message={
                                    <div className="text-center">
                                        <p className="mb-2 text-gray-600">
                                            Vous n'avez pas encore créé de modèles personnels.
                                        </p>
                                        <div className="space-y-1 text-xs text-gray-500">
                                            <p>ID utilisateur connecté: {session?.user?.id || 'Non connecté'}</p>
                                            <p>Templates disponibles total: {templates.length}</p>
                                            {templates.length > 0 && (
                                                <div className="p-2 mt-2 text-left rounded bg-gray-50">
                                                    <p className="mb-1 font-medium">Templates existants:</p>
                                                    {templates.map(t => (
                                                        <p key={t.id} className="text-xs">
                                                            • {t.name} (ID: {t.id}, Type: {t.template_type_name}, User: {t.user_subscriber_id})
                                                        </p>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <p className="mt-4 text-sm text-gray-500">
                                            Créez votre premier modèle personnel pour commencer.
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
                        className="fixed z-20 p-3 text-white transition-all duration-300 bg-blue-600 rounded-full shadow-lg bottom-6 right-6 hover:bg-blue-700"
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