# Phase 1 — Multitenant Time Control System

Restructure from single-tenant (User→Workspace) to multitenant many-to-many
(User↔WorkspaceMember↔Workspace), add work schedules and clock events, extend
ElioApi's `.permission()` to support per-workspace roles, and wire up all Phase 1
API routes. Remove `/api/models/` in favor of shared `/models/`.

---

## Decisions

| Topic | Decision |
|-------|----------|
| Naming | Keep **Workspace** (not Company) |
| Roles | Per-workspace in `WorkspaceMember`; `user.role` kept for platform-level admin only (`"user"` / `"super"`) |
| Sessions | **Events only** — sessions computed on-the-fly from `clock_in`/`clock_out` pairs |
| Schedules | **JSON text column** — flexible, not normalized rows |
| Permissions | Extend ElioApi `.permission()` with `{ workspace: true }` option (backward compatible) |
| Scope | API only for Phase 1 — frontend alignment deferred |

---

## Phase A — Shared Constants (`/constants/index.js`)

Add enums used by both API and frontend:

```js
ROLES           = { owner: 5, admin: 4, manager: 3, worker: 2, viewer: 1 }
SCHEDULE_MODES  = { FIXED_SCHEDULE, FLEXIBLE_DAILY, FLEXIBLE_WEEKLY }
EVENT_TYPES     = { CLOCK_IN, CLOCK_OUT }
```

Numeric `ROLES` values allow `>=` comparisons for hierarchy checks.

---

## Phase B — Shared Models (`/models/`)

### B1. User (`/models/User.js`)
- Remove `workspace_id` — users no longer belong to a single workspace
- Override `role` to enum `["user", "super"]` default `"user"` — platform-level only
- Use `...ElioModel.User` spread for name/email/phone base fields

### B2. Workspace (`/models/Workspace.js`)
- Add `description` — string, optional, public
- Add `created_by` — string (user_id of owner), public

### B3. WorkspaceMember (`/models/WorkspaceMember.js`) — **new**
Many-to-many pivot between User and Workspace with per-workspace role.

| Field | Type | Notes |
|-------|------|-------|
| `user_id` | string | required, public |
| `workspace_id` | string | required, public |
| `role` | enum | owner/admin/manager/worker/viewer, default worker |

> Composite unique constraint on `(user_id, workspace_id)` enforced at app level
> (ElioField only supports single-column unique).

### B4. WorkSchedule (`/models/WorkSchedule.js`) — **new**
One schedule per workspace member. Defines work expectations.

| Field | Type | Notes |
|-------|------|-------|
| `workspace_member_id` | string | required, public |
| `workspace_id` | string | required, public (denormalized) |
| `user_id` | string | required, public (denormalized) |
| `mode` | enum | fixed_schedule / flexible_daily_hours / flexible_weekly_hours |
| `schedule` | text | JSON: `{ monday: [["9:00","14:00"],["15:00","18:00"]], ... }` |
| `required_daily_hours` | number | optional, for flexible_daily mode |
| `required_weekly_hours` | number | optional, for flexible_weekly mode |

### B5. TimeEvent (`/models/TimeEvent.js`) — **new** (replaces TimeEntry)
Raw clock events. Sessions derived on-the-fly.

| Field | Type | Notes |
|-------|------|-------|
| `user_id` | string | required, public |
| `workspace_id` | string | required, public |
| `type` | enum | clock_in / clock_out |
| `timestamp` | date | required, public |
| `note` | string | optional, for corrections |
| `created_by` | string | optional, user_id of admin who created it (audit) |

### B6. Cleanup
- Delete `/models/Project.js` (future phase)
- Delete `/models/TimeEntry.js` (replaced by TimeEvent)
- Delete `/api/models/` directory entirely
- Update `/models/index.js` exports

---

## Phase C — ElioApi Extension (`ElioRoute.permission()`)

**File:** `ElioApi/utils/ElioRoute.js`

Extended signature: `.permission(role, options?)`

When `options.workspace === true`:
1. Extract `workspace_id` from `req.params` → `req.body` → `req.query`
2. Look up membership: `db.workspace_member.findOne({ user_id: user.id, workspace_id })`
3. No membership → 403 Forbidden
4. Compare `ROLES[membership.role] >= ROLES[requiredRole]`
5. Attach `req.membership` to `req` for downstream handlers

Backward compatible: `.permission("admin")` without options still checks `user.role`.

---

## Phase D — API Routes (`/api/index.js`)

### D1. Workspaces

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/workspaces` | auth | Create workspace → auto-create owner membership |
| GET | `/workspaces` | auth | List user's workspaces via memberships |
| GET | `/workspaces/:workspace_id` | workspace viewer+ | Get workspace details |
| PUT | `/workspaces/:workspace_id` | workspace admin+ | Update workspace |
| DELETE | `/workspaces/:workspace_id` | workspace owner | Delete workspace |

### D2. Members

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/workspaces/:workspace_id/members` | workspace admin+ | Add member |
| GET | `/workspaces/:workspace_id/members` | workspace viewer+ | List members |
| PUT | `/workspaces/:workspace_id/members/:member_id` | workspace admin+ | Update role |
| DELETE | `/workspaces/:workspace_id/members/:member_id` | workspace admin+ | Remove member |

Constraints:
- Cannot demote/remove the owner
- Cannot assign a role higher than your own

### D3. Schedules

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/workspaces/:workspace_id/schedules` | workspace admin+ | Create schedule for a member |
| GET | `/workspaces/:workspace_id/schedules` | workspace manager+ | List all schedules |
| GET | `/workspaces/:workspace_id/schedules/:user_id` | own or manager+ | Get user's schedule |
| PUT | `/workspaces/:workspace_id/schedules/:schedule_id` | workspace admin+ | Update schedule |

### D4. Time Events (core feature)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/workspaces/:workspace_id/clock` | workspace worker+ | Clock in/out (auto-detect from last event) |
| GET | `/workspaces/:workspace_id/events` | manager+ or own | List time events |
| GET | `/workspaces/:workspace_id/events/me` | workspace worker+ | Own events |
| GET | `/workspaces/:workspace_id/events/summary` | workspace manager+ | Computed hours + compliance |
| DELETE | `/workspaces/:workspace_id/events/:event_id` | workspace admin+ | Delete/correct event |

**Clock logic:**
> 1. Verify membership exists
> 2. Find latest event for this `user_id + workspace_id`
> 3. If none or last was `clock_out` → create `clock_in`
> 4. If last was `clock_in` → create `clock_out`

### D5. Utility Functions (internal, not routes)

**computeSessions(events):**
- Pair consecutive `clock_in`/`clock_out` events
- Return `{ sessions: [{start, end, durationMs}], totalHours, dailyBreakdown }`

**computeCompliance(sessions, schedule):**
- Compare actual vs expected based on schedule `mode`
- Return `{ compliant, lateMinutes, earlyLeaveMinutes, overtime, missingHours }`

---

## Phase E — Cleanup

1. Delete `/api/models/` directory
2. Update API imports to use shared `/models/`
3. Frontend alignment deferred

---

## Verification Checklist

- [ ] API starts, `sync: true` creates all 5 tables: `users`, `workspaces`, `workspace_members`, `work_schedules`, `time_events`
- [ ] Seed user, login, JWT flow works
- [ ] `POST /workspaces` creates workspace + owner membership atomically
- [ ] Adding a second user as worker stores per-workspace role
- [ ] Worker hitting admin route returns 403
- [ ] Owner cannot be demoted or removed
- [ ] `POST /clock` toggles between clock_in and clock_out
- [ ] `GET /events` is filtered by workspace
- [ ] `GET /events/summary` returns computed hours
- [ ] Cross-tenant: User B cannot see User A's workspace data

---

## Future Considerations

1. **Composite unique** on `(user_id, workspace_id)` — extend `SchemaSyncer` in a later ElioApi version
2. **Ownership transfer** — separate endpoint `POST /workspaces/:id/transfer-ownership`
3. **Manual event entry** — admin creates events for employees with `created_by` audit field
4. **Phase 2 readiness** — `time_events` will optionally reference `task_id` / `project_id`
