import React, { useState, useEffect } from 'react'
import axios from 'axios'

// ── Editable field sections ───────────────────────────────────────────────────
const SECTIONS = [
  {
    title: '🔐 Authentication',
    fields: [
      { key: 'BC_TENANT_ID',     label: 'Tenant ID',      hint: 'Azure AD tenant GUID',                          type: 'text'     },
      { key: 'BC_CLIENT_ID',     label: 'Client ID',      hint: 'App Registration client GUID',                  type: 'text'     },
      { key: 'BC_CLIENT_SECRET', label: 'Client Secret',  hint: 'Leave unchanged to keep existing secret',       type: 'password' },
      { key: 'BC_RESOURCE',      label: 'Resource URL',   hint: 'BC API base  e.g. https://api.businesscentral.dynamics.com', type: 'text' },
    ],
  },
  {
    title: '🏢 Business Central',
    fields: [
      { key: 'BC_ENVIRONMENT',  label: 'Environment',   hint: 'e.g. Production or Test-Shyam',              type: 'text' },
      { key: 'BC_COMPANY_ID',   label: 'Company ID',    hint: 'Company GUID — used in Order Status API',    type: 'text' },
      { key: 'BC_COMPANY_NAME', label: 'Company Name',  hint: 'Exact name — used in Order Tracker API path',type: 'text' },
    ],
  },
]

// ── Build API URL list from current form values ───────────────────────────────
function buildUrls(f) {
  const res  = f.BC_RESOURCE    || 'https://api.businesscentral.dynamics.com'
  const ten  = f.BC_TENANT_ID   || '<tenant_id>'
  const env  = f.BC_ENVIRONMENT || '<environment>'
  const cId  = f.BC_COMPANY_ID  || '<company_id>'
  const cNm  = f.BC_COMPANY_NAME|| 'Proactive Data Systems Pvt.Ltd'
  const base = `${res}/v2.0/${ten}`

  return [
    {
      label:  'Order Status API',
      method: 'POST',
      color:  '#2563eb',
      bg:     '#eff6ff',
      url:    `${base}/${env}/ODataV4/RequestInformation_GetOrderStatus?company=${cId}`,
    },
    {
      label:  'Order Tracker API',
      method: 'GET',
      color:  '#059669',
      bg:     '#f0fdf4',
      url:    `${base}/${env}/ODataV4/Company('${encodeURIComponent(cNm)}')/OrderTrackerAPI`,
    },
    {
      label:  'Token Endpoint',
      method: 'POST',
      color:  '#7c3aed',
      bg:     '#faf5ff',
      url:    `https://login.microsoftonline.com/${ten}/oauth2/token`,
    },
  ]
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function SettingsModal({ onClose }) {
  const [form,        setForm]        = useState({})
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)
  const [error,       setError]       = useState(null)
  const [showSecrets, setShowSecrets] = useState(false)

  useEffect(() => {
    axios.get('/api/config/')
      .then((r) => { setForm(r.data); setLoading(false) })
      .catch(() => { setError('Failed to load settings.'); setLoading(false) })
  }, [])

  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  function change(key, val) {
    setForm((f) => ({ ...f, [key]: val }))
    setSaved(false); setError(null)
  }

  async function save() {
    setSaving(true); setError(null); setSaved(false)
    try {
      await axios.post('/api/config/', form)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed.')
    } finally { setSaving(false) }
  }

  const urls = buildUrls(form)

  return (
    <div className="sm-backdrop" onClick={onClose}>
      <div className="sm-modal" onClick={(e) => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="sm-header">
          <div className="sm-header-left">
            <span className="sm-header-icon">⚙</span>
            <div>
              <h2 className="sm-title">App Settings</h2>
              <p className="sm-sub">Business Central API configuration</p>
            </div>
          </div>
          <button className="sm-close" onClick={onClose} title="Close (Esc)">✕</button>
        </div>

        {loading ? (
          <div className="sm-loading">
            <div className="spinner" />
            <p>Loading settings…</p>
          </div>
        ) : (
          /* ── Two-panel body ── */
          <div className="sm-body">

            {/* LEFT — editable fields */}
            <div className="sm-left">
              <div className="sm-left-top">
                <label className="sm-show-secret">
                  <input
                    type="checkbox"
                    checked={showSecrets}
                    onChange={(e) => setShowSecrets(e.target.checked)}
                  />
                  Show sensitive values
                </label>
              </div>

              {SECTIONS.map((sec) => (
                <div key={sec.title} className="sm-section">
                  <div className="sm-section-title">{sec.title}</div>
                  {sec.fields.map(({ key, label, hint, type }) => (
                    <div key={key} className="sm-field">
                      <label className="sm-field-label">{label}</label>
                      <input
                        className="sm-field-input"
                        type={type === 'password' && !showSecrets ? 'password' : 'text'}
                        value={form[key] || ''}
                        onChange={(e) => change(key, e.target.value)}
                        spellCheck={false}
                        autoComplete="off"
                      />
                      {hint && <span className="sm-field-hint">{hint}</span>}
                    </div>
                  ))}
                </div>
              ))}

              {error && <div className="sm-error">{error}</div>}
              {saved && <div className="sm-success">✓ Saved successfully!</div>}

              <div className="sm-footer-actions">
                <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                <button className="btn btn-primary" onClick={save} disabled={saving}>
                  {saving ? 'Saving…' : '💾 Save Settings'}
                </button>
              </div>
              <p className="sm-footer-note">Changes apply immediately — no server restart needed.</p>
            </div>

            {/* RIGHT — API URL preview (always fully visible) */}
            <div className="sm-right">
              <div className="sm-right-title">🔗 API Endpoints</div>
              <p className="sm-right-sub">Auto-built from the fields on the left. Updates live as you type.</p>

              <div className="sm-url-list">
                {/* 1. Order Status API */}
                <div className="sm-url-entry">
                  <div className="sm-url-entry-head" style={{ borderLeftColor: urls[0].color }}>
                    <div className="sm-url-entry-label-row">
                      <span className="sm-url-dot" style={{ background: urls[0].color }} />
                      <span className="sm-url-name">{urls[0].label}</span>
                      <span className="sm-url-badge" style={{ color: urls[0].color, borderColor: urls[0].color }}>
                        {urls[0].method}
                      </span>
                    </div>
                  </div>
                  <code className="sm-url-code" style={{ background: urls[0].bg }}>
                    {urls[0].url}
                  </code>
                </div>

                {/* 2. Order Tracker API */}
                <div className="sm-url-entry">
                  <div className="sm-url-entry-head" style={{ borderLeftColor: urls[1].color }}>
                    <div className="sm-url-entry-label-row">
                      <span className="sm-url-dot" style={{ background: urls[1].color }} />
                      <span className="sm-url-name">{urls[1].label}</span>
                      <span className="sm-url-badge" style={{ color: urls[1].color, borderColor: urls[1].color }}>
                        {urls[1].method}
                      </span>
                    </div>
                  </div>
                  <code className="sm-url-code" style={{ background: urls[1].bg }}>
                    {urls[1].url}
                  </code>
                </div>

                {/* 3. Token Endpoint */}
                <div className="sm-url-entry">
                  <div className="sm-url-entry-head" style={{ borderLeftColor: urls[2].color }}>
                    <div className="sm-url-entry-label-row">
                      <span className="sm-url-dot" style={{ background: urls[2].color }} />
                      <span className="sm-url-name">{urls[2].label}</span>
                      <span className="sm-url-badge" style={{ color: urls[2].color, borderColor: urls[2].color }}>
                        {urls[2].method}
                      </span>
                    </div>
                  </div>
                  <code className="sm-url-code" style={{ background: urls[2].bg }}>
                    {urls[2].url}
                  </code>
                </div>
              </div>

              <div className="sm-right-note">
                🔒 Client Secret is masked. Check "Show sensitive values" on the left to reveal it.
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
