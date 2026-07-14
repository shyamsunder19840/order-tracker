import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api';

const FIELD_GROUPS = [
  {
    title: 'Azure AD / OAuth',
    icon: '🔐',
    keys: ['BC_TENANT_ID', 'BC_CLIENT_ID', 'BC_CLIENT_SECRET'],
  },
  {
    title: 'Business Central',
    icon: '🏢',
    keys: ['BC_COMPANY_ID', 'BC_ENVIRONMENT'],
  },
  {
    title: 'User Credentials',
    icon: '👤',
    keys: ['BC_USERNAME', 'BC_PASSWORD'],
  },
  {
    title: 'Advanced',
    icon: '⚙️',
    keys: ['BC_STATIC_TOKEN'],
  },
];

export default function SettingsModal({ open, onClose }) {
  const [settings, setSettings]     = useState([]);
  const [apiUrl, setApiUrl]         = useState('');
  const [edited, setEdited]         = useState({});
  const [visible, setVisible]       = useState({});
  const [editedUrl, setEditedUrl]   = useState('');
  const [copied, setCopied]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [testing, setTesting]       = useState(false);
  const [status, setStatus]         = useState(null);
  const [testResult, setTestResult] = useState(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res  = await fetch(`${API_BASE}/settings/`);
      const data = await res.json();
      setSettings(data.settings || []);
      setApiUrl(data.api_url || '');
      setEdited({});
    } catch {
      setStatus({ type: 'error', msg: 'Failed to load settings from server.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchSettings();
      setTestResult(null);
      setCopied(false);
      setEditedUrl('');
    }
  }, [open, fetchSettings]);

  const handleChange = (key, val) => {
    setEdited(prev => ({ ...prev, [key]: val }));
    setStatus(null);
  };

  const toggleVisible = (key) =>
    setVisible(prev => ({ ...prev, [key]: !prev[key] }));

  const getValue = (key) =>
    edited[key] !== undefined
      ? edited[key]
      : (settings.find(s => s.key === key)?.value ?? '');

  // The displayed URL: user's direct edit takes priority, then env/company fields, then server value
  const displayUrl = editedUrl !== ''
    ? editedUrl
    : (() => {
        const env = edited['BC_ENVIRONMENT'] ?? settings.find(s => s.key === 'BC_ENVIRONMENT')?.value ?? '';
        const cid = edited['BC_COMPANY_ID']  ?? settings.find(s => s.key === 'BC_COMPANY_ID')?.value  ?? '';
        if (!env || !cid) return apiUrl;
        return `https://api.businesscentral.dynamics.com/v2.0/${env}/api/Proactive/ProactiveAPI/v1.0/companies(${cid})/CustomerSalesSummaryAPI`;
      })();

  const urlIsEdited = editedUrl !== '' && editedUrl !== apiUrl;

  const handleUrlChange = (val) => {
    setEditedUrl(val);
    setStatus(null);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(displayUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const hasChanges = Object.keys(edited).length > 0 || urlIsEdited;

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    setTestResult(null);
    // Merge URL edit into payload as BC_API_URL so backend can parse env + company
    const payload = urlIsEdited
      ? { ...edited, BC_API_URL: editedUrl }
      : edited;
    try {
      const res  = await fetch(`${API_BASE}/settings/`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ settings: payload }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ type: 'success', msg: data.message || 'Settings saved successfully.' });
        setEdited({});
        setEditedUrl('');
        await fetchSettings();
      } else {
        setStatus({ type: 'error', msg: data.error || 'Save failed.' });
      }
    } catch {
      setStatus({ type: 'error', msg: 'Network error. Is the Django server running?' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res  = await fetch(`${API_BASE}/auth-test/`);
      const data = await res.json();
      const ok   = res.ok && data.steps?.every(s => s.status === 'OK');
      setTestResult({ ok, steps: data.steps || [], env: data.env || {} });
    } catch {
      setTestResult({ ok: false, steps: [], error: 'Could not reach Django server.' });
    } finally {
      setTesting(false);
    }
  };

  if (!open) return null;

  const S = {
    overlay: {
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    },
    modal: {
      background: '#fff', borderRadius: 16, width: '100%', maxWidth: 700,
      maxHeight: '90vh', display: 'flex', flexDirection: 'column',
      boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden',
    },
    header: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '20px 28px 16px', borderBottom: '1px solid #f0f0f0',
      background: 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)',
    },
    headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
    headerIcon: { fontSize: 26 },
    headerTitle: { fontSize: 20, fontWeight: 700, color: '#fff', lineHeight: 1.2 },
    headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
    closeBtn: {
      background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer',
      borderRadius: 8, width: 36, height: 36, fontSize: 18, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    body: { flex: 1, overflowY: 'auto', padding: '24px 28px' },
    group: { marginBottom: 26 },
    groupHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 },
    groupIcon:  { fontSize: 16 },
    groupTitle: { fontSize: 13, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em' },
    groupLine:  { flex: 1, height: 1, background: '#e5e7eb' },
    fieldRow: { marginBottom: 14 },
    label: {
      display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280',
      marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em',
    },
    inputWrap: {
      display: 'flex', alignItems: 'center',
      border: '1.5px solid #e5e7eb', borderRadius: 8, overflow: 'hidden',
      background: '#fafafa',
    },
    inputWrapEdited: { borderColor: '#f59e0b', background: '#fffbeb' },
    inputWrapReadonly: {
      border: '1.5px solid #e5e7eb', borderRadius: 8, overflow: 'hidden',
      background: '#f0f4ff',
    },
    input: {
      flex: 1, border: 'none', outline: 'none', padding: '9px 12px',
      fontSize: 13, background: 'transparent', color: '#111827',
      fontFamily: 'monospace',
    },
    inputReadonly: {
      flex: 1, border: 'none', outline: 'none', padding: '10px 12px',
      fontSize: 12, background: 'transparent', color: '#3730a3',
      fontFamily: 'monospace', wordBreak: 'break-all', resize: 'none',
      lineHeight: 1.6, cursor: 'text',
    },
    eyeBtn: {
      border: 'none', background: 'none', cursor: 'pointer',
      padding: '0 10px', fontSize: 16, color: '#9ca3af',
      display: 'flex', alignItems: 'center',
    },
    copyBtn: (copied) => ({
      border: 'none', background: copied ? '#d1fae5' : '#e0e7ff', cursor: 'pointer',
      padding: '8px 14px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
      color: copied ? '#065f46' : '#4f46e5', transition: 'all 0.2s',
      borderLeft: '1px solid #e5e7eb',
    }),
    editedBadge: {
      fontSize: 10, fontWeight: 700, color: '#d97706',
      background: '#fef3c7', padding: '2px 6px', borderRadius: 10,
      marginLeft: 6, lineHeight: 1.4,
    },
    apiSection: {
      marginBottom: 26, borderRadius: 10, overflow: 'hidden',
      border: '1.5px solid #c7d2fe', background: '#f5f3ff',
    },
    apiSectionHeader: {
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 14px', background: '#ede9fe',
      borderBottom: '1px solid #c7d2fe',
    },
    apiSectionTitle: { fontSize: 13, fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.06em' },
    apiNote: { fontSize: 11, color: '#7c3aed', marginLeft: 'auto', fontStyle: 'italic' },
    apiUrlBox: {
      display: 'flex', alignItems: 'stretch',
    },
    apiUrlText: (edited) => ({
      flex: 1, padding: '11px 14px', fontSize: 12,
      color: edited ? '#92400e' : '#3730a3',
      fontFamily: 'monospace', lineHeight: 1.7, wordBreak: 'break-all',
      background: edited ? '#fffbeb' : 'transparent',
      border: 'none', outline: 'none',
      resize: 'none', cursor: 'text',
      transition: 'background 0.2s, color 0.2s',
    }),
    footer: {
      padding: '16px 28px', borderTop: '1px solid #f0f0f0',
      display: 'flex', alignItems: 'center', gap: 10,
    },
    statusBox: (type) => ({
      flex: 1, fontSize: 12, padding: '8px 12px', borderRadius: 8,
      background: type === 'success' ? '#d1fae5' : '#fee2e2',
      color:      type === 'success' ? '#065f46' : '#991b1b',
      fontWeight: 500,
    }),
    testBtn: {
      padding: '9px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
      fontWeight: 600, border: '1.5px solid #e5e7eb', background: '#f9fafb',
      color: '#374151', whiteSpace: 'nowrap',
    },
    saveBtn: (disabled) => ({
      padding: '9px 20px', borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: 13, fontWeight: 700, border: 'none',
      background: disabled ? '#c4b5fd' : '#4f46e5',
      color: '#fff', whiteSpace: 'nowrap', opacity: disabled ? 0.7 : 1,
    }),
    testBox: {
      marginTop: 20, borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb',
    },
    testHeader: (ok) => ({
      padding: '10px 14px', fontWeight: 700, fontSize: 13,
      background: ok ? '#d1fae5' : '#fee2e2',
      color:      ok ? '#065f46' : '#991b1b',
      display: 'flex', alignItems: 'center', gap: 8,
    }),
    testRow: {
      padding: '6px 14px', fontSize: 12, borderTop: '1px solid #f3f4f6',
      display: 'flex', gap: 12, color: '#374151',
    },
  };

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.modal}>

        {/* ── Header ── */}
        <div style={S.header}>
          <div style={S.headerLeft}>
            <span style={S.headerIcon}>⚙️</span>
            <div>
              <div style={S.headerTitle}>API Settings</div>
              <div style={S.headerSub}>Business Central connection configuration</div>
            </div>
          </div>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* ── Body ── */}
        <div style={S.body}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
              Loading settings…
            </div>
          ) : (
            <>
              {/* API Endpoint URL (editable) */}
              <div style={{
                ...S.apiSection,
                borderColor: urlIsEdited ? '#f59e0b' : '#c7d2fe',
              }}>
                <div style={{
                  ...S.apiSectionHeader,
                  background: urlIsEdited ? '#fef3c7' : '#ede9fe',
                  borderBottomColor: urlIsEdited ? '#f59e0b' : '#c7d2fe',
                }}>
                  <span style={{ fontSize: 16 }}>🌐</span>
                  <span style={{
                    ...S.apiSectionTitle,
                    color: urlIsEdited ? '#d97706' : '#4f46e5',
                  }}>
                    API Endpoint
                  </span>
                  {urlIsEdited
                    ? <span style={{ ...S.apiNote, color: '#d97706' }}>modified · will save on click</span>
                    : <span style={S.apiNote}>editable · changing env or company updates this</span>
                  }
                </div>
                <div style={S.apiUrlBox}>
                  <textarea
                    rows={3}
                    style={S.apiUrlText(urlIsEdited)}
                    value={displayUrl}
                    onChange={e => handleUrlChange(e.target.value)}
                    spellCheck={false}
                  />
                  <button
                    style={S.copyBtn(copied)}
                    onClick={handleCopy}
                    title="Copy URL to clipboard"
                  >
                    {copied ? '✓ Copied!' : '📋 Copy'}
                  </button>
                </div>
              </div>

              {/* Editable credential fields */}
              {FIELD_GROUPS.map(group => {
                const groupSettings = group.keys
                  .map(k => settings.find(s => s.key === k))
                  .filter(Boolean);
                if (!groupSettings.length) return null;
                return (
                  <div key={group.title} style={S.group}>
                    <div style={S.groupHeader}>
                      <span style={S.groupIcon}>{group.icon}</span>
                      <span style={S.groupTitle}>{group.title}</span>
                      <div style={S.groupLine} />
                    </div>
                    {groupSettings.map(field => {
                      const isEdited  = edited[field.key] !== undefined;
                      const isSecret  = field.secret;
                      const isVisible = visible[field.key];
                      const val       = getValue(field.key);
                      return (
                        <div key={field.key} style={S.fieldRow}>
                          <label style={S.label}>
                            {field.label}
                            {isEdited && <span style={S.editedBadge}>modified</span>}
                          </label>
                          <div style={{ ...S.inputWrap, ...(isEdited ? S.inputWrapEdited : {}) }}>
                            <input
                              style={S.input}
                              type={isSecret && !isVisible ? 'password' : 'text'}
                              value={val}
                              placeholder={isSecret ? '••••••••' : `Enter ${field.label}`}
                              onChange={e => handleChange(field.key, e.target.value)}
                              spellCheck={false}
                              autoComplete="off"
                            />
                            {isSecret && (
                              <button
                                style={S.eyeBtn}
                                onClick={() => toggleVisible(field.key)}
                                title={isVisible ? 'Hide' : 'Show'}
                              >
                                {isVisible ? '🙈' : '👁'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* Test connection result */}
              {testResult && (
                <div style={S.testBox}>
                  <div style={S.testHeader(testResult.ok)}>
                    {testResult.ok ? '✅' : '❌'}
                    {testResult.ok ? ' Connection successful' : ' Connection failed'}
                  </div>
                  {testResult.error && (
                    <div style={S.testRow}><span>{testResult.error}</span></div>
                  )}
                  {testResult.steps.map((step, i) => (
                    <div key={i} style={S.testRow}>
                      <span style={{ color: step.status === 'OK' ? '#059669' : '#dc2626', fontWeight: 600, minWidth: 80 }}>
                        {step.status === 'OK' ? '✓' : '✗'} {step.step}
                      </span>
                      <span style={{ color: '#6b7280', wordBreak: 'break-all' }}>
                        {step.status === 'OK'
                          ? (step.token_prefix ? `Token: ${step.token_prefix}` : step.records != null ? `${step.records} record(s) accessible` : 'OK')
                          : step.error}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={S.footer}>
          {status ? (
            <div style={S.statusBox(status.type)}>{status.msg}</div>
          ) : (
            <div style={{ flex: 1 }} />
          )}
          <button style={S.testBtn} onClick={handleTestConnection} disabled={testing}>
            {testing ? '⟳ Testing…' : '🔌 Test Connection'}
          </button>
          <button
            style={S.saveBtn(!hasChanges || saving)}
            onClick={handleSave}
            disabled={!hasChanges || saving}
          >
            {saving ? 'Saving…' : '💾 Save Changes'}
          </button>
        </div>

      </div>
    </div>
  );
}
