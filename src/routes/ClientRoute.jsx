import ProjetLayoutClient from "../layouts/clients/projet/ProjetLayoutAdmin";
import BudgetPage from "../pages/clients/budget/BudgetPage";
import DashboardView from "../pages/clients/dashboard/DashboardView";
import ProjetClient from "../pages/clients/projets/ProjetClient";
import ScenarioView from "../pages/clients/scenario/ScenarioView";

const ClientRoute = {
  path: "/client",
  element: <ProjetLayoutClient />,
  children: [
    {
      index: true,
      element: <div>HomePage client</div>,
    },
    {
      path: "projet",
      element: <ProjetClient />,
    },
    {
      path: "dashboard",
      element: <DashboardView />,
    },
    {
      path: "budget",
      element: <BudgetPage />,
    },
    {
      path: "scenarios",
      element: <ScenarioView />,
    },
  ],
};

export default ClientRoute;
