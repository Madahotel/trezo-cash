import React, { useState, useEffect, useCallback } from 'react';
import { X, Settings, Eye, EyeOff } from 'lucide-react';

const widgetConfig = [
  { type: 'group', label: 'Indicateurs Clés (KPIs)' },
  {
    id: 1,
    label: 'Trésorerie Actionnable',
    indent: true,
  },
  { id: 2, label: 'Dettes en Retard', indent: true },
  { id: 3, label: 'Créances en Retard', indent: true },
  { id: 4, label: 'Épargne', indent: true },
  { id: 5, label: 'Provisions', indent: true },
  { id: 6, label: 'Emprunts à rembourser', indent: true },
  { id: 7, label: 'Prêts à recevoir', indent: true },
  { type: 'divider' },
  { id: 8, label: 'Alertes intelligentes' },
  { id: 9, label: 'Actions prioritaires' },
  { id: 10, label: 'Score Trézo' },
  { id: 11, label: 'Prévision sur 30 jours' },
  { id: 12, label: 'Budget du mois en cours' },
  { id: 13, label: 'Résumé des emprunts et prêts' },
  { id: 14, label: 'Promotion Ambassadeur' },
  { id: 15, label: "Raccourcis d'actions" },
  { id: 16, label: 'Tutoriels vidéo' },
];

const DashboardSettingsDrawer = ({
  isOpen,
  onClose,
  initialWidgetSettings,
  onSave,
}) => {
  const [localSettings, setLocalSettings] = useState(initialWidgetSettings);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalSettings(initialWidgetSettings);
      setHasChanges(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialWidgetSettings]);

  const handleToggle = useCallback((id) => {
    setLocalSettings((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
    setHasChanges(true);
  }, []);

  const handleToggleAll = useCallback((visible) => {
    const newSettings = {};
    widgetConfig.forEach((widget) => {
      if (widget.id) {
        newSettings[widget.id] = visible;
      }
    });
    setLocalSettings(newSettings);
    setHasChanges(true);
  }, []);

  // Sauvegarde quand le drawer se ferme
  const handleClose = useCallback(() => {
    if (hasChanges) {
      onSave(localSettings);
    }
    onClose();
  }, [hasChanges, localSettings, onClose, onSave]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleClose]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={handleClose}
        />
      )}

      <div
        className={`
          fixed inset-0 left-auto w-96 max-w-full bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-600" />
            Personnaliser le Tableau de Bord
            {hasChanges && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                Modifications non sauvegardées
              </span>
            )}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
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
                        htmlFor={`widget-${widget.id}`}
                        className="relative inline-flex items-center cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          id={`widget-${widget.id}`}
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

          <div className="p-6 border-t border-gray-200 bg-gray-50/50">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                {hasChanges
                  ? 'Les modifications seront sauvegardées à la fermeture'
                  : 'Les modifications sont sauvegardées automatiquement'}
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
