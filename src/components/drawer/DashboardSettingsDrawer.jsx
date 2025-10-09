import React, { useState, useEffect } from 'react';
import { X, Save, Settings, Eye, EyeOff } from 'lucide-react';

const widgetConfig = [
    { type: 'group', label: 'Indicateurs Clés (KPIs)' },
    { id: 'kpi_actionable_balance', label: 'Trésorerie Actionnable', indent: true },
    { id: 'kpi_overdue_payables', label: 'Dettes en Retard', indent: true },
    { id: 'kpi_overdue_receivables', label: 'Créances en Retard', indent: true },
    { id: 'kpi_savings', label: 'Épargne', indent: true },
    { id: 'kpi_provisions', label: 'Provisions', indent: true },
    { id: 'kpi_borrowings', label: 'Emprunts à rembourser', indent: true },
    { id: 'kpi_lendings', label: 'Prêts à recevoir', indent: true },
    { type: 'divider' },
    { id: 'alerts', label: 'Alertes intelligentes' },
    { id: 'priorities', label: 'Actions prioritaires' },
    { id: 'trezo_score', label: 'Score Trézo' },
    { id: '30_day_forecast', label: 'Prévision sur 30 jours' },
    { id: 'monthly_budget', label: 'Budget du mois en cours' },
    { id: 'loans', label: 'Résumé des emprunts et prêts' },
    { id: 'actions', label: 'Raccourcis d\'actions' },
    { id: 'tutorials', label: 'Tutoriels vidéo' },
];

const DashboardSettingsDrawer = ({ isOpen, onClose, initialWidgetSettings, onSave }) => {
    const [localSettings, setLocalSettings] = useState(initialWidgetSettings);

    useEffect(() => {
        if (isOpen) {
            setLocalSettings(initialWidgetSettings);
        }
    }, [isOpen, initialWidgetSettings]);

    const handleToggle = (id) => {
        setLocalSettings(prev => ({ ...prev, [id]: !prev[id] }));
    };
    
    const handleToggleAll = (visible) => {
        const newSettings = {};
        widgetConfig.forEach(widget => {
            if (widget.id) {
                newSettings[widget.id] = visible;
            }
        });
        setLocalSettings(newSettings);
    };

    const handleSaveClick = () => {
        onSave(localSettings);
    };

    // Fermer avec la touche Escape
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
                    onClick={onClose}
                />
            )}
            
            {/* Drawer avec le style du modal */}
            <div className={`
                fixed top-0 right-0 h-full w-96 max-w-full bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : 'translate-x-full'}
            `}>
                {/* Header identique au modal */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-blue-600" />
                        Personnaliser le Tableau de Bord
                    </h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-6 space-y-4 max-h-[60vh]">
                            {/* Actions globales - style identique au modal */}
                            <div className="flex justify-end gap-2 mb-4">
                                <button 
                                    onClick={() => handleToggleAll(true)} 
                                    className="text-xs font-semibold flex items-center gap-1 text-blue-600 hover:underline"
                                >
                                    <Eye size={14} /> Tout afficher
                                </button>
                                <button 
                                    onClick={() => handleToggleAll(false)} 
                                    className="text-xs font-semibold flex items-center gap-1 text-gray-500 hover:underline"
                                >
                                    <EyeOff size={14} /> Tout masquer
                                </button>
                            </div>

                            {/* Liste des widgets - style identique au modal */}
                            <ul className="space-y-2">
                                {widgetConfig.map((widget, index) => {
                                    if (widget.type === 'group') {
                                        return (
                                            <li key={widget.label} className="pt-4 pb-1 px-3 text-sm font-bold text-gray-500">
                                                {widget.label}
                                            </li>
                                        );
                                    }
                                    if (widget.type === 'divider') {
                                        return (
                                            <li key={`divider-${index}`} className="pt-4">
                                                <hr />
                                            </li>
                                        );
                                    }
                                    return (
                                        <li 
                                            key={widget.id} 
                                            className={`flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors ${
                                                widget.indent ? 'ml-4' : ''
                                            }`}
                                        >
                                            <span className="font-medium text-gray-700">{widget.label}</span>
                                            <label htmlFor={widget.id} className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    id={widget.id}
                                                    checked={!!localSettings[widget.id]}
                                                    onChange={() => handleToggle(widget.id)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>

                    {/* Footer identique au modal */}
                    <div className="flex justify-end gap-3 p-4 border-t">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveClick}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                        >
                            <Save className="w-4 h-4" /> Enregistrer
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DashboardSettingsDrawer;