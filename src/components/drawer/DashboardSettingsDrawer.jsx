import React, { useState, useEffect } from 'react';
import { X, Settings, Eye, EyeOff } from 'lucide-react';

const widgetConfig = [
  { type: 'group', label: 'Indicateurs Clés (KPIs)' },
  {
    id: 'kpi_actionable_balance',
    label: 'Trésorerie Actionnable',
    indent: true,
  },
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
  { id: 'actions', label: "Raccourcis d'actions" },
  { id: 'tutorials', label: 'Tutoriels vidéo' },
];

const DashboardSettingsDrawer = ({
  isOpen,
  onClose,
  initialWidgetSettings,
  onSave,
}) => {
  const [localSettings, setLocalSettings] = useState(initialWidgetSettings);

  useEffect(() => {
    if (isOpen) {
      setLocalSettings(initialWidgetSettings);
      // Empêcher le défilement du body quand le drawer est ouvert
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialWidgetSettings]);

  // Sauvegarde automatique quand les settings changent
  useEffect(() => {
    if (isOpen) {
      onSave(localSettings);
    }
  }, [localSettings, isOpen, onSave]);

  const handleToggle = (id) => {
    setLocalSettings((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleToggleAll = (visible) => {
    const newSettings = {};
    widgetConfig.forEach((widget) => {
      if (widget.id) {
        newSettings[widget.id] = visible;
      }
    });
    setLocalSettings(newSettings);
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

      {/* Drawer full screen height */}
      <div
        className={`
                fixed inset-0 left-auto w-96 max-w-full bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : 'translate-x-full'}
            `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-600" />
            Personnaliser le Tableau de Bord
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content avec hauteur complète */}
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Actions globales */}
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-gray-700">
                  Visibilité des widgets
                </h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleToggleAll(true)}
                    className="text-xs font-semibold flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    <Eye size={14} /> Tout afficher
                  </button>
                  <button
                    onClick={() => handleToggleAll(false)}
                    className="text-xs font-semibold flex items-center gap-1 text-gray-500 hover:text-gray-600 hover:underline"
                  >
                    <EyeOff size={14} /> Tout masquer
                  </button>
                </div>
              </div>

              {/* Liste des widgets */}
              <ul className="space-y-3">
                {widgetConfig.map((widget, index) => {
                  if (widget.type === 'group') {
                    return (
                      <li
                        key={widget.label}
                        className="pt-6 pb-2 px-3 text-sm font-bold text-gray-700 uppercase tracking-wide border-t border-gray-200 first:border-t-0 first:pt-0"
                      >
                        {widget.label}
                      </li>
                    );
                  }
                  if (widget.type === 'divider') {
                    return (
                      <li key={`divider-${index}`} className="pt-4">
                        <hr className="border-gray-200" />
                      </li>
                    );
                  }
                  return (
                    <li
                      key={widget.id}
                      className={`flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-all duration-200 ${
                        widget.indent ? 'ml-4 border-l-2 border-gray-200' : ''
                      }`}
                    >
                      <span className="font-medium text-gray-800">
                        {widget.label}
                      </span>
                      <label
                        htmlFor={widget.id}
                        className="relative inline-flex items-center cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          id={widget.id}
                          checked={!!localSettings[widget.id]}
                          onChange={() => handleToggle(widget.id)}
                          className="sr-only peer"
                        />
                        <div className="w-12 h-6 bg-gray-300 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 shadow-sm"></div>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Footer en bas */}
          <div className="p-6 border-t border-gray-200 bg-gray-50/50">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Les modifications sont sauvegardées automatiquement
              </p>
              <p className="text-xs text-gray-500">
                Fermez ce panneau pour voir les changements
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardSettingsDrawer;
