import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Layout from '../components/Layout/Layout';
import GlobalFilters from '../components/GlobalFilters';
import KPICard from '../components/KPICard';
import SalesTrendChart from '../components/charts/SalesTrendChart';
import PieChartCard from '../components/charts/PieChartCard';
import HBarChart from '../components/charts/HBarChart';
import GroupBarChart from '../components/charts/GroupBarChart';
import { fetchKPIs, fetchCharts, fetchFiltersMeta ,  selectLastRefreshAt } from '../store/slices/salesSlice';
import { selectFilterParams } from '../store/slices/filterSlice';
import { formatCurrency, formatNumber, formatPct } from '../utils/formatters';

const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 };
const grid3 = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 };

const Spinner = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 80, color: '#6366f1' }}>
    <div style={{ width: 56, height: 56, border: '5px solid #e0e7ff', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.9s linear infinite', marginBottom: 18 }} />
    <div style={{ fontSize: 17, fontWeight: 600 }}>Loading data from Business Central…</div>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

export default function Dashboard() {
  const dispatch    = useDispatch();
  const params         = useSelector(selectFilterParams);
  const lastRefreshAt  = useSelector(selectLastRefreshAt);
  const kpis        = useSelector(s => s.sales.kpis);
  const charts      = useSelector(s => s.sales.charts);
  const loadingKPIs = useSelector(s => s.sales.loading.kpis);
  const loadingCharts = useSelector(s => s.sales.loading.charts);

  useEffect(() => { dispatch(fetchFiltersMeta()); }, [dispatch, lastRefreshAt]);
  useEffect(() => {
    dispatch(fetchKPIs(params));
    dispatch(fetchCharts(params));
  }, [dispatch, JSON.stringify(params), lastRefreshAt]);

  if (!kpis || !charts) return <Layout title="Dashboard — Customer Sales Summary"><Spinner /></Layout>;

  return (
    <Layout title="Dashboard — Customer Sales Summary">
      <GlobalFilters />

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>
        <KPICard title="Total Sales"      value={formatCurrency(kpis?.total_sales)}      icon="💰" color="#4f46e5" />
        <KPICard title="Total TGM"        value={formatCurrency(kpis?.total_tgm)}         icon="🎯" color="#10b981" sub={`TGM%: ${formatPct(kpis?.tgm_pct)}`} />
        <KPICard title="ETGM"             value={formatCurrency(kpis?.total_etgm)}        icon="⚡" color="#f59e0b" sub={`ETGM%: ${formatPct(kpis?.etgm_pct)}`} />
        <KPICard title="Large Deals"      value={formatNumber(kpis?.large_deal_count)}    icon="🏆" color="#8b5cf6" sub="≥ 1 Crore" />
        <KPICard title="Big Deals"        value={formatNumber(kpis?.big_deal_count)}      icon="🌟" color="#ec4899" sub="≥ 5 Crore" />
        <KPICard title="Unique Customers" value={formatNumber(kpis?.unique_customers)}    icon="🏢" color="#14b8a6" />
        <KPICard title="Total Orders"     value={formatNumber(kpis?.unique_orders)}       icon="📋" color="#f97316" />
        <KPICard title="Total Records"    value={formatNumber(kpis?.total_records)}       icon="🗃️" color="#6366f1" />
      </div>

      {/* Sales Trend */}
      <div style={{ marginBottom: 20 }}>
        <SalesTrendChart data={charts?.monthly_trend || []} title="Monthly Sales Trend" />
      </div>

      {/* Pie charts row */}
      <div style={grid3}>
        <PieChartCard data={charts?.by_technology   || []} title="Sales by Technology"    />
        <PieChartCard data={charts?.by_region        || []} title="Sales by Region"         />
        <PieChartCard data={charts?.by_product_type  || []} title="Sales by Product Type"   />
      </div>

      {/* Bar charts row */}
      <div style={grid2}>
        <HBarChart data={charts?.top_customers || []} title="Top 10 Customers by Sales" color="#4f46e5" />
        <HBarChart data={charts?.top_ams       || []} title="Top 10 AMs by Sales"        color="#06b6d4" />
      </div>

      {/* Group bars */}
      <div style={grid2}>
        <GroupBarChart data={charts?.by_quarter    || []} title="Quarterly Performance" />
        <GroupBarChart data={charts?.by_sales_team || []} title="Sales Team Performance" />
      </div>

    </Layout>
  );
}
