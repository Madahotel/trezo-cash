import React, { useState, useEffect } from 'react';
import { useData } from '../../../components/context/DataContext';
import { useUI } from '../../../components/context/UIContext';
import { LayoutTemplate, Plus, Edit, Trash2, RefreshCw, User } from 'lucide-react';
import EmptyState from '../../../components/emptystate/EmptyState';
import { deleteTemplate, fetchTemplates } from '../../../components/context/actions';
import SaveTemplateModal from '../../../components/modal/SaveTemplateModal';

const MyTemplatesView = () => {
    const { dataState, dataDispatch } = useData();
    const { uiDispatch } = useUI();
    const { templates, session } = dataState;
    const [isSaveTemplateModal, setIsSaveTemplateModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshCount, setRefreshCount] = useState(0);

    // Fonction pour normaliser les IDs (gère les strings et numbers)
    const normalizeId = (id) => {
        if (id === null || id === undefined) return null;
        return typeof id === 'string' ? parseInt(id) || id : id;
    };

    // Filtrer les templates de l'utilisateur connecté
    const myTemplates = templates.filter(t => {
        // Vérifier si session et session.user existent
        if (!session || !session.user || !session.user.id) {
            console.log('❌ Session ou user manquant:', { session, userId: session?.user?.id });
            return false;
        }
        
        const sessionUserId = normalizeId(session.user.id);
        const templateUserId = normalizeId(t.user_subscriber_id);
        
        const isUserTemplate = sessionUserId === templateUserId;
        
        console.log(`🔍 Template ${t.id}:`, {
            templateUserId,
            sessionUserId,
            match: isUserTemplate,
            templateType: typeof t.user_subscriber_id,
            sessionType: typeof session.user.id
        });
        
        return isUserTemplate;
    });

    // Charger les templates au montage du composant
    useEffect(() => {
        const loadTemplates = async () => {
            setIsLoading(true);
            console.log('🔄 Début du chargement des templates...');
            await fetchTemplates({ dataDispatch, uiDispatch });
            setIsLoading(false);
            console.log('✅ Chargement des templates terminé');
        };
        
        loadTemplates();
    }, [dataDispatch, uiDispatch, refreshCount]);

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

    const handleDeleteTemplate = (templateId) => {
        uiDispatch({
            type: 'OPEN_CONFIRMATION_MODAL',
            payload: {
                title: 'Supprimer ce modèle ?',
                message: 'Cette action est irréversible.',
                onConfirm: () => deleteTemplate({dataDispatch, uiDispatch}, templateId),
            }
        });
    };

    const handleCloseModal = () => {
        setIsSaveTemplateModal(false);
        setEditingTemplate(null);
        // Recharger les templates après fermeture du modal
        handleRefresh();
    };

    // Debug: afficher les données pour le débogage
    useEffect(() => {
        console.log('🔍 Debug MyTemplatesView:');
        console.log('- Session:', session);
        console.log('- User ID:', session?.user?.id, '(type:', typeof session?.user?.id + ')');
        console.log('- Templates dans dataState:', templates.length);
        console.log('- My Templates filtrés:', myTemplates.length);
        
        // Afficher les IDs utilisateur des templates pour debug
        const uniqueUserIds = [...new Set(templates.map(t => t.user_subscriber_id))];
        console.log('- IDs utilisateur dans les templates:', uniqueUserIds);
        
        // Afficher chaque template pour debug
        templates.slice(0, 3).forEach((template, index) => {
            console.log(`📋 Template ${index + 1}:`, {
                id: template.id,
                name: template.name,
                user_subscriber_id: template.user_subscriber_id,
                type: typeof template.user_subscriber_id
            });
        });
    }, [templates, session, myTemplates]);

    if (isLoading) {
        return (
            <div className="flex flex-col justify-center items-center py-12 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="text-lg text-gray-600">Chargement des modèles...</span>
                <button 
                    onClick={handleRefresh}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                    <RefreshCw size={16} />
                    Actualiser
                </button>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mes Modèles</h1>
                    <p className="text-gray-600 mt-1">
                        {myTemplates.length} modèle(s) personnel(s) sur {templates.length} au total
                    </p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={handleRefresh}
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        <RefreshCw size={16} />
                        Actualiser
                    </button>
                    <button 
                        onClick={handleCreateTemplate} 
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Créer un modèle
                    </button>
                </div>
            </div>
            
            {/* Section Debug (à retirer en production)
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    <User size={16} />
                    Informations de Session
                </h3>
                <div className="text-sm text-blue-700 space-y-1">
                    <div><strong>User ID:</strong> {session?.user?.id} (type: {typeof session?.user?.id})</div>
                    <div><strong>Templates chargés:</strong> {templates.length}</div>
                    <div><strong>Mes templates:</strong> {myTemplates.length}</div>
                    <div><strong>IDs utilisateur dans les templates:</strong> {[...new Set(templates.map(t => t.user_subscriber_id))].join(', ')}</div>
                    <div><strong>Session:</strong> {session ? '✅ Connecté' : '❌ Non connecté'}</div>
                </div>
            </div> */}
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Mes Modèles Personnels</h2>
                
                {myTemplates.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                        {myTemplates.map(template => (
                            <li key={template.id} className="py-4 flex justify-between items-center group hover:bg-gray-50 px-2 rounded transition-colors">
                                <div className="flex items-center gap-3 flex-1">
                                    <div 
                                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                                      style={{ 
                                        backgroundColor: (template.color || '#3B82F6') + '20',
                                        border: `2px solid ${template.color || '#3B82F6'}20`
                                      }}
                                    >
                                        <LayoutTemplate 
                                          className="w-6 h-6" 
                                          style={{ color: template.color || '#3B82F6' }} 
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-800 truncate">{template.name}</p>
                                        <p className="text-sm text-gray-500 mt-1">{template.description || 'Aucune description'}</p>
                                        <div className="flex gap-2 mt-2 flex-wrap">
                                            <span className={`text-xs px-2 py-1 rounded-full ${
                                                template.is_public 
                                                  ? 'bg-green-100 text-green-800 border border-green-200' 
                                                  : 'bg-gray-100 text-gray-800 border border-gray-200'
                                            }`}>
                                                {template.is_public ? '🌍 Public' : '🔒 Privé'}
                                            </span>
                                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                                                {template.template_type_id === 2 ? '👤 Personnel' : '💼 Professionnel'}
                                            </span>
                                            {template.template_type_id === 1 && (
                                                <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                                                    ⭐ Officiel
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                      onClick={() => handleEditTemplate(template)} 
                                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                      title="Modifier le modèle"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteTemplate(template.id)} 
                                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                      title="Supprimer le modèle"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <EmptyState
                        icon={LayoutTemplate}
                        title="Aucun modèle personnel trouvé"
                        message={
                            <div className="text-center">
                                <p>Votre ID utilisateur ({session?.user?.id}) ne correspond à aucun template.</p>
                                <p className="mt-2">Les templates existants appartiennent aux utilisateurs: {[...new Set(templates.map(t => t.user_subscriber_id))].join(', ')}</p>
                            </div>
                        }
                        actionText="Créer mon premier modèle"
                        onActionClick={handleCreateTemplate}
                    />
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