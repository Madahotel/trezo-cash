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
  Eye,
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../../../utils/formatters';
import BudgetDetailModal from './BudgetDetailModal';

const BudgetTable = ({ budgetData, isMobile, onEdit, onDelete, loading = false }) => {
  const [activeTab, setActiveTab] = useState('revenus');
  const [expandedRow, setExpandedRow] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const [subCategoryMenuOpen, setSubCategoryMenuOpen] = useState(null);
  const [groupedData, setGroupedData] = useState([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const menuRefs = useRef({});

  // Fonction pour grouper les données par catégorie
  const getGroupedData = () => {
    if (activeTab === 'revenus') {
      const entries = budgetData?.entries || {};
      const categories = entries?.entry_items?.category_names || [];
      const items = entries?.entry_items?.sub_categories || [];

      return categories.map((category) => {
        const categoryItems = items.filter(
          (item) => item.category_id === category.category_id
        );
        const totalAmount = categoryItems.reduce(
          (sum, item) => sum + parseFloat(item.amount || 0),
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
      const exits = budgetData?.exits || {};
      const categories = exits?.exit_items?.category_names || [];
      const items = exits?.exit_items?.sub_categories || [];

      return categories.map((category) => {
        const categoryItems = items.filter(
          (item) => item.category_id === category.category_id
        );
        const totalAmount = categoryItems.reduce(
          (sum, item) => sum + parseFloat(item.amount || 0),
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

  // Mettre à jour les données groupées
  useEffect(() => {
    if (budgetData && !loading) {
      const data = getGroupedData();
      setGroupedData(data);
    }
  }, [budgetData, activeTab, loading]);

  // Reste du code reste inchangé...
  const handleRowClick = (itemId) => {
    setExpandedRow(expandedRow === itemId ? null : itemId);
  };

  const handleSubCategoryMenuToggle = (itemId, event) => {
    event.stopPropagation();
    setSubCategoryMenuOpen(subCategoryMenuOpen === itemId ? null : itemId);
  };

  const closeAllMenus = () => {
    setMenuOpen(null);
    setSubCategoryMenuOpen(null);
  };

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

  const handleViewDetails = (item, event) => {
    event.stopPropagation();
    closeAllMenus();
    setSelectedSubCategory(item);
    setDetailModalOpen(true);
  };

  const handleCloseModal = () => {
    setDetailModalOpen(false);
    setSelectedSubCategory(null);
  };

  const formatShortDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      month: 'short',
      year: 'numeric',
    });
  };

  const getMenuPosition = (element) => {
    if (!element) return 'bottom';
    const rect = element.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const menuHeight = 100;

    if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
      return 'top';
    }
    return 'bottom';
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

  // Composant de ligne de chargement
  const LoadingRow = () => (
    <tr className="border-b animate-pulse">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-3 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-center">
        <div className="h-6 bg-gray-200 rounded w-16 mx-auto"></div>
      </td>
      <td className="py-3 px-4 text-center">
        <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
      </td>
      <td className="py-3 px-4 text-right">
        <div className="h-6 bg-gray-200 rounded w-24 ml-auto"></div>
      </td>
      <td className="py-3 px-4 text-center">
        <div className="h-6 bg-gray-200 rounded w-6 mx-auto"></div>
      </td>
    </tr>
  );

  if (isMobile) return null;

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        {/* En-tête de chargement */}
        <div className="flex justify-between items-center mb-6">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>

        {/* Tabs de chargement */}
        <div className="flex space-x-1 rounded-lg bg-gray-100 p-1 mb-6">
          <div className="flex-1 rounded-md px-3 py-2 bg-gray-200 animate-pulse"></div>
          <div className="flex-1 rounded-md px-3 py-2 bg-gray-200 animate-pulse"></div>
        </div>

        {/* Tableau de chargement */}
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
                <th className="text-center py-3 px-4 font-medium text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, index) => (
                <LoadingRow key={index} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

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

                      {/* Fréquence */}
                      <td className="py-3 px-4 text-center">
                        {getFrequencyBadge('Mensuelle')}
                      </td>

                      {/* Période */}
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

                      {/* Actions */}
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

                    {/* Ligne de détails */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.tr
                          className="bg-gray-50"
                          variants={rowVariants}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                        >
                          <td colSpan="5" className="py-4 px-4">
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
                                {category.items.map((item, index) => {
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
                                      transition={{ delay: index * 0.05 }}
                                    >
                                      {/* Contenu de la sous-catégorie */}
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
                                        <div className="text-right">
                                          <div className="text-sm text-gray-600">
                                            Période
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            {formatShortDate(item.start_date)}
                                            {item.is_duration_indefinite ? (
                                              <span> → ∞</span>
                                            ) : item.end_date ? (
                                              <span>
                                                {' '}
                                                →{' '}
                                                {formatShortDate(item.end_date)}
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

                                          <AnimatePresence>
                                            {isSubMenuOpen && (
                                              <motion.div
                                                className={`fixed w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50 ${
                                                  menuPosition === 'top'
                                                    ? 'bottom-auto'
                                                    : 'top-auto'
                                                }`}
                                                initial={{
                                                  opacity: 0,
                                                  scale: 0.95,
                                                }}
                                                animate={{
                                                  opacity: 1,
                                                  scale: 1,
                                                }}
                                                exit={{
                                                  opacity: 0,
                                                  scale: 0.95,
                                                }}
                                                transition={{ duration: 0.15 }}
                                                style={{
                                                  position: 'fixed',
                                                  [menuPosition === 'top'
                                                    ? 'bottom'
                                                    : 'top']:
                                                    menuPosition === 'top'
                                                      ? `${
                                                          window.innerHeight -
                                                          menuRefs.current[
                                                            item.id
                                                          ]?.getBoundingClientRect()
                                                            .top +
                                                          8
                                                        }px`
                                                      : `${
                                                          menuRefs.current[
                                                            item.id
                                                          ]?.getBoundingClientRect()
                                                            .bottom + 8
                                                        }px`,
                                                  right: `${
                                                    window.innerWidth -
                                                    menuRefs.current[
                                                      item.id
                                                    ]?.getBoundingClientRect()
                                                      .right
                                                  }px`,
                                                }}
                                              >
                                                <div className="py-1">
                                                  <button
                                                    onClick={(e) =>
                                                      handleViewDetails(item, e)
                                                    }
                                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                                  >
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    Voir les détails
                                                  </button>
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
                                              </motion.div>
                                            )}
                                          </AnimatePresence>
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
                <td colSpan="5" className="py-8 text-center text-gray-500">
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

      {/* Modale de détails */}
      <BudgetDetailModal
        open={detailModalOpen}
        onClose={handleCloseModal}
        subCategory={selectedSubCategory}
        type={activeTab}
        onEdit={handleEdit}
      />

      {/* Overlay pour fermer les menus */}
      {(menuOpen || subCategoryMenuOpen) && (
        <div className="fixed inset-0 z-40" onClick={closeAllMenus} />
      )}
    </div>
  );
};

// Fonctions utilitaires (doivent être définies)
const getColorClasses = (categoryId) => {
  const colors = {
    1: 'bg-red-100 text-red-600',
    2: 'bg-green-100 text-green-600',
    3: 'bg-blue-100 text-blue-600',
    4: 'bg-purple-100 text-purple-600',
    5: 'bg-yellow-100 text-yellow-600',
    6: 'bg-pink-100 text-pink-600',
    7: 'bg-indigo-100 text-indigo-600',
    9: 'bg-teal-100 text-teal-600',
  };
  return colors[categoryId] || 'bg-gray-100 text-gray-600';
};

const getFrequencyBadge = (frequency) => {
  const frequencies = {
    Mensuelle: 'Mensuel',
    Trimestrielle: 'Trim',
    Annuelle: 'Annuel',
    Ponctuelle: 'Ponctuel',
    Hebdomadaire: 'Hebdo',
  };
  return (
    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
      {frequencies[frequency] || frequency || 'Mensuel'}
    </span>
  );
};

export default BudgetTable;