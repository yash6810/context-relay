import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { ensureSampleData } from "./lib/storage";
import "./index.css";
import App from "./App";

import { Preloader } from "./components/Preloader";

function Root() {
  useEffect(() => {
    ensureSampleData();
  }, []);

  return (
    <StrictMode>
      <Preloader>
        <MemoryRouter>
          <ThemeProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </ThemeProvider>
        </MemoryRouter>
      </Preloader>
    </StrictMode>
  );
}

createRoot(document.getElementById("root")!).render(<Root />);