// Platform-level user account.
// Workspace membership and per-workspace roles live in WorkspaceMember.
export const User = (ElioModel, ElioField) => new ElioModel("user", {
  ...ElioModel.User,  // name (public), email (public), phone (private)
  // Override role: platform-level only ("user" | "super")
  role: ElioField.enum(["user", "super"]).default("user").public(),
})
