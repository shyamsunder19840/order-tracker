/**
 * Tech Summary — mirrors the "Tech Summary" and "Tech Summary (Collab)" sheets.
 * Shows per-technology performance across all Financial Years.
 */
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Layout from '../components/Layout/Layout';
import GlobalFilters from '../components/GlobalFilters';
import KPICard from '../components/KPICard';
import GroupBarChart from '../components/charts/GroupBarChart';
import PieChartCard from '../components/charts/PieChartCard';
import SalesTrendChart from '../components/charts/SalesTrendChart';
import { fetchTechSummary ,  selectLastRefreshAt } from '../store/slices/salesSlice';
import { selectFilterParams } from '../store/slices/filterSlice';
import { formatCurrency, formatNumber, formatPct, COLORS } from '../utils/formatters';

const S = {
  card:   { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.08)', marginBottom: 20 },
  h2:     { fontWeight: 700, fontSize: 14, color: '#1e1b4b', marginBottom: 14 },
  th:     { padding: '8px 12px', background: '#f8fafc', borderBottom: '2px solid #e5e7eb', color: '#374151', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap', fontSize: 11 },
  thL:    { padding: '8px 12px', background: '#f8fafc', borderBottom: '2px solid #e5e7eb', color: '#374151', fontWeight: 700, textAlign: 'left', fontSize: 11 },
  td:     { padding: '8px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'right', fontSize: 12 },
  tdL:    { padding: '8px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'left', fontSize: 12, fontWeight: 600 },
};

function yoyChange(curr, prev) {
  if (!prev || !curr) return null;
  const pct = ((curr - prev) / Math.abs(prev)) * 100;
  return (
    <span style={{ color: pct >= 0 ? '#059669' : '#dc2626', fontSize: 10, marginLeft: 4 }}>
      {pct >= 0 ? '▲' : '▼'}{Math.abs(pct).toFixed(0)}%
    </span>
  );
}

export default function TechSummaryPage() {
  const dispatch = useDispatch();
  const params         = useSelector(selectFilterParams);
  const lastRefreshAt  = useSelector(selectLastRefreshAt);
  const data     = useSelector(s => s.sales.techSummary);
  const loading  = useSelector(s => s.sales.loading.techSummary);

  useEffect(() => { dispatch(fetchTechSummary(params)); }, [dispatch, JSON.stringify(params), lastRefreshAt]);

  const kpis         = data?.kpis;
  const fyList       = data?.fy_list || [];
  const techList     = data?.tech_summaries || [];
  const byTechnology = data?.by_technology || [];

  return (
    <Layout title="Tech Summary — Technology Performance">
      <GlobalFilters />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 14, marginBottom: 20 }}>
        <KPICard title="Total Sales" value={formatCurrency(kpis?.total_sales)}    icon="💰" color="#4f46e5" />
        <KPICard title="Total TGM"   value={formatCurrency(kpis?.total_tgm)}      icon="🎯" color="#06b6d4" sub={`TGM%: ${formatPct(kpis?.tgm_pct)}`} />
        <KPICard title="Customers"   value={formatNumber(kpis?.unique_customers)} icon="🏢" color="#10b981" />
        <KPICard title="Technologies" value={techList.length}                     icon="⚙️" color="#f59e0b" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <PieChartCard data={byTechnology} title="Sales by Technology" />
        <GroupBarChart data={byTechnology.slice(0, 10)} title="Technology — Sales vs TGM" />
      </div>

      <div style={{ marginBottom: 20 }}>
        <SalesTrendChart data={data?.monthly_trend || []} title="Monthly Trend (All Technologies)" />
      </div>

      {/* Multi-FY Technology Table */}
      {fyList.length > 0 && (
        <div style={S.card}>
          <div style={S.h2}>📋 Technology × Financial Year Performance</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={S.thL}>Technology</th>
                  {fyList.map(fy => (
                    <th key={fy} colSpan={3} style={{ ...S.th, textAlign: 'center', borderLeft: '2px solid #e5e7eb' }}>
                      {fy}
                    </th>
                  ))}
                </tr>
                <tr>
                  <th style={S.thL}></th>
                  {fyList.map(fy => (
                    <React.Fragment key={fy}>
                      <th style={{ ...S.th, borderLeft: '2px solid #f3f4f6' }}>Sales</th>
                      <th style={S.th}>TGM</th>
                      <th style={S.th}>TGM%</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {techList.map((tech, i) => (
                  <tr key={tech.technology} style={{ background: i % 2 ? '#f8fafc' : '#fff' }}>
                    <td style={S.tdL}>
                      <span style={{
                        display: 'inline-block', padding: '2px 10px', borderRadius: 20,
                        background: `${COLORS[i % COLORS.length]}22`,
                        color: COLORS[i % COLORS.length], fontWeight: 700, fontSize: 12,
                      }}>
                        {tech.technology}
                      </span>
                    </td>
                    {fyList.map((fy, fi) => {
                      const d    = tech[fy] || {};
                      const prev = fi > 0 ? tech[fyList[fi - 1]] : null;
                      return (
                        <React.Fragment key={fy}>
                          <td style={{ ...S.td, borderLeft: '2px solid #f3f4f6' }}>
                            {formatCurrency(d.sales)}
                            {prev && yoyChange(d.sales, prev.sales)}
                          </td>
                          <td style={S.td}>{formatCurrency(d.tgm)}</td>
                          <td style={S.td}>{formatPct(d.tgm_pct)}</td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
}
