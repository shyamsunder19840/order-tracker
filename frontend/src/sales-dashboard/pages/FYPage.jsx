/**
 * FY View — mirrors the "FY 26-27" sheet.
 * Pivot: Region > Sales Team > Customer with Adjusted Sales & TGM.
 * Use the Financial Year filter to select the FY to display.
 */
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Layout from '../components/Layout/Layout';
import GlobalFilters from '../components/GlobalFilters';
import KPICard from '../components/KPICard';
import HBarChart from '../components/charts/HBarChart';
import PieChartCard from '../components/charts/PieChartCard';
import { fetchFYPage ,  selectLastRefreshAt } from '../store/slices/salesSlice';
import { selectFilterParams } from '../store/slices/filterSlice';
import { formatCurrency, formatNumber, formatPct } from '../utils/formatters';

const S = {
  card:   { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.08)', marginBottom: 20 },
  h2:     { fontWeight: 700, fontSize: 14, color: '#1e1b4b', marginBottom: 14 },
  table:  { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th:     { padding: '8px 12px', background: '#f8fafc', borderBottom: '2px solid #e5e7eb', color: '#374151', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap', fontSize: 11 },
  thL:    { padding: '8px 12px', background: '#f8fafc', borderBottom: '2px solid #e5e7eb', color: '#374151', fontWeight: 700, textAlign: 'left', fontSize: 11 },
  td:     { padding: '7px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'right', fontSize: 12 },
  tdL:    { padding: '7px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'left', fontSize: 12 },
  region: { fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#ede9fe', color: '#5b21b6' },
  team:   { fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#dbeafe', color: '#1d4ed8' },
};

export default function FYPage() {
  const dispatch = useDispatch();
  const params         = useSelector(selectFilterParams);
  const lastRefreshAt  = useSelector(selectLastRefreshAt);
  const data     = useSelector(s => s.sales.fyPage);
  const loading  = useSelector(s => s.sales.loading.fyPage);
  const selFY    = params.financial_year;

  useEffect(() => { dispatch(fetchFYPage(params)); }, [dispatch, JSON.stringify(params), lastRefreshAt]);

  const kpis      = data?.kpis;
  const pivotRows = data?.pivot_rows || [];
  const byRegion  = data?.by_region  || [];
  const byTeam    = data?.by_sales_team || [];
  const byCustomer= data?.by_customer   || [];

  return (
    <Layout title={`FY Analysis${selFY ? ` — ${selFY}` : ' — All Years'}`}>
      <div style={{ background: '#ede9fe', borderRadius: 8, padding: '8px 16px', marginBottom: 12, fontSize: 12, color: '#4c1d95' }}>
        Tip: Use the <strong>Financial Year</strong> filter above to scope to a specific year (e.g. F.Y.2026-27).
      </div>
      <GlobalFilters />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 14, marginBottom: 20 }}>
        <KPICard title="Adj. Sales"   value={formatCurrency(kpis?.total_sales_adjusted)} icon="⚖️" color="#4f46e5" />
        <KPICard title="Total Sales"  value={formatCurrency(kpis?.total_sales)}          icon="💰" color="#06b6d4" />
        <KPICard title="Adj. TGM"     value={formatCurrency(kpis?.total_tgm_adjusted)}   icon="🎯" color="#10b981" sub={`TGM%: ${formatPct(kpis?.tgm_adjusted_pct)}`} />
        <KPICard title="Customers"    value={formatNumber(kpis?.unique_customers)}       icon="🏢" color="#f59e0b" />
        <KPICard title="Big Deals"    value={formatNumber(kpis?.big_deal_count)}         icon="🌟" color="#8b5cf6" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <PieChartCard data={byRegion}   title="Adjusted Sales by Region"     />
        <HBarChart    data={byCustomer} title="Top Customers (Adjusted)" color="#4f46e5" limit={10} />
      </div>

      <div style={{ marginBottom: 20 }}>
        <HBarChart data={byTeam} title="Sales Team Performance (Adjusted)" color="#06b6d4" limit={15} />
      </div>

      {/* Pivot table: Region > Team > Customer */}
      <div style={S.card}>
        <div style={S.h2}>📋 Region → Sales Team → Customer Pivot ({pivotRows.length} rows)</div>
        <div style={{ overflowX: 'auto', maxHeight: 560, overflowY: 'auto' }}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.thL}>Region</th>
                <th style={S.thL}>Sales Team</th>
                <th style={S.thL}>Customer</th>
                <th style={S.th}>Adj. Sales (₹)</th>
                <th style={S.th}>Adj. TGM (₹)</th>
                <th style={S.th}>TGM %</th>
              </tr>
            </thead>
            <tbody>
              {pivotRows.map((row, i) => (
                <tr key={i} style={{ background: i % 2 ? '#f8fafc' : '#fff' }}>
                  <td style={S.tdL}><span style={S.region}>{row.region}</span></td>
                  <td style={S.tdL}><span style={S.team}>{row.sales_team}</span></td>
                  <td style={S.tdL}>{row.customer_name}</td>
                  <td style={S.td}>{formatCurrency(row.sales_adjusted)}</td>
                  <td style={S.td}>{formatCurrency(row.tgm_adjusted)}</td>
                  <td style={S.td}>{formatPct(row.tgm_pct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
