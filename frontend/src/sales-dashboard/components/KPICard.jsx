import React from 'react';

// Light tint of any hex colour at ~10% opacity (for card background)
function tint(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},0.08)`;
}

export default function KPICard({ title, value, sub, icon, color = '#4f46e5', trend }) {
  const S = {
    card: {
      background: `linear-gradient(135deg, #ffffff 60%, ${tint(color)} 100%)`,
      borderRadius: 14,
      padding: '16px 20px',
      boxShadow: '0 1px 6px rgba(99,102,241,0.08), 0 4px 16px rgba(99,102,241,0.04)',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      minWidth: 160,
      border: '1px solid #ede9fe',
      borderLeft: `4px solid ${color}`,
      transition: 'box-shadow 0.15s',
    },
    top:   { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
    icon:  {
      fontSize: 20, lineHeight: 1,
      background: tint(color),
      borderRadius: 8,
      padding: '4px 6px',
    },
    title: {
      fontSize: 11, color: '#6b7280', fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: 0.7,
    },
    value: { fontSize: 22, fontWeight: 800, color: '#1e1b4b', lineHeight: 1.2 },
    sub:   { fontSize: 11, color: '#9ca3af', fontWeight: 500 },
    trend: (positive) => ({
      fontSize: 11, fontWeight: 700,
      color: positive ? '#059669' : '#dc2626',
      background: positive ? '#d1fae5' : '#fee2e2',
      padding: '1px 6px', borderRadius: 10,
    }),
  };

  return (
    <div style={S.card}>
      <div style={S.top}>
        <span style={S.title}>{title}</span>
        {icon && <span style={S.icon}>{icon}</span>}
      </div>
      <div style={S.value}>{value ?? '—'}</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {sub   && <span style={S.sub}>{sub}</span>}
        {trend !== undefined && (
          <span style={S.trend(trend >= 0)}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}
