import ProjetLayoutAdmin from "../layouts/admin/projet/ProjetLayoutAdmin";
import AdminDashboard from "../pages/superadmin/dashboard/AdminDashboard";
import Projet from "../pages/superadmin/projets/ProjetAdmin";

const AdminRoute = {
    path: "/superadmin",
    element: <ProjetLayoutAdmin />,
    children: [
        {
            index: true,
            element: <AdminDashboard/>,
        },
        {
            path: 'projet', element: (
                <Projet />
            )
        }
    ]

};

export default AdminRoute;