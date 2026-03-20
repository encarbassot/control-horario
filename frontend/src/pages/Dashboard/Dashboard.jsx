import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import "./Dashboard.css"
import { api } from "../../api/ApiAdapter"
import { URL_INVITATIONS_ME, URL_INVITATION_ACCEPT, URL_WORKSPACES } from "../../api/urls"
import { ROUTES } from "../../routes/navigationConfig"
import { useElioAuth } from "../../contexts/ElioAuthContext.jsx"
import { useActiveClock } from "../../contexts/ActiveClockContext.jsx"
import icoWorkspaces from "../../assets/icons/actions/workspaces.svg"

function formatElapsed(ms) {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function Dashboard(){
  const navigate = useNavigate()
  const { user } = useElioAuth()
  const { activeShift, elapsed: globalElapsed, clockIn: contextClockIn, clockOut: contextClockOut } = useActiveClock()

  const [workspaces, setWorkspaces] = useState([])
  const [invitations, setInvitations] = useState([])
  const [loadingWs, setLoadingWs] = useState(true)
  const [loadingInv, setLoadingInv] = useState(true)
  const [acceptingId, setAcceptingId] = useState(null)
  const [decliningId, setDecliningId] = useState(null)

  // Clock state: { [workspace_id]: { loading } }
  const [clockLoading, setClockLoading] = useState({})

  // Fetch workspaces
  useEffect(() => {
    api.get(URL_WORKSPACES).then(({ success, data }) => {
      if (success && data) setWorkspaces(data)
      setLoadingWs(false)
    })
    api.get(URL_INVITATIONS_ME).then(({ success, data }) => {
      if (success) setInvitations(data)
      setLoadingInv(false)
    })
  }, [])

  const handleClockIn = useCallback(async (wsId) => {
    setClockLoading(prev => ({ ...prev, [wsId]: true }))
    await contextClockIn(wsId)
    setClockLoading(prev => ({ ...prev, [wsId]: false }))
  }, [contextClockIn])

  const handleClockOut = useCallback(async (wsId) => {
    setClockLoading(prev => ({ ...prev, [wsId]: true }))
    await contextClockOut(wsId)
    setClockLoading(prev => ({ ...prev, [wsId]: false }))
  }, [contextClockOut])

  async function handleAccept(inv) {
    setAcceptingId(inv.id)
    const { success } = await api.post(URL_INVITATION_ACCEPT(inv.token))
    if (success) {
      setInvitations(prev => prev.filter(i => i.id !== inv.id))
      const { data } = await api.get(URL_WORKSPACES)
      if (data) setWorkspaces(data)
    }
    setAcceptingId(null)
  }

  async function handleDecline(inv) {
    setDecliningId(inv.id)
    await api.post(`/invitations/${inv.token}/decline`)
    setInvitations(prev => prev.filter(i => i.id !== inv.id))
    setDecliningId(null)
  }

  const roleLabel = (role) => role ? role.charAt(0).toUpperCase() + role.slice(1) : ''

  return (
    <div className="Page Dashboard">
      <h1>Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</h1>

      {/* ── Invitations ─────────────────────────────────────────── */}
      {(loadingInv || invitations.length > 0) && (
        <section className="dash-section">
          <h2 className="dash-section__title">Pending invitations</h2>
          {loadingInv ? (
            <div className="dash-loading"><span className="spinner small" /></div>
          ) : (
            <div className="dash-inv-list">
              {invitations.map(inv => (
                <div key={inv.id} className="dash-inv-card">
                  <div className="dash-inv-info">
                    <img src={icoWorkspaces} className="dash-inv-ico" alt="" />
                    <div>
                      <p className="dash-inv-ws">{inv.workspace_name}</p>
                      <p className="dash-inv-role">
                        Invited as <span className={`role-badge role-badge--${inv.role}`}>{roleLabel(inv.role)}</span>
                      </p>
                    </div>
                  </div>
                  <div className="dash-inv-actions">
                    <button
                      className="button button--small button--danger-outline"
                      onClick={() => handleDecline(inv)}
                      disabled={decliningId === inv.id || acceptingId === inv.id}
                    >
                      {decliningId === inv.id ? <span className="spinner small" /> : 'Decline'}
                    </button>
                    <button
                      className="button button--small"
                      onClick={() => handleAccept(inv)}
                      disabled={acceptingId === inv.id || decliningId === inv.id}
                    >
                      {acceptingId === inv.id ? <span className="spinner small" /> : 'Accept'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Workspaces + Clock ──────────────────────────────────── */}
      <section className="dash-section">
        <div className="dash-section__head">
          <h2 className="dash-section__title">My workspaces</h2>
          <button className="button button--small" onClick={() => navigate(ROUTES.WORKSPACES)}>
            Manage
          </button>
        </div>
        {loadingWs ? (
          <div className="dash-loading"><span className="spinner small" /></div>
        ) : workspaces.length === 0 ? (
          <p className="dash-empty">
            You are not part of any workspace yet.{' '}
            <span className="dash-link" onClick={() => navigate(ROUTES.WORKSPACES)}>Create one</span>
          </p>
        ) : (
          <div className="dash-ws-list">
            {workspaces.map(ws => {
              const isActive = activeShift?.workspace_id === ws.id
              const isLoading = clockLoading[ws.id] || false

              return (
                <div key={ws.id} className={`dash-ws-row ${isActive ? 'dash-ws-row--active' : ''}`}>
                  <div
                    className="dash-ws-row__info"
                    onClick={() => navigate(ROUTES.WORKSPACES_DETAIL.replace(':workspace_id', ws.id))}
                  >
                    <span className="dash-ws-row__name">{ws.name}</span>
                    <span className={`role-badge role-badge--${ws.role}`}>{roleLabel(ws.role)}</span>
                  </div>

                  <div className="dash-ws-row__clock">
                    {isActive && (
                      <span className="dash-ws-row__timer">{formatElapsed(globalElapsed)}</span>
                    )}
                    <button
                      onClick={() => isActive ? handleClockOut(ws.id) : handleClockIn(ws.id)}
                      disabled={isLoading || (activeShift && !isActive)}
                      title={isActive ? 'Clock out' : activeShift ? 'Stop active shift first' : 'Clock in'}
                      style={{
                        width: 40, height: 40, minWidth: 40,
                        borderRadius: '50%',
                        border: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: isLoading || (activeShift && !isActive) ? 'not-allowed' : 'pointer',
                        opacity: isLoading || (activeShift && !isActive) ? 0.5 : 1,
                        background: isActive ? '#ef4444' : '#22c55e',
                        boxShadow: isActive ? '0 2px 8px rgba(239,68,68,0.4)' : '0 2px 8px rgba(34,197,94,0.4)',
                        transition: 'transform 0.1s, box-shadow 0.15s',
                        flexShrink: 0,
                        padding: 0,
                        lineHeight: 0,
                      }}
                    >
                      {isLoading ? (
                        <span className="spinner small" />
                      ) : isActive ? (
                        <svg viewBox="0 0 24 24" width="18" height="18" style={{display:'block'}}>
                          <rect x="6" y="5" width="12" height="14" rx="2" fill="white" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" width="18" height="18" style={{display:'block'}}>
                          <polygon points="7,4 20,12 7,20" fill="white" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
