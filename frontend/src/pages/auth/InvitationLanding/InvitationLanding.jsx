import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../../../api/ApiAdapter'
import { URL_INVITATION_INFO, URL_INVITATION_ACCEPT } from '../../../api/urls'
import { useElioAuth } from '../../../contexts/ElioAuthContext.jsx'
import { InputText } from '../../../elio-react-components/components/inputs/InputText/InputText'
import { InputPassword } from '../../../elio-react-components/components/inputs/InputPassword/InputPassword'
import { useForm } from '../../../elio-react-components/utils/useForm/useForm'
import { ROUTES } from '../../../routes/navigationConfig'
import './InvitationLanding.css'

export default function InvitationLanding() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, isCheckingAuth, login } = useElioAuth()

  const [inviteInfo, setInviteInfo] = useState(null)
  const [inviteError, setInviteError] = useState(null)
  const [isFetching, setIsFetching] = useState(true)

  const [tab, setTab] = useState('login')
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  const [acceptStatus, setAcceptStatus] = useState(null) // null | 'loading' | 'done' | 'error'
  const [acceptError, setAcceptError] = useState('')

  const passwordRef = useRef(null)

  const [
    [
      [inpEmail, setInpEmail],
      [inpPassword, setInpPassword, errPassword],
    ],
    { validateForEmptyFields, getFormValues },
  ] = useForm([
    { fieldName: 'email', value: '' },
    { fieldName: 'password' },
  ])

  useEffect(() => {
    async function fetchInfo() {
      const { success, data, error } = await api.get(URL_INVITATION_INFO(token))
      setIsFetching(false)
      if (success) {
        setInviteInfo(data)
        setInpEmail(data.email)
      } else {
        setInviteError(error?.message || 'This invitation is not valid or has expired.')
      }
    }
    fetchInfo()
  }, [token])

  async function handleAccept() {
    setAcceptStatus('loading')
    setAcceptError('')
    const { success, data, error } = await api.post(URL_INVITATION_ACCEPT(token))
    if (success) {
      setAcceptStatus('done')
      setTimeout(() => navigate(ROUTES.WORKSPACES), 1800)
    } else {
      setAcceptStatus('error')
      setAcceptError(error?.message || 'Could not accept the invitation.')
    }
  }

  async function handleLogin() {
    if (!validateForEmptyFields()) return
    setLoginError('')
    setIsLoading(true)
    const { email, password } = getFormValues()
    const { success, error } = await login({ email, password })
    setIsLoading(false)
    if (!success) {
      setLoginError(error?.message || 'Login failed. Please check your credentials.')
      return
    }
    await handleAccept()
  }

  const busy = isLoading || acceptStatus === 'loading'

  if (isFetching || isCheckingAuth) {
    return (
      <div className="InvitationLanding">
        <span className="spinner" />
      </div>
    )
  }

  if (inviteError) {
    return (
      <div className="InvitationLanding">
        <div className="inv-card">
          <div className="inv-icon inv-icon--error">✕</div>
          <h2>Invalid invitation</h2>
          <p className="inv-subtitle">{inviteError}</p>
          <Link to={ROUTES.LOGIN} className="button">Go to login</Link>
        </div>
      </div>
    )
  }

  if (acceptStatus === 'done') {
    return (
      <div className="InvitationLanding">
        <div className="inv-card">
          <div className="inv-icon inv-icon--success">✓</div>
          <h2>Joined successfully!</h2>
          <p className="inv-subtitle">
            You are now a member of <strong>{inviteInfo.workspace_name}</strong>.
          </p>
          <p className="inv-hint">Redirecting you to your workspaces…</p>
        </div>
      </div>
    )
  }

  const roleLabel = inviteInfo.role.charAt(0).toUpperCase() + inviteInfo.role.slice(1)

  return (
    <div className="InvitationLanding">
      <div className="inv-card">
        {/* Invitation header */}
        <div className="inv-header">
          <h1>You've been invited</h1>
          <p className="inv-workspace">
            Join <strong>{inviteInfo.workspace_name}</strong> as&nbsp;
            <span className={`role-badge role-badge--${inviteInfo.role}`}>{roleLabel}</span>
          </p>
          <p className="inv-email">Sent to <strong>{inviteInfo.email}</strong></p>
        </div>

        {/* Already logged in */}
        {isAuthenticated ? (
          <div className="inv-authenticated">
            {acceptStatus === 'error' && <p className="inv-error">{acceptError}</p>}
            <button
              className="button"
              onClick={handleAccept}
              disabled={busy}
            >
              {busy ? <span className="spinner small" /> : 'Accept invitation'}
            </button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="inv-tabs">
              <button
                className={`inv-tab ${tab === 'login' ? 'inv-tab--active' : ''}`}
                onClick={() => setTab('login')}
              >
                Log in
              </button>
              <button
                className={`inv-tab ${tab === 'signup' ? 'inv-tab--active' : ''}`}
                onClick={() => setTab('signup')}
              >
                Sign up
              </button>
            </div>

            {tab === 'login' && (
              <div className="inv-tab-content">
                <InputText
                  title="Email"
                  value={inpEmail}
                  onChange={e => setInpEmail(e.target.value.toLowerCase())}
                  onEnter={() => passwordRef.current?.focus()}
                  optional
                />
                <InputPassword
                  ref={passwordRef}
                  title="Password"
                  value={inpPassword}
                  onChange={e => setInpPassword(e.target.value)}
                  error={errPassword}
                  onEnter={handleLogin}
                  optional
                />
                {loginError && <p className="inv-error">{loginError}</p>}
                {acceptStatus === 'error' && <p className="inv-error">{acceptError}</p>}
                <button className="button" onClick={handleLogin} disabled={busy}>
                  {busy ? <span className="spinner small" /> : 'Log in & accept'}
                </button>
                <div className="inv-links">
                  <Link to={ROUTES.RESET_PASSWORD} state={{ email: inpEmail }}>
                    Forgot password?
                  </Link>
                </div>
              </div>
            )}

            {tab === 'signup' && (
              <div className="inv-tab-content inv-signup-info">
                <p>
                  Create your account with <strong>{inviteInfo.email}</strong> to join{' '}
                  <strong>{inviteInfo.workspace_name}</strong>.
                </p>
                <Link
                  className="button"
                  to={ROUTES.SIGNUP}
                  state={{ email: inviteInfo.email }}
                >
                  Create account
                </Link>
                <p className="inv-hint">
                  After signing up and verifying your email, come back to this link to accept
                  the invitation.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
