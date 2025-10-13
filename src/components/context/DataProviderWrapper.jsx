// DataProviderWrapper.jsx
import React from 'react';
import { useAuth } from './AuthContext';
import { DataProvider } from './DataContext';

export const DataProviderWrapper = ({ children }) => {
  const { user } = useAuth();
  
  return (
    <DataProvider user={user}>
      {children}
    </DataProvider>
  );
};

// Puis modifiez légèrement DataContext pour accepter une prop user
export const DataProvider = ({ children, user }) => {
    const [state, dispatch] = useReducer(dataReducer, getInitialDataState());

    useEffect(() => {
        if (user) {
            // Utilisez l'utilisateur réel au lieu des données mock
            const realSession = {
                user: user,
                access_token: 'real-token', // Vous devrez récupérer ça depuis AuthContext
                expires_at: Math.floor(Date.now() / 1000) + 3600
            };
            
            dispatch({ type: 'SET_SESSION', payload: realSession });
            dispatch({ type: 'SET_PROFILE', payload: user });
        } else {
            // Fallback sur les données mock si pas d'utilisateur
            const mockSession = getMockSession();
            dispatch({ type: 'SET_SESSION', payload: mockSession });
            dispatch({ type: 'SET_PROFILE', payload: mockSession.user });
        }

        // Simuler des données d'échange
        dispatch({ 
            type: 'SET_EXCHANGE_RATES', 
            payload: {
                EUR: 1,
                USD: 1.08,
                GBP: 0.85
            }
        });
    }, [user]); // Dépendance sur user

    return (
        <DataContext.Provider value={{ dataState: state, dataDispatch: dispatch }}>
            {children}
        </DataContext.Provider>
    );
};