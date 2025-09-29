import { createBrowserRouter } from "react-router-dom";
import AdminRoute from "./AdminRoute";
import ClientRoute from "./ClientRoute";
import Login from "../pages/Login";
const router = createBrowserRouter([
    AdminRoute,
    ClientRoute,
  { path: "*", element:<p>Not found  </p> },
  { path: "/", element:<Login/> },
]);

export default router;
