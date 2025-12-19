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
  ChevronLeft,
  ChevronUp,
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../../../utils/formatters';
import BudgetDetailModal from './BudgetDetailModal';
import { filterDataByYear } from '../../../services/budget';

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
  isReadOnly = false,
}) => {
  const menuPosition = isSubMenuOpen
    ? getMenuPosition(menuRefs.current[item.id])
    : 'bottom';

  return (
    <motion.div
      className="flex items-center justify-between p-4 transition-all duration-200 bg-white border border-gray-100 rounded-lg hover:bg-gray-25 group"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
    >
      <div className="flex items-center flex-1 gap-3">
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
          <div className="mb-1 text-xs text-gray-500">Budget</div>
          <div className="font-medium text-gray-900">
            {/* Mila devise */}
            {item.amount} {item.currency_symbol}
          </div>
        </div>

        <div className="text-right">
          <div className="mb-1 text-xs text-gray-500">Période</div>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Calendar className="w-3 h-3" />
            {formatShortDate(item.start_date)}
            {item.is_duration_indefinite ||
            item.is_budget_duration_indefinite ? (
              <span> → ∞</span>
            ) : item.end_date ? (
              <span> → {formatShortDate(item.end_date)}</span>
            ) : null}
          </div>
        </div>

        <div className="text-right">
          <div className="mb-1 text-xs text-gray-500">Fréquence</div>
          <div className="text-sm text-gray-600">{item.frequency_name}</div>
        </div>

        {!isReadOnly && (
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
        )}
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
      className="fixed z-50 w-48 overflow-hidden bg-white border border-gray-200 rounded-lg"
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
          className="flex items-center w-full px-3 py-2 text-sm text-gray-700 transition-colors rounded-md hover:bg-gray-50"
        >
          <Eye className="w-4 h-4 mr-2 text-gray-500" />
          Voir les détails
        </button>
        <button
          onClick={(e) => onEdit(item, activeTab, e)}
          className="flex items-center w-full px-3 py-2 text-sm text-gray-700 transition-colors rounded-md hover:bg-gray-50"
        >
          <Edit className="w-4 h-4 mr-2 text-gray-500" />
          Modifier
        </button>

        <div className="my-1 border-t border-gray-100"></div>

        <button
          onClick={(e) => onDelete(item, activeTab, e)}
          className="flex items-center w-full px-3 py-2 text-sm text-red-600 transition-colors rounded-md hover:bg-red-50"
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
  isReadOnly = false,
  year,
  onYearChange, // Nouvelle prop pour changer l'année depuis le parent
}) => {
  const [activeTab, setActiveTab] = useState('revenus');
  const [expandedRow, setExpandedRow] = useState(null);
  const [subCategoryMenuOpen, setSubCategoryMenuOpen] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const menuRefs = useRef({});
  const yearDropdownRef = useRef(null);

  // Générer la liste des années disponibles
  const generateYearList = () => {
    const currentYear = new Date().getFullYear();
    const years = [];

    // Ajouter les années de 2020 à l'année actuelle + 5
    for (let year = 2020; year <= currentYear + 5; year++) {
      years.push(year);
    }

    return years;
  };

  const availableYears = generateYearList();

  // Fermer le dropdown quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        yearDropdownRef.current &&
        !yearDropdownRef.current.contains(event.target)
      ) {
        setIsYearDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fonction pour filtrer les données par année - CORRIGÉE

  const filteredBudgetData = filterDataByYear(budgetData, year);

  const getGroupedData = () => {
    if (!filteredBudgetData || loading) return [];

    // Si structure consolidée
    if (filteredBudgetData.categories) {
      return filteredBudgetData.categories;
    }

    // Structure normale
    let data;
    if (activeTab === 'revenus') {
      const entries = filteredBudgetData?.entries || {};
      const categories = entries?.entry_items?.category_names || [];

      data = categories.map((category) => {
        const categoryItems = category.items || [];
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
      const exits = filteredBudgetData?.exits || {};
      const categories = exits?.exit_items?.category_names || [];

      data = categories.map((category) => {
        const categoryItems = category.items || [];
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
    if (event) event.stopPropagation();
    closeAllMenus();
    onEdit(item, type);
  };

  const handleDelete = (item, type, event) => {
    if (event) event.stopPropagation();
    closeAllMenus();
    onDelete(item, type);
  };

  const handleViewDetails = (item, event) => {
    if (event) event.stopPropagation();
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

  const handleYearChange = (selectedYear) => {
    if (onYearChange) {
      onYearChange(selectedYear);
    }
    setIsYearDropdownOpen(false);
  };

  useEffect(() => {
    return () => {
      menuRefs.current = {};
    };
  }, []);

  const LoadingRow = () => (
    <tr className="border-b border-gray-100 animate-pulse">
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
          <div className="space-y-2">
            <div className="w-32 h-4 bg-gray-200 rounded"></div>
            <div className="w-24 h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <div className="w-20 h-6 mx-auto bg-gray-200 rounded"></div>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="w-24 h-6 ml-auto bg-gray-200 rounded"></div>
      </td>
      <td className="px-6 py-4 text-center">
        <div className="w-8 h-8 mx-auto bg-gray-200 rounded-full"></div>
      </td>
    </tr>
  );

  if (isMobile) return null;

  if (loading) {
    return (
      <div className="p-6 bg-white border border-gray-200 rounded-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="w-48 h-6 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-24 bg-gray-200 rounded-lg h-9 animate-pulse"></div>
        </div>

        <div className="flex p-1 mb-6 space-x-1 bg-gray-100 rounded-lg">
          <div className="flex-1 rounded-md px-4 py-2.5 bg-gray-200 animate-pulse"></div>
          <div className="flex-1 rounded-md px-4 py-2.5 bg-gray-200 animate-pulse"></div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-3 text-sm font-medium text-left text-gray-700">
                  Catégorie
                </th>
                <th className="px-6 py-3 text-sm font-medium text-center text-gray-700">
                  Période
                </th>
                <th className="px-6 py-3 text-sm font-medium text-right text-gray-700">
                  Budget
                </th>
                <th className="px-6 py-3 text-sm font-medium text-center text-gray-700">
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
    <div className="p-6 bg-white border border-gray-200 rounded-xl">
      {/* En-tête avec l'année */}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">
              {isReadOnly ? 'Détail du budget consolidé' : 'Détail du budget'}
            </h2>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {isReadOnly
              ? 'Visualisation des budgets consolidés'
              : 'Gestion de vos revenus et dépenses'}
            {year && ` pour l'année ${year}`}
          </p>
        </div>
        {!isReadOnly && (
          <div className="flex items-center gap-3">
            {/* Sélecteur d'année */}
            <div className="relative" ref={yearDropdownRef}>
              <button
                onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                className="flex items-center justify-between gap-2 px-3 py-2 text-sm font-medium text-gray-700 transition-all duration-200 bg-white border border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 min-w-[130px]"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-gray-500" />
                  <span>Année {year}</span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-gray-500 transition-transform ${
                    isYearDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isYearDropdownOpen && (
                <div className="absolute right-0 z-50 w-full mt-1 overflow-hidden bg-white border border-gray-200 rounded-lg shadow-lg top-full min-w-[130px]">
                  <div className="py-1 max-h-60 overflow-y-auto">
                    {availableYears.map((availableYear) => (
                      <button
                        key={availableYear}
                        onClick={() => handleYearChange(availableYear)}
                        className={`flex items-center justify-between w-full px-3 py-2 text-sm text-left transition-colors hover:bg-gray-50 ${
                          availableYear === year
                            ? 'bg-blue-50 text-blue-600 font-medium'
                            : 'text-gray-700'
                        }`}
                      >
                        <span>Année {availableYear}</span>
                        {availableYear === year && (
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* <button className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 transition-all duration-200 border border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50">
              <Filter className="w-4 h-4 mr-2" />
              <span>Filtrer</span>
            </button> */}
          </div>
        )}
      </div>

      {/* Tabs - seulement pour les vues non consolidées */}
      {!isReadOnly && (
        <div className="flex p-1 mb-4 space-x-1 bg-gray-100 rounded-lg">
          <button
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
              activeTab === 'revenus'
                ? 'bg-white text-gray-900 border border-gray-200 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
            onClick={() => handleTabChange('revenus')}
          >
            Revenus ({filteredBudgetData?.entries?.entry_count || 0})
          </button>
          <button
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
              activeTab === 'depenses'
                ? 'bg-white text-gray-900 border border-gray-200 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
            onClick={() => handleTabChange('depenses')}
          >
            Dépenses ({filteredBudgetData?.exits?.exit_count || 0})
          </button>
        </div>
      )}

      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-6 py-3 text-sm font-medium text-left text-gray-700">
                Catégorie
              </th>
              <th className="px-6 py-3 text-sm font-medium text-center text-gray-700">
                Période
              </th>
              {/* <th className="px-6 py-3 text-sm font-medium text-right text-gray-700">
                Budget
              </th> */}
              <th className="px-6 py-3 text-sm font-medium text-center text-gray-700">
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
                      className="transition-colors duration-200 border-b border-gray-100 cursor-pointer hover:bg-gray-25"
                      onClick={() => handleRowClick(category.id)}
                    >
                      <td className="px-6 py-4">
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

                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                          <Calendar className="w-3 h-3" />
                          {category.items.length > 0 ? (
                            <span>Multiple</span>
                          ) : (
                            <span>-</span>
                          )}
                        </div>
                      </td>

                      {/* <td className="px-6 py-4 text-right">
                        <div className="font-semibold text-gray-900">
                          {category.amount} Ar
                        </div>
                      </td> */}

                      <td className="px-6 py-4 text-center">
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
                          <td colSpan="5" className="px-6 py-4">
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
                                <span className="px-2 py-1 text-xs text-gray-500 bg-white border border-gray-200 rounded">
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
                                    isReadOnly={isReadOnly}
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
                    <div className="flex items-center justify-center w-12 h-12 mb-3 bg-gray-100 rounded-full">
                      <Tag className="w-5 h-5" />
                    </div>
                    <div className="font-medium text-gray-500">
                      Aucune donnée disponible
                    </div>
                    <div className="mt-1 text-sm">
                      {isReadOnly
                        ? 'Aucun budget consolidé trouvé'
                        : activeTab === 'revenus'
                        ? year
                          ? `Aucun revenu trouvé pour l'année ${year}`
                          : 'Aucun revenu trouvé'
                        : year
                        ? `Aucune dépense trouvée pour l'année ${year}`
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
