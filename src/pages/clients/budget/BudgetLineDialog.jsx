import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { useSettings } from "../../../contexts/SettingsContext";
import { useTranslation } from "../../../i18n/translations";
import categoryService from "../../../service/categoryService";

const BudgetLineDialog = ({ open, onOpenChange, onSave, editLine = null }) => {
  const { language, currency, currencies } = useSettings();
  const { t } = useTranslation(language);

  const [formData, setFormData] = useState(
    editLine || {
      type: "expense",
      mainCategory: "",
      subcategory: "",
      amount: "",
      currency: currency,
      frequency: "monthly",
      startDate: "",
      endDate: "",
      isIndefinite: false,
      description: "",
    }
  );

  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableSubcategories, setAvailableSubcategories] = useState([]);

  // Load categories when dialog opens or type changes
  useEffect(() => {
    if (open) {
      const categoryType = formData.type === "revenue" ? "income" : "expense";
      const categories = categoryService.getAllCategories(categoryType);
      setAvailableCategories(categories);

      // Reset subcategories when type changes
      setAvailableSubcategories([]);
      if (formData.mainCategory && !editLine) {
        setFormData((prev) => ({ ...prev, mainCategory: "", subcategory: "" }));
      }
    }
  }, [open, formData.type]);

  // Load subcategories when main category changes
  useEffect(() => {
    if (formData.mainCategory) {
      const categoryType = formData.type === "revenue" ? "income" : "expense";
      const category = categoryService.getCategoryById(
        formData.mainCategory,
        categoryType
      );
      if (category) {
        setAvailableSubcategories(category.subcategories);
        // Reset subcategory selection when main category changes
        if (!editLine) {
          setFormData((prev) => ({ ...prev, subcategory: "" }));
        }
      }
    } else {
      setAvailableSubcategories([]);
      setFormData((prev) => ({ ...prev, subcategory: "" }));
    }
  }, [formData.mainCategory, formData.type]);

  const frequencies = [
    { value: "one_time", label: t("oneTime") },
    { value: "daily", label: t("daily") },
    { value: "weekly", label: t("weekly") },
    { value: "biweekly", label: t("biweekly") },
    { value: "monthly", label: t("monthly") },
    { value: "bimonthly", label: t("bimonthly") },
    { value: "quarterly", label: t("quarterly") },
    { value: "semiannual", label: t("semiannual") },
    { value: "annual", label: t("annual") },
  ];

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.mainCategory || !formData.subcategory || !formData.amount) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    // Get category and subcategory details for saving
    const categoryType = formData.type === "revenue" ? "income" : "expense";
    const category = categoryService.getCategoryById(
      formData.mainCategory,
      categoryType
    );
    const subcategory = categoryService.getSubcategoryById(
      formData.mainCategory,
      formData.subcategory,
      categoryType
    );

    const budgetLineData = {
      ...formData,
      categoryName: category?.name || "",
      subcategoryName: subcategory?.name || "",
      categoryIcon: category?.icon,
      categoryColor: category?.color,
    };

    onSave(budgetLineData);
    onOpenChange(false);
    // Reset form
    setFormData({
      type: "expense",
      mainCategory: "",
      subcategory: "",
      amount: "",
      currency: currency,
      frequency: "monthly",
      startDate: "",
      endDate: "",
      isIndefinite: false,
      description: "",
    });
  };

  // Get current category for display
  const getCurrentCategory = () => {
    if (!formData.mainCategory) return null;
    const categoryType = formData.type === "revenue" ? "income" : "expense";
    return categoryService.getCategoryById(formData.mainCategory, categoryType);
  };

  const currentCategory = getCurrentCategory();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editLine ? t("editBudgetLine") : t("addBudgetLine")}
          </DialogTitle>
          <DialogDescription>{t("budgetLineDescription")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Type (Revenu/Dépense) */}
          <div className="space-y-2">
            <Label>{t("type")}</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleChange("type", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">{t("expense")}</SelectItem>
                <SelectItem value="revenue">{t("revenue")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Catégorie principale */}
          <div className="space-y-2">
            <Label>Catégorie principale *</Label>
            <Select
              value={formData.mainCategory}
              onValueChange={(value) => handleChange("mainCategory", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir une catégorie..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {availableCategories.map((category) => {
                  const IconComponent = category.icon;
                  return (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center space-x-2">
                        <IconComponent
                          className={`w-4 h-4 text-${category.color}-600`}
                        />
                        <span>{category.name}</span>
                        {category.isBase && (
                          <Badge variant="secondary" className="text-xs ml-2">
                            Base
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Sous-catégorie */}
          <div className="space-y-2">
            <Label>Sous-catégorie *</Label>
            <Select
              value={formData.subcategory}
              onValueChange={(value) => handleChange("subcategory", value)}
              disabled={
                !formData.mainCategory || availableSubcategories.length === 0
              }
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !formData.mainCategory
                      ? "Sélectionnez d'abord une catégorie principale..."
                      : availableSubcategories.length === 0
                      ? "Aucune sous-catégorie disponible"
                      : "Choisir une sous-catégorie..."
                  }
                />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {availableSubcategories.map((subcategory) => (
                  <SelectItem key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Aperçu de la catégorisation */}
          {currentCategory && formData.subcategory && (
            <div className="p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center space-x-2">
                <currentCategory.icon
                  className={`w-5 h-5 text-${currentCategory.color}-600`}
                />
                <span className="font-medium text-gray-700">
                  {currentCategory.name}
                </span>
                <span className="text-gray-400">></span>
                <span className="text-gray-600">
                  {
                    availableSubcategories.find(
                      (sub) => sub.id === formData.subcategory
                    )?.name
                  }
                </span>
              </div>
            </div>
          )}

          {/* Montant et Devise */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">{t("amount")} *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleChange("amount", e.target.value)}
                placeholder="5000.00"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("currency")}</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => handleChange("currency", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {currencies.map((curr) => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {curr.code} - {curr.symbol} {curr.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Fréquence */}
          <div className="space-y-2">
            <Label>{t("frequency")}</Label>
            <Select
              value={formData.frequency}
              onValueChange={(value) => handleChange("frequency", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {frequencies.map((freq) => (
                  <SelectItem key={freq.value} value={freq.value}>
                    {freq.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">{t("startDate")}</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange("startDate", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">{t("endDate")}</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleChange("endDate", e.target.value)}
                disabled={formData.isIndefinite}
              />
            </div>
          </div>

          {/* Indéterminé */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isIndefinite"
              checked={formData.isIndefinite}
              onCheckedChange={(checked) => {
                handleChange("isIndefinite", checked);
                if (checked) {
                  handleChange("endDate", "");
                }
              }}
            />
            <Label htmlFor="isIndefinite" className="cursor-pointer">
              {t("indefinite")}
            </Label>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              {t("description")} ({t("optional")})
            </Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder={t("descriptionPlaceholder")}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleSubmit}>
              {editLine ? t("save") : t("add")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BudgetLineDialog;
