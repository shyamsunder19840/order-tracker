/**
 * Sales Summary — mirrors the "Sales Summary" sheet.
 * Multi-FY comparison by Segment, Technology, and Region with YoY changes.
 */
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Layout from '../components/Layout/Layout';
import GlobalFilters from '../components/GlobalFilters';
import KPICard from '../components/KPICard';
import SalesTrendChart from '../components/charts/SalesTrendChart';
import GroupBarChart from '../components/charts/GroupBarChart';
import { fetchSalesSummary ,  selectLastRefreshAt } from '../store/slices/salesSlice';
import { selectFilterParams } from '../store/slices/filterSlice';
import { formatCurrency, formatNumber, formatPct } from '../utils/formatters';

const TABS = ['By Segment', 'By Technology', 'By Region'];

const S = {
  card:   { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.08)', marginBottom: 20 },
  h2:     { fontWeight: 700, fontSize: 14, color: '#1e1b4b', marginBottom: 14 },
  th:     { padding: '8px 10px', background: '#1e1b4b', color: '#e0e7ff', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap', fontSize: 11 },
  thL:    { padding: '8px 10px', background: '#1e1b4b', color: '#e0e7ff', fontWeight: 700, textAlign: 'left', fontSize: 11, position: 'sticky', left: 0 },
  td:     { padding: '7px 10px', borderBottom: '1px solid #f3f4f6', textAlign: 'right', fontSize: 12 },
  tdL:    { padding: '7px 10px', borderBottom: '1px solid #f3f4f6', textAlign: 'left', fontSize: 12, fontWeight: 600, position: 'sticky', left: 0, background: '#fff' },
  tabBar: { display: 'flex', gap: 0, marginBottom: 16, borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb' },
  tab:    (active) => ({
    flex: 1, padding: '9px 16px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
    background: active ? '#4f46e5' : '#f9fafb',
    color:      active ? '#fff'    : '#6b7280',
    transition: 'all 0.15s',
  }),
};

function yoyArrow(curr, prev) {
  if (!prev || !curr) return null;
  const pct = ((curr - prev) / Math.abs(prev)) * 100;
  const color = pct >= 0 ? '#059669' : '#dc2626';
  return <span style={{ color, fontSize: 11, fontWeight: 700 }}>{pct >= 0 ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}%</span>;
}

function MultiYearTable({ rows, fyList }) {
  if (!rows?.length || !fyList?.length) return <div style={{ color: '#9ca3af', padding: 20 }}>No data</div>;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr>
            <th style={S.thL}>Criteria</th>
            {fyList.map(fy => (
              <th key={fy} colSpan={4} style={{ ...S.th, textAlign: 'center', borderLeft: '2px solid #312e81' }}>{fy}</th>
            ))}
          </tr>
          <tr>
            <th style={{ ...S.thL, background: '#312e81' }}></th>
            {fyList.map(fy => (
              <React.Fragment key={fy}>
                <th style={{ ...S.th, background: '#312e81', borderLeft: '2px solid #1e1b4b' }}>Sales (₹)</th>
                <th style={{ ...S.th, background: '#312e81' }}>TGM (₹)</th>
                <th style={{ ...S.th, background: '#312e81' }}>TGM %</th>
                <th style={{ ...S.th, background: '#312e81' }}>Orders</th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.label} style={{ background: i % 2 ? '#f8fafc' : '#fff' }}>
              <td style={{ ...S.tdL, background: i % 2 ? '#f8fafc' : '#fff' }}>{row.label}</td>
              {fyList.map((fy, fi) => {
                const d    = row[fy] || {};
                const prev = fi > 0 ? row[fyList[fi - 1]] : null;
                return (
                  <React.Fragment key={fy}>
                    <td style={{ ...S.td, borderLeft: '2px solid #f3f4f6' }}>
                      {formatCurrency(d.sales)}
                      {prev && <div>{yoyArrow(d.sales, prev.sales)}</div>}
                    </td>
                    <td style={S.td}>{formatCurrency(d.tgm)}</td>
                    <td style={S.td}>{formatPct(d.tgm_pct)}</td>
                    <td style={S.td}>{formatNumber(d.orders)}</td>
                  </React.Fragment>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SalesSummaryPage() {
  const dispatch = useDispatch();
  const params         = useSelector(selectFilterParams);
  const lastRefreshAt  = useSelector(selectLastRefreshAt);
  const data     = useSelector(s => s.sales.salesSummary);
  const loading  = useSelector(s => s.sales.loading.salesSummary);
  const [tab, setTab] = useState(0);

  useEffect(() => { dispatch(fetchSalesSummary(params)); }, [dispatch, JSON.stringify(params), lastRefreshAt]);

  const kpis   = data?.kpis;
  const fyList = data?.fy_list || [];

  const tableData = [
    data?.by_segment    || [],
    data?.by_technology || [],
    data?.by_region     || [],
  ];

  return (
    <Layout title="Sales Summary — Multi-Year Comparison">
      <GlobalFilters />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 14, marginBottom: 20 }}>
        <KPICard title="Total Sales"    value={formatCurrency(kpis?.total_sales)}          icon="💰" color="#4f46e5" />
        <KPICard title="Adj. Sales"     value={formatCurrency(kpis?.total_sales_adjusted)} icon="⚖️" color="#06b6d4" />
        <KPICard title="Total TGM"      value={formatCurrency(kpis?.total_tgm)}            icon="🎯" color="#10b981" sub={`TGM%: ${formatPct(kpis?.tgm_pct)}`} />
        <KPICard title="Total ETGM"     value={formatCurrency(kpis?.total_etgm)}           icon="⚡" color="#f59e0b" sub={`ETGM%: ${formatPct(kpis?.etgm_pct)}`} />
        <KPICard title="Customers"      value={formatNumber(kpis?.unique_customers)}       icon="🏢" color="#8b5cf6" />
        <KPICard title="Big Deals"      value={formatNumber(kpis?.big_deal_count)}         icon="🌟" color="#ec4899" sub="≥ ₹10 Cr" />
      </div>

      <div style={{ marginBottom: 20 }}>
        <SalesTrendChart data={data?.monthly_trend || []} title="Monthly Sales Trend" />
      </div>

      <div style={S.card}>
        <div style={S.tabBar}>
          {TABS.map((t, i) => (
            <button key={t} style={S.tab(tab === i)} onClick={() => setTab(i)}>{t}</button>
          ))}
        </div>

        {loading && <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Loading…</div>}
        {!loading && (
          <MultiYearTable rows={tableData[tab]} fyList={fyList} />
        )}
      </div>
    </Layout>
  );
}
