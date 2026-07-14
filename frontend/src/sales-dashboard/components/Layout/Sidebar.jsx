import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';

const NAV = [
  { to: '/',              label: 'Dashboard',         icon: '📊' },
  { to: '/srm-data',      label: 'SRM Data',          icon: '🗃️' },

  { divider: true, label: 'Summary Sheets' },
  { to: '/sales-summary', label: 'Sales Summary',     icon: '📈' },
  { to: '/tech-summary',  label: 'Tech Summary',      icon: '⚙️' },
  { to: '/band-wise',     label: 'Band Wise Sales',   icon: '🏷️' },
  { to: '/fy-view',       label: 'FY View',           icon: '📅' },

  { divider: true, label: 'By Technology' },
  { to: '/cisco',         label: 'CISCO',             icon: '🔵' },
  { to: '/non-cisco',     label: 'NON-CISCO',         icon: '🟣' },
  { to: '/amc',           label: 'AMC',               icon: '🛡️' },
  { to: '/saas',          label: 'SaaS',              icon: '☁️' },
  { to: '/cable',         label: 'Cabling',           icon: '🔌' },

  { divider: true, label: 'By Dimension' },
  { to: '/region',        label: 'Region-wise',       icon: '🗺️' },
  { to: '/segment',       label: 'Segment-wise',      icon: '🏢' },
  { to: '/sales-team',    label: 'Sales Team',        icon: '👥' },

  { divider: true, label: 'Deal Analysis' },
  { to: '/big-deals',     label: 'Big Deals ≥10 Cr',  icon: '🌟' },
  { to: '/large-deals',   label: 'Large Deals ≥1 Cr', icon: '🏆' },

  { divider: true, label: 'Reference' },
  { to: '/master-data',   label: 'Master Data',       icon: '📋' },
];

const S = {
  sidebar: (open) => ({
    width:     open ? 235 : 0,
    minWidth:  open ? 235 : 0,
    overflow:  'hidden',
    background: '#ffffff',
    color:     '#374151',
    display:   'flex',
    flexDirection: 'column',
    transition: 'width 0.25s, min-width 0.25s',
    height:    '100%',
    flexShrink: 0,
    borderRight: '1px solid #e5e7eb',
    boxShadow: '2px 0 8px rgba(79,70,229,0.06)',
  }),

  logo: {
    padding: '14px 0 12px',
    borderBottom: '1px solid #ede9fe',
    background: 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    textAlign: 'center',
    gap: 4,
  },
  logoImg: { width: '75%', maxWidth: 155, display: 'block', marginLeft: 12 },
  logoTitle: { fontSize: 11, color: '#1e1b4b', fontWeight: 700, letterSpacing: 0.3, marginTop: 2 },
  logoSub: { fontSize: 10, color: '#8b5cf6', fontWeight: 600, letterSpacing: 0.5 },

  nav: { flex: 1, overflowY: 'auto', padding: '8px 0',
    scrollbarWidth: 'thin',
    scrollbarColor: '#e0e7ff transparent',
  },

  divider: {
    padding: '14px 16px 5px',
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 1.4,
    color: '#1e1b4b',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    background: 'linear-gradient(90deg, #ede9fe 0%, transparent 100%)',
    borderLeft: '3px solid #6366f1',
    marginTop: 4,
  },

  dividerLine: {
    margin: '0 16px 4px',
    height: 1,
    background: 'linear-gradient(90deg, #c7d2fe, transparent)',
  },

  link: (active) => ({
    display:       'flex',
    alignItems:    'center',
    gap:           9,
    padding:       '7px 14px 7px 12px',
    margin:        '1px 8px',
    borderRadius:  8,
    textDecoration: 'none',
    color:         active ? '#4f46e5' : '#4b5563',
    background:    active ? '#ede9fe' : 'transparent',
    borderLeft:    `3px solid ${active ? '#6366f1' : 'transparent'}`,
    fontSize:      13,
    fontWeight:    active ? 700 : 400,
    whiteSpace:    'nowrap',
    transition:    'all 0.13s',
    cursor:        'pointer',
  }),

  icon:   { fontSize: 14, width: 20, textAlign: 'center', flexShrink: 0 },

  footer: {
    padding: '10px 16px',
    borderTop: '1px solid #ede9fe',
    background: '#fafafa',
    fontSize: 10,
    color: '#9ca3af',
    whiteSpace: 'nowrap',
    fontWeight: 500,
  },
};

export default function Sidebar() {
  const open = useSelector(s => s.ui.sidebarOpen);

  return (
    <aside style={S.sidebar(open)}>
      <div style={S.logo}>
        <img src="/logo.png" alt="Proactive" style={S.logoImg} />
        <div style={S.logoTitle}>Customer Sales Summary</div>
        <div style={S.logoSub}>Business Central · Live Data</div>
      </div>

      <nav style={S.nav}>
        {NAV.map((item, i) =>
          item.divider ? (
            <React.Fragment key={i}>
              <div style={S.divider}>{item.label}</div>
              <div style={S.dividerLine} />
            </React.Fragment>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              style={({ isActive }) => S.link(isActive)}
            >
              <span style={S.icon}>{item.icon}</span>
              {item.label}
            </NavLink>
          )
        )}
      </nav>

      <div style={S.footer}>© Proactive · BC API v1.0</div>
    </aside>
  );
}
