import { useEffect, useState } from "react";
import axios from '../../../components/config/Axios';
import { Navigate, Outlet, useLocation } from "react-router-dom";

const AmbassadorGate = () => {
    const [loading, setLoading] = useState(true);
    const [isAmbassador, setIsAmbassador] = useState(false);
    const [error, setError] = useState(null);
    const location = useLocation();

    useEffect(() => {
        const checkAmbassador = async () => {
            try {
                setLoading(true);
                const response = await axios.get("/ambassadeur/check", {
                    withCredentials: true
                });
                setIsAmbassador(response.data.isAmbassador);
            } catch (err) {
                setError("Impossible de vérifier le statut ambassadeur.");
                console.log(err);
            } finally {
                setLoading(false);
            }
        };

        checkAmbassador();
    }, []);

    if (loading) {
        return <div className="py-10 text-center">Chargement...</div>;
    }

    if (error) {
        return <div className="py-10 text-center text-red-500">{error}</div>;
    }

    // ✅ Si utilisateur est ambassadeur → render les enfants normaux
    if (isAmbassador) {
        return <Outlet />;
    }

    // ✅ Si l'utilisateur est sur la page “devenir”, on rend le composant
    if (location.pathname.endsWith("/devenir")) {
        return <Outlet />;
    }

    // Sinon → redirection vers "devenir"
    return <Navigate to="devenir" replace />;
};

export default AmbassadorGate;
