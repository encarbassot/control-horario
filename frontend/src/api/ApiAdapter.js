


import { ElioApiAdapter } from 'elioapi/frontend'
import { API_URL } from "../../../constants/index.js";

/**
 * Global API instance.
 *
 * Usage anywhere in the app:
 *   import { api } from './api/ApiAdapter'
 *
 *   // Auth
 *   const { success, data, error } = await api.auth.login({ email, password })
 *
 *   // Models (any name maps to a query builder automatically)
 *   const { data: entries } = await api.timeEntries.where('userId', id).get()
 *   const { data: entry }   = await api.timeEntries.create({ ... })
 */
export const api = ElioApiAdapter.create({
  apiUrl: API_URL,

  // Called automatically when both access + refresh tokens are expired.
  // Redirect to login so the user can re-authenticate.
  onUnauthorized: () => {
    window.location.href = '/login'
  },
})

// ElioApiAdapter only ships get() and post() as raw HTTP helpers.
// Add put() and delete() so custom routes can use all HTTP verbs.
api.put = (path, body) => api._request({ path, method: 'PUT', body }).then(r => {
  const s = r?.success ?? false
  return { success: s, data: r?.data ?? null, error: r?.error ?? null }
})
api.delete = (path, body) => api._request({ path, method: 'DELETE', body }).then(r => {
  const s = r?.success ?? false
  return { success: s, data: r?.data ?? null, error: r?.error ?? null }
})