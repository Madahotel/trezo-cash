import {
  Filter,
  MoreVertical,
  Tag,
  ChevronDown,
  ChevronRight,
  Calendar,
  Square,
  Edit,
  Trash2,
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../../../utils/formatters';

const BudgetTable = ({ budgetData, isMobile, onEdit, onDelete }) => {
  // Tous les hooks doivent être appelés AVANT tout return conditionnel
  const [activeTab, setActiveTab] = useState('revenus');
  const [expandedRow, setExpandedRow] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const [subCategoryMenuOpen, setSubCategoryMenuOpen] = useState(null);
  const [groupedData, setGroupedData] = useState([]);
  const menuRefs = useRef({});

  const getFrequencyBadge = (frequency) => {
    const frequencies = {
      Mensuelle: 'Mensuel',
      Trimestrielle: 'Trim',
      Annuelle: 'Annuel',
      Ponctuelle: 'Ponctuel',
    };
    return (
      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
        {frequencies[frequency] || frequency || 'Mensuel'}
      </span>
    );
  };

  const getColorClasses = (categoryId) => {
    const colors = {
      1: 'bg-red-100 text-red-600', // Logement
      2: 'bg-green-100 text-green-600', // Alimentation
      3: 'bg-blue-100 text-blue-600', // Transport
      4: 'bg-purple-100 text-purple-600', // Santé
      5: 'bg-yellow-100 text-yellow-600', // Éducation
      6: 'bg-pink-100 text-pink-600', // Loisirs
    };
    return colors[categoryId] || 'bg-gray-100 text-gray-600';
  };

  // Fonction pour grouper les données par catégorie
  const getGroupedData = () => {
    if (activeTab === 'revenus') {
      // Pour les revenus (entries)
      const entries = budgetData?.entries || {};
      const categories = entries?.entry_items?.category_names || [];
      const items = entries?.entry_items?.sub_categories || [];

      return categories.map((category) => {
        const categoryItems = items.filter(
          (item) => item.category_id === category.category_id
        );
        const totalAmount = categoryItems.reduce(
          (sum, item) => sum + (item.amount || 0),
          0
        );

        return {
          id: category.category_id,
          categoryName: category.category_name,
          subcategoryName: `${categoryItems.length} sous-catégories`,
          amount: totalAmount,
          items: categoryItems,
        };
      });
    } else {
      // Pour les dépenses (exits)
      const exits = budgetData?.exits || {};
      const categories = exits?.exit_items?.category_names || [];
      const items = exits?.exit_items?.sub_categories || [];

      return categories.map((category) => {
        const categoryItems = items.filter(
          (item) => item.category_id === category.category_id
        );
        const totalAmount = categoryItems.reduce(
          (sum, item) => sum + (item.amount || 0),
          0
        );

        return {
          id: category.category_id,
          categoryName: category.category_name,
          subcategoryName: `${categoryItems.length} sous-catégories`,
          amount: totalAmount,
          items: categoryItems,
        };
      });
    }
  };

  // Mettre à jour les données groupées quand budgetData ou activeTab change
  useEffect(() => {
    if (budgetData) {
      const data = getGroupedData();
      setGroupedData(data);
    }
  }, [budgetData, activeTab]);

  // Fonction pour gérer le clic sur une ligne
  const handleRowClick = (itemId) => {
    setExpandedRow(expandedRow === itemId ? null : itemId);
  };

  // Fonction pour gérer l'ouverture/fermeture du menu des sous-catégories
  const handleSubCategoryMenuToggle = (itemId, event) => {
    event.stopPropagation();
    setSubCategoryMenuOpen(subCategoryMenuOpen === itemId ? null : itemId);
  };

  // Fonction pour fermer tous les menus
  const closeAllMenus = () => {
    setMenuOpen(null);
    setSubCategoryMenuOpen(null);
  };

  // Fonctions de gestion des actions
  const handleEdit = (item, type, event) => {
    event.stopPropagation();
    closeAllMenus();
    onEdit(item, type);
  };

  const handleDelete = (item, type, event) => {
    event.stopPropagation();
    closeAllMenus();
    onDelete(item, type);
  };

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      month: 'short',
      year: 'numeric',
    });
  };

  // Fonction pour calculer la position du menu
  const getMenuPosition = (element) => {
    if (!element) return 'bottom';

    const rect = element.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const menuHeight = 160; // Hauteur approximative du menu

    return spaceBelow < menuHeight && spaceAbove > spaceBelow
      ? 'top'
      : 'bottom';
  };

  // Animations
  const rowVariants = {
    hidden: {
      opacity: 0,
      height: 0,
      transition: {
        duration: 0.3,
        ease: 'easeInOut',
      },
    },
    visible: {
      opacity: 1,
      height: 'auto',
      transition: {
        duration: 0.3,
        ease: 'easeInOut',
      },
    },
  };

  const contentVariants = {
    hidden: {
      opacity: 0,
      y: -10,
      transition: {
        duration: 0.2,
      },
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
  };

  // Le return conditionnel doit être APRÈS tous les hooks
  if (isMobile) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      {/* En-tête */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Détail du budget</h2>
        <button className="flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
          <Filter className="w-4 h-4 mr-2" />
          <span>Filtrer</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 rounded-lg bg-gray-100 p-1 mb-6">
        <button
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === 'revenus'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:bg-white/50'
          }`}
          onClick={() => setActiveTab('revenus')}
        >
          Revenus ({budgetData?.entries?.entry_count || 0})
        </button>
        <button
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === 'depenses'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:bg-white/50'
          }`}
          onClick={() => setActiveTab('depenses')}
        >
          Dépenses ({budgetData?.exits?.exit_count || 0})
        </button>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-medium text-gray-700">
                Catégorie
              </th>
              <th className="text-center py-3 px-4 font-medium text-gray-700">
                Fréquence
              </th>
              <th className="text-center py-3 px-4 font-medium text-gray-700">
                Période
              </th>
              <th className="text-right py-3 px-4 font-medium text-gray-700">
                Budget
              </th>
              {/* <th className="text-right py-3 px-4 font-medium text-gray-700">
                Réel
              </th>
              <th className="text-right py-3 px-4 font-medium text-gray-700">
                Écart
              </th> */}
              <th className="text-center py-3 px-4 font-medium text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {groupedData.length > 0 ? (
              groupedData.map((category) => {
                const colorClass = getColorClasses(category.id);
                const isExpanded = expandedRow === category.id;

                return (
                  <React.Fragment key={category.id}>
                    {/* Ligne principale */}
                    <tr
                      className="border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleRowClick(category.id)}
                    >
                      {/* Catégorie */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${colorClass} flex-shrink-0`}
                          >
                            <Tag className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <div className="font-medium text-gray-900">
                              {category.categoryName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {category.subcategoryName}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Fréquence - Moyenne pour la catégorie */}
                      <td className="py-3 px-4 text-center">
                        {getFrequencyBadge('Mensuelle')}
                      </td>

                      {/* Période - Plage pour la catégorie */}
                      <td className="py-3 px-4 text-center text-sm text-gray-600">
                        <div className="flex items-center justify-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {category.items.length > 0 ? (
                            <span>Multiple</span>
                          ) : (
                            <span>-</span>
                          )}
                        </div>
                      </td>

                      {/* Budget */}
                      <td className="text-right py-3 px-4 font-medium">
                        {formatCurrency(category.amount)}
                      </td>

                      {/* Réel - Pour l'instant égal au budget */}
                      {/* <td className="text-right py-3 px-4">
                        {formatCurrency(category.amount)}
                      </td> */}

                      {/* Écart - Pour l'instant 0 */}
                      {/* <td className="text-right py-3 px-4 font-medium text-gray-600">
                        {formatCurrency(0)}
                      </td> */}

                      {/* Actions - Flèche d'expansion uniquement */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(category.id);
                            }}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Ligne de détails (sous-catégories) avec animation */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.tr
                          className="bg-gray-50"
                          variants={rowVariants}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                        >
                          <td colSpan="7" className="py-4 px-4">
                            <motion.div
                              className="pl-12"
                              variants={contentVariants}
                              initial="hidden"
                              animate="visible"
                              exit="hidden"
                            >
                              <h4 className="font-medium text-gray-900 mb-3">
                                Détails des sous-catégories -{' '}
                                {category.categoryName}
                              </h4>
                              <div className="grid gap-3">
                                {category.items.map((item) => {
                                  const isSubMenuOpen =
                                    subCategoryMenuOpen === item.id;
                                  const menuPosition = isSubMenuOpen
                                    ? getMenuPosition(menuRefs.current[item.id])
                                    : 'bottom';

                                  return (
                                    <motion.div
                                      key={item.id}
                                      className="flex justify-between items-center py-2 px-4 bg-white rounded-lg border relative"
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: 0.1 }}
                                    >
                                      <div className="flex items-center gap-3">
                                        <Square className="w-3 h-3 text-gray-400 fill-current" />
                                        <div className="flex flex-col">
                                          <span className="text-sm font-medium">
                                            {item.sub_category_name}
                                          </span>
                                          {item.description && (
                                            <span className="text-xs text-gray-500 mt-1">
                                              {item.description}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-6">
                                        <div className="text-right">
                                          <div className="text-sm text-gray-600">
                                            Budget
                                          </div>
                                          <div className="font-medium">
                                            {formatCurrency(item.amount)}
                                          </div>
                                        </div>
                                        {/* <div className="text-right">
                                          <div className="text-sm text-gray-600">
                                            Réel
                                          </div>
                                          <div className="font-medium">
                                            {formatCurrency(item.amount)}
                                          </div>
                                        </div> */}
                                        {/* <div className="text-right">
                                          <div className="text-sm text-gray-600">
                                            Écart
                                          </div>
                                          <div className="font-medium text-gray-600">
                                            {formatCurrency(0)}
                                          </div>
                                        </div> */}
                                        <div className="text-right">
                                          <div className="text-sm text-gray-600">
                                            Période
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            {formatDate(item.start_date)}
                                            {item.is_duration_indefinite ? (
                                              <span> → ∞</span>
                                            ) : item.end_date ? (
                                              <span>
                                                {' '}
                                                → {formatDate(item.end_date)}
                                              </span>
                                            ) : null}
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-sm text-gray-600">
                                            Fréquence
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            {item.frequency_name}
                                          </div>
                                        </div>
                                        {/* Actions pour sous-catégorie */}
                                        <div className="relative">
                                          <button
                                            ref={(el) =>
                                              (menuRefs.current[item.id] = el)
                                            }
                                            onClick={(e) =>
                                              handleSubCategoryMenuToggle(
                                                item.id,
                                                e
                                              )
                                            }
                                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                                          >
                                            <MoreVertical className="w-4 h-4" />
                                          </button>

                                          {/* Menu modal pour sous-catégorie avec positionnement adaptatif */}
                                          {isSubMenuOpen && (
                                            <div
                                              className={`absolute ${
                                                menuPosition === 'top'
                                                  ? 'bottom-full mb-1'
                                                  : 'top-full mt-1'
                                              } right-0 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50`}
                                            >
                                              <div className="py-1">
                                                <button
                                                  onClick={(e) =>
                                                    handleEdit(
                                                      item,
                                                      activeTab,
                                                      e
                                                    )
                                                  }
                                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                                >
                                                  <Edit className="w-4 h-4 mr-2" />
                                                  Modifier
                                                </button>
                                                <div className="border-t border-gray-100 my-1"></div>
                                                <button
                                                  onClick={(e) =>
                                                    handleDelete(
                                                      item,
                                                      activeTab,
                                                      e
                                                    )
                                                  }
                                                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                >
                                                  <Trash2 className="w-4 h-4 mr-2" />
                                                  Supprimer
                                                </button>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </motion.div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <div>Aucune donnée disponible</div>
                    <div className="text-sm text-gray-400 mt-1">
                      {activeTab === 'revenus'
                        ? 'Aucun revenu trouvé'
                        : 'Aucune dépense trouvée'}
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Overlay pour fermer les menus en cliquant ailleurs */}
      {(menuOpen || subCategoryMenuOpen) && (
        <div className="fixed inset-0 z-40" onClick={closeAllMenus} />
      )}
    </div>
  );
};

export default BudgetTable;
