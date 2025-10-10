import { createContext, useContext, useState, useEffect } from "react";
import axios from "../config/Axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("auth_token") || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem("auth_token");

      if (savedToken) {
        try {
          console.log("🔄 Vérification du token...");
          // Configure le token pour les requêtes suivantes
          axios.defaults.headers.Authorization = `Bearer ${savedToken}`;
          
          // Ici vous devrez peut-être appeler un endpoint pour récupérer les infos utilisateur
          // Pour l'instant, on va simplement valider que le token existe
          setUser({ name: "Utilisateur" }); // Placeholder
          setToken(savedToken);
          setError(null);
        } catch (error) {
          console.error("❌ Erreur lors de la vérification du token:", error);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔑 Tentative de connexion...");
      const response = await axios.post("/login", { // Changé de "/auth/login" à "/login"
        email,
        password,
      });

      console.log("✅ Réponse login:", response.data);

      const { token: receivedToken, user: userData } = response.data;

      if (!receivedToken) {
        throw new Error("Token non reçu");
      }

      localStorage.setItem("auth_token", receivedToken);
      // Stocker aussi les infos utilisateur si nécessaire
      localStorage.setItem("user", JSON.stringify(userData));
      
      setToken(receivedToken);
      setUser(userData);
      setError(null);

      return { success: true, message: "Connexion réussie" };
    } catch (error) {
      console.error("❌ Erreur login:", error);
      const message = error.response?.data?.message || "Erreur de connexion";
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password, password_confirm) => {
    try {
      setLoading(true);
      setError(null);

      console.log("📝 Tentative d'inscription...");
      const response = await axios.post("/register", { // Changé de "/auth/register" à "/register"
        name,
        email,
        password,
        password_confirm: password_confirm || password,
      });

      console.log("✅ Réponse register:", response.data);

      // Note: Votre AXIOS register ne retourne pas de token ni user
      // Seulement un message de succès
      if (response.data.status === 200) {
        setError(null);
        return { 
          success: true, 
          message: response.data.message || "Inscription réussie" 
        };
      } else {
        throw new Error(response.data.message || "Erreur d'inscription");
      }
    } catch (error) {
      console.error("❌ Erreur register:", error);
      const message = error.response?.data?.message || "Erreur d'inscription";
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await axios.post("/logout"); // Changé de "/auth/logout" à "/logout"
      }
    } catch (error) {
      console.error("Erreur logout:", error);
    } finally {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      setToken(null);
      setUser(null);
      setError(null);
      console.log("🚪 Déconnexion effectuée");
    }
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    error,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};