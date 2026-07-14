/**
 * Band Wise Sales — mirrors the "Band Wise Sales" + "Revised Band Wise Sales" sheets.
 * Shows customer count, order count, sales, TGM, TGM%, average deal size per Band × FY.
 */
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Layout from '../components/Layout/Layout';
import GlobalFilters from '../components/GlobalFilters';
import KPICard from '../components/KPICard';
import GroupBarChart from '../components/charts/GroupBarChart';
import PieChartCard from '../components/charts/PieChartCard';
import { fetchBandWise ,  selectLastRefreshAt } from '../store/slices/salesSlice';
import { selectFilterParams } from '../store/slices/filterSlice';
import { formatCurrency, formatNumber, formatPct } from '../utils/formatters';

const S = {
  card:  { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.08)', marginBottom: 20 },
  h2:    { fontWeight: 700, fontSize: 14, color: '#1e1b4b', marginBottom: 14 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th:    { padding: '8px 10px', background: '#f8fafc', borderBottom: '2px solid #e5e7eb', color: '#374151', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap', fontSize: 11 },
  thL:   { padding: '8px 10px', background: '#f8fafc', borderBottom: '2px solid #e5e7eb', color: '#374151', fontWeight: 700, textAlign: 'left', fontSize: 11 },
  td:    { padding: '7px 10px', borderBottom: '1px solid #f3f4f6', textAlign: 'right', color: '#374151' },
  tdL:   { padding: '7px 10px', borderBottom: '1px solid #f3f4f6', textAlign: 'left', color: '#374151' },
  badge: (band) => {
    const colors = { 'A+':'#7c3aed','A1':'#1d4ed8','A2':'#0369a1','A3':'#0891b2','A4':'#059669','A5':'#d97706','B':'#9ca3af' };
    return { display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${colors[band] || '#9ca3af'}22`, color: colors[band] || '#9ca3af' };
  },
};

const BAND_ORDER = ['A+','A1','A2','A3','A4','A5','B'];

export default function BandWisePage() {
  const dispatch  = useDispatch();
  const params         = useSelector(selectFilterParams);
  const lastRefreshAt  = useSelector(selectLastRefreshAt);
  const data      = useSelector(s => s.sales.bandWise);
  const loading   = useSelector(s => s.sales.loading.bandWise);

  useEffect(() => { dispatch(fetchBandWise(params)); }, [dispatch, JSON.stringify(params), lastRefreshAt]);

  const kpis       = data?.kpis;
  const byBand     = data?.band_summary || [];
  const bandFyRows = data?.band_wise_fy || [];
  const fyList     = data?.fy_list || [];

  return (
    <Layout title="Band Wise Sales Analysis">
      <GlobalFilters />

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 14, marginBottom: 20 }}>
        <KPICard title="Total Sales"     value={formatCurrency(kpis?.total_sales)}          icon="💰" color="#4f46e5" />
        <KPICard title="Adjusted Sales"  value={formatCurrency(kpis?.total_sales_adjusted)} icon="⚖️" color="#06b6d4" />
        <KPICard title="Total TGM"       value={formatCurrency(kpis?.total_tgm)}            icon="🎯" color="#10b981" sub={`TGM%: ${formatPct(kpis?.tgm_pct)}`} />
        <KPICard title="Big Deals"       value={formatNumber(kpis?.big_deal_count)}         icon="🌟" color="#8b5cf6" sub="≥ ₹10 Cr" />
        <KPICard title="Large Deals"     value={formatNumber(kpis?.large_deal_count)}       icon="🏆" color="#f59e0b" sub="≥ ₹1 Cr" />
        <KPICard title="Customers"       value={formatNumber(kpis?.unique_customers)}       icon="🏢" color="#14b8a6" />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <PieChartCard data={byBand} title="Sales Share by Band" nameKey="band" valueKey="sales" />
        <GroupBarChart data={byBand.map(b => ({ name: b.band, sales: b.sales, tgm: b.tgm }))} title="Band — Sales vs TGM" />
      </div>

      {/* Band summary table */}
      <div style={S.card}>
        <div style={S.h2}>📊 Band Summary</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.thL}>Band</th>
                <th style={S.thL}>Name</th>
                <th style={S.th}>Customers</th>
                <th style={S.th}>Orders</th>
                <th style={S.th}>Sales (₹)</th>
                <th style={S.th}>TGM (₹)</th>
                <th style={S.th}>TGM %</th>
                <th style={S.th}>Avg Deal (₹)</th>
              </tr>
            </thead>
            <tbody>
              {byBand.map((b, i) => (
                <tr key={b.band} style={{ background: i % 2 ? '#fafafa' : '#fff' }}>
                  <td style={S.tdL}><span style={S.badge(b.band)}>{b.band}</span></td>
                  <td style={S.tdL}>{b.band_name}</td>
                  <td style={S.td}>{formatNumber(b.customer_count)}</td>
                  <td style={S.td}>{formatNumber(b.order_count)}</td>
                  <td style={S.td}>{formatCurrency(b.sales)}</td>
                  <td style={S.td}>{formatCurrency(b.tgm)}</td>
                  <td style={S.td}>{formatPct(b.tgm_pct)}</td>
                  <td style={S.td}>{formatCurrency(b.avg_deal_size)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Band × FY cross-table */}
      {fyList.length > 0 && (
        <div style={S.card}>
          <div style={S.h2}>📅 Band Wise — Year-over-Year ({fyList.join(' | ')})</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.thL}>Band</th>
                  {fyList.map(fy => (
                    <React.Fragment key={fy}>
                      <th style={S.th} colSpan={5} title={fy}>{fy}</th>
                    </React.Fragment>
                  ))}
                </tr>
                <tr>
                  <th style={S.thL}></th>
                  {fyList.map(fy => (
                    <React.Fragment key={fy}>
                      <th style={S.th}>Cust.</th>
                      <th style={S.th}>Orders</th>
                      <th style={S.th}>Sales</th>
                      <th style={S.th}>TGM</th>
                      <th style={S.th}>TGM%</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BAND_ORDER.map(band => {
                  const row = bandFyRows.find(r => r.band === band);
                  if (!row) return null;
                  return (
                    <tr key={band}>
                      <td style={S.tdL}><span style={S.badge(band)}>{band} — {row.band_name}</span></td>
                      {fyList.map(fy => (
                        <React.Fragment key={fy}>
                          <td style={S.td}>{formatNumber(row[`${fy}_customers`])}</td>
                          <td style={S.td}>{formatNumber(row[`${fy}_orders`])}</td>
                          <td style={S.td}>{formatCurrency(row[`${fy}_sales`])}</td>
                          <td style={S.td}>{formatCurrency(row[`${fy}_tgm`])}</td>
                          <td style={S.td}>{formatPct(row[`${fy}_tgm_pct`])}</td>
                        </React.Fragment>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
}
