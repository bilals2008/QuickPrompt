import React from "react"
import ReactDOM from "react-dom/client"
import { HashRouter, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "@/components/theme-provider.jsx"
import App from "./App.jsx"
import HomePage from "./pages/HomePage.jsx"
import Settings from "./pages/Settings.jsx"
import VaultPage from "./pages/VaultPage.jsx"
import ImportExportPage from "./features/import-export/ImportExportPage.jsx"
import Onboarding from "./features/onboarding/Onboarding.jsx"
import "./index.css"

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark">
      <HashRouter>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/" element={<App />}>
            <Route index element={<HomePage />} />
            <Route path="vault" element={<VaultPage />} />
            <Route path="settings" element={<Settings />} />
            <Route path="import-export" element={<ImportExportPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </ThemeProvider>
  </React.StrictMode>
)
