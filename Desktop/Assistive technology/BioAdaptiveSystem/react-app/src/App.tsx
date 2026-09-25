import { useState, useEffect } from "react"
import LoginPage from "./pages/login"
import DashboardPage from "./pages/dashboard"
import { DashboardProvider } from "./context/DashboardContext"

export type TabType = "dashboard" | "analytics" | "sessions" | "accessibility" | "extension" | "settings"

function App() {
  const [view, setView] = useState<"login" | "dashboard">(() => {
    const hash = window.location.hash.replace("#", "")
    return hash === "login" ? "login" : "dashboard"
  })

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const hash = window.location.hash.replace("#", "") as TabType
    if (["dashboard", "analytics", "sessions", "accessibility", "extension", "settings"].includes(hash)) {
      return hash
    }
    return "dashboard"
  })

  // Hash-based URL routing & Browser Back/Forward navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "")
      if (hash === "login") {
        setView("login")
      } else {
        setView("dashboard")
        if (["dashboard", "analytics", "sessions", "accessibility", "extension", "settings"].includes(hash)) {
          setActiveTab(hash as TabType)
        }
      }
    }

    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    window.location.hash = tab
  }

  const handleLogin = () => {
    setView("dashboard")
    window.location.hash = activeTab || "dashboard"
  }

  const handleLogout = () => {
    setView("login")
    window.location.hash = "login"
  }

  return (
    <DashboardProvider>
      {view === "login" ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <DashboardPage 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
          onLogout={handleLogout} 
        />
      )}
    </DashboardProvider>
  )
}

export default App
