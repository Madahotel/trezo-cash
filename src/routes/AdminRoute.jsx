import ProjetLayoutAdmin from "../layouts/admin/projet/ProjetLayoutAdmin";
import Projet from "../pages/superadmin/projets/ProjetAdmin";

const AdminRoute = {
    path: "/superadmin",
    element: <ProjetLayoutAdmin />,
    children: [
        {
            index: true,
            element: <div>HomePage</div>,
        },
        {
            path: 'projet', element: (
                <Projet />
            )
        }
    ]

};

export default AdminRoute;