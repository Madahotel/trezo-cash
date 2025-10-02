import React, { useState } from 'react';
import { useUI } from '../../../components/context/UIContext';
import { Save, Shield, Eye, EyeOff } from 'lucide-react';

const SecuritySettingsView = () => {
    const { uiDispatch } = useUI();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        
        // Validation
        if (password !== confirmPassword) {
            uiDispatch({ 
                type: 'ADD_TOAST', 
                payload: { 
                    message: 'Les mots de passe ne correspondent pas.', 
                    type: 'error' 
                } 
            });
            return;
        }
        
        if (password.length < 6) {
            uiDispatch({ 
                type: 'ADD_TOAST', 
                payload: { 
                    message: 'Le mot de passe doit faire au moins 6 caractères.', 
                    type: 'error' 
                } 
            });
            return;
        }

        setLoading(true);
        
        try {
            // Utilisation de l'API fetch pour appeler votre endpoint backend
            const response = await fetch('/api/auth/update-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password }),
                credentials: 'include' // Pour inclure les cookies de session
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erreur lors de la mise à jour du mot de passe');
            }

            uiDispatch({ 
                type: 'ADD_TOAST', 
                payload: { 
                    message: 'Mot de passe mis à jour avec succès.', 
                    type: 'success' 
                } 
            });
            
            // Réinitialiser les champs
            setPassword('');
            setConfirmPassword('');
            
        } catch (error) {
            uiDispatch({ 
                type: 'ADD_TOAST', 
                payload: { 
                    message: `Erreur: ${error.message}`, 
                    type: 'error' 
                } 
            });
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-sm border">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <Shield className="w-6 h-6 text-green-600" /> 
                Mot de passe et Sécurité
            </h2>
            
            <form onSubmit={handleUpdatePassword} className="space-y-6 max-w-lg">
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nouveau mot de passe
                    </label>
                    <input 
                        type={showPassword ? 'text' : 'password'} 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Entrez votre nouveau mot de passe"
                    />
                    <button 
                        type="button" 
                        onClick={togglePasswordVisibility} 
                        className="absolute right-3 top-8 text-gray-500 hover:text-gray-700"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
                
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirmer le nouveau mot de passe
                    </label>
                    <input 
                        type={showPassword ? 'text' : 'password'} 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Confirmez votre nouveau mot de passe"
                    />
                    <button 
                        type="button" 
                        onClick={togglePasswordVisibility} 
                        className="absolute right-3 top-8 text-gray-500 hover:text-gray-700"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
                
                <div className="flex justify-end pt-4">
                    <button 
                        type="submit" 
                        disabled={loading || !password || !confirmPassword}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        {loading ? 'Enregistrement...' : 'Changer le mot de passe'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SecuritySettingsView;