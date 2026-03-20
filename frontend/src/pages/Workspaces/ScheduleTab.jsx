import { useEffect, useState, useMemo } from "react"
import { api } from "../../api/ApiAdapter"
import { useActiveClock } from "../../contexts/ActiveClockContext"
import "./ScheduleTab.css"

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const MINUTES_IN_DAY = 24 * 60

function getShiftColor(shift) {
  if (shift.status === "cancelled") return "shift--cancelled"
  if (shift.status === "in_progress") return "shift--active"
  if (!shift.actual_start) return "shift--planned"

  const hasSuspicious =
    (shift.original_start && shift.planned_start &&
      new Date(shift.planned_start) < new Date(shift.original_start)) ||
    (shift.original_end && shift.planned_end &&
      new Date(shift.planned_end) > new Date(shift.original_end))

  if (hasSuspicious) return "shift--suspicious"

  const TOLERANCE = 15 * 60 * 1000
  const startDiff = shift.actual_start && shift.planned_start
    ? Math.abs(new Date(shift.actual_start) - new Date(shift.planned_start)) : 0
  const endDiff = shift.actual_end && shift.planned_end
    ? Math.abs(new Date(shift.actual_end) - new Date(shift.planned_end)) : 0

  if (startDiff > TOLERANCE || endDiff > TOLERANCE) return "shift--deviation"
  return "shift--ontime"
}

function minuteOfDay(dateStr) {
  const d = new Date(dateStr)
  return d.getHours() * 60 + d.getMinutes()
}

function formatHoursMinutes(totalMinutes) {
  const h = Math.floor(totalMinutes / 60)
  const m = Math.round(totalMinutes % 60)
  if (h === 0) return `${m}m`
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function formatTime(dateStr) {
  if (!dateStr) return "—"
  const d = new Date(dateStr)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

function getDaysInMonth(year, month) {
  const days = []
  const count = new Date(year, month + 1, 0).getDate()
  for (let d = 1; d <= count; d++) {
    const date = new Date(year, month, d)
    days.push({
      dateStr: date.toISOString().slice(0, 10),
      dayName: DAY_NAMES[date.getDay()],
      dayNum: d,
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      isToday: date.toDateString() === new Date().toDateString(),
    })
  }
  return days
}

export default function ScheduleTab({ workspaceId, isManager, members }) {
  const { now } = useActiveClock()
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedDay, setExpandedDay] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  const days = useMemo(
    () => getDaysInMonth(currentMonth.year, currentMonth.month),
    [currentMonth.year, currentMonth.month]
  )

  const monthLabel = useMemo(() => {
    const d = new Date(currentMonth.year, currentMonth.month)
    return d.toLocaleDateString(undefined, { year: "numeric", month: "long" })
  }, [currentMonth.year, currentMonth.month])

  useEffect(() => {
    const from = `${currentMonth.year}-${String(currentMonth.month + 1).padStart(2, "0")}-01`
    const lastDay = new Date(currentMonth.year, currentMonth.month + 1, 0).getDate()
    const to = `${currentMonth.year}-${String(currentMonth.month + 1).padStart(2, "0")}-${lastDay}`

    setLoading(true)
    const endpoint = selectedUser
      ? `/workspaces/${workspaceId}/shifts?from=${from}&to=${to}&user_id=${selectedUser}`
      : `/workspaces/${workspaceId}/shifts/me?from=${from}&to=${to}`

    // Lazy-generate shifts from templates, then fetch
    api.post(`/workspaces/${workspaceId}/shifts/generate`, { from, to, ...(selectedUser ? { user_id: selectedUser } : {}) })
      .then(() => api.get(endpoint))
      .then(({ success, data }) => {
        if (success) setShifts(data || [])
        setLoading(false)
      })
  }, [workspaceId, currentMonth, selectedUser])

  const shiftsByDate = useMemo(() => {
    const map = {}
    for (const s of shifts) {
      const dateKey = s.date?.slice(0, 10) || new Date(s.planned_start).toISOString().slice(0, 10)
      if (!map[dateKey]) map[dateKey] = []
      map[dateKey].push(s)
    }
    return map
  }, [shifts])

  function prevMonth() {
    setCurrentMonth(prev => {
      const m = prev.month - 1
      return m < 0 ? { year: prev.year - 1, month: 11 } : { year: prev.year, month: m }
    })
    setExpandedDay(null)
  }

  function nextMonth() {
    setCurrentMonth(prev => {
      const m = prev.month + 1
      return m > 11 ? { year: prev.year + 1, month: 0 } : { year: prev.year, month: m }
    })
    setExpandedDay(null)
  }

  return (
    <div className="ScheduleTab">
      <div className="sched-controls">
        <div className="sched-month-nav">
          <button className="sched-nav-btn" onClick={prevMonth}>‹</button>
          <span className="sched-month-label">{monthLabel}</span>
          <button className="sched-nav-btn" onClick={nextMonth}>›</button>
        </div>
        {isManager && members.length > 0 && (
          <select
            className="sched-user-select"
            value={selectedUser || ""}
            onChange={e => { setSelectedUser(e.target.value || null); setExpandedDay(null) }}
          >
            <option value="">My schedule</option>
            {members.map(m => (
              <option key={m.user_id} value={m.user_id}>
                {m.user_name || m.user_id}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="sched-header-row">
        <div className="sched-col-day" />
        <div className="sched-col-hours" />
        <div className="sched-col-timeline">
          <div className="sched-hour-labels">
            {[0, 3, 6, 9, 12, 15, 18, 21].map(h => (
              <span key={h} className="sched-hour-label" style={{ left: `${(h / 24) * 100}%` }}>
                {String(h).padStart(2, "0")}
              </span>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="sched-loading"><span className="spinner small" /></div>
      ) : (
        <div className="sched-rows">
          {days.map(day => {
            const dayShifts = shiftsByDate[day.dateStr] || []
            const totalMin = dayShifts.reduce((sum, s) => {
              const start = s.actual_start || s.planned_start
              const end = s.status === "in_progress" && !s.actual_end
                ? new Date(now).toISOString()
                : (s.actual_end || s.planned_end)
              if (!start || !end) return sum
              return sum + (new Date(end) - new Date(start)) / 60000
            }, 0)
            const isExpanded = expandedDay === day.dateStr

            return (
              <div key={day.dateStr} className="sched-day-group">
                <div
                  className={[
                    "sched-row",
                    day.isWeekend && "sched-row--weekend",
                    day.isToday && "sched-row--today",
                    isExpanded && "sched-row--expanded",
                  ].filter(Boolean).join(" ")}
                  onClick={() => setExpandedDay(isExpanded ? null : day.dateStr)}
                >
                  <div className="sched-col-day">
                    <span className="sched-day-name">{day.dayName.slice(0, 3)}</span>
                    <span className="sched-day-num">{day.dayNum}</span>
                  </div>
                  <div className="sched-col-hours">
                    {totalMin > 0 ? (
                      <span className="sched-total">{formatHoursMinutes(totalMin)}</span>
                    ) : (
                      <span className="sched-total sched-total--empty">—</span>
                    )}
                  </div>
                  <div className="sched-col-timeline">
                    <div className="sched-timeline-bg">
                      {dayShifts.map(shift => {
                        const start = shift.actual_start || shift.planned_start
                        const end = shift.status === "in_progress" && !shift.actual_end
                          ? new Date(now).toISOString()
                          : (shift.actual_end || shift.planned_end || new Date().toISOString())
                        const startMin = minuteOfDay(start)
                        const endMin = minuteOfDay(end)
                        const left = (startMin / MINUTES_IN_DAY) * 100
                        const width = Math.max(((endMin - startMin) / MINUTES_IN_DAY) * 100, 0.5)

                        return (
                          <div
                            key={shift.id}
                            className={`sched-bar ${getShiftColor(shift)}`}
                            style={{ left: `${left}%`, width: `${width}%` }}
                            title={`${formatTime(start)} – ${formatTime(end)}`}
                          />
                        )
                      })}
                    </div>
                  </div>
                </div>

                {isExpanded && dayShifts.length > 0 && (
                  <div className="sched-detail">
                    {dayShifts.map(shift => (
                      <div key={shift.id} className={`sched-detail-row ${getShiftColor(shift)}`}>
                        <div className="sched-detail-times">
                          <div className="sched-detail-pair">
                            <span className="sched-detail-label">Planned</span>
                            <span>{formatTime(shift.planned_start)} – {formatTime(shift.planned_end)}</span>
                          </div>
                          {shift.actual_start && (
                            <div className="sched-detail-pair">
                              <span className="sched-detail-label">Actual</span>
                              <span>
                                {formatTime(shift.actual_start)} – {shift.actual_end ? formatTime(shift.actual_end) : "…"}
                              </span>
                            </div>
                          )}
                          {shift.note && (
                            <div className="sched-detail-pair">
                              <span className="sched-detail-label">Note</span>
                              <span className="sched-detail-note">{shift.note}</span>
                            </div>
                          )}
                        </div>
                        <div className="sched-detail-actions">
                          <span className={`sched-status sched-status--${shift.status}`}>
                            {shift.status.replace("_", " ")}
                          </span>
                          <button className="button button--small" disabled>Edit</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {isExpanded && dayShifts.length === 0 && (
                  <div className="sched-detail sched-detail--empty">No shifts this day</div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
