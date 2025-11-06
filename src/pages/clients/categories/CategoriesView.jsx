import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Tag, FolderPlus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/Select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../../components/ui/tabs';
import { Separator } from '../../../components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Button } from '../../../components/ui/Button';
import { AddSubcategoryDialog } from './components-category/add-sub-category';
import { CategoryCard } from './components-category/category-card';
import {
  getCategories,
  getSubCategories,
} from '../../../components/context/categoriesActions';

// Hook personnalisé pour gérer les catégories avec API
const useCategories = () => {
  const [categories, setCategories] = useState({
    base: { expense: [], income: [] },
    custom: { expense: [], income: [] },
  });
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Charger les catégories et sous-catégories depuis l'API
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      // Charger les catégories
      const categoriesResponse = await getCategories();
      const categoriesData = categoriesResponse.categories.category_items;

      // Charger les sous-catégories
      const subcategoriesResponse = await getSubCategories();
      const subcategoriesData =
        subcategoriesResponse.sub_categories.sub_category_items;

      // Transformer les données de l'API en format attendu par le frontend
      const transformedCategories = transformCategoriesData(
        categoriesData,
        subcategoriesData
      );

      setCategories(transformedCategories);
      setSubcategories(subcategoriesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };
  console.log(categories);

  // Transformer les données de l'API en format frontend
  const transformCategoriesData = (categoriesData, subcategoriesData) => {
    const baseCategories = {
      expense: [],
      income: [],
    };

    const customCategories = {
      expense: [],
      income: [],
    };

    // Transformer les catégories
    categoriesData.forEach((category) => {
      const categoryType =
        category.category_type_id === 2 ? 'income' : 'expense';

      // Trouver les sous-catégories associées
      const categorySubcategories = subcategoriesData
        .filter((sub) => sub.category_id === category.id)
        .map((sub) => ({
          name: sub.name,
          criticity: sub.criticity_name,
        }));

      const categoryObj = {
        id: category.id.toString(),
        name: category.name,
        description: '', // À adapter si votre API fournit une description
        type: categoryType,
        color: getColorByCategory(category.name),
        icon: Tag,
        isBase: true, // À adapter selon votre logique métier
        subcategories: categorySubcategories,
      };

      // Pour l'exemple, on considère toutes les catégories comme "base"
      // Vous devrez adapter cette logique selon votre métier
      baseCategories[categoryType].push(categoryObj);
    });

    return {
      base: baseCategories,
      custom: customCategories,
    };
  };

  // Helper pour assigner des couleurs aux catégories
  const getColorByCategory = (categoryName) => {
    const colorMap = {
      Alimentation: 'green',
      Transport: 'blue',
      Logement: 'purple',
      Salaire: 'green',
      Freelance: 'blue',
      Loisirs: 'pink',
      Santé: 'red',
      Investissements: 'orange',
    };

    return colorMap[categoryName] || 'blue';
  };

  const addCustomCategory = async (categoryData) => {
    try {
      // Implémenter l'appel API pour créer une catégorie
      // await createCategory(categoryData);
      await fetchAllData(); // Recharger les données
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  };

  const updateCustomCategory = async (id, type, categoryData) => {
    try {
      // Implémenter l'appel API pour modifier une catégorie
      // await updateCategory(id, categoryData);
      await fetchAllData(); // Recharger les données
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  };

  const deleteCustomCategory = async (id, type) => {
    try {
      // Implémenter l'appel API pour supprimer une catégorie
      // await deleteCategory(id);
      await fetchAllData(); // Recharger les données
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  };

  const addSubcategory = async (categoryId, type, subcategoryName) => {
    try {
      // Implémenter l'appel API pour créer une sous-catégorie
      // await createSubcategory({ categoryId, name: subcategoryName });
      await fetchAllData(); // Recharger les données
    } catch (error) {
      console.error('Error adding subcategory:', error);
      throw error;
    }
  };

  const updateSubcategory = async (
    categoryId,
    type,
    subcategoryIndex,
    newName
  ) => {
    try {
      // Implémenter l'appel API pour modifier une sous-catégorie
      // Note: Vous devrez adapter selon votre structure d'ID de sous-catégories
      await fetchAllData(); // Recharger les données
    } catch (error) {
      console.error('Error updating subcategory:', error);
      throw error;
    }
  };

  const deleteSubcategory = async (categoryId, type, subcategoryIndex) => {
    try {
      // Implémenter l'appel API pour supprimer une sous-catégorie
      await fetchAllData(); // Recharger les données
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      throw error;
    }
  };

  const getBaseCategories = (type) => categories.base[type] || [];
  const getCustomCategories = (type) => categories.custom[type] || [];

  return {
    categories,
    subcategories,
    loading,
    addCustomCategory,
    updateCustomCategory,
    deleteCustomCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    getBaseCategories,
    getCustomCategories,
    refetchCategories: fetchAllData,
  };
};

// Composant CategoryForm (identique mais adapté pour l'API)
const CategoryForm = ({
  isOpen,
  onOpenChange,
  editingCategory,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'expense',
    color: 'blue',
    subcategories: [{ name: '' }],
  });

  const colorOptions = [
    { value: 'blue', label: 'Bleu', class: 'bg-blue-500' },
    { value: 'green', label: 'Vert', class: 'bg-green-500' },
    { value: 'red', label: 'Rouge', class: 'bg-red-500' },
    { value: 'purple', label: 'Violet', class: 'bg-purple-500' },
    { value: 'orange', label: 'Orange', class: 'bg-orange-500' },
    { value: 'cyan', label: 'Cyan', class: 'bg-cyan-500' },
    { value: 'pink', label: 'Rose', class: 'bg-pink-500' },
    { value: 'yellow', label: 'Jaune', class: 'bg-yellow-500' },
    { value: 'indigo', label: 'Indigo', class: 'bg-indigo-500' },
    { value: 'emerald', label: 'Émeraude', class: 'bg-emerald-500' },
  ];

  useEffect(() => {
    if (editingCategory) {
      setFormData({
        name: editingCategory.name,
        description: editingCategory.description || '',
        type: editingCategory.type,
        color: editingCategory.color,
        subcategories: editingCategory.subcategories.length
          ? editingCategory.subcategories.map((sub) => ({ name: sub.name }))
          : [{ name: '' }],
      });
    } else {
      setFormData({
        name: '',
        description: '',
        type: 'expense',
        color: 'blue',
        subcategories: [{ name: '' }],
      });
    }
  }, [editingCategory, isOpen]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubcategoryChange = (index, value) => {
    const newSubcategories = [...formData.subcategories];
    newSubcategories[index].name = value;
    setFormData({
      ...formData,
      subcategories: newSubcategories,
    });
  };

  const addSubcategoryField = () => {
    setFormData({
      ...formData,
      subcategories: [...formData.subcategories, { name: '' }],
    });
  };

  const removeSubcategoryField = (index) => {
    const newSubcategories = formData.subcategories.filter(
      (_, i) => i !== index
    );
    setFormData({
      ...formData,
      subcategories: newSubcategories,
    });
  };

  const handleSave = () => {
    const categoryData = {
      name: formData.name,
      description: formData.description,
      type: formData.type,
      color: formData.color,
      icon: 'Tag',
      subcategories: formData.subcategories
        .filter((sub) => sub.name.trim())
        .map((sub) => ({ name: sub.name.trim() })),
    };

    onSave(categoryData);
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle catégorie
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingCategory
              ? 'Modifier la catégorie'
              : 'Créer une nouvelle catégorie'}
          </DialogTitle>
          <DialogDescription>
            Ajoutez une catégorie personnalisée avec ses sous-catégories.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la catégorie</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ex: Services externes"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleSelectChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Sortie</SelectItem>
                  <SelectItem value="income">Entrée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optionnel)</Label>
            <textarea
              className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Description de la catégorie..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Couleur</Label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`w-8 h-8 rounded-full ${color.class} border-2 ${
                    formData.color === color.value
                      ? 'border-gray-800'
                      : 'border-gray-300'
                  }`}
                  onClick={() => handleSelectChange('color', color.value)}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Sous-catégories</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSubcategoryField}
              >
                <Plus className="w-4 h-4 mr-1" />
                Ajouter
              </Button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {formData.subcategories.map((subcategory, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={subcategory.name}
                    onChange={(e) =>
                      handleSubcategoryChange(index, e.target.value)
                    }
                    placeholder="Nom de la sous-catégorie"
                    className="flex-1"
                  />
                  {formData.subcategories.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSubcategoryField(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel}>
              Annuler
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              {editingCategory ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Composant EditSubcategoryDialog (identique)
const EditSubcategoryDialog = ({
  isOpen,
  onOpenChange,
  onSave,
  category,
  subcategoryIndex,
  currentName,
}) => {
  const [subcategoryName, setSubcategoryName] = useState(currentName || '');

  useEffect(() => {
    setSubcategoryName(currentName || '');
  }, [currentName, isOpen]);

  const handleSave = () => {
    if (subcategoryName.trim()) {
      onSave(category, subcategoryIndex, subcategoryName);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier la sous-catégorie</DialogTitle>
          <DialogDescription>
            Modifiez la sous-catégorie de "{category?.name}"
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="subcategoryName">Nom de la sous-catégorie</Label>
            <Input
              id="subcategoryName"
              value={subcategoryName}
              onChange={(e) => setSubcategoryName(e.target.value)}
              placeholder="Ex: Abonnements"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Modifier
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Composant CategoriesSection (identique)
const CategoriesSection = ({
  type,
  onEditCategory,
  onDeleteCategory,
  onAddSubcategory,
  onEditSubcategory,
  onDeleteSubcategory,
  getBaseCategories,
  getCustomCategories,
}) => {
  const baseCategories = getBaseCategories(type);
  const customCategories = getCustomCategories(type);

  return (
    <div className="space-y-6">
      {/* Base Categories */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center">
          <FolderPlus className="w-5 h-5 mr-2 text-blue-600" />
          Catégories de base
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {baseCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onEdit={() => {}} // Désactivé pour les catégories de base
              onDelete={() => {}} // Désactivé pour les catégories de base
              onAddSubcategory={() => {}} // Désactivé pour les catégories de base
              onEditSubcategory={() => {}} // Désactivé pour les catégories de base
              onDeleteSubcategory={() => {}} // Désactivé pour les catégories de base
            />
          ))}
        </div>
      </div>

      <Separator />

      {/* Custom Categories */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center">
          <Tag className="w-5 h-5 mr-2 text-green-600" />
          Catégories personnalisées
        </h3>
        {customCategories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FolderPlus className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Aucune catégorie personnalisée</p>
            <p className="text-sm">
              Cliquez sur "Nouvelle catégorie" pour commencer
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customCategories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onEdit={onEditCategory}
                onDelete={onDeleteCategory}
                onAddSubcategory={onAddSubcategory}
                onEditSubcategory={onEditSubcategory}
                onDeleteSubcategory={onDeleteSubcategory}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Composant principal
const CategoriesPage = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAddSubcategoryDialogOpen, setIsAddSubcategoryDialogOpen] =
    useState(false);
  const [isEditSubcategoryDialogOpen, setIsEditSubcategoryDialogOpen] =
    useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategoryIndex, setSelectedSubcategoryIndex] =
    useState(null);
  const [selectedSubcategoryName, setSelectedSubcategoryName] = useState('');

  const {
    categories,
    loading,
    addCustomCategory,
    updateCustomCategory,
    deleteCustomCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    getBaseCategories,
    getCustomCategories,
  } = useCategories();

  const handleAddSubcategory = (category) => {
    setSelectedCategory(category);
    setIsAddSubcategoryDialogOpen(true);
  };

  const handleSaveSubcategory = async (category, subcategoryName) => {
    try {
      await addSubcategory(category.id, category.type, subcategoryName);
      setIsAddSubcategoryDialogOpen(false);
    } catch (error) {
      alert("Erreur lors de l'ajout de la sous-catégorie");
    }
  };

  const handleEditSubcategory = (category, subcategoryIndex) => {
    setSelectedCategory(category);
    setSelectedSubcategoryIndex(subcategoryIndex);
    setSelectedSubcategoryName(category.subcategories[subcategoryIndex].name);
    setIsEditSubcategoryDialogOpen(true);
  };

  const handleSaveEditSubcategory = async (
    category,
    subcategoryIndex,
    newName
  ) => {
    try {
      await updateSubcategory(
        category.id,
        category.type,
        subcategoryIndex,
        newName
      );
      setIsEditSubcategoryDialogOpen(false);
    } catch (error) {
      alert('Erreur lors de la modification de la sous-catégorie');
    }
  };

  const handleDeleteSubcategory = async (category, subcategoryIndex) => {
    if (
      window.confirm(
        'Êtes-vous sûr de vouloir supprimer cette sous-catégorie ?'
      )
    ) {
      try {
        await deleteSubcategory(category.id, category.type, subcategoryIndex);
      } catch (error) {
        alert('Erreur lors de la suppression de la sous-catégorie');
      }
    }
  };

  const handleSaveCategory = async (categoryData) => {
    try {
      if (editingCategory) {
        await updateCustomCategory(
          editingCategory.id,
          editingCategory.type,
          categoryData
        );
      } else {
        await addCustomCategory(categoryData);
      }

      setIsCreateDialogOpen(false);
      setEditingCategory(null);
    } catch (error) {
      alert('Erreur lors de la sauvegarde de la catégorie');
    }
  };

  const handleCancelCategory = () => {
    setIsCreateDialogOpen(false);
    setEditingCategory(null);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setIsCreateDialogOpen(true);
  };

  const handleDeleteCategory = async (category) => {
    if (
      window.confirm(
        `Êtes-vous sûr de vouloir supprimer la catégorie "${category.name}" ?`
      )
    ) {
      try {
        await deleteCustomCategory(category.id, category.type);
      } catch (error) {
        alert('Erreur lors de la suppression de la catégorie');
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des catégories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des catégories</h1>
          <p className="text-gray-600">
            Gestion des catégories et sous-catégories budgétaires
          </p>
        </div>

        <CategoryForm
          isOpen={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          editingCategory={editingCategory}
          onSave={handleSaveCategory}
          onCancel={handleCancelCategory}
        />
      </div>

      {/* Dialogs pour les sous-catégories */}
      <AddSubcategoryDialog
        isOpen={isAddSubcategoryDialogOpen}
        onOpenChange={setIsAddSubcategoryDialogOpen}
        onSave={handleSaveSubcategory}
        category={selectedCategory}
      />

      <EditSubcategoryDialog
        isOpen={isEditSubcategoryDialogOpen}
        onOpenChange={setIsEditSubcategoryDialogOpen}
        onSave={handleSaveEditSubcategory}
        category={selectedCategory}
        subcategoryIndex={selectedSubcategoryIndex}
        currentName={selectedSubcategoryName}
      />

      {/* Categories Management */}
      <Tabs defaultValue="expense" className="space-y-4">
        <TabsList>
          <TabsTrigger value="expense">Catégories de sortie</TabsTrigger>
          <TabsTrigger value="income">Catégories d'entrée</TabsTrigger>
        </TabsList>

        <TabsContent value="expense">
          <CategoriesSection
            type="expense"
            onEditCategory={handleEditCategory}
            onDeleteCategory={handleDeleteCategory}
            onAddSubcategory={handleAddSubcategory}
            onEditSubcategory={handleEditSubcategory}
            onDeleteSubcategory={handleDeleteSubcategory}
            getBaseCategories={getBaseCategories}
            getCustomCategories={getCustomCategories}
          />
        </TabsContent>

        <TabsContent value="income">
          <CategoriesSection
            type="income"
            onEditCategory={handleEditCategory}
            onDeleteCategory={handleDeleteCategory}
            onAddSubcategory={handleAddSubcategory}
            onEditSubcategory={handleEditSubcategory}
            onDeleteSubcategory={handleDeleteSubcategory}
            getBaseCategories={getBaseCategories}
            getCustomCategories={getCustomCategories}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CategoriesPage;
