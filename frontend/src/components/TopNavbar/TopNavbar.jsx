import { useState, useRef, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useElioAuth } from "../../contexts/ElioAuthContext"
import { useActiveClock } from "../../contexts/ActiveClockContext"
import { ROUTES } from "../../routes/navigationConfig"
import "./TopNavbar.css"

const NAV_ITEMS = [
  { label: "Dashboard", path: ROUTES.HOME },
  { label: "Workspaces", path: ROUTES.WORKSPACES },
]

export default function TopNavbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useElioAuth()
  const { activeShift, elapsed, clockOut } = useActiveClock()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)

  function formatElapsed(ms) {
    const totalSec = Math.floor(ms / 1000)
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const isActive = (path) => {
    if (path === ROUTES.HOME) return location.pathname === "/" || location.pathname === "/dashboard"
    return location.pathname.startsWith(path)
  }

  return (
    <nav className="TopNavbar">
      {/* Left: Logo + nav links */}
      <div className="TopNavbar__left">
        <span className="TopNavbar__logo" onClick={() => navigate(ROUTES.HOME)}>⏱️</span>
        <div className="TopNavbar__links">
          {NAV_ITEMS.map(item => (
            <button
              key={item.path}
              className={`TopNavbar__link ${isActive(item.path) ? "TopNavbar__link--active" : ""}`}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Center: Clock island */}
      <div className="TopNavbar__center">
        {activeShift && (
          <div className="TopNavbar__island">
            <span className="TopNavbar__island-dot" />
            <span className="TopNavbar__island-timer">{formatElapsed(elapsed)}</span>
            <span className="TopNavbar__island-ws">{activeShift.workspace_name || "Workspace"}</span>
            <button
              className="TopNavbar__island-stop"
              onClick={() => clockOut(activeShift.workspace_id)}
              title="Clock out"
            >
              <svg viewBox="0 0 24 24" width="12" height="12">
                <rect x="6" y="5" width="12" height="14" rx="2" fill="white" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Right: User dropdown */}
      <div className="TopNavbar__right" ref={userMenuRef}>
        <button
          className="TopNavbar__user-btn"
          onClick={() => setUserMenuOpen(prev => !prev)}
        >
          <span className="TopNavbar__avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </span>
          <span className="TopNavbar__user-name">{user?.name?.split(" ")[0] || "User"}</span>
          <svg className="TopNavbar__chevron" viewBox="0 0 20 20" width="14" height="14">
            <path d="M5 7l5 5 5-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
        </button>

        {userMenuOpen && (
          <div className="TopNavbar__dropdown">
            <div className="TopNavbar__dropdown-header">
              <span className="TopNavbar__dropdown-name">{user?.name || "User"}</span>
              <span className="TopNavbar__dropdown-email">{user?.email || ""}</span>
            </div>
            <div className="TopNavbar__dropdown-divider" />
            <button
              className="TopNavbar__dropdown-item"
              onClick={() => { navigate(ROUTES.PROFILE); setUserMenuOpen(false) }}
            >
              Profile
            </button>
            <div className="TopNavbar__dropdown-divider" />
            <button className="TopNavbar__dropdown-item TopNavbar__dropdown-item--danger" onClick={logout}>
              Log out
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
