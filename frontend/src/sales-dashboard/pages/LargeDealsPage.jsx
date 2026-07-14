import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Layout from '../components/Layout/Layout';
import GlobalFilters from '../components/GlobalFilters';
import KPICard from '../components/KPICard';
import HBarChart from '../components/charts/HBarChart';
import DataTable from '../components/DataTable';
import { fetchLargeDeals ,  selectLastRefreshAt } from '../store/slices/salesSlice';
import { selectFilterParams } from '../store/slices/filterSlice';
import { formatCurrency, formatNumber, formatPct } from '../utils/formatters';
import { salesAPI, fetchAllPages } from '../services/api';

export default function LargeDealsPage() {
  const dispatch = useDispatch();
  const params         = useSelector(selectFilterParams);
  const lastRefreshAt  = useSelector(selectLastRefreshAt);
  const data     = useSelector(s => s.sales.largeDeals);
  const loading  = useSelector(s => s.sales.loading.largeDeals);

  // DataTable is used here without onPageChange/page/perPage, so its pager
  // never renders. Large Deal counts run in the low hundreds, so 500
  // comfortably covers the full filtered set without risking the render-hang
  // a much larger flat table causes (see SRMData.jsx).
  useEffect(() => { dispatch(fetchLargeDeals({ ...params, per_page: 500 })); }, [dispatch, JSON.stringify(params), lastRefreshAt]);

  const kpis    = data?.kpis;
  const records = data?.records?.results || [];
  const total   = data?.records?.total;

  // Fetched on demand for CSV export only, in case the filtered set ever
  // exceeds the 500-row cap this page currently loads. Chunked (not one
  // per_page=huge request) to avoid the "Network Error" a single huge
  // JSON response can cause over the dev proxy.
  const handleExportAll = () => fetchAllPages(salesAPI.getLargeDeals, params, (data) => data.records);

  return (
    <Layout title="Large Deals — ≥ ₹1 Crore">
      <div style={{ background: '#dbeafe', borderRadius: 8, padding: '8px 16px', marginBottom: 12, fontSize: 13, color: '#1e40af', borderLeft: '4px solid #3b82f6' }}>
        <strong>Large Deal:</strong> Orders with Sales Amount ≥ ₹1 Crore (includes Big Deals ≥ ₹10 Cr).
      </div>
      <GlobalFilters />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 14, marginBottom: 20 }}>
        <KPICard title="Total Sales"   value={formatCurrency(kpis?.total_sales)}    icon="💰" color="#3b82f6" />
        <KPICard title="Total TGM"     value={formatCurrency(kpis?.total_tgm)}      icon="🎯" color="#10b981" sub={`TGM%: ${formatPct(kpis?.tgm_pct)}`} />
        <KPICard title="Large Deals"   value={formatNumber(kpis?.large_deal_count)} icon="🏆" color="#f59e0b" />
        <KPICard title="Big Deals"     value={formatNumber(kpis?.big_deal_count)}   icon="🌟" color="#ef4444" sub="of large" />
        <KPICard title="Customers"     value={formatNumber(kpis?.unique_customers)} icon="🏢" color="#8b5cf6" />
        <KPICard title="Records"       value={formatNumber(total)}                  icon="📋" color="#6b7280" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <HBarChart data={data?.by_customer || []} title="Top Customers (Large Deals)" color="#3b82f6" limit={10} />
        <HBarChart data={data?.by_region   || []} title="By Region"                   color="#8b5cf6" />
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Loading…</div>}
      {!loading && (
        <DataTable records={records} total={total} title="Large Deal Transactions" onExportAll={handleExportAll} />
      )}
    </Layout>
  );
}
