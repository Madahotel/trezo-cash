import React, { useState, useMemo } from "react";
import {
  X,
  Calendar,
  Building,
  Trash2,
  Edit,
  PlusCircle,
  Lock,
} from "lucide-react";
import AddCategoryModal from "./AddCategoryModal";
import { formatCurrency } from "../../utils/formatting";
import { motion, AnimatePresence } from "framer-motion";

const BudgetModal = ({ isOpen, onClose }) => {
  // --- Données de test ---
  const categories = {
    revenue: [
      {
        id: "r1",
        name: "Ventes",
        subCategories: [
          { id: "r1s1", name: "Produit A" },
          { id: "r1s2", name: "Produit B" },
        ],
      },
      {
        id: "r2",
        name: "Autres revenus",
        subCategories: [{ id: "r2s1", name: "Sub A" }],
      },
    ],
    expense: [
      {
        id: "e1",
        name: "Fournitures",
        subCategories: [
          { id: "e1s1", name: "Papeterie" },
          { id: "e1s2", name: "Informatique" },
        ],
      },
      {
        id: "e2",
        name: "Services",
        subCategories: [{ id: "e2s1", name: "Nettoyage" }],
      },
    ],
  };

  const tiers = [
    { id: "t1", name: "Client 1", type: "client" },
    { id: "t2", name: "Fournisseur 1", type: "fournisseur" },
  ];

  const userCashAccounts = [
    { id: "c1", name: "Compte courant" },
    { id: "c2", name: "Compte épargne" },
  ];

  const currencyOptions = ["EUR", "USD", "MGA"];
  const currencySymbols = { EUR: "€", USD: "$", MGA: "Ar" };

  const frequencyOptions = [
    { value: "ponctuel", label: "Ponctuel" },
    { value: "mensuel", label: "Mensuel" },
    { value: "annuel", label: "Annuel" },
    { value: "irregulier", label: "irregulier" },
  ];

  const projectVatRates = [
    { id: 1, name: "Taux normal", rate: 20 },
    { id: 2, name: "Taux réduit", rate: 5.5 },
  ];

  // --- State du formulaire ---
  const [formData, setFormData] = useState({
    type: "revenu",
    category: "",
    frequency: "mensuel",
    amount: "",
    currency: "EUR",
    amount_type: "ttc",
    vat_rate: 0,
    date: new Date().toISOString().split("T")[0],
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    supplier: "",
    description: "",
    isProvision: false,
    payments: [{ date: new Date().toISOString().split("T")[0], amount: "" }],
    numProvisions: "",
    provisionDetails: { finalPaymentDate: "", provisionAccountId: "" },
  });

  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState("");
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);

  // --- Fonctions ---
  const getAvailableCategories = () =>
    formData.type === "revenu" ? categories.revenue : categories.expense;
  // const getAvailableTiers = () =>
  //   tiers.filter(
  //     (t) => t.type === (formData.type === "revenu" ? "client" : "fournisseur")
  //   );

  const addPayment = () =>
    setFormData((prev) => ({
      ...prev,
      payments: [
        ...prev.payments,
        { date: new Date().toISOString().split("T")[0], amount: "" },
      ],
    }));
  const removePayment = (index) =>
    setFormData((prev) => ({
      ...prev,
      payments: prev.payments.filter((_, i) => i !== index),
    }));
  const handlePaymentChange = (index, field, value) => {
    const newPayments = [...formData.payments];
    newPayments[index][field] = value;
    setFormData((prev) => ({ ...prev, payments: newPayments }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Données enregistrées :", formData);
    onClose();
  };

  const handleSaveNewCategory = (subCategoryName) => {
    const mainCat = getAvailableCategories().find(
      (mc) => mc.id === selectedMainCategoryId
    );
    if (mainCat) {
      mainCat.subCategories.push({
        id: `s${Date.now()}`,
        name: subCategoryName,
      });
      setFormData((prev) => ({ ...prev, category: subCategoryName }));
      setIsAddCategoryModalOpen(false);
    }
  };

  const { htAmount, ttcAmount } = useMemo(() => {
    const vatRate = parseFloat(formData.vat_rate) || 0; // <-- juste le nombre
    const numericAmount = parseFloat(formData.amount) || 0;

    if (formData.amount_type === "ttc") {
      const ht = numericAmount;
      const ttc = ht * (1 + vatRate / 100);
      return { htAmount: ht, ttcAmount: ttc };
    } else {
      const ht = numericAmount;
      const ttc = numericAmount;
      return { htAmount: ht, ttcAmount: ttc };
    }
  }, [formData.amount, formData.amount_type, formData.vat_rate]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              Nouvelle entrée budgétaire
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="revenu"
                    checked={formData.type === "revenu"}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        type: e.target.value,
                        category: "",
                      }));
                      setSelectedMainCategoryId("");
                    }}
                    className="mr-2"
                  />
                  <Building className="w-4 h-4 mr-1 text-green-600" /> Entrée
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="depense"
                    checked={formData.type === "depense"}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        type: e.target.value,
                        category: "",
                      }));
                      setSelectedMainCategoryId("");
                    }}
                    className="mr-2"
                  />
                  <Calendar className="w-4 h-4 mr-1 text-red-600" /> Sortie
                </label>
              </div>
            </div>

            {/* Catégories */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie principale *
                </label>
                <select
                  value={selectedMainCategoryId}
                  onChange={(e) => {
                    setSelectedMainCategoryId(e.target.value);
                    setFormData((prev) => ({ ...prev, category: "" }));
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Sélectionner</option>
                  {getAvailableCategories().map((mc) => (
                    <option key={mc.id} value={mc.id}>
                      {mc.name}
                    </option>
                  ))}
                </select>
              </div>
              {selectedMainCategoryId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sous-catégorie *
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Sélectionner</option>
                      {getAvailableCategories()
                        .find((mc) => mc.id === selectedMainCategoryId)
                        .subCategories.map((sub) => (
                          <option key={sub.id} value={sub.name}>
                            {sub.name}
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsAddCategoryModalOpen(true)}
                      className="p-2 border rounded-lg bg-gray-100 hover:bg-gray-200"
                    >
                      <PlusCircle className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fréquence *
              </label>
              <select
                value={formData.frequency}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    frequency: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {frequencyOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {formData.frequency === "ponctuel" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date du paiement *
                </label>
                <input
                  type="date"
                  value={formData.date || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, date: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  //   min={activeProject?.startDate}
                />
              </div>
            )}
            {formData.frequency !== "ponctuel" &&
              formData.frequency !== "irregulier" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border rounded-lg bg-gray-50">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de début *
                    </label>
                    <input
                      type="date"
                      value={formData.startDate || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          startDate: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                      //   min={activeProject?.startDate}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de fin (optionnel)
                    </label>
                    <input
                      type="date"
                      value={formData.endDate || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          endDate: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min={formData.startDate}
                    />
                  </div>
                </div>
              )}

            {formData.frequency === "irregulier" && (
              <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                <h4 className="font-medium text-gray-800">
                  Liste des paiements
                </h4>
                {formData.payments.map((payment, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="date"
                      value={payment.date || ""}
                      onChange={(e) =>
                        handlePaymentChange(index, "date", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                      //   min={activeProject?.startDate}
                    />
                    <input
                      type="number"
                      value={payment.amount || ""}
                      onChange={(e) =>
                        handlePaymentChange(index, "amount", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder={`10000`}
                      min="0"
                      step="0.01"
                      required
                    />
                    {formData.payments.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePayment(index)}
                        className="p-2 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addPayment}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  <PlusCircle className="w-4 h-4" />
                  Ajouter un paiement
                </button>
              </div>
            )}
            {/* Fournisseur / Client */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.type === "revenu" ? "Client" : "Fournisseur"} *
              </label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, supplier: e.target.value }))
                }
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Nom..."
              />
            </div>
            {/* Montant et devise */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Montant *
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  className="flex-1 px-3 py-2 border rounded-lg"
                  placeholder="0.00"
                />
                <select
                  value={formData.currency}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      currency: e.target.value,
                    }))
                  }
                  className="px-3 py-2 border rounded-lg"
                >
                  {currencyOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <div className="flex items-center bg-gray-200 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({ ...p, amount_type: "ht" }))
                    }
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                      formData.amount_type === "ht"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "bg-transparent text-gray-600"
                    }`}
                  >
                    HT
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({ ...p, amount_type: "ttc" }))
                    }
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                      formData.amount_type === "ttc"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "bg-transparent text-gray-600"
                    }`}
                  >
                    TTC
                  </button>
                </div>
              </div>
            </div>
            <AnimatePresence>
              {formData.amount_type === "ttc" && projectVatRates.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Taux de TVA
                      </label>
                      <select
                        value={formData.vat_rate || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            vat_rate: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                      >
                        <option value="">Aucune TVA</option>
                        {projectVatRates.map((rate) => (
                          <option key={rate.id} value={rate.rate}>
                            {rate.name} ({rate.rate}%)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="pt-7">
                      <p className="text-sm text-gray-500">
                        Montant TTC calculé:
                      </p>
                      <p className="font-bold text-lg text-gray-800">
                        {formatCurrency(ttcAmount, {
                          currency: formData.currency,
                        })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Paiements */}
            {formData.frequency === "irregulier" && (
              <div>
                {formData.payments.map((p, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      type="date"
                      value={p.date}
                      onChange={(e) =>
                        handlePaymentChange(i, "date", e.target.value)
                      }
                      className="flex-1 px-3 py-2 border rounded-lg"
                    />
                    <input
                      type="number"
                      value={p.amount}
                      onChange={(e) =>
                        handlePaymentChange(i, "amount", e.target.value)
                      }
                      className="flex-1 px-3 py-2 border rounded-lg"
                    />
                    {formData.payments.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePayment(i)}
                        className="p-2 text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addPayment}
                  className="flex items-center gap-2 text-blue-600"
                >
                  <PlusCircle className="w-4 h-4" /> Ajouter un paiement
                </button>
              </div>
            )}

            {/* Boutons */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-lg"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"
              >
                <Edit className="w-4 h-4" /> Enregistrer
              </button>
            </div>
          </form>
        </div>
      </div>

      {isAddCategoryModalOpen && (
        <AddCategoryModal
          isOpen={isAddCategoryModalOpen}
          onClose={() => setIsAddCategoryModalOpen(false)}
          onSave={handleSaveNewCategory}
          mainCategoryName={
            getAvailableCategories().find(
              (mc) => mc.id === selectedMainCategoryId
            )?.name
          }
        />
      )}
    </>
  );
};

export default BudgetModal;
