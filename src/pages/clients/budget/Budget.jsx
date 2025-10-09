import React, { useState } from "react";
import {
  Plus,
  Download,
  Upload,
  Filter,
  Calendar,
  Repeat,
  MoreVertical,
  Edit,
  Trash2,
  Archive,
  Tag,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import BudgetLineDialog from "./BudgetLineDialog";
import { useSettings } from "../../../contexts/SettingsContext";
import { useTranslation } from "../../../i18n/translations";
import categoryService from "../../../service/categoryService";

const BudgetPage = () => {
  const [activeTab, setActiveTab] = useState("revenus");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLine, setEditingLine] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [selectedLine, setSelectedLine] = useState(null);
  const { language, currency, formatCurrency } = useSettings();
  const { t } = useTranslation(language);

  const [budgetData, setBudgetData] = useState({
    revenus: [
      {
        id: 1,
        type: "revenue",
        mainCategory: "ventes_produits_services",
        subcategory: "ca_principal",
        categoryName: "Ventes de produits/services",
        subcategoryName: "Chiffre affaires principal",
        categoryColor: "green",
        montant: 45000,
        currency: "EUR",
        reel: 42300,
        ecart: -2700,
        frequency: "monthly",
        startDate: "2025-01-01",
        endDate: "2025-12-31",
        isIndefinite: false,
        description: "Ventes mensuelles principales",
      },
      {
        id: 2,
        type: "revenue",
        mainCategory: "ventes_produits_services",
        subcategory: "prestations",
        categoryName: "Ventes de produits/services",
        subcategoryName: "Prestations de service",
        categoryColor: "green",
        montant: 15000,
        currency: "USD",
        reel: 16200,
        ecart: 1200,
        frequency: "monthly",
        startDate: "2025-01-01",
        endDate: "",
        isIndefinite: true,
        description: "Services de consulting",
      },
      {
        id: 3,
        type: "revenue",
        mainCategory: "subventions_aides",
        subcategory: "aides_publiques",
        categoryName: "Subventions et aides",
        subcategoryName: "Aides publiques",
        categoryColor: "orange",
        montant: 5000,
        currency: "EUR",
        reel: 5000,
        ecart: 0,
        frequency: "quarterly",
        startDate: "2025-01-01",
        endDate: "2025-12-31",
        isIndefinite: false,
        description: "Subvention innovation",
      },
    ],
    depenses: [
      {
        id: 1,
        type: "expense",
        mainCategory: "remuneration_personnel",
        subcategory: "salaires",
        categoryName: "Rémunération du personnel",
        subcategoryName: "Salaires",
        categoryColor: "indigo",
        montant: 25000,
        currency: "EUR",
        reel: 25000,
        ecart: 0,
        frequency: "monthly",
        startDate: "2025-01-01",
        endDate: "",
        isIndefinite: true,
        description: "Salaires équipe",
      },
      {
        id: 2,
        type: "expense",
        mainCategory: "logement",
        subcategory: "loyer",
        categoryName: "Logement",
        subcategoryName: "Loyer",
        categoryColor: "emerald",
        montant: 3000,
        currency: "EUR",
        reel: 3000,
        ecart: 0,
        frequency: "monthly",
        startDate: "2025-01-01",
        endDate: "",
        isIndefinite: true,
        description: "Loyer bureau",
      },
      {
        id: 3,
        type: "expense",
        mainCategory: "achats_materiel",
        subcategory: "materiel_bureau",
        categoryName: "Achats de matériel",
        subcategoryName: "Matériel de bureau",
        categoryColor: "stone",
        montant: 5000,
        currency: "USD",
        reel: 4200,
        ecart: -800,
        frequency: "monthly",
        startDate: "2025-01-01",
        endDate: "2025-06-30",
        isIndefinite: false,
        description: "Équipement informatique",
      },
      {
        id: 4,
        type: "expense",
        mainCategory: "nourriture_restauration",
        subcategory: "restaurant",
        categoryName: "Nourriture & Restauration",
        subcategoryName: "Restaurant",
        categoryColor: "red",
        montant: 2000,
        currency: "CAD",
        reel: 2300,
        ecart: 300,
        frequency: "monthly",
        startDate: "2025-01-01",
        endDate: "",
        isIndefinite: true,
        description: "Repas d'affaires",
      },
    ],
  });

  const calculateTotal = (items) => {
    return items.reduce((sum, item) => sum + item.montant, 0);
  };

  const calculateReel = (items) => {
    return items.reduce((sum, item) => sum + item.reel, 0);
  };

  const handleSaveBudgetLine = (lineData) => {
    if (editingLine) {
      // Edit existing line
      const type = lineData.type === "revenue" ? "revenus" : "depenses";
      setBudgetData((prev) => ({
        ...prev,
        [type]: prev[type].map((item) =>
          item.id === editingLine.id
            ? {
                ...item,
                type: lineData.type,
                mainCategory: lineData.mainCategory,
                subcategory: lineData.subcategory,
                categoryName: lineData.categoryName,
                subcategoryName: lineData.subcategoryName,
                categoryColor: lineData.categoryColor,
                montant: parseFloat(lineData.amount) || 0,
                currency: lineData.currency,
                frequency: lineData.frequency,
                startDate: lineData.startDate,
                endDate: lineData.endDate,
                isIndefinite: lineData.isIndefinite,
                description: lineData.description,
              }
            : item
        ),
      }));
      setEditingLine(null);
    } else {
      // Add new line
      const type = lineData.type === "revenue" ? "revenus" : "depenses";
      const newLine = {
        id: budgetData[type].length + 1,
        type: lineData.type,
        mainCategory: lineData.mainCategory,
        subcategory: lineData.subcategory,
        categoryName: lineData.categoryName,
        subcategoryName: lineData.subcategoryName,
        categoryColor: lineData.categoryColor,
        montant: parseFloat(lineData.amount) || 0,
        currency: lineData.currency,
        reel: 0,
        ecart: 0,
        frequency: lineData.frequency,
        startDate: lineData.startDate,
        endDate: lineData.endDate,
        isIndefinite: lineData.isIndefinite,
        description: lineData.description,
        archived: false,
      };

      setBudgetData((prev) => ({
        ...prev,
        [type]: [...prev[type], newLine],
      }));
    }
  };

  const handleEditLine = (line, type) => {
    setEditingLine({
      ...line,
      type: type === "revenus" ? "revenue" : "expense",
      amount: line.montant.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleDeleteLine = (line, type) => {
    setSelectedLine({ ...line, type });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedLine) {
      setBudgetData((prev) => ({
        ...prev,
        [selectedLine.type]: prev[selectedLine.type].filter(
          (item) => item.id !== selectedLine.id
        ),
      }));
      setDeleteDialogOpen(false);
      setSelectedLine(null);
    }
  };

  const handleArchiveLine = (line, type) => {
    setSelectedLine({ ...line, type });
    setArchiveDialogOpen(true);
  };

  const confirmArchive = () => {
    if (selectedLine) {
      setBudgetData((prev) => ({
        ...prev,
        [selectedLine.type]: prev[selectedLine.type].map((item) =>
          item.id === selectedLine.id ? { ...item, archived: true } : item
        ),
      }));
      setArchiveDialogOpen(false);
      setSelectedLine(null);
    }
  };

  const getFrequencyBadge = (frequency) => {
    const frequencyMap = {
      one_time: { label: t("oneTime"), color: "bg-gray-100 text-gray-700" },
      daily: { label: t("daily"), color: "bg-blue-100 text-blue-700" },
      weekly: { label: t("weekly"), color: "bg-green-100 text-green-700" },
      biweekly: {
        label: t("biweekly"),
        color: "bg-purple-100 text-purple-700",
      },
      monthly: { label: t("monthly"), color: "bg-indigo-100 text-indigo-700" },
      bimonthly: { label: t("bimonthly"), color: "bg-pink-100 text-pink-700" },
      quarterly: {
        label: t("quarterly"),
        color: "bg-orange-100 text-orange-700",
      },
      semiannual: {
        label: t("semiannual"),
        color: "bg-teal-100 text-teal-700",
      },
      annual: { label: t("annual"), color: "bg-cyan-100 text-cyan-700" },
    };
    const freq = frequencyMap[frequency] || frequencyMap.monthly;
    return (
      <Badge className={`${freq.color} hover:${freq.color}`}>
        {freq.label}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t("budgetTitle")}</h1>
          <p className="text-gray-600">{t("budgetSubtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            {t("import")}
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            {t("export")}
          </Button>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            {t("newLine")}
          </Button>
        </div>
      </div>

      {/* Budget Line Dialog */}
      <BudgetLineDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveBudgetLine}
        editLine={editingLine}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConfirmationMessage")}
              {selectedLine && (
                <div className="mt-2 font-medium">
                  {selectedLine.categoryName || selectedLine.categorie}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmArchive")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("archiveConfirmationMessage")}
              {selectedLine && (
                <div className="mt-2 font-medium">
                  {selectedLine.categoryName || selectedLine.categorie}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmArchive}>
              {t("archive")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Revenus prévus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {calculateTotal(budgetData.revenus).toLocaleString()} €
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Réalisé: {calculateReel(budgetData.revenus).toLocaleString()} €
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Dépenses prévues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {calculateTotal(budgetData.depenses).toLocaleString()} €
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Réalisé: {calculateReel(budgetData.depenses).toLocaleString()} €
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Solde prévisionnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {(
                calculateTotal(budgetData.revenus) -
                calculateTotal(budgetData.depenses)
              ).toLocaleString()}{" "}
              €
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Réalisé:{" "}
              {(
                calculateReel(budgetData.revenus) -
                calculateReel(budgetData.depenses)
              ).toLocaleString()}{" "}
              €
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Détail du budget</CardTitle>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filtrer
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="revenus">Revenus</TabsTrigger>
              <TabsTrigger value="depenses">Dépenses</TabsTrigger>
            </TabsList>

            <TabsContent value="revenus" className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        {t("category")}
                      </th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">
                        {t("frequency")}
                      </th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">
                        {t("period")}
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">
                        {t("budget")}
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">
                        {t("actual")}
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">
                        {t("variance")}
                      </th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">
                        {t("actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {budgetData.revenus
                      .filter((item) => !item.archived)
                      .map((item) => {
                        const categoryType = "income";
                        const category = item.mainCategory
                          ? categoryService.getCategoryById(
                              item.mainCategory,
                              categoryType
                            )
                          : null;
                        const IconComponent = category?.icon || Tag;

                        return (
                          <tr
                            key={item.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`p-1.5 rounded-lg bg-${
                                    item.categoryColor || "gray"
                                  }-100 flex-shrink-0`}
                                >
                                  <IconComponent
                                    className={`w-4 h-4 text-${
                                      item.categoryColor || "gray"
                                    }-600`}
                                  />
                                </div>
                                <div className="flex flex-col">
                                  <div className="font-medium text-gray-900">
                                    {item.categoryName || item.categorie}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {item.subcategoryName}
                                  </div>
                                  {item.description && (
                                    <div className="text-xs text-gray-400 mt-0.5">
                                      {item.description}
                                    </div>
                                  )}
                                </div>
                                {item.archived && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {t("archived")}
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {getFrequencyBadge(item.frequency)}
                            </td>
                            <td className="py-3 px-4 text-center text-sm text-gray-600">
                              <div className="flex items-center justify-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(item.startDate).toLocaleDateString(
                                  "fr-FR",
                                  { month: "short", year: "numeric" }
                                )}
                                {item.isIndefinite ? (
                                  <span className="ml-1">→ ∞</span>
                                ) : item.endDate ? (
                                  <span>
                                    →{" "}
                                    {new Date(item.endDate).toLocaleDateString(
                                      "fr-FR",
                                      { month: "short", year: "numeric" }
                                    )}
                                  </span>
                                ) : null}
                              </div>
                            </td>
                            <td className="text-right py-3 px-4">
                              <div className="flex items-center justify-end gap-1">
                                <span>
                                  {formatCurrency(item.montant, item.currency)}
                                </span>
                                {item.currency !== currency && (
                                  <span className="text-xs text-gray-500">
                                    ({item.currency})
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="text-right py-3 px-4">
                              {formatCurrency(item.reel, item.currency)}
                            </td>
                            <td
                              className={`text-right py-3 px-4 font-medium ${
                                item.ecart > 0
                                  ? "text-green-600"
                                  : item.ecart < 0
                                  ? "text-red-600"
                                  : "text-gray-600"
                              }`}
                            >
                              {item.ecart > 0 ? "+" : ""}
                              {formatCurrency(item.ecart, item.currency)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleEditLine(item, "revenus")
                                    }
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    {t("edit")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleArchiveLine(item, "revenus")
                                    }
                                  >
                                    <Archive className="mr-2 h-4 w-4" />
                                    {t("archive")}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleDeleteLine(item, "revenus")
                                    }
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {t("delete")}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="depenses" className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        {t("category")}
                      </th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">
                        {t("frequency")}
                      </th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">
                        {t("period")}
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">
                        {t("budget")}
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">
                        {t("actual")}
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">
                        {t("variance")}
                      </th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">
                        {t("actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {budgetData.depenses
                      .filter((item) => !item.archived)
                      .map((item) => {
                        const categoryType = "expense";
                        const category = item.mainCategory
                          ? categoryService.getCategoryById(
                              item.mainCategory,
                              categoryType
                            )
                          : null;
                        const IconComponent = category?.icon || Tag;

                        return (
                          <tr
                            key={item.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`p-1.5 rounded-lg bg-${
                                    item.categoryColor || "gray"
                                  }-100 flex-shrink-0`}
                                >
                                  <IconComponent
                                    className={`w-4 h-4 text-${
                                      item.categoryColor || "gray"
                                    }-600`}
                                  />
                                </div>
                                <div className="flex flex-col">
                                  <div className="font-medium text-gray-900">
                                    {item.categoryName || item.categorie}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {item.subcategoryName}
                                  </div>
                                  {item.description && (
                                    <div className="text-xs text-gray-400 mt-0.5">
                                      {item.description}
                                    </div>
                                  )}
                                </div>
                                {item.archived && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {t("archived")}
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {getFrequencyBadge(item.frequency)}
                            </td>
                            <td className="py-3 px-4 text-center text-sm text-gray-600">
                              <div className="flex items-center justify-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(item.startDate).toLocaleDateString(
                                  "fr-FR",
                                  { month: "short", year: "numeric" }
                                )}
                                {item.isIndefinite ? (
                                  <span className="ml-1">→ ∞</span>
                                ) : item.endDate ? (
                                  <span>
                                    →{" "}
                                    {new Date(item.endDate).toLocaleDateString(
                                      "fr-FR",
                                      { month: "short", year: "numeric" }
                                    )}
                                  </span>
                                ) : null}
                              </div>
                            </td>
                            <td className="text-right py-3 px-4">
                              <div className="flex items-center justify-end gap-1">
                                <span>
                                  {formatCurrency(item.montant, item.currency)}
                                </span>
                                {item.currency !== currency && (
                                  <span className="text-xs text-gray-500">
                                    ({item.currency})
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="text-right py-3 px-4">
                              {formatCurrency(item.reel, item.currency)}
                            </td>
                            <td
                              className={`text-right py-3 px-4 font-medium ${
                                item.ecart > 0
                                  ? "text-red-600"
                                  : item.ecart < 0
                                  ? "text-green-600"
                                  : "text-gray-600"
                              }`}
                            >
                              {item.ecart > 0 ? "+" : ""}
                              {formatCurrency(item.ecart, item.currency)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleEditLine(item, "depenses")
                                    }
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    {t("edit")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleArchiveLine(item, "depenses")
                                    }
                                  >
                                    <Archive className="mr-2 h-4 w-4" />
                                    {t("archive")}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleDeleteLine(item, "depenses")
                                    }
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {t("delete")}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetPage;
