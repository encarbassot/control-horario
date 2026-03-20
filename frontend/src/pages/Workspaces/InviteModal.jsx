import { useState } from "react"
import { TextModal } from "../../elio-react-components/components/Modals/TextModal/TextModal"
import { api } from "../../api/ApiAdapter"

const ROLES = ["viewer", "worker", "manager", "admin"]

export default function InviteModal({ workspaceId, onClose }) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("worker")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  async function handleInvite() {
    if (!email.trim()) return
    setLoading(true)
    setError(null)
    setSuccess(null)

    const { success: ok, data, error: err } = await api.post(
      `/workspaces/${workspaceId}/members/invite`,
      { email: email.trim(), role }
    )
    setLoading(false)

    if (ok) {
      if (data.added) {
        setSuccess("User added to workspace directly.")
      } else if (data.invited) {
        setSuccess("Invitation email sent. The user will need to sign up to accept.")
      }
      setEmail("")
    } else {
      setError(err?.general?.[0] || err?.message || "Error inviting user")
    }
  }

  return (
    <TextModal
      title="Invite to workspace"
      setIsOpen={onClose}
      aceptar={handleInvite}
      aceptarLoading={loading}
      aceptarText="Invite"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <label htmlFor="invite-email">Email</label>
          <input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleInvite()}
            placeholder="user@example.com"
            autoFocus
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <label htmlFor="invite-role">Role</label>
          <select
            id="invite-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            {ROLES.map(r => (
              <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
            ))}
          </select>
        </div>

        {error && <span style={{ color: "var(--color-error, red)", fontSize: "0.85rem" }}>{error}</span>}
        {success && <span style={{ color: "var(--color-success, green)", fontSize: "0.85rem" }}>{success}</span>}
      </div>
    </TextModal>
  )
}