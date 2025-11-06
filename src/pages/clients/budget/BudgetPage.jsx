// BudgetPage.jsx - Version corrigée avec gestion centralisée
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Download, FileSpreadsheet, FileText } from 'lucide-react';
import BudgetStateView from './BudgetStateView';
import { useUI } from '../../../components/context/UIContext';
import { useData } from '../../../components/context/DataContext';
import { updateProjectOnboardingStep } from '../../../components/context/actions';
import { useActiveProjectData } from '../../../hooks/useActiveProjectData';
import { motion, AnimatePresence } from 'framer-motion';
import { getBudget } from '../../../components/context/budgetAction';

const BudgetPage = () => {
    const { uiState, uiDispatch } = useUI();
    const { dataState, dataDispatch } = useData();
    const navigate = useNavigate();

    const [searchTerm, setSearchTerm] = useState('');
    const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
    const downloadMenuRef = useRef(null);

    const [budgetData, setBudgetData] = useState(null);
    const [budgetLoading, setBudgetLoading] = useState(false);
    const [budgetError, setBudgetError] = useState(null);

    const { activeProject } = useActiveProjectData(dataState, uiState);
    const showValidationButton = activeProject && activeProject.onboarding_step === 'budget';

    const fetchBudgetData = async (retryCount = 0) => {
        if (!activeProject?.id || typeof activeProject.id !== 'number') {
            setBudgetError('Aucun projet valide sélectionné');
            return;
        }

        try {
            setBudgetLoading(true);
            setBudgetError(null);
            console.log('🔄 Chargement du budget pour le projet:', activeProject.name);
            
            const data = await getBudget(activeProject.id);
            setBudgetData(data);
        } catch (err) {
            console.error('Erreur lors du chargement du budget:', err);
            
            if (err.response?.status === 429 && retryCount < 2) {
                const delay = Math.pow(2, retryCount) * 1000;
                console.warn(`⏳ Trop de requêtes, nouvelle tentative dans ${delay}ms...`);
                
                setTimeout(() => {
                    fetchBudgetData(retryCount + 1);
                }, delay);
                return;
            }
            
            setBudgetError('Erreur lors du chargement du budget');
        } finally {
            setBudgetLoading(false);
        }
    };

    useEffect(() => {
        if (activeProject?.id && typeof activeProject.id === 'number') {
            const timer = setTimeout(() => {
                fetchBudgetData();
            }, 200);
            
            return () => clearTimeout(timer);
        }
    }, [activeProject?.id]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target)) {
                setIsDownloadMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleValidation = async () => {
        if (!activeProject?.id) {
            console.error('❌ Aucun projet actif pour la validation');
            return;
        }

        try {
            await updateProjectOnboardingStep(
                { dataDispatch, uiDispatch }, 
                { projectId: activeProject.id, step: 'accounts' }
            );
            navigate('/app/comptes');
        } catch (error) {
            console.error('❌ Erreur lors de la validation:', error);
        }
    };

    useEffect(() => {
        console.log('🔍 BudgetPage - Projet actif:', activeProject);
        console.log('🔍 BudgetPage - Budget chargé:', !!budgetData);
        console.log('🔍 BudgetPage - En cours de chargement:', budgetLoading);
    }, [activeProject, budgetData, budgetLoading]);

    if (budgetLoading) {
        return (
            <div className="p-6 max-w-full">
                <div className="flex justify-center items-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-600">Chargement du budget...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (budgetError) {
        return (
            <div className="p-6 max-w-full">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <h3 className="text-red-800 font-semibold mb-2">Erreur</h3>
                    <p className="text-red-600">{budgetError}</p>
                    <button
                        onClick={fetchBudgetData}
                        className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-full">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="hidden md:block">
                    <p className="text-gray-600">
                        Recensez, identifiez et classez vos entrées et sorties régulièrement.
                    </p>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    {/* Barre de recherche */}
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Rechercher par tiers..."
                            className="w-full pl-10 pr-4 py-2 border rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        />
                    </div>
                    
                    {/* Menu d'exportation */}
                    <div className="relative hidden md:flex" ref={downloadMenuRef}>
                        <button
                            onClick={() => setIsDownloadMenuOpen(prev => !prev)}
                            className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors px-3 py-2 rounded-full hover:bg-gray-100"
                        >
                            <Download size={16} />
                            <span>Exporter</span>
                        </button>
                        <AnimatePresence>
                            {isDownloadMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border z-20"
                                >
                                    <ul className="p-1">
                                        <li>
                                            <button
                                                disabled
                                                className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Fonctionnalité bientôt disponible"
                                            >
                                                <FileSpreadsheet size={14} />
                                                Télécharger Excel
                                            </button>
                                        </li>
                                        <li>
                                            <button
                                                disabled
                                                className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Fonctionnalité bientôt disponible"
                                            >
                                                <FileText size={14} />
                                                Télécharger en PDF
                                            </button>
                                        </li>
                                    </ul>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
            
            {/* Bouton de validation conditionnel */}
            {showValidationButton && (
                <div className="mb-6 flex justify-center">
                    <button
                        onClick={handleValidation}
                        className="px-6 py-3 text-sm font-semibold text-white bg-green-600 rounded-lg shadow-sm hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                        Valider mon budget et passer à la mise en place de mes comptes
                    </button>
                </div>
            )}
            
            <BudgetStateView 
                searchTerm={searchTerm} 
                budgetData={budgetData}
                loading={budgetLoading}
                onRefresh={fetchBudgetData}
            />
        </div>
    );
};

export default BudgetPage;