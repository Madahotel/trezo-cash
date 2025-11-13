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
      const savedUser = localStorage.getItem("user");

      if (savedToken) {
        try {
          axios.defaults.headers.Authorization = `Bearer ${savedToken}`;
          if (savedUser) {
            try {
              const userData = JSON.parse(savedUser);
              setUser(userData);
            } catch (e) {
            }
          }
          setToken(savedToken);
          setError(null);
        } catch (error) {
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
      const response = await axios.post("/login", {
        email,
        password,
      });
      const { token: receivedToken, user: userData } = response.data;

      if (!receivedToken) {
        throw new Error("Token non reçu");
      }

      localStorage.setItem("auth_token", receivedToken);
      localStorage.setItem("user", JSON.stringify(userData));
      
      setToken(receivedToken);
      setUser(userData);
      setError(null);

      return { success: true, message: "Connexion réussie" };
    } catch (error) {
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
      const response = await axios.post("/register", {
        name,
        email,
        password,
        password_confirm: password_confirm || password,
      });

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
        await axios.post("/logout");
      }
    } catch (error) {
    } finally {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      setToken(null);
      setUser(null);
      setError(null);
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