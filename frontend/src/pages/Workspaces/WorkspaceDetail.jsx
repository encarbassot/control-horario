import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import "./WorkspaceDetail.css"

import { api } from "../../api/ApiAdapter"
import { Table } from "../../elio-react-components/components/Table/Table"
import { TextModal } from "../../elio-react-components/components/Modals/TextModal/TextModal"
import InviteModal from "./InviteModal"
import ScheduleTab from "./ScheduleTab"
import WeekPlannerTab from "./WeekPlannerTab"
import { ROUTES } from "../../routes/navigationConfig"

import icoBack from "../../assets/icons/actions/back.svg"
import icoAddUser from "../../assets/icons/actions/add-user.svg"
import icoTrash from "../../assets/icons/actions/trash.svg"
import icoEdit from "../../assets/icons/actions/edit.svg"
import icoEmail from "../../assets/icons/actions/email.svg"

const ROLE_ORDER = ["owner", "admin", "manager", "worker", "viewer"]
const EDITABLE_ROLES = ["admin", "manager", "worker", "viewer"]

const CONFIG_LABELS = {
  allow_user_edit_shifts: "Workers can edit their own shifts",
  auto_check_in:         "Auto check-in at planned start",
  auto_check_out:        "Auto check-out at planned end",
  require_note_on_edit:  "Require note when editing a shift",
  allow_future_shifts:   "Allow future shift planning",
}

export default function WorkspaceDetail() {
  const { workspace_id } = useParams()
  const navigate = useNavigate()

  const [workspace, setWorkspace]     = useState(null)
  const [members, setMembers]         = useState([])
  const [invitations, setInvitations] = useState([])
  const [config, setConfig]           = useState(null)
  const [myRole, setMyRole]           = useState(null)
  const [tab, setTab]                 = useState("week")

  const [inviteOpen, setInviteOpen]             = useState(false)
  const [editRoleTarget, setEditRoleTarget]     = useState(null) // { member }
  const [editRoleValue, setEditRoleValue]       = useState("")
  const [editRoleLoading, setEditRoleLoading]   = useState(false)
  const [editRoleError, setEditRoleError]       = useState(null)
  const [removeMemberTarget, setRemoveMemberTarget] = useState(null)
  const [removeLoading, setRemoveLoading]       = useState(false)
  const [configSaving, setConfigSaving]         = useState(false)

  const isAdmin   = myRole && ["owner", "admin"].includes(myRole)
  const isManager = myRole && ["owner", "admin", "manager"].includes(myRole)

  useEffect(() => { fetchAll() }, [workspace_id])

  async function fetchAll() {
    // Fetch workspace list first to get our role, then fetch the rest in parallel
    const listRes = await api.get("/workspaces")
    let role = null
    if (listRes.success) {
      const ws = listRes.data.find(w => w.id === workspace_id)
      if (ws) { role = ws.role; setMyRole(ws.role) }
    }

    const isAdminNow = role && ["owner", "admin"].includes(role)

    const requests = [
      api.get(`/workspaces/${workspace_id}`),
      api.get(`/workspaces/${workspace_id}/members`),
      api.get(`/workspaces/${workspace_id}/config`),
      ...(isAdminNow ? [api.get(`/workspaces/${workspace_id}/invitations`)] : []),
    ]

    const [wsRes, membersRes, cfgRes, invRes] = await Promise.all(requests)
    if (wsRes.success)      setWorkspace(wsRes.data)
    if (membersRes.success) setMembers(membersRes.data)
    if (cfgRes.success)     setConfig(cfgRes.data)
    if (invRes?.success)    setInvitations(invRes.data)
  }

  // role is now set inside fetchAll

  async function handleRemoveMember() {
    setRemoveLoading(true)
    const { success } = await api.delete(`/workspaces/${workspace_id}/members/${removeMemberTarget.id}`)
    setRemoveLoading(false)
    if (success) {
      setMembers(prev => prev.filter(m => m.id !== removeMemberTarget.id))
      setRemoveMemberTarget(null)
    }
  }

  async function handleUpdateRole() {
    setEditRoleLoading(true)
    setEditRoleError(null)
    const { success, error } = await api.put(
      `/workspaces/${workspace_id}/members/${editRoleTarget.id}`,
      { role: editRoleValue }
    )
    setEditRoleLoading(false)
    if (success) {
      setMembers(prev => prev.map(m => m.id === editRoleTarget.id ? { ...m, role: editRoleValue } : m))
      setEditRoleTarget(null)
    } else {
      setEditRoleError(error?.general?.[0] || "Error updating role")
    }
  }

  async function handleCancelInvitation(invitation) {
    const { success } = await api.delete(
      `/workspaces/${workspace_id}/invitations/${invitation.id}`
    )
    if (success) setInvitations(prev => prev.filter(i => i.id !== invitation.id))
  }

  async function handleResendInvitation(invitation) {
    await api.post(`/workspaces/${workspace_id}/invitations/${invitation.id}/resend`)
  }

  async function handleToggleConfig(key) {
    if (!config || configSaving) return
    const newVal = !config[key]
    setConfig(prev => ({ ...prev, [key]: newVal }))
    setConfigSaving(true)
    await api.put(`/workspaces/${workspace_id}/config`, { [key]: newVal })
    setConfigSaving(false)
  }

  if (!workspace) return <div className="Page WorkspaceDetail"><p>Loading…</p></div>

  const pendingInvitations = invitations.filter(i => i.status === "pending")

  return (
    <div className="Page WorkspaceDetail">

      {/* ── Header ── */}
      <div className="WorkspaceDetail__header">
        <button className="WorkspaceDetail__back" onClick={() => navigate(ROUTES.WORKSPACES)}>
          <img src={icoBack} alt="Back" />
        </button>
        <div className="WorkspaceDetail__title">
          <h1>{workspace.name}</h1>
          {workspace.description && <p className="WorkspaceDetail__desc">{workspace.description}</p>}
        </div>
        {myRole && <span className={`WorkspaceDetail__role role--${myRole}`}>{myRole}</span>}
      </div>

      {/* ── Tabs ── */}
      <div className="WorkspaceDetail__tabs">
        <button
          className={`WorkspaceDetail__tab${tab === "week" ? " active" : ""}`}
          onClick={() => setTab("week")}
        >
          Week
        </button>
        <button
          className={`WorkspaceDetail__tab${tab === "month" ? " active" : ""}`}
          onClick={() => setTab("month")}
        >
          Month
        </button>
        <button
          className={`WorkspaceDetail__tab${tab === "members" ? " active" : ""}`}
          onClick={() => setTab("members")}
        >
          Members {members.length > 0 && <span className="badge">{members.length}</span>}
        </button>
        {isAdmin && (
          <button
            className={`WorkspaceDetail__tab${tab === "invitations" ? " active" : ""}`}
            onClick={() => setTab("invitations")}
          >
            Invitations {pendingInvitations.length > 0 && <span className="badge">{pendingInvitations.length}</span>}
          </button>
        )}
        {isAdmin && (
          <button
            className={`WorkspaceDetail__tab${tab === "config" ? " active" : ""}`}
            onClick={() => setTab("config")}
          >
            Config
          </button>
        )}
      </div>

      {/* ── Week planner tab ── */}
      {tab === "week" && (
        <WeekPlannerTab workspaceId={workspace_id} isOwner={myRole === "owner"} members={members} />
      )}

      {/* ── Month tab ── */}
      {tab === "month" && (
        <ScheduleTab workspaceId={workspace_id} isManager={isManager} members={members} />
      )}

      {/* ── Members tab ── */}
      {tab === "members" && (
        <div className="WorkspaceDetail__section">
          {isAdmin && (
            <div className="WorkspaceDetail__section-actions">
              <button className="button" onClick={() => setInviteOpen(true)}>
                <img src={icoAddUser} alt="" /> Invite member
              </button>
            </div>
          )}
          <div className="Table_wrapper">
            <Table
              elements={members}
              columns={[
                {
                  label: "Name",
                  width: 2,
                  mode: "static",
                  render: (m) => m.user_name || "—",
                },
                {
                  label: "Email",
                  width: 2,
                  mode: "static",
                  render: (m) => m.user_email || "—",
                },
                {
                  label: "Phone",
                  width: 2,
                  mode: "static",
                  render: (m) => m.user_phone || "—",
                },
                {
                  label: "Role",
                  width: 1,
                  mode: "static",
                  render: (m) => <span className={`role-badge role--${m.role}`}>{m.role}</span>,
                },
              ]}
              customActions={isAdmin ? (m) => [
                m.role !== "owner" && {
                  icon: icoEdit,
                  callback: () => { setEditRoleTarget(m); setEditRoleValue(m.role); setEditRoleError(null) },
                },
                m.role !== "owner" && {
                  icon: icoTrash,
                  callback: () => setRemoveMemberTarget(m),
                },
              ].filter(Boolean) : undefined}
            />
          </div>
        </div>
      )}

      {/* ── Invitations tab ── */}
      {tab === "invitations" && isAdmin && (
        <div className="WorkspaceDetail__section">
          <div className="WorkspaceDetail__section-actions">
            <button className="button" onClick={() => setInviteOpen(true)}>
              <img src={icoAddUser} alt="" /> Invite member
            </button>
          </div>
          {pendingInvitations.length === 0 ? (
            <p className="WorkspaceDetail__empty">No pending invitations.</p>
          ) : (
            <div className="Table_wrapper">
              <Table
                elements={pendingInvitations}
                columns={[
                  {
                    label: "Email",
                    width: 3,
                    mode: "static",
                    render: (i) => i.email,
                  },
                  {
                    label: "Role",
                    width: 1,
                    mode: "static",
                    render: (i) => <span className={`role-badge role--${i.role}`}>{i.role}</span>,
                  },
                  {
                    label: "Expires",
                    width: 2,
                    mode: "static",
                    render: (i) => new Date(i.expires_at).toLocaleDateString(),
                  },
                ]}
                customActions={(i) => [
                  {
                    icon: icoEmail,
                    callback: () => handleResendInvitation(i),
                  },
                  {
                    icon: icoTrash,
                    callback: () => handleCancelInvitation(i),
                  },
                ]}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Config tab ── */}
      {tab === "config" && isAdmin && config && (
        <div className="WorkspaceDetail__section">
          <div className="WorkspaceDetail__config-list">
            {Object.entries(CONFIG_LABELS).map(([key, label]) => (
              <div key={key} className="WorkspaceDetail__config-row">
                <div className="WorkspaceDetail__config-label">{label}</div>
                <button
                  className={`WorkspaceDetail__toggle${config[key] ? " on" : ""}`}
                  onClick={() => handleToggleConfig(key)}
                  disabled={configSaving}
                >
                  <span className="WorkspaceDetail__toggle-knob" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Invite modal ── */}
      {inviteOpen && (
        <InviteModal
          workspaceId={workspace_id}
          onClose={() => { setInviteOpen(false); fetchAll() }}
        />
      )}

      {/* ── Edit role modal ── */}
      {editRoleTarget && (
        <TextModal
          title="Change role"
          setIsOpen={() => setEditRoleTarget(null)}
          aceptar={handleUpdateRole}
          aceptarLoading={editRoleLoading}
          aceptarText="Save"
          cancelar={() => setEditRoleTarget(null)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--color-text-2, #666)" }}>
              {editRoleTarget.user_id}
            </p>
            <select value={editRoleValue} onChange={(e) => setEditRoleValue(e.target.value)}>
              {EDITABLE_ROLES.map(r => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
            {editRoleError && <span style={{ color: "var(--color-error, red)", fontSize: "0.85rem" }}>{editRoleError}</span>}
          </div>
        </TextModal>
      )}

      {/* ── Remove member confirm modal ── */}
      {removeMemberTarget && (
        <TextModal
          title="Remove member"
          setIsOpen={() => setRemoveMemberTarget(null)}
          aceptar={handleRemoveMember}
          aceptarLoading={removeLoading}
          aceptarText="Remove"
          aceptarRed
          cancelar={() => setRemoveMemberTarget(null)}
        >
          <p>Remove <strong>{removeMemberTarget.user_id}</strong> from the workspace?</p>
        </TextModal>
      )}
    </div>
  )
}
