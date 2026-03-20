import { useActiveClock } from "../../contexts/ActiveClockContext"
import "./ClockIsland.css"

function formatElapsed(ms) {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export default function ClockIsland() {
  const { activeShift, elapsed, clockOut } = useActiveClock()

  if (!activeShift) return null

  return (
    <div className="ClockIsland">
      <div className="ClockIsland__pulse" />
      <div className="ClockIsland__content">
        <div className="ClockIsland__left">
          <span className="ClockIsland__dot" />
          <span className="ClockIsland__timer">{formatElapsed(elapsed)}</span>
        </div>
        <span className="ClockIsland__ws">{activeShift.workspace_name || "Workspace"}</span>
        <button
          className="ClockIsland__stop"
          onClick={() => clockOut(activeShift.workspace_id)}
          title="Clock out"
        >
          <svg viewBox="0 0 24 24" width="14" height="14">
            <rect x="6" y="5" width="12" height="14" rx="2" fill="currentColor" />
          </svg>
        </button>
      </div>
    </div>
  )
}
