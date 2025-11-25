import React, { useState, useEffect } from 'react';
import { Tag, Search, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { apiGet } from '../../../components/context/actionsMethode';
import { CategoryCard } from './components/CategoryCard';
import { LoadingGrid } from './components/LoadingGrid';
import { AddSubcategoryModal } from './components/AddSubCategorie';
import { SubcategoryDetailModal } from './components/SubCategorieDetails';

const CategoryView = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [activeTab, setActiveTab] = useState('expense');
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [criticities, setCriticities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transformedData, setTransformedData] = useState({
    expense: [],
    income: [],
    custom: { expense: [], income: [] },
  });

  const colorOptions = [
    {
      value: 'slate',
      label: 'Ardoise',
      bg: 'bg-slate-600',
      light: 'bg-slate-100',
    },
    { value: 'gray', label: 'Gris', bg: 'bg-gray-600', light: 'bg-gray-100' },
    { value: 'blue', label: 'Bleu', bg: 'bg-blue-600', light: 'bg-blue-100' },
    {
      value: 'emerald',
      label: 'Émeraude',
      bg: 'bg-emerald-600',
      light: 'bg-emerald-100',
    },
  ];

  // Appel API indépendant pour les catégories
  const fetchCategories = async () => {
    try {
      const resCategories = await apiGet('/categories');
      setCategories(resCategories.categories?.category_items || []);
    } catch (error) {
      console.log('Error fetching categories:', error);
    }
  };

  // Appel API indépendant pour les sous-catégories
  const fetchSubCategories = async () => {
    try {
      const resSubCategories = await apiGet('/sub-categories');
      setSubCategories(
        resSubCategories.sub_categories?.sub_category_items || []
      );
      setCriticities(resSubCategories.criticities?.criticity_items || []);
    } catch (error) {
      console.log('Error fetching sub-categories:', error);
    }
  };

  // Transformer les données de l'API en format utilisable
  const transformApiData = (categoriesData, subCategoriesData) => {
    const baseCategories = categoriesData.map((category) => ({
      id: category.id.toString(),
      name: category.name,
      description: '',
      type: category.category_type_id === 1 ? 'expense' : 'income',
      color: 'slate',
      icon: 'Tag',
      isBase: true,
      subcategories: subCategoriesData
        .filter((sub) => sub.category_id === category.id)
        .map((sub) => ({
          id: sub.id.toString(),
          name: sub.name,
          criticity: {
            id: sub.criticity_id,
            name: sub.criticity_name,
          },
        })),
    }));

    // Séparer par type
    const expenseCategories = baseCategories.filter(
      (cat) => cat.type === 'expense'
    );
    const incomeCategories = baseCategories.filter(
      (cat) => cat.type === 'income'
    );

    return {
      expense: expenseCategories,
      income: incomeCategories,
      custom: {
        expense: [],
        income: [],
      },
    };
  };

  // Mettre à jour les données transformées quand les données brutes changent
  useEffect(() => {
    if (categories.length > 0 && subCategories.length > 0) {
      const newTransformedData = transformApiData(categories, subCategories);
      setTransformedData(newTransformedData);
    }
  }, [categories, subCategories]);

  // Service utilisant les données de l'API
  const categoryService = {
    getAllCategories: (type) => {
      return [...transformedData[type], ...transformedData.custom[type]];
    },

    getBaseCategories: (type) => {
      return transformedData[type];
    },
  };

  const filteredCategories = (type) => {
    const categories = categoryService.getAllCategories(type);
    if (!searchTerm.trim()) return categories;

    const searchLower = searchTerm.toLowerCase();

    return categories.filter(
      (category) =>
        category.name.toLowerCase().includes(searchLower) ||
        (category.description &&
          category.description.toLowerCase().includes(searchLower)) ||
        category.subcategories.some((sub) =>
          sub.name.toLowerCase().includes(searchLower)
        )
    );
  };

  const handleAddSubcategory = (category) => {
    setSelectedCategory(category);
    setIsCreateDialogOpen(true);
  };

  // Fonction pour ouvrir le modal de détails
  const handleViewSubcategoryDetails = (category, subcategory) => {
    setSelectedCategory(category);
    setSelectedSubCategory(subcategory);
    setIsDetailModalOpen(true);
  };

  // Fonction pour fermer le modal d'ajout
  const closeCreateModal = () => {
    setIsCreateDialogOpen(false);
    setSelectedCategory(null);
  };

  // Fonction pour fermer le modal de détails
  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedSubCategory(null);
    setSelectedCategory(null);
  };

  // Chargement initial des données
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchCategories(), fetchSubCategories()]);
      } catch (error) {
        console.log('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Compter les catégories par type pour les tabs
  const getCategoryCounts = () => {
    const expenseCount = categories.filter(
      (cat) => cat.category_type_id === 1
    ).length;
    const incomeCount = categories.filter(
      (cat) => cat.category_type_id === 2
    ).length;

    return { expense: expenseCount, income: incomeCount };
  };

  const categoryCounts = getCategoryCounts();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="p-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Catégories
              </h1>
              <p className="text-gray-600">
                Gérez vos catégories de revenus et dépenses
              </p>
            </div>
          </div>

          {/* Search and Tabs */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher une catégorie..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                />
              </div>

              <div className="text-sm text-gray-500">
                {loading ? (
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                ) : (
                  `${filteredCategories(activeTab).length} catégorie${
                    filteredCategories(activeTab).length !== 1 ? 's' : ''
                  }`
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('expense')}
                className={`flex items-center space-x-2 px-4 py-2 rounded text-sm font-medium transition-colors ${
                  activeTab === 'expense'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <TrendingDown className="w-4 h-4" />
                <span>
                  Sorties ({loading ? '...' : categoryCounts.expense})
                </span>
              </button>
              <button
                onClick={() => setActiveTab('income')}
                className={`flex items-center space-x-2 px-4 py-2 rounded text-sm font-medium transition-colors ${
                  activeTab === 'income'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Entrées ({loading ? '...' : categoryCounts.income})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Base Categories */}
          <section>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Catégories de Base
                </h2>
                <p className="text-gray-600">
                  Catégories prédéfinies, non modifiables
                </p>
              </div>
            </div>

            {loading ? (
              <LoadingGrid />
            ) : categories.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Tag className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Aucune catégorie trouvée
                </h3>
                <p className="text-gray-500">
                  Aucune catégorie n'a été trouvée dans le système.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCategories(activeTab).map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    colorOptions={colorOptions}
                    handleAddSubcategory={handleAddSubcategory}
                    handleViewSubcategoryDetails={handleViewSubcategoryDetails}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Modal d'ajout de sous-catégories */}
      <AddSubcategoryModal
        isOpen={isCreateDialogOpen}
        onClose={closeCreateModal}
        selectedCategory={selectedCategory}
        criticities={criticities}
        onSubcategoriesCreated={fetchSubCategories}
      />

      {/* Modal de détails de sous-catégorie */}
      <SubcategoryDetailModal
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        selectedCategory={selectedCategory}
        selectedSubCategory={selectedSubCategory}
        criticities={criticities}
        onSubcategoryUpdated={fetchSubCategories}
      />
    </div>
  );
};

export default CategoryView;
