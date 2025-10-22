import { RouterProvider } from "react-router-dom";
import router from "./routes/router";
import { DataProvider } from "./components/context/DataContext";
import { UIProvider } from "./components/context/UIContext";
import { AuthProvider } from "./components/context/AuthContext";
import { SettingsProvider } from "./components/context/SettingsContext";
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <AuthProvider>
        <DataProvider>
          <UIProvider>
            <SettingsProvider>
              <RouterProvider router={router} />
            </SettingsProvider>
          </UIProvider>
        </DataProvider>
      </AuthProvider>
    </>
  );
}

export default App;