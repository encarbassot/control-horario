import { useActiveClock } from "../../contexts/ActiveClockContext"
import "./ActiveClockBar.css"

function formatElapsed(ms) {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export default function ActiveClockBar() {
  const { activeShift, elapsed, clockOut } = useActiveClock()

  if (!activeShift) return null

  return (
    <div className="ActiveClockBar">
      <div className="ActiveClockBar__info">
        <span className="ActiveClockBar__dot" />
        <span className="ActiveClockBar__ws">{activeShift.workspace_name || "Workspace"}</span>
        <span className="ActiveClockBar__timer">{formatElapsed(elapsed)}</span>
      </div>
      <button
        className="ActiveClockBar__stop"
        onClick={() => clockOut(activeShift.workspace_id)}
        title="Clock out"
      >
        <svg viewBox="0 0 24 24" width="16" height="16"><rect x="6" y="5" width="12" height="14" rx="2" fill="currentColor"/></svg>
        <span>Stop</span>
      </button>
    </div>
  )
}
