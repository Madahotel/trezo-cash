import React, { useState, useMemo } from 'react';
import { X, Send, Trash2, Users, Mail } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
// import { inviteCollaborator, revokeCollaborator } from '../../components/context/actions';
import Avatar from '../avatar/Avatar';

const ShareProjectDrawer = ({ isOpen, onClose }) => {
    const { dataState, dataDispatch } = useData();
    const { uiState, uiDispatch } = useUI();
    const { session, projects, collaborators, allProfiles } = dataState;
    const { activeProjectId } = uiState;

    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('viewer');
    const [inviteScope, setInviteScope] = useState('all');
    const [isSendingInvite, setIsSendingInvite] = useState(false);

    const activeProject = useMemo(() => projects.find(p => p.id === activeProjectId), [projects, activeProjectId]);

    const projectCollaborators = useMemo(() => {
        if (!activeProjectId) return { active: [], pending: [] };
        const active = [];
        const pending = [];

        // Add owner
        const ownerProfile = allProfiles.find(p => p.id === activeProject?.user_id);
        if (ownerProfile) {
            active.push({ ...ownerProfile, role: 'Propriétaire', isOwner: true });
        }

        collaborators.forEach(c => {
            if (c.projectIds?.includes(activeProjectId)) {
                if (c.status === 'accepted') {
                    const profile = allProfiles.find(p => p.id === c.user_id);
                    if (profile) {
                        active.push({ ...profile, role: c.role === 'editor' ? 'Éditeur' : 'Lecteur', collabId: c.id });
                    }
                } else if (c.status === 'pending') {
                    pending.push({ ...c, collabId: c.id });
                }
            }
        });
        return { active, pending };
    }, [activeProjectId, collaborators, allProfiles, projects, activeProject]);

    const handleInvite = async (e) => {
        e.preventDefault();
        if (!inviteEmail.trim()) {
            uiDispatch({ type: 'ADD_TOAST', payload: { message: "Veuillez saisir un e-mail.", type: 'error' } });
            return;
        }

        setIsSendingInvite(true);
        try {
            await inviteCollaborator({ dataDispatch, uiDispatch }, {
                email: inviteEmail,
                role: inviteRole,
                permissionScope: inviteScope,
                projectIds: [activeProjectId],
                ownerId: session.user.id
            });
            setInviteEmail('');
        } catch (error) {
            console.error('Error inviting collaborator:', error);
        } finally {
            setIsSendingInvite(false);
        }
    };

    const handleRevoke = (collabId, name) => {
        uiDispatch({
            type: 'OPEN_CONFIRMATION_MODAL',
            payload: {
                title: `Révoquer l'accès de ${name} ?`,
                message: 'Cette personne perdra l\'accès à ce projet. Cette action est irréversible.',
                onConfirm: () => revokeCollaborator({ dataDispatch, uiDispatch }, collabId),
            }
        });
    };

    const handleResend = async (invite) => {
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Renvoyer l'invitation à ${invite.email}...`, type: 'info' } });
        
        try {
            // Simulation d'envoi d'email local
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Dans une vraie application, vous pourriez utiliser un service d'email
            // ou une API dédiée pour l'envoi d'invitations
            console.log(`Invitation renvoyée à: ${invite.email}`);
            
            uiDispatch({ type: 'ADD_TOAST', payload: { message: `Invitation renvoyée à ${invite.email}.`, type: 'success' } });
        } catch (error) {
            console.error('Error resending invite:', error);
            uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur lors du renvoi: ${error.message}`, type: 'error' } });
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black z-40 transition-opacity bg-opacity-60" onClick={onClose}></div>
            <div className="fixed top-0 right-0 bottom-0 w-full max-w-lg bg-gray-50 shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-start justify-between p-6 border-b bg-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Partager "{activeProject?.name}"</h2>
                                <p className="text-sm text-gray-500 mt-1">Gérez qui peut voir et modifier ce projet</p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-grow p-6 overflow-y-auto space-y-8">
                        {/* Invite Form */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="font-semibold text-gray-800 mb-4 text-lg">Inviter un collaborateur</h3>
                            <form onSubmit={handleInvite} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Adresse e-mail
                                    </label>
                                    <input 
                                        type="email" 
                                        value={inviteEmail} 
                                        onChange={(e) => setInviteEmail(e.target.value)} 
                                        placeholder="nom@exemple.com" 
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        required 
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Rôle</label>
                                        <select 
                                            value={inviteRole} 
                                            onChange={(e) => setInviteRole(e.target.value)} 
                                            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                        >
                                            <option value="viewer">Lecteur</option>
                                            <option value="editor">Éditeur</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                                        <select 
                                            value={inviteScope} 
                                            onChange={(e) => setInviteScope(e.target.value)} 
                                            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                        >
                                            <option value="all">Entrées & Sorties</option>
                                            <option value="income_only">Entrées seulement</option>
                                            <option value="expense_only">Sorties seulement</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <button 
                                    type="submit" 
                                    disabled={isSendingInvite || !inviteEmail.trim()}
                                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200"
                                >
                                    {isSendingInvite ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Envoi en cours...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" /> 
                                            Envoyer l'invitation
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Active Collaborators */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Users className="w-5 h-5 text-gray-600" />
                                <h3 className="font-semibold text-gray-800 text-lg">Équipe du projet</h3>
                                <span className="bg-gray-100 text-gray-600 text-sm px-2 py-1 rounded-full">
                                    {projectCollaborators.active.length} membre{projectCollaborators.active.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                            
                            <div className="space-y-3">
                                {projectCollaborators.active.map(member => (
                                    <div key={member.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl group hover:shadow-sm transition-all">
                                        <div className="flex items-center gap-3">
                                            <Avatar name={member.full_name} role={member.role} />
                                            <div>
                                                <p className="font-semibold text-gray-900">{member.full_name}</p>
                                                <p className="text-sm text-gray-600">{member.role}</p>
                                            </div>
                                        </div>
                                        {!member.isOwner && (
                                            <button 
                                                onClick={() => handleRevoke(member.collabId, member.full_name)} 
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                title="Révoquer l'accès"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                
                                {projectCollaborators.active.length === 0 && (
                                    <div className="text-center py-8 text-gray-500">
                                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p>Aucun collaborateur pour le moment</p>
                                        <p className="text-sm">Invitez des personnes pour collaborer sur ce projet</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Pending Invites */}
                        {projectCollaborators.pending.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <Mail className="w-5 h-5 text-gray-600" />
                                    <h3 className="font-semibold text-gray-800 text-lg">Invitations en attente</h3>
                                    <span className="bg-yellow-100 text-yellow-800 text-sm px-2 py-1 rounded-full">
                                        {projectCollaborators.pending.length} en attente
                                    </span>
                                </div>
                                
                                <div className="space-y-3">
                                    {projectCollaborators.pending.map(invite => (
                                        <div key={invite.id} className="flex items-center justify-between p-4 bg-white border border-yellow-200 rounded-xl group hover:shadow-sm transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                                                    <Mail className="w-5 h-5 text-yellow-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{invite.email}</p>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="text-gray-600">
                                                            {invite.role === 'editor' ? 'Éditeur' : 'Lecteur'}
                                                        </span>
                                                        <span className="text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full text-xs">
                                                            En attente
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleResend(invite)} 
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="Renvoyer l'invitation"
                                                >
                                                    <Send size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleRevoke(invite.collabId, invite.email)} 
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Annuler l'invitation"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default ShareProjectDrawer;