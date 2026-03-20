import { TEMPLATE_END_TYPES } from '../constants/index.js'

// Recurring schedule template — defines a repeating shift block.
// Used for lazy generation: when a week/month view is loaded, the API
// creates PLANNED ShiftEvents from matching active templates.
//
// Recurrence logic:
//   weekDiff = floor((targetDate - repeat_anchor) / 7)
//   if (weekDiff >= 0 && weekDiff % repeat_every === 0 && targetDate.dayOfWeek === day_of_week)
//     → generate a ShiftEvent
//
// Cross-midnight: start_time > end_time means the shift ends the next day.
export const ScheduleTemplate = (ElioModel, ElioField) => new ElioModel("schedule_template", {
  workspace_id:    ElioField.string().required().public(),
  user_id:         ElioField.string().required().public(),
  day_of_week:     ElioField.number().required().public(),     // 0=Sunday … 6=Saturday
  start_time:      ElioField.string().required().public(),     // "HH:MM"
  end_time:        ElioField.string().required().public(),     // "HH:MM" (can be < start for cross-midnight)
  repeat_every:    ElioField.number().default(1).public(),     // every N weeks
  repeat_anchor:   ElioField.date().required().public(),       // first occurrence date (ISO)
  end_type:        ElioField.enum(Object.values(TEMPLATE_END_TYPES)).default(TEMPLATE_END_TYPES.NEVER).public(),
  end_after_count: ElioField.number().optional().public(),     // if end_type = 'after'
  end_until_date:  ElioField.date().optional().public(),       // if end_type = 'until'
  note:            ElioField.string().optional().public(),
  created_by:      ElioField.string().required().public(),
  active:          ElioField.boolean().default(true).public(),
})
