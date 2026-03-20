import { ROLE_NAMES } from '../constants/index.js'

// Many-to-many pivot between User and Workspace.
// Per-workspace role is stored here, not on the User model.
// Composite unique (user_id + workspace_id) is enforced at app level.
export const WorkspaceMember = (ElioModel, ElioField) => new ElioModel("workspace_member", {
  id:           ElioField.uuid().public(),
  user_id:      ElioField.string().required().public(),
  workspace_id: ElioField.string().required().public(),
  role:         ElioField.enum(ROLE_NAMES).default("worker").public(),
})
