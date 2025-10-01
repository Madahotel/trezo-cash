import ProjetLayoutClient from "../layouts/clients/projet/ProjetLayoutAdmin";
import BudgetPage from "../pages/clients/budget/BudgetPage";
import DashboardView from "../pages/clients/dashboard/DashboardView";
import CashflowView from "../pages/clients/flux/CashflowView";
import ProjetClient from "../pages/clients/projets/ProjetClient";
import BudgetTracker from "../pages/clients/tresorie/BudgetTracker";
import TrezoPage from "../pages/clients/tresorie/TrezoPage";

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
      element: <TrezoPage />,
      
    },
     {
     path: "budget",
      element: <BudgetPage />,
    },
    {
     path: "flux",
      element: <CashflowView/>,
    },
  ],
};

export default ClientRoute;
