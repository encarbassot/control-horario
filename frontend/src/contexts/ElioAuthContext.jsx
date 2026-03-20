 // ElioAuthContext.jsx
// React context that wraps ElioApiAdapter and manages auth state.
//
// Features:
//  - Auto-login on mount: silently exchanges the httpOnly refresh_token cookie
//    for a new access token (no user action required).
//  - Reactive: components re-render when the user logs in, logs out,
//    or the token is silently refreshed.
//  - Single source of truth: all auth state lives here, the rest of
//    the app just calls login() / logout() from useElioAuth().
//
// Setup (main.jsx):
//   import { api }              from './api/ApiAdapter'
//   import { ElioAuthProvider } from 'elioapi/frontend'
//
//   <ElioAuthProvider api={api}>
//     <App />
//   </ElioAuthProvider>
//
// Usage in any component:
//   const { user, isAuthenticated, isLoading, login, logout } = useElioAuth()

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ElioAuthContext = createContext(null);

/**
 * ElioAuthProvider
 *
 * @param {{ api: ElioApiAdapter, children: React.ReactNode }} props
 */
export function ElioAuthProvider({ api, children }) {
  const [user, setUser]             = useState(null);
  const [isLoading, setIsLoading]   = useState(true);   // true until tryAutoLogin resolves
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); // hold ProtectedRoute until we know

  useEffect(() => {
    // Subscribe to auth changes pushed by the adapter
    // (covers silent token refresh that carries user data)
    const unsub = api.auth.onUserChange((u) => {
      setUser(u);
      setIsLoggedIn(Boolean(u));
    });

    // Attempt to restore session from the httpOnly cookie.
    // If there is no valid cookie the request will fail silently.
    api.auth.tryAutoLogin().then(({ user: restored }) => {
      if (restored) {
        setUser(restored);
        setIsLoggedIn(true);
      }
    }).catch(() => {
      // network error on startup — treat as not logged in
    }).finally(() => {
      setIsLoading(false);
      setIsCheckingAuth(false);
    });

    return unsub;
  }, [api]);

  /**
   * login({ email, password })
   * Wraps api.auth.login and updates context state.
   * Returns the same { success, data, error } shape the adapter does.
   */
  const login = useCallback(async (credentials) => {
    try {
      const result = await api.auth.login(credentials);
      if (result.success && result.data?.user) setUser(result.data.user);
      setIsLoggedIn(result.success);
      return result;
    } catch (err) {
      return { success: false, error: { code: 'NETWORK_ERROR', message: err.message } };
    }
  }, [api]);

  /**
   * logout()
   * Clears tokens, notifies the server, resets context state.
   */
  const logout = useCallback(async () => {
    await api.auth.logout();
    setUser(null);
    setIsLoggedIn(false);
  }, [api]);

  /**
   * updateUser(partial)
   * Merges partial data into the current user object.
   * Useful after profile edits that return updated user fields from the server.
   */
  const updateUser = useCallback((partial) => {
    setUser(prev => prev ? { ...prev, ...partial } : prev);
  }, []);

  return (
    <ElioAuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        isCheckingAuth,
        isLoggedIn,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </ElioAuthContext.Provider>
  );
}

/**
 * useElioAuth()
 *
 * Returns: { user, isAuthenticated, isLoading, login, logout }
 *
 * Must be called inside <ElioAuthProvider>.
 */
export function useElioAuth() {
  const ctx = useContext(ElioAuthContext);
  if (!ctx) throw new Error('useElioAuth must be used inside <ElioAuthProvider>');
  return ctx;
}
