import {
  Filter,
  MoreVertical,
  Tag,
  ChevronDown,
  ChevronRight,
  Calendar,
  Edit,
  Trash2,
  Eye,
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../../../utils/formatters';
import BudgetDetailModal from './BudgetDetailModal';

const formatShortDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('fr-FR', {
    month: 'short',
    year: 'numeric',
  });
};

const SubCategoryRow = ({
  item,
  index,
  activeTab,
  onEdit,
  onDelete,
  onViewDetails,
  isSubMenuOpen,
  onSubCategoryMenuToggle,
  menuRefs,
}) => {
  const menuPosition = isSubMenuOpen
    ? getMenuPosition(menuRefs.current[item.id])
    : 'bottom';

  return (
    <motion.div
      className="flex justify-between items-center p-4 bg-white rounded-lg border border-gray-100 hover:bg-gray-25 transition-all duration-200 group"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
    >
      <div className="flex items-center gap-3 flex-1">
        <div className="w-1.5 h-1.5 bg-gray-300 rounded-full group-hover:bg-blue-500 transition-colors" />
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900">
            {item.sub_category_name}
          </span>
          {item.description && (
            <span className="text-xs text-gray-500 mt-0.5">
              {item.description}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right">
          <div className="text-xs text-gray-500 mb-1">Budget</div>
          <div className="font-medium text-gray-900">
            {formatCurrency(item.amount)}
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-gray-500 mb-1">Période</div>
          <div className="text-sm text-gray-600 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatShortDate(item.start_date)}
            {item.is_duration_indefinite ? (
              <span> → ∞</span>
            ) : item.end_date ? (
              <span> → {formatShortDate(item.end_date)}</span>
            ) : null}
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-gray-500 mb-1">Fréquence</div>
          <div className="text-sm text-gray-600">{item.frequency_name}</div>
        </div>

        <div className="relative">
          <button
            ref={(el) => (menuRefs.current[item.id] = el)}
            onClick={(e) => onSubCategoryMenuToggle(item.id, e)}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </button>

          <AnimatePresence>
            {isSubMenuOpen && (
              <SubCategoryMenu
                item={item}
                activeTab={activeTab}
                menuPosition={menuPosition}
                menuRefs={menuRefs}
                onEdit={onEdit}
                onDelete={onDelete}
                onViewDetails={onViewDetails}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

const SubCategoryMenu = ({
  item,
  activeTab,
  menuPosition,
  menuRefs,
  onEdit,
  onDelete,
  onViewDetails,
}) => {
  return (
    <motion.div
      className="fixed w-48 bg-white rounded-lg border border-gray-200 z-50 overflow-hidden"
      initial={{ opacity: 0, scale: 0.95, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -4 }}
      transition={{ duration: 0.15 }}
      style={{
        position: 'fixed',
        [menuPosition === 'top' ? 'bottom' : 'top']:
          menuPosition === 'top'
            ? `${
                window.innerHeight -
                menuRefs.current[item.id]?.getBoundingClientRect().top +
                8
              }px`
            : `${
                menuRefs.current[item.id]?.getBoundingClientRect().bottom + 8
              }px`,
        right: `${
          window.innerWidth -
          menuRefs.current[item.id]?.getBoundingClientRect().right
        }px`,
      }}
    >
      <div className="p-1">
        <button
          onClick={(e) => onViewDetails(item, e)}
          className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
        >
          <Eye className="w-4 h-4 mr-2 text-gray-500" />
          Voir les détails
        </button>
        <button
          onClick={(e) => onEdit(item, activeTab, e)}
          className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
        >
          <Edit className="w-4 h-4 mr-2 text-gray-500" />
          Modifier
        </button>

        <div className="border-t border-gray-100 my-1"></div>

        <button
          onClick={(e) => onDelete(item, activeTab, e)}
          className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Supprimer
        </button>
      </div>
    </motion.div>
  );
};

const BudgetTable = ({
  budgetData,
  isMobile,
  onEdit,
  onDelete,
  loading = false,
}) => {
  const [activeTab, setActiveTab] = useState('revenus');
  const [expandedRow, setExpandedRow] = useState(null);
  const [subCategoryMenuOpen, setSubCategoryMenuOpen] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const menuRefs = useRef({});

  const getGroupedData = () => {
    if (!budgetData || loading) return [];

    let data;
    if (activeTab === 'revenus') {
      const entries = budgetData?.entries || {};
      const categories = entries?.entry_items?.category_names || [];
      const items = entries?.entry_items?.sub_categories || [];

      data = categories.map((category) => {
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
          subcategoryName: `${categoryItems.length} sous-catégorie${
            categoryItems.length > 1 ? 's' : ''
          }`,
          amount: totalAmount,
          items: categoryItems,
        };
      });
    } else {
      const exits = budgetData?.exits || {};
      const categories = exits?.exit_items?.category_names || [];
      const items = exits?.exit_items?.sub_categories || [];

      data = categories.map((category) => {
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
          subcategoryName: `${categoryItems.length} sous-catégorie${
            categoryItems.length > 1 ? 's' : ''
          }`,
          amount: totalAmount,
          items: categoryItems,
        };
      });
    }

    return data;
  };

  const groupedData = getGroupedData();

  const handleRowClick = (itemId) => {
    setExpandedRow((prev) => (prev === itemId ? null : itemId));
  };

  const handleSubCategoryMenuToggle = (itemId, event) => {
    event.stopPropagation();
    setSubCategoryMenuOpen((prev) => (prev === itemId ? null : itemId));
  };

  const closeAllMenus = () => {
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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setExpandedRow(null);
  };

  useEffect(() => {
    return () => {
      menuRefs.current = {};
    };
  }, []);

  const LoadingRow = () => (
    <tr className="border-b border-gray-100 animate-pulse">
      <td className="py-4 px-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-3 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      </td>
      <td className="py-4 px-6 text-center">
        <div className="h-6 bg-gray-200 rounded w-20 mx-auto"></div>
      </td>
      <td className="py-4 px-6 text-right">
        <div className="h-6 bg-gray-200 rounded w-24 ml-auto"></div>
      </td>
      <td className="py-4 px-6 text-center">
        <div className="h-8 bg-gray-200  w-8 mx-auto rounded-full"></div>
      </td>
    </tr>
  );

  if (isMobile) return null;

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-9 bg-gray-200 rounded-lg w-24 animate-pulse"></div>
        </div>

        <div className="flex space-x-1 rounded-lg bg-gray-100 p-1 mb-6">
          <div className="flex-1 rounded-md px-4 py-2.5 bg-gray-200 animate-pulse"></div>
          <div className="flex-1 rounded-md px-4 py-2.5 bg-gray-200 animate-pulse"></div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-6 font-medium text-gray-700 text-sm">
                  Catégorie
                </th>
                <th className="text-center py-3 px-6 font-medium text-gray-700 text-sm">
                  Période
                </th>
                <th className="text-right py-3 px-6 font-medium text-gray-700 text-sm">
                  Budget
                </th>
                <th className="text-center py-3 px-6 font-medium text-gray-700 text-sm">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {[...Array(4)].map((_, index) => (
                <LoadingRow key={index} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* En-tête */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Détail du budget
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Gestion de vos revenus et dépenses
          </p>
        </div>
        <button className="flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200">
          <Filter className="w-4 h-4 mr-2" />
          <span>Filtrer</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 rounded-lg bg-gray-100 p-1 mb-6">
        <button
          className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
            activeTab === 'revenus'
              ? 'bg-white text-gray-900 border border-gray-200'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
          }`}
          onClick={() => handleTabChange('revenus')}
        >
          Revenus ({budgetData?.entries?.entry_count || 0})
        </button>
        <button
          className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
            activeTab === 'depenses'
              ? 'bg-white text-gray-900 border border-gray-200'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
          }`}
          onClick={() => handleTabChange('depenses')}
        >
          Dépenses ({budgetData?.exits?.exit_count || 0})
        </button>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-6 font-medium text-gray-700 text-sm">
                Catégorie
              </th>
              <th className="text-center py-3 px-6 font-medium text-gray-700 text-sm">
                Période
              </th>
              <th className="text-right py-3 px-6 font-medium text-gray-700 text-sm">
                Budget
              </th>
              <th className="text-center py-3 px-6 font-medium text-gray-700 text-sm">
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
                      className="border-b border-gray-100 hover:bg-gray-25 cursor-pointer transition-colors duration-200"
                      onClick={() => handleRowClick(category.id)}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className={`p-2.5 rounded-lg ${colorClass}`}>
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

                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                          <Calendar className="w-3 h-3" />
                          {category.items.length > 0 ? (
                            <span>Multiple</span>
                          ) : (
                            <span>-</span>
                          )}
                        </div>
                      </td>

                      <td className="text-right py-4 px-6">
                        <div className="font-semibold text-gray-900">
                          {formatCurrency(category.amount)}
                        </div>
                      </td>

                      <td className="py-4 px-6 text-center">
                        <div className="flex justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(category.id);
                            }}
                            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
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
                          className="bg-gray-25"
                          variants={rowVariants}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                        >
                          <td colSpan="5" className="py-4 px-6">
                            <motion.div
                              className="pl-14"
                              variants={contentVariants}
                              initial="hidden"
                              animate="visible"
                              exit="hidden"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-gray-900">
                                  Sous-catégories - {category.categoryName}
                                </h4>
                                <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
                                  {category.items.length} élément
                                  {category.items.length > 1 ? 's' : ''}
                                </span>
                              </div>
                              <div className="grid gap-2">
                                {category.items.map((item, index) => (
                                  <SubCategoryRow
                                    key={item.id}
                                    item={item}
                                    index={index}
                                    activeTab={activeTab}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onViewDetails={handleViewDetails}
                                    isSubMenuOpen={
                                      subCategoryMenuOpen === item.id
                                    }
                                    onSubCategoryMenuToggle={
                                      handleSubCategoryMenuToggle
                                    }
                                    menuRefs={menuRefs}
                                  />
                                ))}
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
                <td colSpan="5" className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <Tag className="w-5 h-5" />
                    </div>
                    <div className="font-medium text-gray-500">
                      Aucune donnée disponible
                    </div>
                    <div className="text-sm mt-1">
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
      {subCategoryMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={closeAllMenus} />
      )}
    </div>
  );
};

const rowVariants = {
  hidden: {
    opacity: 0,
    height: 0,
    transition: {
      duration: 0.2,
      ease: 'easeInOut',
    },
  },
  visible: {
    opacity: 1,
    height: 'auto',
    transition: {
      duration: 0.2,
      ease: 'easeInOut',
    },
  },
};

const contentVariants = {
  hidden: {
    opacity: 0,
    y: -4,
    transition: {
      duration: 0.15,
    },
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
};

const getColorClasses = (categoryId) => {
  const colors = {
    1: 'bg-red-50 text-red-600',
    2: 'bg-green-50 text-green-600',
    3: 'bg-blue-50 text-blue-600',
    4: 'bg-purple-50 text-purple-600',
    5: 'bg-amber-50 text-amber-600',
    6: 'bg-pink-50 text-pink-600',
    7: 'bg-indigo-50 text-indigo-600',
    9: 'bg-teal-50 text-teal-600',
  };
  return colors[categoryId] || 'bg-gray-50 text-gray-600';
};

const getMenuPosition = (element) => {
  if (!element) return 'bottom';
  const rect = element.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  const menuHeight = 120;

  if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
    return 'top';
  }
  return 'bottom';
};

export default BudgetTable;
