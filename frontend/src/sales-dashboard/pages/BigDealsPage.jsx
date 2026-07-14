/**
 * Big Deals — mirrors "Big Deals in FY 25-26" sheet.
 * Shows deals ≥ ₹10 Cr with adjusted and credit amounts.
 */
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Layout from '../components/Layout/Layout';
import GlobalFilters from '../components/GlobalFilters';
import KPICard from '../components/KPICard';
import HBarChart from '../components/charts/HBarChart';
import GroupBarChart from '../components/charts/GroupBarChart';
import { fetchBigDeals ,  selectLastRefreshAt } from '../store/slices/salesSlice';
import { selectFilterParams } from '../store/slices/filterSlice';
import { formatCurrency, formatDate, formatNumber, formatPct } from '../utils/formatters';

const S = {
  card:   { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.08)', marginBottom: 20 },
  h2:     { fontWeight: 700, fontSize: 14, color: '#1e1b4b', marginBottom: 14 },
  table:  { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th:     { padding: '9px 12px', background: '#1e1b4b', color: '#e0e7ff', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap', fontSize: 11 },
  thL:    { padding: '9px 12px', background: '#1e1b4b', color: '#e0e7ff', fontWeight: 700, textAlign: 'left', fontSize: 11 },
  td:     { padding: '8px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'right', fontSize: 12 },
  tdL:    { padding: '8px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'left', fontSize: 12 },
  bigBadge: { display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#fef3c7', color: '#92400e' },
};

export default function BigDealsPage() {
  const dispatch = useDispatch();
  const params         = useSelector(selectFilterParams);
  const lastRefreshAt  = useSelector(selectLastRefreshAt);
  const data     = useSelector(s => s.sales.bigDeals);
  const loading  = useSelector(s => s.sales.loading.bigDeals);

  // Table below has no pagination UI — it renders every row it's given.
  // Big Deal counts are small (double digits), so 500 comfortably covers
  // the full filtered set without risking the render-hang a much larger
  // flat table causes (see SRMData.jsx).
  useEffect(() => { dispatch(fetchBigDeals({ ...params, per_page: 500 })); }, [dispatch, JSON.stringify(params), lastRefreshAt]);

  const kpis       = data?.kpis;
  const records    = data?.records?.results || [];
  const total      = data?.records?.total;
  const byCustomer = data?.by_customer || [];
  const byRegion   = data?.by_region   || [];
  const byFY       = data?.by_fy       || [];
  const byTech     = data?.by_technology || [];

  return (
    <Layout title="Big Deals — ≥ ₹10 Crore">
      <GlobalFilters />

      <div style={{ background: '#fef3c7', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: '#92400e', borderLeft: '4px solid #f59e0b' }}>
        <strong>Big Deal Definition:</strong> Orders with Sales Amount ≥ ₹10 Crore. Adjusted values apply a 15% recognition factor (85% excluded per revenue recognition policy).
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 14, marginBottom: 20 }}>
        <KPICard title="Total Sales"     value={formatCurrency(kpis?.total_sales)}          icon="💰" color="#f59e0b" />
        <KPICard title="Adjusted Sales"  value={formatCurrency(kpis?.total_sales_adjusted)} icon="⚖️" color="#d97706" />
        <KPICard title="Total TGM"       value={formatCurrency(kpis?.total_tgm)}            icon="🎯" color="#10b981" sub={`TGM%: ${formatPct(kpis?.tgm_pct)}`} />
        <KPICard title="Big Deal Count"  value={formatNumber(kpis?.big_deal_count)}         icon="🌟" color="#ef4444" />
        <KPICard title="Customers"       value={formatNumber(kpis?.unique_customers)}       icon="🏢" color="#8b5cf6" />
        <KPICard title="Total Records"   value={formatNumber(total)}                        icon="📋" color="#6b7280" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <HBarChart data={byCustomer} title="Top Customers (Big Deals)" color="#f59e0b" limit={10} />
        <GroupBarChart data={byFY} title="Big Deals by Financial Year" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <HBarChart data={byRegion} title="By Region" color="#ef4444" />
        <HBarChart data={byTech}   title="By Technology" color="#8b5cf6" />
      </div>

      {/* Transaction table */}
      <div style={S.card}>
        <div style={S.h2}>🌟 Big Deal Transactions ({total ?? records.length})</div>
        <div style={{ overflowX: 'auto', maxHeight: 500, overflowY: 'auto' }}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.thL}>Date</th>
                <th style={S.thL}>SO No.</th>
                <th style={S.thL}>Customer</th>
                <th style={S.thL}>AM</th>
                <th style={S.thL}>Region</th>
                <th style={S.thL}>Technology</th>
                <th style={S.th}>Sales (₹)</th>
                <th style={S.th}>Adj. Sales (₹)</th>
                <th style={S.th}>TGM (₹)</th>
                <th style={S.th}>TGM%</th>
                <th style={S.thL}>FY</th>
                <th style={S.thL}>Qtr</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <tr key={r.SystemId || i} style={{ background: i % 2 ? '#fffbeb' : '#fff' }}>
                  <td style={S.tdL}>{formatDate(r.Order_Date)}</td>
                  <td style={S.tdL}>{r.SO_No_}</td>
                  <td style={S.tdL}>{r.Master_Customer_Name}</td>
                  <td style={S.tdL}>{r.AM_Name}</td>
                  <td style={S.tdL}>{r.Region}</td>
                  <td style={S.tdL}>{r.Technology}</td>
                  <td style={S.td}>{formatCurrency(r.Sales_Amount)}</td>
                  <td style={S.td}>{formatCurrency(r.Sales_Amount_Adjusted)}</td>
                  <td style={S.td}>{formatCurrency(r.TGM)}</td>
                  <td style={S.td}>{formatPct(r.TGM_Pct)}</td>
                  <td style={S.tdL}>{r.Financial_Year}</td>
                  <td style={S.tdL}>{r.Quarter}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
