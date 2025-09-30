import React from "react";
import HomePage from "../pages/clients/home/HomePage";
import PublicLayout from "../components/headers/PublicLayout";
import AboutPage from "../pages/clients/about/AboutPage";
import Login from "../pages/Login";

const ClientRoute = {
    path: "/",
    element: <PublicLayout />,
    children: [
        {
            index: true,
            element: <HomePage/>,
        },
        {
            path: 'a-propos', element: (
                <AboutPage />
            )
        },
                {
            path: 'login', element: (
                <Login/>
            )
        }
    ]

};

export default ClientRoute;