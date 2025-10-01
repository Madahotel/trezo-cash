import ProjetLayoutClient from "../layouts/clients/projet/ProjetLayoutAdmin";
import BudgetPage from "../pages/clients/budget/BudgetPage";
import DashboardView from "../pages/clients/dashboard/DashboardView";
import CashflowView from "../pages/clients/flux/CashflowView";
import ScheduleView from "../pages/clients/echeance/ScheduleView";
import ProjetClient from "../pages/clients/projets/ProjetClient";
import BudgetTracker from "../pages/clients/tresorie/BudgetTracker";
import TrezoPage from "../pages/clients/tresorie/TrezoPage";
import ExpenseAnalysisView from "../pages/clients/analyse/ExpenseAnalysisView";
import MyTemplatesPage from "../pages/clients/models/MyTemplatesPage";
import ProjectSettingsPage from "../pages/clients/projets/ProjectSettingsPage";
import ProvisionsPage from "../pages/clients/suiviProvision/ProvisionsPage";

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
    ,
    {
     path: "echeancier",
      element: <ScheduleView/>,
    },
    {
     path: "analyse",
      element: <ExpenseAnalysisView/>,
    },
    {
     path: "templates",
      element: <MyTemplatesPage/>,
    },
    {
     path: "parametres-projet",
      element: <ProjectSettingsPage/>,
    },
    {
     path: "provisions",
      element: <ProvisionsPage/>,
    },

  ],
};

export default ClientRoute;
