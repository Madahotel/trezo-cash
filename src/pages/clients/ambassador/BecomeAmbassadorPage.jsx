// src/pages/BecomeAmbassadorPage.jsx
import React, { useState } from "react";
import axios from '../../../components/config/Axios';

const BecomeAmbassadorPage = () => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleBecomeAmbassador = async () => {
        try {
            setLoading(true);
            await axios.post("/ambassadeur/register");
            setSuccess(true);
        } catch (err) {
            alert("Erreur lors de la demande : " + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="py-10 text-center">
                <p className="font-semibold text-green-600">
                    Félicitations ! Vous êtes maintenant ambassadeur 🎉
                </p>
                <a href="/client/parrainage" className="text-blue-600 underline">
                    Accéder à votre tableau de bord
                </a>
            </div>
        );
    }

    return (
        <div className="max-w-md p-6 mx-auto mt-10 bg-white shadow rounded-xl">
            <h1 className="mb-4 text-xl font-bold text-gray-700">Devenir Ambassadeur</h1>
            <p className="mb-6 text-gray-600">
                Rejoignez le programme ambassadeur et commencez à parrainer vos amis !
            </p>
            <button
                onClick={handleBecomeAmbassador}
                disabled={loading}
                className="w-full py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
                {loading ? "Enregistrement..." : "Je deviens ambassadeur"}
            </button>
        </div>
    );
};

export default BecomeAmbassadorPage;
