
import ProjetLayoutClient from "../layouts/clients/projet/ProjetLayoutAdmin";
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
            path: 'projet', element: (
                <ProjetClient />
            )
        }
    ]

};

export default ClientRoute;