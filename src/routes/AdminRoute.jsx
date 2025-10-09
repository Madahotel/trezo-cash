import ProjetLayoutAdmin from "../layouts/admin/projet/ProjetLayoutAdmin";
import AdminAmbassadorsPage from "../pages/superadmin/ambassadors/AdminAmbassadorsPage";
import AdminAnalyticsPage from "../pages/superadmin/analyse/AdminAnalyticsPage";
import AdminDashboard from "../pages/superadmin/dashboard/AdminDashboard";
import Projet from "../pages/superadmin/projets/ProjetAdmin";
import AdminRevenuePage from "../pages/superadmin/revenue/AdminRevenuePage";
import AdminUsersPage from "../pages/superadmin/users/AdminUsersPage";

const AdminRoute = {
    path: "/admin",
    element: <ProjetLayoutAdmin />,
    children: [
        {
            index: true,
            element: <AdminDashboard/>,
        },
        {
            path: 'dashboard', element: (
                <AdminDashboard />
            )
        },
        {
            path: 'ambassadors', element: (
                <AdminAmbassadorsPage />
            )
        },
        {
            path: 'users', element: (
                <AdminUsersPage />
            )
        },
        {
            path: 'revenue', element: (
                <AdminRevenuePage />
            )
        },
        {
            path: 'analytics', element: (
                <AdminAnalyticsPage />
            )
        },

    ]

};

export default AdminRoute;