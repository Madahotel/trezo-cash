import { RouterProvider } from "react-router-dom";
import router from "./routes/router";
import { DataProvider } from "./components/context/DataContext";
import { UIProvider } from "./components/context/UIContext";

function App() {
  return (
    <>
      <DataProvider>
        <UIProvider>
          <RouterProvider router={router} />
        </UIProvider>
      </DataProvider>
    </>
  );
}

export default App;
