import { RouterProvider } from "react-router-dom";
import router from "./routes/router";
import { DataProvider } from "./components/context/DataContext";
import { UIProvider } from "./components/context/UIContext";
import { AuthProvider } from "./components/context/AuthContext"; // ➕ Import an'ity

function App() {
  return (
    <DataProvider>
      <UIProvider>
        <AuthProvider> 
          <RouterProvider router={router} />
        </AuthProvider>
      </UIProvider>
    </DataProvider>
  );
}

export default App;
