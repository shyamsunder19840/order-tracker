import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Layout from '../components/Layout/Layout';
import GlobalFilters from '../components/GlobalFilters';
import KPICard from '../components/KPICard';
import GroupBarChart from '../components/charts/GroupBarChart';
import PieChartCard from '../components/charts/PieChartCard';
import HBarChart from '../components/charts/HBarChart';
import { fetchKPIs, fetchBySegment, fetchCharts ,  selectLastRefreshAt } from '../store/slices/salesSlice';
import { selectFilterParams } from '../store/slices/filterSlice';
import { formatCurrency, formatNumber, formatPct } from '../utils/formatters';

export default function SegmentPage() {
  const dispatch  = useDispatch();
  const params         = useSelector(selectFilterParams);
  const lastRefreshAt  = useSelector(selectLastRefreshAt);
  const kpis      = useSelector(s => s.sales.kpis);
  const bySegment = useSelector(s => s.sales.bySegment);
  const charts    = useSelector(s => s.sales.charts);

  useEffect(() => {
    dispatch(fetchKPIs(params));
    dispatch(fetchBySegment(params));
    dispatch(fetchCharts(params));
  }, [dispatch, JSON.stringify(params), lastRefreshAt]);

  return (
    <Layout title="Segment-wise Sales Analysis">
      <GlobalFilters />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>
        <KPICard title="Total Sales"   value={formatCurrency(kpis?.total_sales)}    icon="💰" color="#4f46e5" />
        <KPICard title="TGM"           value={formatCurrency(kpis?.total_tgm)}      icon="🎯" color="#06b6d4" sub={`TGM%: ${formatPct(kpis?.tgm_pct)}`} />
        <KPICard title="Customers"     value={formatNumber(kpis?.unique_customers)} icon="🏢" color="#10b981" />
        <KPICard title="Segments"      value={bySegment?.length ?? '—'}             icon="🏷️" color="#f59e0b" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <PieChartCard data={bySegment || []} title="Sales Share by Segment" />
        <GroupBarChart data={bySegment || []} title="Segment — Sales, TGM, ETGM" />
      </div>

      {/* Technology breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <HBarChart data={charts?.by_technology  || []} title="By Technology"   color="#4f46e5" />
        <HBarChart data={charts?.by_product_type || []} title="By Product Type" color="#06b6d4" />
      </div>
    </Layout>
  );
}
