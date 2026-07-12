import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "./context/ThemeContext";
import "./index.css";
import AppSidepanel from "./AppSidepanel";
import { Preloader } from "./components/Preloader";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Preloader>
      <ThemeProvider>
        <AppSidepanel />
      </ThemeProvider>
    </Preloader>
  </StrictMode>
);