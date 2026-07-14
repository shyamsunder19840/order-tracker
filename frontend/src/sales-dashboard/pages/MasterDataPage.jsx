import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Layout from '../components/Layout/Layout';
import { fetchMasterData ,  selectLastRefreshAt } from '../store/slices/salesSlice';

const S = {
  grid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 20 },
  section: { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.08)' },
  h2:      { fontSize: 14, fontWeight: 700, color: '#1e1b4b', marginBottom: 12 },
  table:   { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th:      { padding: '7px 10px', background: '#f8fafc', color: '#374151', fontWeight: 700, textAlign: 'left', borderBottom: '2px solid #e5e7eb', fontSize: 11 },
  td:      { padding: '7px 10px', borderBottom: '1px solid #f3f4f6', color: '#374151' },
  badge:   (color) => ({
    display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
    background: `${color}22`, color,
  }),
};

const BAND_COLORS = { 'A+':'#7c3aed','A1':'#1d4ed8','A2':'#0369a1','A3':'#0891b2','A4':'#059669','A5':'#d97706','B':'#9ca3af' };

const COMPUTED_COLS = [
  ['W', 'Col 23', 'Total_for_Year',       'Sum of Sales_Amount per customer per Financial_Year (running annual total)'],
  ['X', 'Col 24', 'Band',                 'Tier code (A+/A1/A2/A3/A4/A5/B) based on Total_for_Year thresholds'],
  ['Y', 'Col 25', 'Band_Revised',         'Human-readable band name (e.g. "Strategic", "Enterprise")'],
  ['Z', 'Col 26', 'Segment',              'Enterprise / Commercial / Unattached — derived from Sales_Teams mapping'],
  ['AA','Col 27', 'Sales_Teams_Modified', 'Cleaned/standardised sales team code'],
  ['AB','Col 28', 'Region',               'West-1 / West-2 / North / South / East — from branch_Name lookup'],
  ['AC','Col 29', 'Big_Deal',             'Y if Sales_Amount ≥ ₹10 Cr (100,000,000), else N'],
  ['AD','Col 30', 'Sales_Amount_Adjusted','Big deals: Value × (1 − 0.85) = 15% recognition; others: unchanged'],
  ['AE','Col 31', 'TGM_Adjusted',         'TGM on adjusted amount, same scaling as Sales_Amount_Adjusted'],
  ['AF','Col 32', 'Large_Deal',           'Y if Sales_Amount ≥ ₹1 Cr (10,000,000), else N'],
  ['AG','Col 33', 'Sales_Amount_Credit',  'max(Sales_Amount, 0) — positive sales for credit tracking'],
  ['AH','Col 34', 'TGM_Credit',           'max(TGM, 0) — TGM on credit portion'],
  ['+', '—',      'Region_Macro',         'West / North / South / East — higher-level grouping of Region'],
  ['+', '—',      'Month',                'Order_Date → YYYY-MM (for time-series grouping)'],
  ['+', '—',      'Month_Name',           'Order_Date → "Apr 2024" (display label)'],
  ['+', '—',      'FY_Quarter',           'Financial_Year + " " + Quarter combined string'],
  ['+', '—',      'TGM_Pct',             'TGM / Sales_Amount × 100'],
  ['+', '—',      'ETGM_Pct',            'ETGM / Sales_Amount × 100'],
];

export default function MasterDataPage() {
  const dispatch   = useDispatch();
  const masterData = useSelector(s => s.sales.masterData);

  useEffect(() => { dispatch(fetchMasterData()); }, [dispatch]);

  const branchRegion = masterData?.branch_region    || {};
  const teamSegment  = masterData?.sales_team_segment || {};
  const bands        = masterData?.band_thresholds  || [];
  const bandNames    = masterData?.band_names        || {};
  const regionMacro  = masterData?.region_macro      || {};

  return (
    <Layout title="Master Data — Reference Tables (Read-only)">
      <div style={{ marginBottom: 12, color: '#6b7280', fontSize: 13 }}>
        Static reference data used for computed columns. These tables are embedded in the application and are not editable.
      </div>

      <div style={S.grid}>
        {/* Band Thresholds — "Band Names" sheet equivalent */}
        <div style={S.section}>
          <div style={S.h2}>🏷️ Band Classification (Total for Year)</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Band</th><th style={S.th}>Name</th><th style={S.th}>Min Annual Sales (₹)</th></tr></thead>
            <tbody>
              {bands.map((b) => (
                <tr key={b.code}>
                  <td style={S.td}><span style={S.badge(BAND_COLORS[b.code] || '#9ca3af')}>{b.code}</span></td>
                  <td style={S.td}>{b.name}</td>
                  <td style={{ ...S.td, textAlign: 'right', fontFamily: 'monospace' }}>
                    {b.threshold.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Branch → Region — "Drop Downs" sheet equivalent */}
        <div style={S.section}>
          <div style={S.h2}>🗺️ Branch → Region Mapping</div>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            <table style={S.table}>
              <thead><tr><th style={S.th}>Branch</th><th style={S.th}>Region</th><th style={S.th}>Macro Region</th></tr></thead>
              <tbody>
                {Object.entries(branchRegion).map(([branch, region]) => (
                  <tr key={branch}>
                    <td style={S.td}>{branch}</td>
                    <td style={S.td}><span style={S.badge('#4f46e5')}>{region}</span></td>
                    <td style={S.td}><span style={S.badge('#06b6d4')}>{regionMacro[region] || '—'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sales Team → Segment — "Drop Downs" sheet equivalent */}
        <div style={S.section}>
          <div style={S.h2}>🏢 Sales Team → Segment Mapping</div>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            <table style={S.table}>
              <thead><tr><th style={S.th}>Sales Team</th><th style={S.th}>Segment</th></tr></thead>
              <tbody>
                {Object.entries(teamSegment).map(([team, seg]) => (
                  <tr key={team}>
                    <td style={S.td}>{team}</td>
                    <td style={S.td}>
                      <span style={S.badge(seg === 'Enterprise' ? '#4f46e5' : seg === 'Commercial' ? '#06b6d4' : '#9ca3af')}>
                        {seg}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Computed columns logic — full W–AH reference */}
      <div style={S.section}>
        <div style={S.h2}>📐 Computed Columns W–AH Logic (exact Excel formula recreation)</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={{ ...S.th, width: 40 }}>Excel Col</th>
                <th style={{ ...S.th, width: 60 }}>Col #</th>
                <th style={{ ...S.th, width: 200 }}>Field Name</th>
                <th style={S.th}>Logic / Source</th>
              </tr>
            </thead>
            <tbody>
              {COMPUTED_COLS.map(([col, num, field, logic], i) => (
                <tr key={field} style={{ background: i % 2 ? '#f8fafc' : '#fff' }}>
                  <td style={{ ...S.td, fontWeight: 800, color: '#4f46e5', textAlign: 'center' }}>{col}</td>
                  <td style={{ ...S.td, color: '#9ca3af', fontSize: 11 }}>{num}</td>
                  <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 11, fontWeight: 600 }}>{field}</td>
                  <td style={{ ...S.td, color: '#374151' }}>{logic}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
