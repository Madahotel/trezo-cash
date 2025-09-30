import ProjetLayoutClient from "../layouts/clients/projet/ProjetLayoutAdmin";
import DashboardView from "../pages/clients/dashboard/DashboardView";
import ProjetClient from "../pages/clients/projets/ProjetClient";
import BudgetTracker from "../pages/clients/tresorie/BudgetTracker";

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
      path: "trezo",
      element: <BudgetTracker />,
    },
  ],
};

export default ClientRoute;
