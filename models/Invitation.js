import { ROLE_NAMES, INVITATION_STATUS } from '../constants/index.js'

// Workspace invitation — sent by admins to invite users (existing or new) to a workspace.
// If the email belongs to an existing user, they are added as a member directly.
// If not, an email is sent with a signup link containing the invitation token.
export const Invitation = (ElioModel, ElioField) => new ElioModel("invitation", {
  workspace_id: ElioField.string().required().public(),
  email:        ElioField.string().required().public(),
  role:         ElioField.enum(ROLE_NAMES).default("worker").public(),
  invited_by:   ElioField.string().required().public(),   // user_id of inviter
  status:       ElioField.enum(Object.values(INVITATION_STATUS)).default(INVITATION_STATUS.PENDING).public(),
  token:        ElioField.string().required().unique().public(),  // unique token for invitation link
  expires_at:   ElioField.date().required().public(),
})
