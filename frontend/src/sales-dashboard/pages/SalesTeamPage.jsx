import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Layout from '../components/Layout/Layout';
import GlobalFilters from '../components/GlobalFilters';
import KPICard from '../components/KPICard';
import GroupBarChart from '../components/charts/GroupBarChart';
import HBarChart from '../components/charts/HBarChart';
import PieChartCard from '../components/charts/PieChartCard';
import { fetchKPIs, fetchBySalesTeam, fetchCharts ,  selectLastRefreshAt } from '../store/slices/salesSlice';
import { selectFilterParams } from '../store/slices/filterSlice';
import { formatCurrency, formatNumber, formatPct } from '../utils/formatters';

export default function SalesTeamPage() {
  const dispatch    = useDispatch();
  const params         = useSelector(selectFilterParams);
  const lastRefreshAt  = useSelector(selectLastRefreshAt);
  const kpis        = useSelector(s => s.sales.kpis);
  const bySalesTeam = useSelector(s => s.sales.bySalesTeam);
  const charts      = useSelector(s => s.sales.charts);

  useEffect(() => {
    dispatch(fetchKPIs(params));
    dispatch(fetchBySalesTeam(params));
    dispatch(fetchCharts(params));
  }, [dispatch, JSON.stringify(params), lastRefreshAt]);

  return (
    <Layout title="Sales Team Performance">
      <GlobalFilters />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>
        <KPICard title="Total Sales"   value={formatCurrency(kpis?.total_sales)}    icon="💰" color="#4f46e5" />
        <KPICard title="TGM"           value={formatCurrency(kpis?.total_tgm)}      icon="🎯" color="#06b6d4" sub={`TGM%: ${formatPct(kpis?.tgm_pct)}`} />
        <KPICard title="Large Deals"   value={formatNumber(kpis?.large_deal_count)} icon="🏆" color="#8b5cf6" />
        <KPICard title="Teams"         value={bySalesTeam?.length ?? '—'}           icon="👥" color="#10b981" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <PieChartCard data={bySalesTeam || []} title="Sales Share by Team" />
        <GroupBarChart data={bySalesTeam || []} title="Team — Sales, TGM, ETGM" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <HBarChart data={charts?.top_ams || []} title="Top AMs by Sales" color="#4f46e5" />
        <HBarChart data={bySalesTeam || []} title="Sales Teams Ranking" color="#06b6d4" />
      </div>
    </Layout>
  );
}
