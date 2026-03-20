// Per-workspace configuration flags.
// One config row per workspace (created automatically when a workspace is created).
export const WorkspaceConfig = (ElioModel, ElioField) => new ElioModel("workspace_config", {
  workspace_id:           ElioField.string().required().unique().public(),

  // Can workers edit their own shifts?
  allow_user_edit_shifts: ElioField.boolean().default(false).public(),

  // Automatically set actual_start = planned_start when the time arrives
  auto_check_in:          ElioField.boolean().default(false).public(),

  // Automatically set actual_end = planned_end when the time arrives
  auto_check_out:         ElioField.boolean().default(false).public(),

  // Require a note when editing an existing shift
  require_note_on_edit:   ElioField.boolean().default(false).public(),

  // Allow creating shifts in the future (planning)
  allow_future_shifts:    ElioField.boolean().default(true).public(),
})
