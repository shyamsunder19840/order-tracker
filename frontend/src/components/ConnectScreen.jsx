import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { connectBC, clearAuthError } from '../store/authSlice.js'
import logo from '../assets/logo.png'

export default function ConnectScreen() {
  const dispatch              = useDispatch()
  const { connecting, error } = useSelector((s) => s.auth)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) return
    dispatch(connectBC({ username: username.trim(), password: password.trim() }))
  }

  return (
    <div className="connect-page">
      <div className="connect-card">
        <img src={logo} alt="Proactive" className="connect-logo" />
        <h1 className="connect-title">Sales &amp; Order Suite</h1>
        <p className="connect-sub">Sign in with your Business Central account</p>

        <form className="connect-form" onSubmit={handleSubmit}>
          <div className="field-group">
            <label className="field-label">Username</label>
            <input
              className="field-input"
              type="email"
              value={username}
              onChange={(e) => { setUsername(e.target.value); dispatch(clearAuthError()) }}
              placeholder="user@company.com"
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="field-group">
            <label className="field-label">Password</label>
            <div className="pw-wrap">
              <input
                className="field-input"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); dispatch(clearAuthError()) }}
                placeholder="Business Central password"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShowPw((v) => !v)}
                tabIndex={-1}
              >
                {showPw ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {error && <div className="connect-error">{error}</div>}

          <button
            className="connect-btn"
            type="submit"
            disabled={connecting || !username.trim() || !password.trim()}
          >
            {connecting ? (
              <><span className="btn-spinner" /> Connecting…</>
            ) : 'Connect to Business Central'}
          </button>
        </form>

        <p className="connect-footer-note">
          Your password is sent securely to the local server and never stored to disk.
        </p>
      </div>
    </div>
  )
}
