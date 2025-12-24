import React, { useState, useMemo, useRef, useEffect } from "react";
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
  MoreVertical,
} from "lucide-react";
import ReactECharts from "echarts-for-react";
import { motion, AnimatePresence } from "framer-motion";
import ScenarioEntriesDrawer from "./ScenarioEntriesDrawer";
import BudgetModal from "../../../components/modal/ScenarioBudgetModal";
import EmptyState from "../../../components/emptystate/EmptyState";
import ScenarioModal from "../../../components/modal/ScenarioModal";
import ConfirmationModal from "../../../components/modal/ConfirmationModal";
import { formatCurrency } from "../../../utils/formatting";
import BudgetLineDialog from "../budget/BudgetLineDialog";
import {
  apiDelete,
  apiGet,
  apiPost,
  apiUpdate,
} from "../../../components/context/actionsMethode";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(null);
  const [activeScenario, setActiveScenario] = useState(null);
  const [editingScenario, setEditingScenario] = useState(null);

  const [scenarios, setScenarios] = useState([]);

  const fetchScenario = async () => {
    try {
      const res = await apiGet("/scenarios");
      console.log(res);

      setScenarios(res.scenarios.scenario_items);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchScenario();
  }, []);

  const quickPeriodOptions = [
    { id: "1m", label: "1 Mois" },
    { id: "3m", label: "3 Mois" },
    { id: "6m", label: "6 Mois" },
  ];

  const handleSaveScenario = async (data) => {
    try {
      const res = await apiPost("/scenarios", data);

      if (res) {
        await fetchScenario();
        setScenarioModalOpen(false);
        console.log("Scenario enregistré !");
      }
    } catch (error) {
      console.log("Erreur lors de l'enregistrement : ", error);
    }
  };

  const handleUpdateScenario = async (scenarioId, data) => {
    try {
      const res = await apiUpdate(`/scenarios/${scenarioId}`, data);
      console.log(res);
      if (res) {
        await fetchScenario();
        setScenarioModalOpen(false);
        console.log("Scenario enregistré !");
      }
    } catch (error) {
      console.log("Erreur lors de l'enregistrement : ", error);
    }
  };

  const handleAddScenario = async () => {
    setEditingScenario(null);
    try {
      setScenarioModalOpen(true);
    } catch (error) {
      console.log(error);
    }
  };

  // État responsive
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Gestion modale / drawer
  const handleOpenScenarioModal = (entry = null) => {
    setEditingEntry(entry);
    setActiveScenario(entry);

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

  const handleAddEntry = (entry) => handleOpenScenarioModal(entry);
  const handleEditEntry = async (scenarioId) => {
    setScenarioModalOpen(true);
    try {
      const res = await apiGet(`/scenarios/${scenarioId}`);
      console.log(res);

      setEditingScenario(res.scenario);
    } catch (error) {
      console.log(error);
    }
  };
  const handleDeleteEntry = async (entryId) => {
    try {
      const res = await apiDelete(`/scenarios/${entryId}`);
      if (res.status === 200) {
        await fetchScenario();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const [selectedPeriodLabel, setSelectedPeriodLabel] = useState(
    quickPeriodOptions[0]?.label || "Période"
  );
  const [activeQuickSelect, setActiveQuickSelect] = useState(
    quickPeriodOptions[0]?.id || null
  );
  const [periodLabel, setPeriodLabel] = useState("Période Actuelle");
  const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState(false);

  const periodMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Fermer les menus en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        periodMenuRef.current &&
        !periodMenuRef.current.contains(event.target)
      ) {
        setIsPeriodMenuOpen(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target)
      ) {
        setMobileMenuOpen(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const handleOpenConfirmModal = () => {
    setConfirmModalOpen(true);
  };

  const toggleMobileMenu = (scenarioId) => {
    setMobileMenuOpen(mobileMenuOpen === scenarioId ? null : scenarioId);
  };

  const chartData = useMemo(() => {
    return {
      labels: currentPeriods,
      series: [
        {
          name: "Solde de base",
          type: "line",
          data: currentBaseData,
          smooth: true,
          lineStyle: { width: 3 },
          itemStyle: { color: "#3b82f6" },
        },
        ...currentScenarioData.map((sc) => ({
          name: sc.name,
          type: "line",
          data: sc.data,
          smooth: true,
          lineStyle: { width: 2, color: sc.color },
          itemStyle: { color: sc.color },
        })),
      ],
    };
  }, [currentPeriods, currentBaseData, currentScenarioData]);

  const settings = {};

  const getChartOptions = () => {
    if (!chartData || chartData.series.length === 0) {
      return {
        title: {
          text: "Aucune donnée à afficher",
          subtext: "Sélectionnez un projet individuel pour voir les scénarios.",
          left: "center",
          top: "center",
        },
      };
    }

    const allDataPoints = chartData.series
      .flatMap((s) => s.data)
      .filter((d) => d !== null && !isNaN(d));

    if (allDataPoints.length === 0) {
      return {
        title: {
          text: "Aucune donnée numérique à afficher",
          left: "center",
          top: "center",
        },
      };
    }

    const dataMin = Math.min(...allDataPoints);
    const dataMax = Math.max(...allDataPoints);
    const range = dataMax - dataMin;
    const buffer = range === 0 ? Math.abs(dataMax * 0.1) || 100 : range * 0.2;
    const yAxisMin = dataMin - buffer;
    const yAxisMax = dataMax + buffer;

    return {
      tooltip: {
        trigger: "axis",
        confine: true,
      },
      legend: {
        data: chartData.series.map((s) => s.name),
        bottom: 0,
        type: "scroll",
        textStyle: {
          fontSize: isMobile ? 10 : 12,
        },
      },
      grid: {
        left: isMobile ? "8%" : "3%",
        right: isMobile ? "8%" : "4%",
        bottom: isMobile ? "20%" : "15%",
        top: isMobile ? "5%" : "3%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: chartData.labels,
        boundaryGap: false,
        axisLabel: {
          fontSize: isMobile ? 10 : 12,
        },
      },
      yAxis: {
        type: "value",
        axisLabel: {
          formatter: (value) => formatCurrency(value, settings),
          fontSize: isMobile ? 10 : 12,
        },
        min: yAxisMin,
        max: yAxisMax,
      },
      series: chartData.series,
    };
  };

  return (
    <>
      <div className="p-4 md:p-6 max-w-full flex flex-col h-full bg-gray-50">
        {/* Liste Scénarios */}
        <div className="bg-white p-4 md:p-6 rounded-lg shadow mb-6 md:mb-8 flex-shrink-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800">
              Vos Scénarios
            </h2>
            <button
              onClick={() => handleAddScenario()}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg font-medium flex items-center gap-2 transition-colors text-sm md:text-base"
            >
              <Plus className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Nouveau Scénario</span>
              <span className="sm:hidden">Nouveau</span>
            </button>
          </div>

          <div className="space-y-3">
            {scenarios?.length > 0 ? (
              scenarios?.map((scenario) => {
                const colors = colorMap[scenario.color] || defaultColors;
                return (
                  <div
                    key={scenario.id}
                    className={`p-3 md:p-4 border rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 ${colors.bg}`}
                  >
                    <div className="flex-1">
                      <h3
                        className={`font-bold text-sm md:text-base ${colors.text}`}
                      >
                        {scenario.name}
                      </h3>
                      <p className={`text-xs md:text-sm ${colors.text}`}>
                        {scenario.description}
                      </p>
                    </div>

                    {/* Version Desktop */}
                    <div className="hidden sm:flex items-center gap-2">
                      {/* <button
                        onClick={() => handleOpenDrawer(scenario.id)}
                        className="p-2 text-gray-500 hover:text-gray-800"
                        title="Voir le détail"
                      >
                        <Eye className="w-4 h-4" />
                      </button> */}
                      <button
                        onClick={() => handleOpenDrawer(scenario)}
                        className="p-2 text-sm rounded-md flex items-center gap-1 bg-gray-200 text-gray-700 hover:bg-gray-300"
                        title="Gérer les écritures"
                      >
                        <List className="w-4 h-4" />
                        <span>Gérer les écritures</span>
                      </button>
                      <button
                        onClick={() => handleAddEntry(scenario.id)}
                        className={`p-2 text-sm rounded-md flex items-center gap-1 ${colors.button} ${colors.text}`}
                      >
                        <Plus className="w-4 h-4" />
                        Ajouter une entrée
                      </button>
                      <button
                        onClick={() => handleEditEntry(scenario.id)}
                        className="p-2 text-blue-600 hover:text-blue-800"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenConfirmModal()}
                        className="p-2 text-yellow-600 hover:text-yellow-800"
                        title="Archiver"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEntry(scenario.id)}
                        className="p-2 text-red-600 hover:text-red-800"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Version Mobile */}
                    <div className="sm:hidden flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenDrawer(scenario)}
                          className="p-2 text-gray-500 hover:text-gray-800"
                          title="Voir le détail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleAddEntry()}
                          className={`p-2 rounded-md flex items-center gap-1 ${colors.button} ${colors.text}`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="relative" ref={mobileMenuRef}>
                        <button
                          onClick={() => toggleMobileMenu(scenario.id)}
                          className="p-2 text-gray-500 hover:text-gray-800"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        <AnimatePresence>
                          {mobileMenuOpen === scenario.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border z-20"
                            >
                              <ul className="p-1">
                                <li>
                                  <button
                                    onClick={() => {
                                      handleOpenDrawer(scenario);
                                      setMobileMenuOpen(null);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center gap-2"
                                  >
                                    <List className="w-4 h-4" />
                                    Gérer les écritures
                                  </button>
                                </li>
                                <li>
                                  <button
                                    onClick={() => {
                                      handleEditEntry({
                                        id: 1,
                                        name: "Entrée test",
                                      });
                                      setMobileMenuOpen(null);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md flex items-center gap-2"
                                  >
                                    <Edit className="w-4 h-4" />
                                    Modifier
                                  </button>
                                </li>
                                <li>
                                  <button
                                    onClick={() => {
                                      handleOpenConfirmModal();
                                      setMobileMenuOpen(null);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm text-yellow-600 hover:bg-yellow-50 rounded-md flex items-center gap-2"
                                  >
                                    <Archive className="w-4 h-4" />
                                    Archiver
                                  </button>
                                </li>
                                <li>
                                  <button
                                    onClick={() => {
                                      handleDeleteEntry(scenario.id);
                                      setMobileMenuOpen(null);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md flex items-center gap-2"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Supprimer
                                  </button>
                                </li>
                              </ul>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
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
                onActionClick={() => setScenarioModalOpen(true)}
              />
            )}
          </div>
        </div>

        {/* Section Graphique avec fond blanc unifié */}
        <div className=" p-4 md:p-6 rounded-lg  flex-grow flex flex-col min-h-0">
          {/* En-tête du graphique */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 md:mb-6 gap-4">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800">
              Comparaison des Soldes
            </h2>

            {/* Contrôles de période */}
            <div className="flex flex-wrap items-center gap-2 md:gap-4">
              {/* Navigation période */}
              <div className="flex items-center gap-1 md:gap-2">
                <button
                  onClick={() => handlePeriodChange(-1)}
                  className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-full transition-colors"
                  title="Période précédente"
                >
                  <ChevronLeft size={16} />
                </button>
                <span
                  className="text-xs md:text-sm font-semibold text-gray-700 w-20 md:w-24 text-center truncate"
                  title={periodLabel}
                >
                  {periodLabel}
                </span>
                <button
                  onClick={() => handlePeriodChange(1)}
                  className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-full transition-colors"
                  title="Période suivante"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="h-6 w-px bg-gray-200 hidden md:block"></div>

              {/* Sélection rapide période */}
              <div className="relative" ref={periodMenuRef}>
                <button
                  onClick={() => setIsPeriodMenuOpen((p) => !p)}
                  className="flex items-center gap-2 px-3 h-8 md:h-9 rounded-md bg-gray-200 text-gray-700 font-semibold text-xs md:text-sm hover:bg-gray-300 transition-colors"
                >
                  <span>{selectedPeriodLabel}</span>
                  <ChevronDown
                    className={`w-3 h-3 md:w-4 md:h-4 transition-transform ${
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
                      className="absolute left-0 top-full mt-2 w-40 md:w-48 bg-white rounded-lg shadow-lg border z-20"
                    >
                      <ul className="p-1">
                        {quickPeriodOptions.map((option) => (
                          <li key={option.id}>
                            <button
                              onClick={() => {
                                handleQuickPeriodSelect(option.id);
                                setIsPeriodMenuOpen(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 text-xs md:text-sm rounded-md ${
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

          {/* Zone du graphique */}
          <div className="flex-grow  bg-white shadow-lg rounded-lg border border-gray-200 p-4 ">
            <div className="flex-grow min-h-[300px] md:min-h-[400px]">
              <ReactECharts
                option={getChartOptions()}
                style={{
                  height: isMobile ? "350px" : "500px",
                  width: "100%",
                }}
                notMerge={true}
                lazyUpdate={true}
              />
            </div>
          </div>
        </div>

        {/* Modales */}
        {isBudgetModalOpen && (
          <BudgetLineDialog
            open={isBudgetModalOpen}
            onOpenChange={handleCloseBudgetModal}
            projectId={activeScenario}
          />
        )}

        {isDrawerOpen && (
          <ScenarioEntriesDrawer
            isOpen={isDrawerOpen}
            setOpenScenario={() => setIsBudgetModalOpen(true)}
            onClose={handleCloseDrawer}
            scenario={selectedScenario}
          />
        )}

        {scenarioModalOpen && (
          <ScenarioModal
            isOpen={scenarioModalOpen}
            onClose={() => setScenarioModalOpen(false)}
            onSave={handleSaveScenario}
            onUpdate={handleUpdateScenario}
            scenario={editingScenario}
          />
        )}

        {confirmModalOpen && (
          <ConfirmationModal
            isOpen={confirmModalOpen}
            onClose={() => setConfirmModalOpen(false)}
            title="Archiver le scénario"
            message="L'archivage d'un scénario le masquera de la liste, mais toutes ses données seront conservées. Vous pourrez le restaurer à tout moment."
            confirmText="Archiver"
            cancelText="Annuler"
            confirmColor="danger"
          />
        )}
      </div>
    </>
  );
};

export default ScenarioView;
