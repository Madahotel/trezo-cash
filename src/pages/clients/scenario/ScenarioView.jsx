import React, { useState, useMemo, useRef } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Layers,
  Eye,
  EyeOff,
  Archive,
  ChevronLeft,
  ChevronRight,
  List,
  ChevronDown,
} from "lucide-react";
import ReactECharts from "echarts-for-react";
import { motion, AnimatePresence } from "framer-motion";
import ScenarioEntriesDrawer from "./ScenarioEntriesDrawer";
import BudgetModal from "../../../components/modal/ScenarioBudgetModal";
import EmptyState from "./EmptyState";
import ScenarioModal from "../../../components/modal/ScenarioModal";
import ConfirmationModal from "../../../components/modal/ConfirmationModal";

// Couleurs des scénarios
const colorMap = {
  "#8b5cf6": {
    bg: "bg-violet-50",
    text: "text-violet-800",
    button: "bg-violet-200 hover:bg-violet-300",
    line: "#8b5cf6",
  },
  "#f97316": {
    bg: "bg-orange-50",
    text: "text-orange-800",
    button: "bg-orange-200 hover:bg-orange-300",
    line: "#f97316",
  },
  "#d946ef": {
    bg: "bg-fuchsia-50",
    text: "text-fuchsia-800",
    button: "bg-fuchsia-200 hover:bg-fuchsia-300",
    line: "#d946ef",
  },
};
const defaultColors = colorMap["#8b5cf6"];

// Données de test
const testScenarios = [
  {
    id: "1",
    name: "Scénario 1",
    displayName: "Scénario 1",
    description: "Description 1",
    color: "#8b5cf6",
    isVisible: true,
  },
  {
    id: "2",
    name: "Scénario 2",
    displayName: "Scénario 2",
    description: "Description 2",
    color: "#f97316",
    isVisible: true,
  },
];

// Générer un tableau de données aléatoires
const generateRandomData = (length, base = 1000, variance = 500) => {
  return Array.from({ length }, () =>
    Math.floor(base + Math.random() * variance - variance / 2)
  );
};

// Périodes (axe X)
const testPeriods = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];

// Solde de base (ligne principale)
const testBaseBalance = generateRandomData(testPeriods.length, 1500, 400);

// Scénarios simulés
const testScenarioBalance = [
  {
    id: "1",
    name: "Scénario Optimiste",
    color: "#8b5cf6",
    data: generateRandomData(testPeriods.length, 1700, 500),
  },
  {
    id: "2",
    name: "Scénario Pessimiste",
    color: "#f97316",
    data: generateRandomData(testPeriods.length, 1300, 500),
  },
  {
    id: "3",
    name: "Scénario Réaliste",
    color: "#d946ef",
    data: generateRandomData(testPeriods.length, 1500, 500),
  },
];

const ScenarioView = () => {
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [scenarioModalOpen, setScenarioModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const quickPeriodOptions = [
    { id: "1m", label: "1 Mois" },
    { id: "3m", label: "3 Mois" },
    { id: "6m", label: "6 Mois" },
  ];
  // Graphique
  const getChartOptions = () => {
    const series = [
      {
        name: "Solde Réel (Base)",
        type: "line",
        data: testBaseBalance,
        lineStyle: { width: 2 },
        itemStyle: { color: "#3b82f6" },
      },
      ...testScenarioBalance.map((sc) => ({
        name: `Scénario: ${sc.name}`,
        type: "line",
        data: sc.data,
        lineStyle: { width: 2, type: "dashed" },
        itemStyle: { color: sc.color },
      })),
    ];

    return {
      tooltip: { trigger: "axis" },
      legend: { data: series.map((s) => s.name), top: "bottom" },
      grid: {
        left: 70, // espace à gauche (évite que les nombres de Y collent)
        right: 40, // espace à droite
        top: 40, // espace en haut
        bottom: 60, // espace en bas (évite que les labels X collent)
        containLabel: true, // 👈 très important : garde les labels dans la zone
      },
      xAxis: {
        type: "category",
        data: testPeriods,
        axisLabel: {
          rotate: 30,
          interval: 0,
          fontSize: 12,
        },
      },
      yAxis: {
        type: "value",
        splitNumber: 6,
        minInterval: 100,
        axisLabel: {
          fontSize: 12,
          margin: 20,
        },
      },
      series,
    };
  };

  // Gestion modale / drawer
  const handleOpenScenarioModal = (entry = null) => {
    console.log(scenarioModalOpen);
    setEditingEntry(entry);
    setIsBudgetModalOpen(true);
  };
  const handleCloseBudgetModal = () => {
    setEditingEntry(null);
    setIsBudgetModalOpen(false);
  };
  const handleOpenDrawer = (scenario) => {
    setSelectedScenario(scenario);
    setIsDrawerOpen(true);
  };
  const handleCloseDrawer = () => {
    setSelectedScenario(null);
    setIsDrawerOpen(false);
  };
  const handleAddEntry = () => handleOpenScenarioModal();
  const handleEditEntry = (entry) => handleOpenScenarioModal(entry);
  const handleDeleteEntry = (entryId) => alert(`Supprimer entrée ${entryId}`); // simple action de test
  const [selectedPeriodLabel, setSelectedPeriodLabel] = useState(
    quickPeriodOptions[0]?.label || "Période"
  );
  const [activeQuickSelect, setActiveQuickSelect] = useState(
    quickPeriodOptions[0]?.id || null
  );
  const [periodLabel, setPeriodLabel] = useState("Période Actuelle");
  const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState(false);

  const periodMenuRef = useRef(null);

  // const handlePeriodChange = (direction) => {
  //   setPeriodLabel((prev) =>
  //     direction === -1 ? "Période Précédente" : "Période Suivante"
  //   );
  // };

  // const handleQuickPeriodSelect = (id) => {
  //   const selected = quickPeriodOptions.find((opt) => opt.id === id);
  //   if (selected) {
  //     setSelectedPeriodLabel(selected.label);
  //     setActiveQuickSelect(id);
  //   }
  // };

  const handleOpenConfirmModal = () => {
    setConfirmModalOpen(true);
  };

  const [currentPeriods, setCurrentPeriods] = useState(testPeriods);
  const [currentBaseData, setCurrentBaseData] = useState(testBaseBalance);
  const [currentScenarioData, setCurrentScenarioData] =
    useState(testScenarioBalance);
  const handleQuickPeriodSelect = (id) => {
    const selected = quickPeriodOptions.find((opt) => opt.id === id);
    if (!selected) return;

    setSelectedPeriodLabel(selected.label);
    setActiveQuickSelect(id);

    let length;
    if (id === "1m") length = 1;
    else if (id === "3m") length = 3;
    else if (id === "6m") length = 6;

    setCurrentPeriods(testPeriods.slice(0, length));
    setCurrentBaseData(testBaseBalance.slice(0, length));
    setCurrentScenarioData(
      testScenarioBalance.map((sc) => ({
        ...sc,
        data: sc.data.slice(0, length),
      }))
    );
  };
  const handlePeriodChange = (direction) => {
    const length = currentPeriods.length;
    let start = testPeriods.indexOf(currentPeriods[0]) + direction;

    if (start < 0) start = 0;
    if (start + length > testPeriods.length)
      start = testPeriods.length - length;

    const newPeriods = testPeriods.slice(start, start + length);
    setCurrentPeriods(newPeriods);
    setCurrentBaseData(testBaseBalance.slice(start, start + length));
    setCurrentScenarioData(
      testScenarioBalance.map((sc) => ({
        ...sc,
        data: sc.data.slice(start, start + length),
      }))
    );

    setPeriodLabel(
      direction === -1 ? "Période Précédente" : "Période Suivante"
    );
  };

  return (
    <>
      <div className="p-6 max-w-full flex flex-col h-full">
        {/* Liste Scénarios */}
        <div className="bg-white p-6 rounded-lg shadow mb-8 flex-shrink-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Vos Scénarios
            </h2>
            <button
              onClick={() => setScenarioModalOpen(true)}
              className="bg-purple-600 hover:bg-accent-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors  disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
              Nouveau Scénario
            </button>
          </div>
          <div className="space-y-3">
            {testScenarios.length > 0 ? (
              testScenarios.map((scenario) => {
                const colors = colorMap[scenario.color] || defaultColors;
                return (
                  <div
                    key={scenario.id}
                    className={`p-4 border rounded-lg flex justify-between items-center ${colors.bg}`}
                  >
                    <div>
                      <h3 className={`font-bold ${colors.text}`}>
                        {scenario.displayName}
                      </h3>
                      <p className={`text-sm ${colors.text}`}>
                        {scenario.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenDrawer(scenario)}
                        className="p-2 text-gray-500 hover:text-gray-800"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenDrawer(scenario)}
                        className="p-2 text-sm rounded-md flex items-center gap-1 bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Gérer les écritures"
                      >
                        <List className="w-4 h-4" />
                        <span>Gérer les écritures</span>
                      </button>
                      <button
                        onClick={() => handleAddEntry()}
                        className={`p-2 text-sm rounded-md flex items-center gap-1    disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed ${colors.button} ${colors.text}`}
                      >
                        <Plus />
                        Ajouter une entrée
                      </button>
                      <button
                        onClick={() =>
                          handleEditEntry({ id: 1, name: "Entrée test" })
                        }
                        className="p-2 text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenConfirmModal()}
                        className="p-2 text-yellow-600 hover:text-yellow-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEntry(1)}
                        className="p-2 text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState
                icon={Layers}
                title="Aucun scénario"
                message="Créez des simulations pour tester."
                actionText="Nouveau Scénario"
                onActionClick={handleOpenScenarioModal}
              />
            )}
          </div>
        </div>
        {/* Graphique */}
        <div className="bg-white p-6 rounded-lg shadow flex-grow flex flex-col min-h-0">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Comparaison des Soldes
          </h2>
          <div className="mb-6 flex-shrink-0">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePeriodChange(-1)}
                  className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-full transition-colors"
                  title="Période précédente"
                >
                  <ChevronLeft size={18} />
                </button>
                <span
                  className="text-sm font-semibold text-gray-700 w-24 text-center"
                  title="Décalage par rapport à la période actuelle"
                >
                  {periodLabel}
                </span>
                <button
                  onClick={() => handlePeriodChange(1)}
                  className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-full transition-colors"
                  title="Période suivante"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
              <div className="h-8 w-px bg-gray-200 hidden md:block"></div>
              <div className="relative" ref={periodMenuRef}>
                <button
                  onClick={() => setIsPeriodMenuOpen((p) => !p)}
                  className="flex items-center gap-2 px-3 h-9 rounded-md bg-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-300 transition-colors"
                >
                  <span>{selectedPeriodLabel}</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      isPeriodMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {isPeriodMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute left-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border z-20"
                    >
                      <ul className="p-1">
                        {quickPeriodOptions.map((option) => (
                          <li key={option.id}>
                            <button
                              onClick={() => {
                                handleQuickPeriodSelect(option.id);
                                setIsPeriodMenuOpen(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 text-sm rounded-md ${
                                activeQuickSelect === option.id
                                  ? "bg-blue-50 text-blue-700 font-semibold"
                                  : "text-gray-700 hover:bg-gray-100"
                              }`}
                            >
                              {option.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
          <div className="flex-grow min-h-0">
            {/* <ScenarioChart
              periods={currentPeriods}
              baseData={currentBaseData}
              scenarioData={currentScenarioData}
            /> */}
          </div>
        </div>

        {/* Modale */}
        {isBudgetModalOpen && (
          <BudgetModal
            isOpen={isBudgetModalOpen}
            onClose={handleCloseBudgetModal}
            onSave={(data) => {
              console.log("Save", data);
              handleCloseBudgetModal();
            }}
            editingData={editingEntry}
          />
        )}

        {/* Drawer */}
        {isDrawerOpen && (
          <ScenarioEntriesDrawer
            isOpen={isDrawerOpen}
            setOpenScenario={() => setIsBudgetModalOpen(true)}
            onClose={handleCloseDrawer}
            // scenario={selectedScenario}
            // onAddEntry={handleAddEntry}
            // onEditEntry={handleEditEntry}
            // onDeleteEntry={handleDeleteEntry}
          />
        )}
      </div>
      {scenarioModalOpen && (
        <ScenarioModal
          isOpen={scenarioModalOpen}
          onClose={() => setScenarioModalOpen((u) => !u)}
        />
      )}

      {confirmModalOpen && (
        <ConfirmationModal
          isOpen={confirmModalOpen}
          onClose={() => setConfirmModalOpen(false)}
          // onConfirm={handleConfirm}
          title="Archiver le scénario"
          message="L'archivage d'un scénario le masquera de la liste, mais toutes ses données seront conservées. Vous pourrez le restaurer à tout moment."
          confirmText="Archiver"
          cancelText="Annuler"
          confirmColor="danger" // ou "primary"
        />
      )}
    </>
  );
};

export default ScenarioView;
