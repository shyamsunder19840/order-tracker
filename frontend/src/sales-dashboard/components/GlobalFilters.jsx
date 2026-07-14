import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setFilter, resetFilters } from '../store/slices/filterSlice';

const FILTER_DEFS = [
  { key: 'financial_year', label: 'Financial Year', metaKey: 'financial_year' },
  { key: 'quarter',        label: 'Quarter',        metaKey: 'quarter' },
  { key: 'region',         label: 'Region',         metaKey: 'region' },
  { key: 'segment',        label: 'Segment',        metaKey: 'segment' },
  { key: 'technology',     label: 'Technology',     metaKey: 'technology' },
  { key: 'product_type',   label: 'Product Type',   metaKey: 'product_type' },
  { key: 'sales_team',     label: 'Sales Team',     metaKey: 'sales_team' },
  { key: 'am_name',        label: 'AM Name',        metaKey: 'am_name' },
  { key: 'branch_name',    label: 'Branch',         metaKey: 'branch_name' },
  { key: 'band',           label: 'Band',           metaKey: 'band' },
  { key: 'big_deal',       label: 'Big Deal',       metaKey: 'big_deal' },
  { key: 'order_type',     label: 'Order Type',     metaKey: 'order_type' },
];

const S = {
  wrap: {
    background: 'linear-gradient(135deg, #faf5ff 0%, #eef2ff 100%)',
    borderRadius: 14,
    padding: '14px 20px',
    boxShadow: '0 1px 8px rgba(99,102,241,0.08)',
    border: '1px solid #ede9fe',
    marginBottom: 20,
  },
  header:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title:   { fontSize: 13, fontWeight: 700, color: '#4f46e5', display: 'flex', alignItems: 'center', gap: 6 },
  row:     { display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' },
  group:   { display: 'flex', flexDirection: 'column', gap: 3, minWidth: 125 },
  label:   { fontSize: 10, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 0.7 },
  select:  {
    padding: '6px 10px', borderRadius: 8,
    border: '1px solid #c7d2fe', fontSize: 12,
    color: '#1e1b4b', background: '#fff',
    cursor: 'pointer', outline: 'none',
    boxShadow: '0 1px 3px rgba(99,102,241,0.06)',
  },
  resetBtn: {
    padding: '6px 14px', borderRadius: 8,
    border: '1px solid #fca5a5',
    background: '#fff0f0', cursor: 'pointer',
    fontSize: 12, color: '#dc2626', fontWeight: 700,
    alignSelf: 'flex-end',
  },
};

export default function GlobalFilters() {
  const dispatch    = useDispatch();
  const filters     = useSelector(s => s.filters);
  const filtersMeta = useSelector(s => s.sales.filtersMeta) || {};

  const activeCount = FILTER_DEFS.filter(d => filters[d.key]).length;

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <span style={S.title}>
          🔍 Global Filters
          {activeCount > 0 && (
            <span style={{ fontSize: 10, background: '#4f46e5', color: '#fff', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
              {activeCount} active
            </span>
          )}
        </span>
      </div>
      <div style={S.row}>
        {FILTER_DEFS.map(({ key, label, metaKey }) => {
          const options = filtersMeta[metaKey] || [];
          return (
            <div key={key} style={S.group}>
              <label style={S.label}>{label}</label>
              <select
                style={{ ...S.select, borderColor: filters[key] ? '#6366f1' : '#c7d2fe', background: filters[key] ? '#f5f3ff' : '#fff', fontWeight: filters[key] ? 600 : 400 }}
                value={filters[key] || ''}
                onChange={e => dispatch(setFilter({ key, value: e.target.value }))}
              >
                <option value="">All</option>
                {options.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          );
        })}
        <button style={S.resetBtn} onClick={() => dispatch(resetFilters())}>✕ Reset All</button>
      </div>
    </div>
  );
}
