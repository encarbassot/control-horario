import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react"
import { api } from "../api/ApiAdapter"

const ActiveClockContext = createContext(null)

export function ActiveClockProvider({ children }) {
  const [activeShift, setActiveShift] = useState(null) // { id, workspace_id, workspace_name, actual_start, ... }
  const [now, setNow] = useState(Date.now())
  const tickRef = useRef(null)

  // Tick every second while a shift is active
  useEffect(() => {
    if (activeShift) {
      tickRef.current = setInterval(() => setNow(Date.now()), 1000)
    } else {
      clearInterval(tickRef.current)
    }
    return () => clearInterval(tickRef.current)
  }, [activeShift])

  // Fetch global clock status on mount
  useEffect(() => {
    api.get("/clock-status").then(({ success, data }) => {
      if (success && data?.active) setActiveShift(data.active)
    })
  }, [])

  const clockIn = useCallback(async (workspaceId) => {
    const { success, data } = await api.post(`/workspaces/${workspaceId}/clock-in`)
    if (success && data) {
      // Fetch workspace name from global status
      const statusRes = await api.get("/clock-status")
      if (statusRes.success && statusRes.data?.active) {
        setActiveShift(statusRes.data.active)
      } else {
        setActiveShift(data)
      }
    }
    return { success, data }
  }, [])

  const clockOut = useCallback(async (workspaceId) => {
    const { success, data } = await api.post(`/workspaces/${workspaceId}/clock-out`)
    if (success) setActiveShift(null)
    return { success, data }
  }, [])

  const elapsed = activeShift
    ? Math.max(0, now - new Date(activeShift.actual_start).getTime())
    : 0

  return (
    <ActiveClockContext.Provider value={{ activeShift, elapsed, now, clockIn, clockOut }}>
      {children}
    </ActiveClockContext.Provider>
  )
}

export function useActiveClock() {
  const ctx = useContext(ActiveClockContext)
  if (!ctx) throw new Error("useActiveClock must be used within ActiveClockProvider")
  return ctx
}
