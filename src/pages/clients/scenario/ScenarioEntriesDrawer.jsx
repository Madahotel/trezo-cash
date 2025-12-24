import React, { useEffect, useState, useMemo } from "react";
import { X } from "lucide-react";
import { apiGet } from "../../../components/context/actionsMethode";

const ScenarioEntriesDrawer = ({ isOpen, onClose, scenario }) => {
  const [entries, setEntries] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("revenus");
  const [openCategories, setOpenCategories] = useState({});

  useEffect(() => {
    if (!scenario?.id) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const res = await apiGet(`/budget-projects/${scenario.id}`);
        setEntries(res);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [scenario?.id]);

  if (!isOpen) return null;

  const revenusData = entries?.entries?.entry_items?.sub_categories ?? [];
  const depensesData = entries?.exits?.exit_items?.sub_categories ?? [];

  const activeData = activeTab === "revenus" ? revenusData : depensesData;

  const groupedByCategory = useMemo(() => {
    return activeData.reduce((acc, item) => {
      const categoryName = item.category_name;

      if (!acc[categoryName]) {
        acc[categoryName] = {
          category_id: item.category_id,
          items: [],
          total: 0,
        };
      }

      acc[categoryName].items.push(item);
      acc[categoryName].total += parseFloat(item.amount);

      return acc;
    }, {});
  }, [activeData]);

  useEffect(() => {
    const initialOpen = {};
    Object.keys(groupedByCategory).forEach((cat) => {
      initialOpen[cat] = false;
    });
    setOpenCategories(initialOpen);
  }, [groupedByCategory]);

  const toggleCategory = (categoryName) => {
    setOpenCategories((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black z-40 transition-opacity ${
          isOpen ? "bg-opacity-60" : "bg-opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <div className="fixed top-0 right-0 bottom-0 w-[600px] bg-gray-50 shadow-xl z-50">
        <div className="flex flex-col h-full">
          <div className="flex items-start justify-between p-4 border-b bg-white">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Écritures du Scénario
              </h2>
              <p className="text-sm text-purple-700 font-medium">
                {scenario?.name}
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-white border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab("revenus")}
                className={`flex-1 px-4 py-3 text-sm font-medium ${
                  activeTab === "revenus"
                    ? "text-green-700 border-b-2 border-green-600 bg-green-50"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Revenus
              </button>

              <button
                onClick={() => setActiveTab("depenses")}
                className={`flex-1 px-4 py-3 text-sm font-medium ${
                  activeTab === "depenses"
                    ? "text-red-700 border-b-2 border-red-600 bg-red-50"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Dépenses
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {isLoading && (
              <p className="text-center text-gray-500">
                Chargement des écritures...
              </p>
            )}

            {!isLoading && activeData.length === 0 && (
              <p className="text-center text-gray-500">
                Aucune {activeTab === "revenus" ? "entrée" : "sortie"}
              </p>
            )}

            {!isLoading &&
              Object.entries(groupedByCategory).map(([categoryName, data]) => (
                <div key={categoryName} className="mb-6">
                  <div
                    className="flex justify-between items-center mb-2 cursor-pointer select-none bg-gray-100 px-3 py-2 rounded"
                    onClick={() => toggleCategory(categoryName)}
                  >
                    <h3 className="font-bold text-lg">{categoryName}</h3>

                    <span className="text-sm font-bold">
                      {openCategories[categoryName] ? "-" : "+"}
                    </span>
                  </div>

                  {openCategories[categoryName] &&
                    data.items.map((item) => (
                      <div
                        key={item.id}
                        className="ml-4 p-3 bg-white rounded shadow-sm mb-2 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">
                              {item.sub_category_name}
                            </p>

                            {item.description && (
                              <p className="text-xs text-gray-500 mt-1">
                                {item.description}
                              </p>
                            )}

                            <div className="flex gap-2 mt-2 text-xs text-gray-600">
                              <span className="bg-gray-100 px-2 py-0.5 rounded">
                                {item.frequency_name}
                              </span>
                            </div>
                          </div>

                          <div className="text-right ml-4">
                            <p className="text-base font-bold text-gray-800">
                              {parseFloat(item.amount).toLocaleString("fr-FR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{" "}
                              {item.currency_symbol}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default ScenarioEntriesDrawer;
