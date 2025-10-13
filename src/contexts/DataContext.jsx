import React, { createContext, useContext, useReducer } from 'react';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};

const initialState = {
  session: { user: { id: '1', email: 'demo@trezocash.fr' } },
  profile: { id: '1', fullName: 'Demo User', role: 'user' },
  projects: [],
  tiers: [],
  templates: [],
  settings: {
    currency: 'EUR',
    displayUnit: 'standard',
    decimalPlaces: 2
  }
};

const dataReducer = (state, action) => {
  switch (action.type) {
    case 'SET_PROFILE':
      return { ...state, profile: action.payload };
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };
    case 'RESET_DATA_STATE':
      return initialState;
    default:
      return state;
  }
};

export const DataProvider = ({ children }) => {
  const [dataState, dataDispatch] = useReducer(dataReducer, initialState);

  return (
    <DataContext.Provider value={{ dataState, dataDispatch }}>
      {children}
    </DataContext.Provider>
  );
};
