import { createBrowserRouter } from "react-router-dom";
import AdminRoute from "./AdminRoute";
import ClientRoute from "./ClientRoute";
import Login from "../pages/Login";
import PublicRoute from "./PublicRoute";
import HomePage from "../pages/clients/home/HomePage";
const router = createBrowserRouter([
    AdminRoute,
    ClientRoute,
    PublicRoute,
  { path: "*", element:<p>Not found  </p> },
  { path: "/", element:<HomePage/> },
]);

export default router;
