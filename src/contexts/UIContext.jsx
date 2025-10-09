import React, { createContext, useContext, useReducer } from 'react';

const UIContext = createContext();

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within UIProvider');
  }
  return context;
};

const initialState = {
  isLoading: false,
  toasts: [],
  isOnboarding: false,
  activeProjectId: null
};

let toastId = 0;

const uiReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [
          ...state.toasts,
          { ...action.payload, id: toastId++ }
        ]
      };
    case 'REMOVE_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter(t => t.id !== action.payload)
      };
    case 'SET_ACTIVE_PROJECT':
      return { ...state, activeProjectId: action.payload };
    case 'RESET_UI_STATE':
      return initialState;
    default:
      return state;
  }
};

export const UIProvider = ({ children }) => {
  const [uiState, uiDispatch] = useReducer(uiReducer, initialState);

  return (
    <UIContext.Provider value={{ uiState, uiDispatch }}>
      {children}
    </UIContext.Provider>
  );
};
