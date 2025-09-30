import ProjetLayoutClient from "../layouts/clients/projet/ProjetLayoutAdmin";
import DashboardView from "../pages/clients/dashboard/DashboardView";
import ProjetClient from "../pages/clients/projets/ProjetClient";

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
  ],
};

export default ClientRoute;
