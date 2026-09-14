import React, { useEffect } from "react"
import ReactDOM from "react-dom/client"
import { HashRouter, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "@/components/theme-provider.jsx"
import App from "./App.jsx"
import HomePage from "./pages/HomePage.jsx"
import Settings from "./pages/Settings.jsx"
import VaultPage from "./pages/VaultPage.jsx"
import CollectionsPage from "./pages/CollectionsPage.jsx"
import ImportExportPage from "./features/import-export/ImportExportPage.jsx"
import Onboarding from "./features/onboarding/Onboarding.jsx"
import "./index.css"

function Root() {
  useEffect(() => {
    const splash = document.getElementById("splash")
    if (splash) {
      splash.style.transition = "opacity 0.3s ease-out"
      splash.style.opacity = "0"
      setTimeout(() => splash.remove(), 300)
    }
  }, [])

  return (
    <ThemeProvider defaultTheme="volt">
      <HashRouter>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/" element={<App />}>
            <Route index element={<HomePage />} />
            <Route path="vault" element={<VaultPage />} />
            <Route path="collections" element={<CollectionsPage />} />
            <Route path="settings" element={<Settings />} />
            <Route path="import-export" element={<ImportExportPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </ThemeProvider>
  )
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)
