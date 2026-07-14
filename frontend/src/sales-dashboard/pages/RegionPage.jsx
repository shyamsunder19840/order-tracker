import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Layout from '../components/Layout/Layout';
import GlobalFilters from '../components/GlobalFilters';
import KPICard from '../components/KPICard';
import GroupBarChart from '../components/charts/GroupBarChart';
import HBarChart from '../components/charts/HBarChart';
import PieChartCard from '../components/charts/PieChartCard';
import { fetchKPIs, fetchByRegion, fetchCharts ,  selectLastRefreshAt } from '../store/slices/salesSlice';
import { selectFilterParams } from '../store/slices/filterSlice';
import { formatCurrency, formatNumber, formatPct } from '../utils/formatters';

const REGION_COLORS = {
  North: '#4f46e5', South: '#10b981', West: '#f59e0b', East: '#ef4444', Other: '#9ca3af',
};

export default function RegionPage() {
  const dispatch = useDispatch();
  const params         = useSelector(selectFilterParams);
  const lastRefreshAt  = useSelector(selectLastRefreshAt);
  const kpis     = useSelector(s => s.sales.kpis);
  const byRegion = useSelector(s => s.sales.byRegion);
  const charts   = useSelector(s => s.sales.charts);

  useEffect(() => {
    dispatch(fetchKPIs(params));
    dispatch(fetchByRegion(params));
    dispatch(fetchCharts(params));
  }, [dispatch, JSON.stringify(params), lastRefreshAt]);

  return (
    <Layout title="Region-wise Sales Analysis">
      <GlobalFilters />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>
        <KPICard title="Total Sales"  value={formatCurrency(kpis?.total_sales)}  icon="💰" color="#4f46e5" />
        <KPICard title="TGM"          value={formatCurrency(kpis?.total_tgm)}    icon="🎯" color="#06b6d4" sub={`TGM%: ${formatPct(kpis?.tgm_pct)}`} />
        <KPICard title="Customers"    value={formatNumber(kpis?.unique_customers)} icon="🏢" color="#10b981" />
        <KPICard title="Regions"      value={byRegion?.length ?? '—'}            icon="🗺️" color="#f59e0b" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <PieChartCard data={byRegion || []} title="Sales Share by Region" />
        <GroupBarChart data={byRegion || []} title="Region — Sales, TGM, ETGM" />
      </div>

      <div style={{ marginBottom: 20 }}>
        <HBarChart data={byRegion || []} title="Region Breakdown" color="#4f46e5" />
      </div>

      {/* Branch breakdown (proxy for sub-region) */}
      <div style={{ marginBottom: 20 }}>
        <HBarChart data={charts?.by_branch || []} title="Branch-wise Sales" color="#06b6d4" />
      </div>
    </Layout>
  );
}
