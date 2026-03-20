import { ElioApi, ElioModel, ElioField, ElioError, elioPaginatedResponse } from 'elioapi'
import { createModels } from '../models/index.js'
import { ROLES, SCHEDULE_MODES, SHIFT_STATUS, INVITATION_STATUS, CONFIG_DEFAULTS, TEMPLATE_END_TYPES, FRONTEND_URL } from '../constants/index.js'

const { User, Workspace, WorkspaceMember, WorkSchedule, ShiftEvent, WorkspaceConfig, Invitation, ScheduleTemplate } = createModels(ElioModel, ElioField)

// ─── API ──────────────────────────────────────────────────────────────────────
const api = new ElioApi({
  name: "⏱️ Control Horario API",
  port: 3050,
  db: {
    host:     process.env.DB_HOST     || '127.0.0.1',
    user:     process.env.DB_USER     || 'elio_test_user',
    password: process.env.DB_PASSWORD || 'elio_test_password',
    database: process.env.DB_NAME     || 'elio_test',
    port:     Number(process.env.DB_PORT) || 3306,
    sync:     true,
  },
  auth: {
    emailValidation: true,
  },
  mailer: {
    host:   'smtp.gmail.com',
    port:   465,
    secure: true,
    user:   process.env.GMAIL_USER,
    pass:   process.env.GMAIL_APP_PASSWORD,
    from:   process.env.GMAIL_USER,
  },
})

// ─── Models ───────────────────────────────────────────────────────────────────
api.model(User)
api.model(Workspace)
api.model(WorkspaceMember)
api.model(WorkSchedule)
api.model(ShiftEvent)
api.model(WorkspaceConfig)
api.model(Invitation)
api.model(ScheduleTemplate)


// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Compute summary from a list of ShiftEvents.
 * Returns total planned hours, actual hours, per-day breakdown, and open shifts.
 */
function computeShiftSummary(shifts) {
  let totalPlannedMs = 0
  let totalActualMs  = 0
  const dailyBreakdown = {}
  const openShifts = []

  for (const s of shifts) {
    const plannedMs = new Date(s.planned_end) - new Date(s.planned_start)
    totalPlannedMs += plannedMs

    const day = new Date(s.date).toISOString().slice(0, 10)
    if (!dailyBreakdown[day]) dailyBreakdown[day] = { plannedHours: 0, actualHours: 0 }
    dailyBreakdown[day].plannedHours += plannedMs / 3_600_000

    if (s.actual_start && s.actual_end) {
      const actualMs = new Date(s.actual_end) - new Date(s.actual_start)
      totalActualMs += actualMs
      dailyBreakdown[day].actualHours += actualMs / 3_600_000
    } else if (s.status === SHIFT_STATUS.IN_PROGRESS) {
      openShifts.push(s)
    }
  }

  // Round daily values
  for (const day of Object.keys(dailyBreakdown)) {
    dailyBreakdown[day].plannedHours = +dailyBreakdown[day].plannedHours.toFixed(2)
    dailyBreakdown[day].actualHours  = +dailyBreakdown[day].actualHours.toFixed(2)
  }

  return {
    totalPlannedHours: +(totalPlannedMs / 3_600_000).toFixed(2),
    totalActualHours:  +(totalActualMs  / 3_600_000).toFixed(2),
    difference:        +((totalActualMs - totalPlannedMs) / 3_600_000).toFixed(2),
    dailyBreakdown,
    openShifts,
  }
}


// ─── Workspaces ──────────────────────────────────────────────────────────────

// Create workspace — caller automatically becomes the owner + auto-create config
api.post("/workspaces")
  .auth()
  .input({ name: ElioField.string().required(), description: ElioField.string().optional() })
  .handle(async ({ db, user, input }) => {
    const id = crypto.randomUUID()
    await db.workspace.insert({ ...input, created_by: user.id, id })
    await db.workspace_member.insert({ user_id: user.id, workspace_id: id, role: "owner" })
    await db.workspace_config.insert({ workspace_id: id, ...CONFIG_DEFAULTS })
    return db.workspace.findOne({ id })
  })

// List workspaces the caller belongs to
api.get("/workspaces")
  .auth()
  .handle(async ({ db, user }) => {
    const memberships = await db.workspace_member.find({ user_id: user.id })
    if (!memberships.length) return []
    const workspaces = await Promise.all(
      memberships.map(m => db.workspace.findOne({ id: m.workspace_id }))
    )
    return workspaces.filter(Boolean).map(ws => ({
      ...ws,
      role: memberships.find(m => m.workspace_id === ws.id)?.role,
    }))
  })

// Get single workspace
api.get("/workspaces/:workspace_id")
  .auth()
  .permission("viewer", { workspace: true })
  .handle(async ({ db, req }) => {
    const ws = await db.workspace.findOne({ id: req.params.workspace_id })
    if (!ws) throw ElioError.notFound("Workspace not found")
    return ws
  })

// Update workspace name/description
api.put("/workspaces/:workspace_id")
  .auth()
  .permission("admin", { workspace: true })
  .input({ name: ElioField.string().optional(), description: ElioField.string().optional() })
  .handle(async ({ db, req, input }) => {
    const id = req.params.workspace_id
    await db.workspace.update(input, { id })
    return db.workspace.findOne({ id })
  })

// Delete workspace (owner only)
api.delete("/workspaces/:workspace_id")
  .auth()
  .permission("owner", { workspace: true })
  .handle(async ({ db, req }) => {
    const id = req.params.workspace_id
    await db.workspace.delete({ id })
    return { deleted: true }
  })


// ─── Members ─────────────────────────────────────────────────────────────────

// Add a member to a workspace
api.post("/workspaces/:workspace_id/members")
  .auth()
  .permission("admin", { workspace: true })
  .input({
    user_id: ElioField.string().required(),
    role:    ElioField.enum(["admin", "manager", "worker", "viewer"]).default("worker"),
  })
  .handle(async ({ db, req, input, membership }) => {
    const workspace_id = req.params.workspace_id

    // Cannot assign a role higher than your own
    if (ROLES[input.role] > ROLES[membership.role]) {
      throw ElioError.forbidden("Cannot assign a role higher than your own")
    }

    // Prevent duplicates
    const existing = await db.workspace_member.findOne({ user_id: input.user_id, workspace_id })
    if (existing) throw ElioError.conflict("User is already a member of this workspace")

    return db.workspace_member.insert({ ...input, workspace_id })
  })

// Invite a member by email — if user exists, add directly; if not, send invitation email
api.post("/workspaces/:workspace_id/members/invite")
  .auth()
  .permission("admin", { workspace: true })
  .input({
    email: ElioField.string().required(),
    role:  ElioField.enum(["admin", "manager", "worker", "viewer"]).default("worker"),
  })
  .handle(async ({ db, req, input, membership, user, api }) => {
    const mailer = api._modules.mailer
    const workspace_id = req.params.workspace_id

    if (ROLES[input.role] > ROLES[membership.role]) {
      throw ElioError.forbidden("Cannot assign a role higher than your own")
    }

    // Check if already a member
    const existingMember = await db.workspace_member.find({ workspace_id })
    const invitedUser = await db.user.findOne({ email: input.email })

    if (invitedUser) {
      const alreadyMember = existingMember.find(m => m.user_id === invitedUser.id)
      if (alreadyMember) throw ElioError.conflict("User is already a member of this workspace")
      // User exists — add directly as member
      await db.workspace_member.insert({ user_id: invitedUser.id, role: input.role, workspace_id })
      return { added: true, user_id: invitedUser.id }
    }

    // User does not exist — create invitation + send email
    const existingInvitation = await db.invitation.findOne({ email: input.email, workspace_id, status: INVITATION_STATUS.PENDING })
    if (existingInvitation) throw ElioError.conflict("An invitation for this email is already pending")

    const token = crypto.randomUUID()
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    const invitation = await db.invitation.insert({
      workspace_id,
      email:      input.email,
      role:       input.role,
      invited_by: user.id,
      status:     INVITATION_STATUS.PENDING,
      token,
      expires_at,
    })

    // Send invitation email
    const workspace = await db.workspace.findOne({ id: workspace_id })
    const inviteLink = `${FRONTEND_URL}/invitation/${token}`
    try {
      await mailer.sendEmail(
        input.email,
        `Invitación a ${workspace.name} — Control Horario`,
        `Has sido invitado a unirte al workspace "${workspace.name}". Acepta la invitación en: ${inviteLink}`,
        `<p>Has sido invitado a unirte al workspace <strong>${workspace.name}</strong>.</p>
         <p>Haz clic en el siguiente enlace para registrarte y aceptar la invitación:</p>
         <p><a href="${inviteLink}">${inviteLink}</a></p>
         <p>Esta invitación expira en 7 días.</p>`,
      )
    } catch (e) {
      console.error("Failed to send invitation email:", e.message)
    }

    return { invited: true, invitation }
  })

// List members
api.get("/workspaces/:workspace_id/members")
  .auth()
  .permission("viewer", { workspace: true })
  .handle(async ({ db, req }) => {
    const members = await db.workspace_member.find({ workspace_id: req.params.workspace_id })
    const users = await Promise.all(members.map(m => db.user.findOne({ id: m.user_id })))
    return members.map((m, i) => ({
      ...m,
      user_name: users[i]?.name || null,
      user_email: users[i]?.email || null,
      user_phone: users[i]?.phone || null,
    }))
  })

// Update member role
api.put("/workspaces/:workspace_id/members/:member_id")
  .auth()
  .permission("admin", { workspace: true })
  .input({ role: ElioField.enum(["admin", "manager", "worker", "viewer"]).required() })
  .handle(async ({ db, req, input, membership }) => {
    const target = await db.workspace_member.findOne({ id: req.params.member_id })
    if (!target) throw ElioError.notFound("Member not found")

    // Owner cannot be demoted
    if (target.role === "owner") throw ElioError.forbidden("Cannot change the owner's role")

    // Cannot promote above your own role
    if (ROLES[input.role] > ROLES[membership.role]) {
      throw ElioError.forbidden("Cannot assign a role higher than your own")
    }

    await db.workspace_member.update(input, { id: target.id })
    return db.workspace_member.findOne({ id: target.id })
  })

// Remove member
api.delete("/workspaces/:workspace_id/members/:member_id")
  .auth()
  .permission("admin", { workspace: true })
  .handle(async ({ db, req, membership }) => {
    const target = await db.workspace_member.findOne({ id: req.params.member_id })
    if (!target) throw ElioError.notFound("Member not found")

    // Owner cannot be removed
    if (target.role === "owner") throw ElioError.forbidden("Cannot remove the workspace owner")

    // Cannot remove someone with a higher or equal role (unless you're owner)
    if (membership.role !== "owner" && ROLES[target.role] >= ROLES[membership.role]) {
      throw ElioError.forbidden("Cannot remove a member with an equal or higher role")
    }

    await db.workspace_member.delete({ id: target.id })
    return { deleted: true }
  })


// ─── Work Schedules ──────────────────────────────────────────────────────────

// Create/replace a schedule for a user in this workspace
api.post("/workspaces/:workspace_id/schedules")
  .auth()
  .permission("admin", { workspace: true })
  .input({
    user_id:               ElioField.string().required(),
    mode:                  ElioField.enum(Object.values(SCHEDULE_MODES)).required(),
    schedule:              ElioField.string().optional(),     // JSON string
    required_daily_hours:  ElioField.number().optional(),
    required_weekly_hours: ElioField.number().optional(),
  })
  .handle(async ({ db, req, input }) => {
    const workspace_id = req.params.workspace_id

    // Verify the target user is a member
    const targetMembership = await db.workspace_member.findOne({ user_id: input.user_id, workspace_id })
    if (!targetMembership) throw ElioError.notFound("User is not a member of this workspace")

    // Replace any existing schedule for this member
    const existing = await db.work_schedule.findOne({ user_id: input.user_id, workspace_id })
    if (existing) await db.work_schedule.delete({ id: existing.id })

    return db.work_schedule.insert({ ...input, workspace_id, workspace_member_id: targetMembership.id })
  })

// List all schedules in a workspace
api.get("/workspaces/:workspace_id/schedules")
  .auth()
  .permission("manager", { workspace: true })
  .handle(async ({ db, req }) => {
    return db.work_schedule.find({ workspace_id: req.params.workspace_id })
  })

// Get schedule for a specific user
api.get("/workspaces/:workspace_id/schedules/:user_id")
  .auth()
  .permission("viewer", { workspace: true })
  .handle(async ({ db, req, user, membership }) => {
    const targetUserId = req.params.user_id
    // Workers/viewers can only see their own schedule
    if (ROLES[membership.role] < ROLES.manager && targetUserId !== user.id) {
      throw ElioError.forbidden("You can only view your own schedule")
    }
    const schedule = await db.work_schedule.findOne({ workspace_id: req.params.workspace_id, user_id: targetUserId })
    if (!schedule) throw ElioError.notFound("No schedule found for this user")
    return schedule
  })

// Update a schedule
api.put("/workspaces/:workspace_id/schedules/:schedule_id")
  .auth()
  .permission("admin", { workspace: true })
  .input({
    mode:                  ElioField.enum(Object.values(SCHEDULE_MODES)).optional(),
    schedule:              ElioField.string().optional(),
    required_daily_hours:  ElioField.number().optional(),
    required_weekly_hours: ElioField.number().optional(),
  })
  .handle(async ({ db, req, input }) => {
    const id = req.params.schedule_id
    const existing = await db.work_schedule.findOne({ id })
    if (!existing) throw ElioError.notFound("Schedule not found")
    await db.work_schedule.update(input, { id })
    return db.work_schedule.findOne({ id })
  })


// ─── Workspace Config ────────────────────────────────────────────────────────

// Get workspace config
api.get("/workspaces/:workspace_id/config")
  .auth()
  .permission("viewer", { workspace: true })
  .handle(async ({ db, req }) => {
    const config = await db.workspace_config.findOne({ workspace_id: req.params.workspace_id })
    if (!config) throw ElioError.notFound("Config not found")
    return config
  })

// Update workspace config flags
api.put("/workspaces/:workspace_id/config")
  .auth()
  .permission("admin", { workspace: true })
  .input({
    allow_user_edit_shifts: ElioField.boolean().optional(),
    auto_check_in:         ElioField.boolean().optional(),
    auto_check_out:        ElioField.boolean().optional(),
    require_note_on_edit:  ElioField.boolean().optional(),
    allow_future_shifts:   ElioField.boolean().optional(),
  })
  .handle(async ({ db, req, input }) => {
    const workspace_id = req.params.workspace_id
    const config = await db.workspace_config.findOne({ workspace_id })
    if (!config) throw ElioError.notFound("Config not found")
    await db.workspace_config.update(input, { id: config.id })
    return db.workspace_config.findOne({ workspace_id })
  })


// ─── Invitations ─────────────────────────────────────────────────────────────

// List pending invitations addressed to the current user's email
api.get("/invitations/me")
  .auth()
  .handle(async ({ db, user }) => {
    const invitations = await db.invitation.find({ email: user.email, status: INVITATION_STATUS.PENDING })
    if (!invitations.length) return []
    const withWorkspace = await Promise.all(
      invitations.map(async inv => {
        const workspace = await db.workspace.findOne({ id: inv.workspace_id })
        return { ...inv, workspace_name: workspace?.name ?? null }
      })
    )
    return withWorkspace
  })

// List pending invitations for a workspace
api.get("/workspaces/:workspace_id/invitations")
  .auth()
  .permission("admin", { workspace: true })
  .handle(async ({ db, req }) => {
    return db.invitation.find({ workspace_id: req.params.workspace_id })
  })

// Cancel an invitation
api.delete("/workspaces/:workspace_id/invitations/:invitation_id")
  .auth()
  .permission("admin", { workspace: true })
  .handle(async ({ db, req }) => {
    const invitation = await db.invitation.findOne({ id: req.params.invitation_id })
    if (!invitation) throw ElioError.notFound("Invitation not found")
    if (invitation.workspace_id !== req.params.workspace_id) throw ElioError.forbidden()
    await db.invitation.update({ status: INVITATION_STATUS.CANCELLED }, { id: invitation.id })
    return { cancelled: true }
  })

// Resend an invitation email
api.post("/workspaces/:workspace_id/invitations/:invitation_id/resend")
  .auth()
  .permission("admin", { workspace: true })
  .handle(async ({ db, req, api }) => {
    const mailer = api._modules.mailer
    const invitation = await db.invitation.findOne({ id: req.params.invitation_id })
    if (!invitation) throw ElioError.notFound("Invitation not found")
    if (invitation.workspace_id !== req.params.workspace_id) throw ElioError.forbidden()
    if (invitation.status !== INVITATION_STATUS.PENDING) {
      throw ElioError.badRequest("Only pending invitations can be resent")
    }

    // Extend expiry
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await db.invitation.update({ expires_at }, { id: invitation.id })

    const workspace = await db.workspace.findOne({ id: req.params.workspace_id })
    const inviteLink = `${FRONTEND_URL}/invitation/${invitation.token}`
    try {
      await mailer.sendEmail(
        invitation.email,
        `Recordatorio: Invitación a ${workspace.name} — Control Horario`,
        `Te recordamos que has sido invitado a "${workspace.name}". Acepta la invitación en: ${inviteLink}`,
        `<p>Te recordamos que has sido invitado a <strong>${workspace.name}</strong>.</p>
         <p><a href="${inviteLink}">${inviteLink}</a></p>
         <p>Esta invitación expira en 7 días.</p>`,
      )
    } catch (e) {
      console.error("Failed to resend invitation email:", e.message)
    }

    return { resent: true }
  })

// Get invitation preview info (public — no auth required)
api.get("/invitations/:token")
  .handle(async ({ db, req }) => {
    const invitation = await db.invitation.findOne({ token: req.params.token })
    if (!invitation) throw ElioError.notFound("Invitation not found")

    if (invitation.status !== INVITATION_STATUS.PENDING) {
      throw ElioError.badRequest("This invitation is no longer valid")
    }

    if (new Date(invitation.expires_at) < new Date()) {
      await db.invitation.update({ status: INVITATION_STATUS.EXPIRED }, { id: invitation.id })
      throw ElioError.badRequest("This invitation has expired")
    }

    const workspace = await db.workspace.findOne({ id: invitation.workspace_id })

    return {
      email: invitation.email,
      role: invitation.role,
      workspace_name: workspace?.name ?? null,
      expires_at: invitation.expires_at,
    }
  })

// Accept an invitation (called after signup — user must be authenticated)
api.post("/invitations/:token/accept")
  .auth()
  .handle(async ({ db, req, user }) => {
    const invitation = await db.invitation.findOne({ token: req.params.token })
    if (!invitation) throw ElioError.notFound("Invitation not found")

    if (invitation.status !== INVITATION_STATUS.PENDING) {
      throw ElioError.badRequest("This invitation is no longer valid")
    }

    if (new Date(invitation.expires_at) < new Date()) {
      await db.invitation.update({ status: INVITATION_STATUS.EXPIRED }, { id: invitation.id })
      throw ElioError.badRequest("This invitation has expired")
    }

    // Verify the authenticated user's email matches the invitation
    if (user.email !== invitation.email) {
      throw ElioError.forbidden("This invitation was sent to a different email address")
    }

    // Prevent duplicates
    const existing = await db.workspace_member.findOne({ user_id: user.id, workspace_id: invitation.workspace_id })
    if (existing) {
      await db.invitation.update({ status: INVITATION_STATUS.ACCEPTED }, { id: invitation.id })
      return { accepted: true, already_member: true }
    }

    await db.workspace_member.insert({
      user_id:      user.id,
      workspace_id: invitation.workspace_id,
      role:         invitation.role,
    })
    await db.invitation.update({ status: INVITATION_STATUS.ACCEPTED }, { id: invitation.id })

    return { accepted: true }
  })

// Decline an invitation (authenticated user declines for themselves)
api.post("/invitations/:token/decline")
  .auth()
  .handle(async ({ db, req, user }) => {
    const invitation = await db.invitation.findOne({ token: req.params.token })
    if (!invitation) throw ElioError.notFound("Invitation not found")
    if (invitation.email !== user.email) throw ElioError.forbidden("This invitation belongs to a different email")
    if (invitation.status !== INVITATION_STATUS.PENDING) throw ElioError.badRequest("This invitation is no longer pending")
    await db.invitation.update({ status: INVITATION_STATUS.CANCELLED }, { id: invitation.id })
    return { declined: true }
  })


// ─── Shift Events ────────────────────────────────────────────────────────────

// Create a shift
api.post("/workspaces/:workspace_id/shifts")
  .auth()
  .permission("worker", { workspace: true })
  .input({
    user_id:       ElioField.string().optional(),   // admin can create for others
    planned_start: ElioField.date().required(),
    planned_end:   ElioField.date().required(),
    note:          ElioField.string().optional(),
  })
  .handle(async ({ db, req, user, input, membership }) => {
    const workspace_id = req.params.workspace_id
    const config = await db.workspace_config.findOne({ workspace_id })
    const isAdmin = ROLES[membership.role] >= ROLES.admin
    const targetUserId = input.user_id || user.id

    // Workers can only create shifts for themselves
    if (!isAdmin && targetUserId !== user.id) {
      throw ElioError.forbidden("You can only create shifts for yourself")
    }

    // If workers cannot edit shifts, they also cannot create them (admin-only)
    if (!isAdmin && !(config && config.allow_user_edit_shifts)) {
      throw ElioError.forbidden("You are not allowed to create shifts. Contact an admin.")
    }

    // Validate future shift creation if disabled
    if (config && !config.allow_future_shifts && new Date(input.planned_start) > new Date()) {
      throw ElioError.forbidden("Future shifts are not allowed in this workspace")
    }

    // Validate target user is a member
    if (targetUserId !== user.id) {
      const targetMember = await db.workspace_member.findOne({ user_id: targetUserId, workspace_id })
      if (!targetMember) throw ElioError.notFound("Target user is not a member of this workspace")
    }

    const plannedStart = new Date(input.planned_start)
    const plannedEnd   = new Date(input.planned_end)
    if (plannedEnd <= plannedStart) throw ElioError.badRequest("planned_end must be after planned_start")

    const date = plannedStart.toISOString().slice(0, 10)

    return db.shift_event.insert({
      user_id:        targetUserId,
      workspace_id,
      date,
      planned_start:  plannedStart,
      planned_end:    plannedEnd,
      original_start: plannedStart,
      original_end:   plannedEnd,
      status:         SHIFT_STATUS.PLANNED,
      note:           input.note || null,
      created_by:     user.id,
    })
  })

// List shifts (manager+ sees all, worker sees own). Filters: from, to, user_id, status
api.get("/workspaces/:workspace_id/shifts")
  .auth()
  .permission("worker", { workspace: true })
  .handle(async ({ db, req, user, membership }) => {
    const workspace_id = req.params.workspace_id
    const isManager = ROLES[membership.role] >= ROLES.manager
    const targetUserId = req.query.user_id || null
    const from   = req.query.from   ? new Date(req.query.from)   : null
    const to     = req.query.to     ? new Date(req.query.to)     : null
    const status = req.query.status || null

    const filter = { workspace_id }
    if (!isManager) {
      filter.user_id = user.id
    } else if (targetUserId) {
      filter.user_id = targetUserId
    }
    if (status) filter.status = status

    let shifts = await db.shift_event.find(filter)
    if (from) shifts = shifts.filter(s => new Date(s.planned_start) >= from)
    if (to)   shifts = shifts.filter(s => new Date(s.planned_start) <= to)

    return shifts
  })

// Own shifts (worker+)
api.get("/workspaces/:workspace_id/shifts/me")
  .auth()
  .permission("worker", { workspace: true })
  .handle(async ({ db, req, user }) => {
    const workspace_id = req.params.workspace_id
    const from   = req.query.from   ? new Date(req.query.from)   : null
    const to     = req.query.to     ? new Date(req.query.to)     : null
    const status = req.query.status || null

    const filter = { user_id: user.id, workspace_id }
    if (status) filter.status = status

    let shifts = await db.shift_event.find(filter)
    if (from) shifts = shifts.filter(s => new Date(s.planned_start) >= from)
    if (to)   shifts = shifts.filter(s => new Date(s.planned_start) <= to)

    return shifts
  })

// Shift summary — hours planned vs actual, per-day breakdown
api.get("/workspaces/:workspace_id/shifts/summary")
  .auth()
  .permission("worker", { workspace: true })
  .handle(async ({ db, req, user, membership }) => {
    const workspace_id = req.params.workspace_id
    const targetUserId = req.query.user_id || user.id
    const isManager = ROLES[membership.role] >= ROLES.manager

    if (!isManager && targetUserId !== user.id) {
      throw ElioError.forbidden("You can only view your own summary")
    }

    const from = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 7 * 86_400_000)
    const to   = req.query.to   ? new Date(req.query.to)   : new Date()

    let shifts = await db.shift_event.find({ user_id: targetUserId, workspace_id })
    shifts = shifts.filter(s => new Date(s.planned_start) >= from && new Date(s.planned_start) <= to)

    return computeShiftSummary(shifts)
  })

// Get single shift
api.get("/workspaces/:workspace_id/shifts/:shift_id")
  .auth()
  .permission("worker", { workspace: true })
  .handle(async ({ db, req, user, membership }) => {
    const shift = await db.shift_event.findOne({ id: req.params.shift_id })
    if (!shift) throw ElioError.notFound("Shift not found")
    if (shift.workspace_id !== req.params.workspace_id) throw ElioError.forbidden()

    // Workers can only see their own shifts
    if (ROLES[membership.role] < ROLES.manager && shift.user_id !== user.id) {
      throw ElioError.forbidden("You can only view your own shifts")
    }

    return shift
  })

// Edit a shift (planned_start/end only — original never changes)
api.put("/workspaces/:workspace_id/shifts/:shift_id")
  .auth()
  .permission("worker", { workspace: true })
  .input({
    planned_start: ElioField.date().optional(),
    planned_end:   ElioField.date().optional(),
    note:          ElioField.string().optional(),
    status:        ElioField.enum(Object.values(SHIFT_STATUS)).optional(),
  })
  .handle(async ({ db, req, user, input, membership }) => {
    const shift = await db.shift_event.findOne({ id: req.params.shift_id })
    if (!shift) throw ElioError.notFound("Shift not found")
    if (shift.workspace_id !== req.params.workspace_id) throw ElioError.forbidden()

    const isAdmin = ROLES[membership.role] >= ROLES.admin
    const config = await db.workspace_config.findOne({ workspace_id: req.params.workspace_id })

    // Workers can only edit their own shifts if config allows
    if (!isAdmin) {
      if (shift.user_id !== user.id) {
        throw ElioError.forbidden("You can only edit your own shifts")
      }
      if (!(config && config.allow_user_edit_shifts)) {
        throw ElioError.forbidden("You are not allowed to edit shifts. Contact an admin.")
      }
    }

    // Require note when editing if config flag is set
    if (config && config.require_note_on_edit && !input.note && !shift.note) {
      throw ElioError.badRequest("A note is required when editing a shift")
    }

    // Validate planned_start < planned_end if either is being updated
    const newStart = input.planned_start ? new Date(input.planned_start) : new Date(shift.planned_start)
    const newEnd   = input.planned_end   ? new Date(input.planned_end)   : new Date(shift.planned_end)
    if (newEnd <= newStart) throw ElioError.badRequest("planned_end must be after planned_start")

    // Update date if planned_start changes
    const update = { ...input, edited_by: user.id, edited_at: new Date() }
    if (input.planned_start) {
      update.date = new Date(input.planned_start).toISOString().slice(0, 10)
    }

    // NEVER modify original_start / original_end
    delete update.original_start
    delete update.original_end

    await db.shift_event.update(update, { id: shift.id })
    return db.shift_event.findOne({ id: shift.id })
  })

// Delete a shift (admin+)
api.delete("/workspaces/:workspace_id/shifts/:shift_id")
  .auth()
  .permission("admin", { workspace: true })
  .handle(async ({ db, req }) => {
    const shift = await db.shift_event.findOne({ id: req.params.shift_id })
    if (!shift) throw ElioError.notFound("Shift not found")
    if (shift.workspace_id !== req.params.workspace_id) throw ElioError.forbidden()
    await db.shift_event.delete({ id: shift.id })
    return { deleted: true }
  })

// Check-in — register actual start time
api.post("/workspaces/:workspace_id/shifts/:shift_id/check-in")
  .auth()
  .permission("worker", { workspace: true })
  .handle(async ({ db, req, user }) => {
    const shift = await db.shift_event.findOne({ id: req.params.shift_id })
    if (!shift) throw ElioError.notFound("Shift not found")
    if (shift.workspace_id !== req.params.workspace_id) throw ElioError.forbidden()
    if (shift.user_id !== user.id) throw ElioError.forbidden("You can only check in to your own shifts")
    if (shift.actual_start) throw ElioError.conflict("Already checked in")

    await db.shift_event.update({
      actual_start: new Date(),
      status:       SHIFT_STATUS.IN_PROGRESS,
    }, { id: shift.id })

    return db.shift_event.findOne({ id: shift.id })
  })

// Check-out — register actual end time
api.post("/workspaces/:workspace_id/shifts/:shift_id/check-out")
  .auth()
  .permission("worker", { workspace: true })
  .handle(async ({ db, req, user }) => {
    const shift = await db.shift_event.findOne({ id: req.params.shift_id })
    if (!shift) throw ElioError.notFound("Shift not found")
    if (shift.workspace_id !== req.params.workspace_id) throw ElioError.forbidden()
    if (shift.user_id !== user.id) throw ElioError.forbidden("You can only check out of your own shifts")
    if (!shift.actual_start) throw ElioError.badRequest("You must check in before checking out")
    if (shift.actual_end) throw ElioError.conflict("Already checked out")

    await db.shift_event.update({
      actual_end: new Date(),
      status:     SHIFT_STATUS.COMPLETED,
    }, { id: shift.id })

    return db.shift_event.findOne({ id: shift.id })
  })


// ─── Schedule Templates ─────────────────────────────────────────────────────

// List templates (owner/admin sees all, manager+ filtered, worker own only)
api.get("/workspaces/:workspace_id/schedule-templates")
  .auth()
  .permission("worker", { workspace: true })
  .handle(async ({ db, req, user, membership }) => {
    const workspace_id = req.params.workspace_id
    const isOwner = membership.role === "owner"
    const targetUserId = req.query.user_id || null

    if (targetUserId && targetUserId !== user.id && !isOwner) {
      throw ElioError.forbidden("Only the owner can view other users' templates")
    }

    const filter = { workspace_id }
    if (targetUserId) filter.user_id = targetUserId
    else if (!isOwner) filter.user_id = user.id

    return db.schedule_template.find(filter)
  })

// My templates
api.get("/workspaces/:workspace_id/schedule-templates/me")
  .auth()
  .permission("worker", { workspace: true })
  .handle(async ({ db, req, user }) => {
    return db.schedule_template.find({ workspace_id: req.params.workspace_id, user_id: user.id, active: true })
  })

// Create template
api.post("/workspaces/:workspace_id/schedule-templates")
  .auth()
  .permission("worker", { workspace: true })
  .input({
    user_id:         ElioField.string().optional(),
    day_of_week:     ElioField.number().required(),
    start_time:      ElioField.string().required(),
    end_time:        ElioField.string().required(),
    repeat_every:    ElioField.number().optional(),
    repeat_anchor:   ElioField.string().required(),
    end_type:        ElioField.string().optional(),
    end_after_count: ElioField.number().optional(),
    end_until_date:  ElioField.string().optional(),
    note:            ElioField.string().optional(),
  })
  .handle(async ({ db, req, user, input, membership }) => {
    const workspace_id = req.params.workspace_id
    const isOwner = membership.role === "owner"
    const targetUserId = input.user_id || user.id

    if (targetUserId !== user.id && !isOwner) {
      throw ElioError.forbidden("Only the owner can create templates for other users")
    }

    if (input.day_of_week < 0 || input.day_of_week > 6) {
      throw ElioError.badRequest("day_of_week must be 0-6")
    }

    return db.schedule_template.insert({
      workspace_id,
      user_id:         targetUserId,
      day_of_week:     input.day_of_week,
      start_time:      input.start_time,
      end_time:        input.end_time,
      repeat_every:    input.repeat_every || 1,
      repeat_anchor:   new Date(input.repeat_anchor),
      end_type:        input.end_type || TEMPLATE_END_TYPES.NEVER,
      end_after_count: input.end_after_count || null,
      end_until_date:  input.end_until_date ? new Date(input.end_until_date) : null,
      note:            input.note || null,
      created_by:      user.id,
      active:          true,
    })
  })

// Update template
api.put("/workspaces/:workspace_id/schedule-templates/:template_id")
  .auth()
  .permission("worker", { workspace: true })
  .input({
    day_of_week:     ElioField.number().optional(),
    start_time:      ElioField.string().optional(),
    end_time:        ElioField.string().optional(),
    repeat_every:    ElioField.number().optional(),
    repeat_anchor:   ElioField.string().optional(),
    end_type:        ElioField.string().optional(),
    end_after_count: ElioField.number().optional(),
    end_until_date:  ElioField.string().optional(),
    note:            ElioField.string().optional(),
    active:          ElioField.boolean().optional(),
  })
  .handle(async ({ db, req, user, input, membership }) => {
    const template = await db.schedule_template.findOne({ id: req.params.template_id })
    if (!template) throw ElioError.notFound("Template not found")

    const isOwner = membership.role === "owner"
    if (template.user_id !== user.id && !isOwner) {
      throw ElioError.forbidden("Only the owner can edit other users' templates")
    }

    const updates = {}
    if (input.day_of_week !== undefined)     updates.day_of_week = input.day_of_week
    if (input.start_time !== undefined)      updates.start_time = input.start_time
    if (input.end_time !== undefined)        updates.end_time = input.end_time
    if (input.repeat_every !== undefined)    updates.repeat_every = input.repeat_every
    if (input.repeat_anchor !== undefined)   updates.repeat_anchor = new Date(input.repeat_anchor)
    if (input.end_type !== undefined)        updates.end_type = input.end_type
    if (input.end_after_count !== undefined) updates.end_after_count = input.end_after_count
    if (input.end_until_date !== undefined)  updates.end_until_date = input.end_until_date ? new Date(input.end_until_date) : null
    if (input.note !== undefined)            updates.note = input.note
    if (input.active !== undefined)          updates.active = input.active

    await db.schedule_template.update(updates, { id: template.id })
    return db.schedule_template.findOne({ id: template.id })
  })

// Delete template
api.delete("/workspaces/:workspace_id/schedule-templates/:template_id")
  .auth()
  .permission("worker", { workspace: true })
  .handle(async ({ db, req, user, membership }) => {
    const template = await db.schedule_template.findOne({ id: req.params.template_id })
    if (!template) throw ElioError.notFound("Template not found")

    const isOwner = membership.role === "owner"
    if (template.user_id !== user.id && !isOwner) {
      throw ElioError.forbidden("Only the owner can delete other users' templates")
    }

    await db.schedule_template.delete({ id: template.id })
    return { success: true }
  })

// ─── Shift Generation (lazy) ────────────────────────────────────────────────

// Generate planned shifts from templates for a date range.
// Idempotent: skips dates where a shift already exists for the same user + workspace + date + times.
api.post("/workspaces/:workspace_id/shifts/generate")
  .auth()
  .permission("worker", { workspace: true })
  .input({
    from:    ElioField.string().required(),
    to:      ElioField.string().required(),
    user_id: ElioField.string().optional(),
  })
  .handle(async ({ db, req, user, input, membership }) => {
    const workspace_id = req.params.workspace_id
    const isOwner = membership.role === "owner"
    const targetUserId = input.user_id || user.id

    if (targetUserId !== user.id && !isOwner) {
      throw ElioError.forbidden("Only the owner can generate shifts for other users")
    }

    const templates = await db.schedule_template.find({
      workspace_id, user_id: targetUserId, active: true,
    })
    if (!templates.length) return []

    const fromDate = new Date(input.from)
    const toDate   = new Date(input.to)
    const created  = []

    // Iterate each day in range
    for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay() // 0=Sun
      const dateStr   = d.toISOString().slice(0, 10)

      for (const tpl of templates) {
        if (tpl.day_of_week !== dayOfWeek) continue

        // Check repeat_every interval
        const anchorDate = new Date(tpl.repeat_anchor)
        const msDiff = d.getTime() - anchorDate.getTime()
        const dayDiff = Math.round(msDiff / 86400000)
        const weekDiff = Math.floor(dayDiff / 7)
        if (weekDiff < 0) continue
        if (tpl.repeat_every > 1 && weekDiff % tpl.repeat_every !== 0) continue

        // Check end conditions
        if (tpl.end_type === TEMPLATE_END_TYPES.UNTIL && tpl.end_until_date) {
          if (d > new Date(tpl.end_until_date)) continue
        }
        if (tpl.end_type === TEMPLATE_END_TYPES.AFTER && tpl.end_after_count) {
          // Count how many occurrences exist before this date
          const occurrences = Math.floor(weekDiff / tpl.repeat_every)
          if (occurrences >= tpl.end_after_count) continue
        }

        // Build planned timestamps
        const [sh, sm] = tpl.start_time.split(":").map(Number)
        const [eh, em] = tpl.end_time.split(":").map(Number)
        const plannedStart = new Date(d)
        plannedStart.setHours(sh, sm, 0, 0)
        const plannedEnd = new Date(d)
        plannedEnd.setHours(eh, em, 0, 0)
        // Cross-midnight: end < start means next day
        if (plannedEnd <= plannedStart) plannedEnd.setDate(plannedEnd.getDate() + 1)

        // Check if shift already exists (same user, workspace, date, planned times)
        const existing = await db.shift_event.find({
          user_id: targetUserId, workspace_id, date: dateStr,
        })
        const alreadyExists = existing.some(s => {
          const sStart = new Date(s.planned_start).getTime()
          const sEnd   = new Date(s.planned_end).getTime()
          return sStart === plannedStart.getTime() && sEnd === plannedEnd.getTime()
        })
        if (alreadyExists) continue

        const shift = await db.shift_event.insert({
          user_id:        targetUserId,
          workspace_id,
          date:           dateStr,
          planned_start:  plannedStart,
          planned_end:    plannedEnd,
          original_start: plannedStart,
          original_end:   plannedEnd,
          status:         SHIFT_STATUS.PLANNED,
          note:           tpl.note || null,
          created_by:     user.id,
        })
        created.push(await db.shift_event.findOne({ id: shift.id }))
      }
    }

    return created
  })


// ─── Quick Clock In / Clock Out (Dashboard) ─────────────────────────────────

// Clock in — creates a new shift and immediately sets actual_start
api.post("/workspaces/:workspace_id/clock-in")
  .auth()
  .permission("worker", { workspace: true })
  .handle(async ({ db, req, user }) => {
    const workspace_id = req.params.workspace_id

    // Check there's no active shift already
    const active = await db.shift_event.findOne({
      user_id: user.id, workspace_id, status: SHIFT_STATUS.IN_PROGRESS,
    })
    if (active) throw ElioError.conflict("You already have an active shift in this workspace")

    const now = new Date()
    const date = now.toISOString().slice(0, 10)

    const shift = await db.shift_event.insert({
      user_id:        user.id,
      workspace_id,
      date,
      planned_start:  now,
      planned_end:    now,      // will be updated on clock-out
      original_start: now,
      original_end:   now,
      actual_start:   now,
      status:         SHIFT_STATUS.IN_PROGRESS,
      created_by:     user.id,
    })

    return db.shift_event.findOne({ id: shift.id })
  })

// Clock out — finds the active in_progress shift and sets actual_end
api.post("/workspaces/:workspace_id/clock-out")
  .auth()
  .permission("worker", { workspace: true })
  .handle(async ({ db, req, user }) => {
    const workspace_id = req.params.workspace_id

    const active = await db.shift_event.findOne({
      user_id: user.id, workspace_id, status: SHIFT_STATUS.IN_PROGRESS,
    })
    if (!active) throw ElioError.notFound("No active shift to clock out of")

    const now = new Date()
    await db.shift_event.update({
      actual_end:   now,
      planned_end:  now,
      status:       SHIFT_STATUS.COMPLETED,
    }, { id: active.id })

    return db.shift_event.findOne({ id: active.id })
  })

// Get active shift for the current user in a workspace (if any)
api.get("/workspaces/:workspace_id/clock-status")
  .auth()
  .permission("worker", { workspace: true })
  .handle(async ({ db, req, user }) => {
    const active = await db.shift_event.findOne({
      user_id: user.id, workspace_id: req.params.workspace_id, status: SHIFT_STATUS.IN_PROGRESS,
    })
    return { active: active || null }
  })

// Global clock status — find active shift in ANY workspace for current user
api.get("/clock-status")
  .auth()
  .handle(async ({ db, user }) => {
    const active = await db.shift_event.findOne({
      user_id: user.id, status: SHIFT_STATUS.IN_PROGRESS,
    })
    if (!active) return { active: null }
    const ws = await db.workspace.findOne({ id: active.workspace_id })
    return { active: { ...active, workspace_name: ws?.name || null } }
  })


// ─── Dev / Seed ──────────────────────────────────────────────────────────────

api.get("/seed-user").handle(async ({ db }) => {
  const email    = "test@example.com"
  const password = "Password123"
  const { salt, hash } = api._hashPassword(password)
  const userId = "seed-user-id"

  try { await db.user.delete({ id: userId }) } catch { }
  try { await db.user_passwords.delete({ user_id: userId }) } catch { }

  await db.user.insert({ id: userId, email, role: "user", name: "Test User", phone: "000000000" })
  await db.user_passwords.insert({ id: "seed-pwd-id", user_id: userId, password: hash, salt })

  return { msg: "User seeded", email, password }
})


api.start()