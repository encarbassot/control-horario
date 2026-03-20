import { useEffect, useState, useMemo, useRef, useCallback } from "react"
import { api } from "../../api/ApiAdapter"
import { useActiveClock } from "../../contexts/ActiveClockContext"
import "./WeekPlannerTab.css"

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
// Map ISO weekday (Mon=0..Sun=6) to JS Date.getDay() (Sun=0..Sat=6)
const ISO_TO_JS = [1, 2, 3, 4, 5, 6, 0]
const JS_TO_ISO = { 0: 6, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 }

const HOUR_HEIGHT = 48 // px per hour
const TOTAL_HEIGHT = 24 * HOUR_HEIGHT
const HOURS = Array.from({ length: 24 }, (_, i) => i)

function getMonday(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatWeekLabel(monday) {
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 6)
  const opts = { day: "numeric", month: "short" }
  return `${monday.toLocaleDateString(undefined, opts)} – ${sunday.toLocaleDateString(undefined, opts)}`
}

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(":").map(Number)
  return h * 60 + m
}

function minutesToTime(min) {
  const h = Math.floor(min / 60) % 24
  const m = min % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

function minutesToPx(min) {
  return (min / 60) * HOUR_HEIGHT
}

// Compute top & height in px for a block, handling cross-midnight
function blockPosition(startTime, endTime) {
  const startMin = timeToMinutes(startTime)
  const endMin = timeToMinutes(endTime)
  if (endMin > startMin) {
    return { top: minutesToPx(startMin), height: minutesToPx(endMin - startMin) }
  }
  // Cross-midnight: goes from start to 24:00
  return { top: minutesToPx(startMin), height: minutesToPx(1440 - startMin) }
}

// For cross-midnight, the overflow part on the next day (0:00 to end)
function overflowPosition(endTime) {
  const endMin = timeToMinutes(endTime)
  if (endMin === 0) return null
  return { top: 0, height: minutesToPx(endMin) }
}

function isCrossMidnight(startTime, endTime) {
  return timeToMinutes(endTime) <= timeToMinutes(startTime)
}

const INITIAL_FORM = {
  day_of_week: 1,
  start_time: "09:00",
  end_time: "17:00",
  repeat_every: 1,
  end_type: "never",
  end_after_count: "",
  end_until_date: "",
  note: "",
}

export default function WeekPlannerTab({ workspaceId, isOwner, members }) {
  const { now } = useActiveClock()
  const [templates, setTemplates] = useState([])
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [monday, setMonday] = useState(() => getMonday(new Date()))
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [saving, setSaving] = useState(false)
  const gridRef = useRef(null)

  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [monday])

  const weekLabel = useMemo(() => formatWeekLabel(monday), [monday])

  // Fetch templates + shifts for the visible week
  useEffect(() => {
    setLoading(true)
    const from = monday.toISOString().slice(0, 10)
    const toDate = new Date(monday)
    toDate.setDate(toDate.getDate() + 6)
    const to = toDate.toISOString().slice(0, 10)

    const userParam = selectedUser ? `?user_id=${selectedUser}` : ""
    const tplEndpoint = selectedUser
      ? `/workspaces/${workspaceId}/schedule-templates?user_id=${selectedUser}`
      : `/workspaces/${workspaceId}/schedule-templates/me`
    const shiftEndpoint = selectedUser
      ? `/workspaces/${workspaceId}/shifts?from=${from}&to=${to}&user_id=${selectedUser}`
      : `/workspaces/${workspaceId}/shifts/me?from=${from}&to=${to}`

    Promise.all([
      api.get(tplEndpoint),
      api.post(`/workspaces/${workspaceId}/shifts/generate`, { from, to, ...(selectedUser ? { user_id: selectedUser } : {}) }),
      api.get(shiftEndpoint),
    ]).then(([tplRes, , shiftRes]) => {
      if (tplRes.success) setTemplates(tplRes.data || [])
      if (shiftRes.success) setShifts(shiftRes.data || [])
      setLoading(false)
    })
  }, [workspaceId, monday, selectedUser])

  // Compute which templates apply to each day of the week
  const templatesByIsoDay = useMemo(() => {
    const map = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }
    for (const tpl of templates) {
      for (let i = 0; i < 7; i++) {
        const date = weekDates[i]
        const jsDow = date.getDay()
        if (tpl.day_of_week !== jsDow) continue

        // Check repeat interval
        const anchor = new Date(tpl.repeat_anchor)
        const dayDiff = Math.round((date.getTime() - anchor.getTime()) / 86400000)
        const weekDiff = Math.floor(dayDiff / 7)
        if (weekDiff < 0) continue
        if (tpl.repeat_every > 1 && weekDiff % tpl.repeat_every !== 0) continue

        // Check end conditions
        if (tpl.end_type === "until" && tpl.end_until_date && date > new Date(tpl.end_until_date)) continue
        if (tpl.end_type === "after" && tpl.end_after_count) {
          const occ = Math.floor(weekDiff / tpl.repeat_every)
          if (occ >= tpl.end_after_count) continue
        }

        map[i].push(tpl)
      }
    }
    return map
  }, [templates, weekDates])

  // Group shifts by ISO day index
  const shiftsByIsoDay = useMemo(() => {
    const map = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }
    for (const s of shifts) {
      const d = new Date(s.date || s.planned_start)
      const jsDow = d.getDay()
      const isoIdx = JS_TO_ISO[jsDow]
      if (isoIdx >= 0 && isoIdx < 7) map[isoIdx].push(s)
    }
    return map
  }, [shifts])

  function prevWeek() {
    setMonday(prev => {
      const d = new Date(prev)
      d.setDate(d.getDate() - 7)
      return d
    })
  }

  function nextWeek() {
    setMonday(prev => {
      const d = new Date(prev)
      d.setDate(d.getDate() + 7)
      return d
    })
  }

  function goToday() {
    setMonday(getMonday(new Date()))
  }

  // Open create modal on grid click
  function handleGridClick(isoDay, e) {
    if (e.target.closest(".wp-block")) return // clicked on an existing block
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const rawMin = Math.round((y / HOUR_HEIGHT) * 60)
    const snappedMin = Math.round(rawMin / 30) * 30
    const startTime = minutesToTime(snappedMin)
    const endMin = Math.min(snappedMin + 60, 1440)
    const endTime = minutesToTime(endMin)

    const jsDow = ISO_TO_JS[isoDay]
    const anchorDate = weekDates[isoDay].toISOString().slice(0, 10)

    setForm({
      ...INITIAL_FORM,
      day_of_week: jsDow,
      start_time: startTime,
      end_time: endTime,
      repeat_anchor: anchorDate,
    })
    setEditingTemplate(null)
    setModalOpen(true)
  }

  // Open edit modal on template block click
  function handleBlockClick(tpl, e) {
    e.stopPropagation()
    setForm({
      day_of_week: tpl.day_of_week,
      start_time: tpl.start_time,
      end_time: tpl.end_time,
      repeat_every: tpl.repeat_every || 1,
      end_type: tpl.end_type || "never",
      end_after_count: tpl.end_after_count || "",
      end_until_date: tpl.end_until_date ? new Date(tpl.end_until_date).toISOString().slice(0, 10) : "",
      note: tpl.note || "",
      repeat_anchor: new Date(tpl.repeat_anchor).toISOString().slice(0, 10),
    })
    setEditingTemplate(tpl)
    setModalOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    const payload = {
      day_of_week: Number(form.day_of_week),
      start_time: form.start_time,
      end_time: form.end_time,
      repeat_every: Number(form.repeat_every) || 1,
      repeat_anchor: form.repeat_anchor,
      end_type: form.end_type,
      end_after_count: form.end_type === "after" ? Number(form.end_after_count) : null,
      end_until_date: form.end_type === "until" ? form.end_until_date : null,
      note: form.note || null,
    }
    if (selectedUser) payload.user_id = selectedUser

    if (editingTemplate) {
      await api.put(`/workspaces/${workspaceId}/schedule-templates/${editingTemplate.id}`, payload)
    } else {
      await api.post(`/workspaces/${workspaceId}/schedule-templates`, payload)
    }

    setSaving(false)
    setModalOpen(false)
    // Refresh
    reloadData()
  }

  async function handleDelete() {
    if (!editingTemplate) return
    setSaving(true)
    await api.delete(`/workspaces/${workspaceId}/schedule-templates/${editingTemplate.id}`)
    setSaving(false)
    setModalOpen(false)
    reloadData()
  }

  function reloadData() {
    const from = monday.toISOString().slice(0, 10)
    const toDate = new Date(monday)
    toDate.setDate(toDate.getDate() + 6)
    const to = toDate.toISOString().slice(0, 10)

    const tplEndpoint = selectedUser
      ? `/workspaces/${workspaceId}/schedule-templates?user_id=${selectedUser}`
      : `/workspaces/${workspaceId}/schedule-templates/me`
    const shiftEndpoint = selectedUser
      ? `/workspaces/${workspaceId}/shifts?from=${from}&to=${to}&user_id=${selectedUser}`
      : `/workspaces/${workspaceId}/shifts/me?from=${from}&to=${to}`

    Promise.all([
      api.get(tplEndpoint),
      api.post(`/workspaces/${workspaceId}/shifts/generate`, { from, to, ...(selectedUser ? { user_id: selectedUser } : {}) }),
      api.get(shiftEndpoint),
    ]).then(([tplRes, , shiftRes]) => {
      if (tplRes.success) setTemplates(tplRes.data || [])
      if (shiftRes.success) setShifts(shiftRes.data || [])
    })
  }

  function updateForm(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  // Current time indicator position
  const nowDate = new Date(now)
  const nowIsoDay = JS_TO_ISO[nowDate.getDay()]
  const nowMinutes = nowDate.getHours() * 60 + nowDate.getMinutes()
  const isThisWeek = weekDates[0] <= nowDate && nowDate <= new Date(weekDates[6].getTime() + 86400000)

  return (
    <div className="WeekPlannerTab">
      {/* Controls */}
      <div className="wp-controls">
        <div className="wp-nav">
          <button className="wp-nav-btn" onClick={prevWeek}>‹</button>
          <span className="wp-week-label">{weekLabel}</span>
          <button className="wp-nav-btn" onClick={nextWeek}>›</button>
          <button className="wp-today-btn" onClick={goToday}>Today</button>
        </div>
        {isOwner && members.length > 0 && (
          <select
            className="wp-user-select"
            value={selectedUser || ""}
            onChange={e => setSelectedUser(e.target.value || null)}
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

      {loading ? (
        <div className="wp-loading"><span className="spinner small" /></div>
      ) : (
        <div className="wp-grid-wrapper">
          {/* Header row */}
          <div className="wp-header">
            <div className="wp-time-gutter" />
            {weekDates.map((d, i) => {
              const isToday = d.toDateString() === new Date().toDateString()
              return (
                <div key={i} className={`wp-day-header ${isToday ? "wp-day-header--today" : ""}`}>
                  <span className="wp-day-label">{DAY_LABELS[i]}</span>
                  <span className={`wp-day-num ${isToday ? "wp-day-num--today" : ""}`}>{d.getDate()}</span>
                </div>
              )
            })}
          </div>

          {/* Grid body */}
          <div className="wp-grid-scroll" ref={gridRef}>
            <div className="wp-grid" style={{ height: TOTAL_HEIGHT }}>
              {/* Time gutter */}
              <div className="wp-time-gutter">
                {HOURS.map(h => (
                  <div key={h} className="wp-hour-label" style={{ top: h * HOUR_HEIGHT, height: HOUR_HEIGHT }}>
                    {String(h).padStart(2, "0")}:00
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {weekDates.map((date, isoDay) => (
                <div
                  key={isoDay}
                  className="wp-day-col"
                  onClick={e => handleGridClick(isoDay, e)}
                >
                  {/* Hour grid lines */}
                  {HOURS.map(h => (
                    <div key={h} className="wp-hour-line" style={{ top: h * HOUR_HEIGHT }} />
                  ))}

                  {/* Template blocks */}
                  {templatesByIsoDay[isoDay]?.map(tpl => {
                    const { top, height } = blockPosition(tpl.start_time, tpl.end_time)
                    const cross = isCrossMidnight(tpl.start_time, tpl.end_time)
                    return (
                      <div
                        key={`tpl-${tpl.id}`}
                        className="wp-block wp-block--template"
                        style={{ top, height: Math.max(height, 12) }}
                        onClick={e => handleBlockClick(tpl, e)}
                        title={`${tpl.start_time} – ${tpl.end_time}${tpl.repeat_every > 1 ? ` (every ${tpl.repeat_every} weeks)` : ""}`}
                      >
                        <span className="wp-block__time">{tpl.start_time} – {tpl.end_time}</span>
                        {tpl.note && <span className="wp-block__note">{tpl.note}</span>}
                        {tpl.repeat_every > 1 && <span className="wp-block__repeat">⟳{tpl.repeat_every}w</span>}
                        {cross && <span className="wp-block__cross">↩</span>}
                      </div>
                    )
                  })}

                  {/* Shift blocks (actual/completed) */}
                  {shiftsByIsoDay[isoDay]?.map(shift => {
                    const start = new Date(shift.actual_start || shift.planned_start)
                    const isActive = shift.status === "in_progress" && !shift.actual_end
                    const end = isActive ? new Date(now) : new Date(shift.actual_end || shift.planned_end)
                    const startMin = start.getHours() * 60 + start.getMinutes()
                    const endMin = end.getHours() * 60 + end.getMinutes()
                    const top = minutesToPx(startMin)
                    const h = endMin > startMin ? minutesToPx(endMin - startMin) : minutesToPx(1440 - startMin)
                    const colorClass = shift.status === "completed" ? "wp-block--completed"
                      : isActive ? "wp-block--active"
                      : shift.status === "cancelled" ? "wp-block--cancelled"
                      : "wp-block--planned-shift"
                    return (
                      <div
                        key={`shift-${shift.id}`}
                        className={`wp-block ${colorClass}`}
                        style={{ top, height: Math.max(h, 8) }}
                        title={`${minutesToTime(startMin)} – ${minutesToTime(endMin)} (${shift.status})`}
                      >
                        <span className="wp-block__time">
                          {minutesToTime(startMin)} – {isActive ? "now" : minutesToTime(endMin)}
                        </span>
                      </div>
                    )
                  })}

                  {/* Current time line */}
                  {isThisWeek && isoDay === nowIsoDay && (
                    <div className="wp-now-line" style={{ top: minutesToPx(nowMinutes) }}>
                      <div className="wp-now-dot" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Template modal */}
      {modalOpen && (
        <div className="wp-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="wp-modal" onClick={e => e.stopPropagation()}>
            <h3>{editingTemplate ? "Edit Template" : "New Schedule Block"}</h3>

            <div className="wp-form-row">
              <label>Day</label>
              <select value={form.day_of_week} onChange={e => updateForm("day_of_week", e.target.value)}>
                {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((d, i) => (
                  <option key={i} value={i}>{d}</option>
                ))}
              </select>
            </div>

            <div className="wp-form-row wp-form-row--times">
              <div>
                <label>Start</label>
                <input type="time" value={form.start_time} onChange={e => updateForm("start_time", e.target.value)} />
              </div>
              <span className="wp-form-sep">–</span>
              <div>
                <label>End</label>
                <input type="time" value={form.end_time} onChange={e => updateForm("end_time", e.target.value)} />
              </div>
            </div>

            <div className="wp-form-row">
              <label>Repeat every</label>
              <div className="wp-form-inline">
                <input
                  type="number"
                  min="1"
                  max="52"
                  value={form.repeat_every}
                  onChange={e => updateForm("repeat_every", e.target.value)}
                  className="wp-form-num"
                />
                <span>week(s)</span>
              </div>
            </div>

            <div className="wp-form-row">
              <label>Ends</label>
              <select value={form.end_type} onChange={e => updateForm("end_type", e.target.value)}>
                <option value="never">Never</option>
                <option value="after">After</option>
                <option value="until">On date</option>
              </select>
            </div>

            {form.end_type === "after" && (
              <div className="wp-form-row">
                <label>Occurrences</label>
                <input
                  type="number"
                  min="1"
                  value={form.end_after_count}
                  onChange={e => updateForm("end_after_count", e.target.value)}
                  className="wp-form-num"
                />
              </div>
            )}

            {form.end_type === "until" && (
              <div className="wp-form-row">
                <label>Until date</label>
                <input
                  type="date"
                  value={form.end_until_date}
                  onChange={e => updateForm("end_until_date", e.target.value)}
                />
              </div>
            )}

            <div className="wp-form-row">
              <label>Note</label>
              <input
                type="text"
                value={form.note}
                onChange={e => updateForm("note", e.target.value)}
                placeholder="Optional note..."
              />
            </div>

            <div className="wp-modal-actions">
              {editingTemplate && (
                <button className="button button--danger" onClick={handleDelete} disabled={saving}>
                  Delete
                </button>
              )}
              <div className="wp-modal-actions__right">
                <button className="button button--secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button className="button" onClick={handleSave} disabled={saving}>
                  {saving ? <span className="spinner small" /> : editingTemplate ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
