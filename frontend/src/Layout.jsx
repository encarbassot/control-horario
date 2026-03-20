import { Outlet } from "react-router-dom"
import TopNavbar from "./components/TopNavbar/TopNavbar"
import "./Layout.css"

export default function Layout() {
  return (
    <div className="AppLayout">
      <TopNavbar />
      <main className="AppLayout__content">
        <Outlet />
      </main>
    </div>
  )
}
