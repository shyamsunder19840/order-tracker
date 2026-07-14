import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { refreshData, clearRefreshMsg } from '../../store/slices/salesSlice';
import SettingsModal from '../SettingsModal';

export default function Header({ title }) {
  const dispatch   = useDispatch();
  const refreshMsg = useSelector(s => s.sales.refreshMsg);
  const loading    = useSelector(s => s.sales.loading);
  const isRefreshing = loading.refreshData;
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleRefresh = async () => {
    await dispatch(refreshData());
    setTimeout(() => dispatch(clearRefreshMsg()), 3000);
  };

  const S = {
    header: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', height: 60,
      background: 'linear-gradient(90deg, #ffffff 0%, #faf5ff 100%)',
      borderBottom: '1px solid #ede9fe',
      boxShadow: '0 1px 8px rgba(99,102,241,0.08)',
      position: 'sticky', top: 0, zIndex: 100, gap: 12,
    },
    left:    { display: 'flex', alignItems: 'center', gap: 14 },
    menuBtn: {
      border: 'none', background: 'none', cursor: 'pointer',
      fontSize: 20, padding: '4px 8px', borderRadius: 6,
      color: '#6b7280', lineHeight: 1,
    },
    title:   { fontSize: 18, fontWeight: 700, color: '#1e1b4b' },
    right:   { display: 'flex', alignItems: 'center', gap: 10 },
    msg:     {
      fontSize: 12, color: '#059669', background: '#d1fae5',
      padding: '4px 10px', borderRadius: 20,
    },
    btn: (variant) => ({
      padding: '7px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
      fontWeight: 600, border: 'none', transition: 'all 0.15s',
      background: variant === 'primary' ? '#4f46e5' : '#f3f4f6',
      color:      variant === 'primary' ? '#fff'    : '#374151',
    }),
    settingsBtn: {
      border: '1.5px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer',
      borderRadius: 8, width: 36, height: 36, fontSize: 17,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#6b7280', transition: 'all 0.15s', flexShrink: 0,
    },
  };

  return (
    <>
      <header style={S.header}>
        <div style={S.left}>
          <button style={S.menuBtn} onClick={() => dispatch(toggleSidebar())} title="Toggle sidebar">☰</button>
          <span style={S.title}>{title}</span>
        </div>
        <div style={S.right}>
          {refreshMsg && <span style={S.msg}>{refreshMsg}</span>}
          <button style={S.btn('primary')} onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? '⟳ Refreshing…' : '↻ Refresh Data'}
          </button>
          <button
            style={S.settingsBtn}
            onClick={() => setSettingsOpen(true)}
            title="API Settings"
          >
            ⚙️
          </button>
        </div>
      </header>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
