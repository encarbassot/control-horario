import { SCHEDULE_MODES } from '../constants/index.js'

// Work schedule for a specific user within a specific workspace.
// workspace_id and user_id are denormalized for query efficiency.
// schedule field stores a JSON string with per-day intervals, e.g.:
//   { "monday": [["9:00","14:00"],["15:00","18:00"]], "friday": [["8:00","15:00"]] }
export const WorkSchedule = (ElioModel, ElioField) => new ElioModel("work_schedule", {
  workspace_member_id:   ElioField.string().required().public(),
  workspace_id:          ElioField.string().required().public(),
  user_id:               ElioField.string().required().public(),
  mode:                  ElioField.enum(Object.values(SCHEDULE_MODES)).required().public(),
  schedule:              ElioField.text().optional().public(),  // JSON string
  required_daily_hours:  ElioField.number().optional().public(),
  required_weekly_hours: ElioField.number().optional().public(),
})
