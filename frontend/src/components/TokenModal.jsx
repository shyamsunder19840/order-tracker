import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setToken, closeModal } from '../store/tokenSlice.js'

export default function TokenModal() {
  const dispatch  = useDispatch()
  const current   = useSelector((s) => s.token.value)
  const [draft, setDraft] = useState(current)

  const handleSave = () => {
    dispatch(setToken(draft))
    dispatch(closeModal())
  }

  const handleClear = () => {
    setDraft('')
    dispatch(setToken(''))
    dispatch(closeModal())
  }

  return (
    <div className="modal-backdrop" onClick={() => dispatch(closeModal())}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Business Central — Bearer Token</h3>
          <button className="modal-close" onClick={() => dispatch(closeModal())}>✕</button>
        </div>

        <p className="modal-hint">
          Paste your Bearer token below. Generate one using:
        </p>
        <pre className="modal-code">{`import requests
payload = {
  'grant_type':    'password',
  'client_id':     'YOUR_CLIENT_ID',
  'client_secret': 'YOUR_CLIENT_SECRET',
  'resource':      'https://api.businesscentral.dynamics.com',
  'username':      'YOUR_BC_USERNAME',
  'password':      'YOUR_PASSWORD',
}
r = requests.post(
  'https://login.microsoftonline.com/'
  'YOUR_TENANT_ID/oauth2/token',
  data=payload)
print(r.json()['access_token'])`}</pre>

        <textarea
          className="modal-textarea"
          placeholder="eyJ0eXAiOiJKV1QiLCJhbGci..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={5}
          spellCheck={false}
        />

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleClear}>Clear token</button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!draft.trim()}
          >
            Save &amp; use token
          </button>
        </div>
      </div>
    </div>
  )
}
