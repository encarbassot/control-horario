import { SHIFT_STATUS } from '../constants/index.js'

// Shift event — a scheduled work block with 3 pairs of dates:
//   1. Planned (editable):  planned_start / planned_end
//   2. Original (immutable, regulatory compliance): original_start / original_end
//   3. Actual (real check-in/out): actual_start / actual_end
//
// Split shifts (jornada partida) are represented as separate ShiftEvents on the same day.
// original_start/end are copied from planned on creation and NEVER modified after.
export const ShiftEvent = (ElioModel, ElioField) => new ElioModel("shift_event", {
  user_id:        ElioField.string().required().public(),
  workspace_id:   ElioField.string().required().public(),
  date:           ElioField.date().required().public(),       // calendar day this shift belongs to

  // Par 1 — Planned (can be edited by admin or worker if config allows)
  planned_start:  ElioField.date().required().public(),
  planned_end:    ElioField.date().required().public(),

  // Par 2 — Original (regulatory backup, set once on creation, immutable)
  original_start: ElioField.date().optional().public(),
  original_end:   ElioField.date().optional().public(),

  // Par 3 — Actual (real clock-in / clock-out timestamps)
  actual_start:   ElioField.date().optional().public(),
  actual_end:     ElioField.date().optional().public(),

  status:         ElioField.enum(Object.values(SHIFT_STATUS)).default(SHIFT_STATUS.PLANNED).public(),
  note:           ElioField.string().optional().public(),
  created_by:     ElioField.string().optional().public(),     // audit: who created this shift
  edited_by:      ElioField.string().optional().public(),     // audit: who last edited
  edited_at:      ElioField.date().optional().public(),
})
