// constants/index.js
// Single source of truth for environment-level config.
// Imported by both api/ and frontend/ so neither hard-codes URLs or settings.

export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export const API_URL = IS_PRODUCTION
  ? 'https://your-production-api.com'   // ← replace before deploying
  : 'http://localhost:3050';

export const FRONTEND_URL = IS_PRODUCTION
  ? 'https://your-production-app.com'   // ← replace before deploying
  : 'http://localhost:5173';

export const CORS_ORIGINS = [FRONTEND_URL];

// ─── Role hierarchy (per workspace) ─────────────────────────────────────────
// Numeric values allow >= comparisons: ROLES.admin >= ROLES.manager
export const ROLES = {
  owner:   5,
  admin:   4,
  manager: 3,
  worker:  2,
  viewer:  1,
};

export const ROLE_NAMES = Object.keys(ROLES); // ['owner','admin','manager','worker','viewer']

// ─── Schedule modes ──────────────────────────────────────────────────────────
export const SCHEDULE_MODES = {
  FIXED_SCHEDULE:    'fixed_schedule',
  FLEXIBLE_DAILY:    'flexible_daily_hours',
  FLEXIBLE_WEEKLY:   'flexible_weekly_hours',
};

// ─── Shift event statuses ────────────────────────────────────────────────────
export const SHIFT_STATUS = {
  PLANNED:     'planned',
  IN_PROGRESS: 'in_progress',
  COMPLETED:   'completed',
  CANCELLED:   'cancelled',
};

// ─── Invitation statuses ─────────────────────────────────────────────────────
export const INVITATION_STATUS = {
  PENDING:   'pending',
  ACCEPTED:  'accepted',
  EXPIRED:   'expired',
  CANCELLED: 'cancelled',
};

// ─── Workspace config defaults ───────────────────────────────────────────────
export const CONFIG_DEFAULTS = {
  allow_user_edit_shifts: false,
  auto_check_in:         false,
  auto_check_out:        false,
  require_note_on_edit:  false,
  allow_future_shifts:   true,
};

// ─── Schedule template end types ─────────────────────────────────────────────
export const TEMPLATE_END_TYPES = {
  NEVER: 'never',
  AFTER: 'after',
  UNTIL: 'until',
};
