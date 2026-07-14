/**
 * Generic page template for technology-specific views:
 * CISCO / NON-CISCO / AMC / SAAS / CABLE
 */
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Layout from '../components/Layout/Layout';
import GlobalFilters from '../components/GlobalFilters';
import KPICard from '../components/KPICard';
import SalesTrendChart from '../components/charts/SalesTrendChart';
import PieChartCard from '../components/charts/PieChartCard';
import HBarChart from '../components/charts/HBarChart';
import DataTable from '../components/DataTable';
import { selectFilterParams } from '../store/slices/filterSlice';
import { formatCurrency, formatNumber, formatPct } from '../utils/formatters';
import { fetchAllPages } from '../services/api';
import { selectLastRefreshAt } from '../store/slices/salesSlice';

export default function TechPage({ title, color, fetchAction, selectData, storeKey, apiCall }) {
  const dispatch = useDispatch();
  const params         = useSelector(selectFilterParams);
  const lastRefreshAt  = useSelector(selectLastRefreshAt);
  const data     = useSelector(selectData);
  const loading  = useSelector(s => s.sales.loading[storeKey]);

  // Local (not the global filter-slice) page cursor — each tech page pages
  // through its own result set independently of SRM Data's pager, and each
  // one gets its own fresh instance since switching tabs remounts this
  // component (different route -> different <TechPage> instance).
  const [page, setPage] = useState(1);
  const prevParamsKeyRef = useRef(null);

  // per_page of 200 keeps each page's DOM small enough to stay responsive
  // (see SRMData.jsx — a flat table with 10k+ rows froze the tab); Prev/Next
  // below reaches the rest. When filters change mid-page, reset to page 1
  // and skip this pass's dispatch (it'd fetch the new filters at the old,
  // likely out-of-range page) — the resulting state update re-runs the
  // effect once more with page already back at 1.
  useEffect(() => {
    const paramsKey       = JSON.stringify(params);
    const filtersChanged  = prevParamsKeyRef.current !== null && prevParamsKeyRef.current !== paramsKey;
    prevParamsKeyRef.current = paramsKey;

    if (filtersChanged && page !== 1) {
      setPage(1);
      return;
    }
    dispatch(fetchAction({ ...params, page, per_page: 200 }));
  }, [dispatch, JSON.stringify(params), page, lastRefreshAt]);

  const kpis    = data?.kpis;
  const records = data?.records?.results || [];
  const total   = data?.records?.total;
  const perPage = data?.records?.per_page;
  const curPage = data?.records?.page;

  // Fetched on demand for CSV export only, in chunks (not one per_page=huge
  // request) — a single very large JSON response caused "AxiosError: Network
  // Error" over the dev proxy (see SRMData.jsx).
  const handleExportAll = () => fetchAllPages(apiCall, params, (d) => d.records);

  return (
    <Layout title={title}>
      <GlobalFilters />

      {loading && <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Loading…</div>}

      {!loading && (
        <>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>
            <KPICard title="Total Sales"   value={formatCurrency(kpis?.total_sales)}     icon="💰" color={color} />
            <KPICard title="TGM"           value={formatCurrency(kpis?.total_tgm)}       icon="🎯" color={color} sub={`TGM%: ${formatPct(kpis?.tgm_pct)}`} />
            <KPICard title="ETGM"          value={formatCurrency(kpis?.total_etgm)}      icon="⚡" color={color} sub={`ETGM%: ${formatPct(kpis?.etgm_pct)}`} />
            <KPICard title="Credit Amt"    value={formatCurrency(kpis?.credit_amount)}   icon="↩️" color="#ef4444" />
            <KPICard title="Large Deals"   value={formatNumber(kpis?.large_deal_count)}  icon="🏆" color="#8b5cf6" sub="≥ 1 Cr" />
            <KPICard title="Customers"     value={formatNumber(kpis?.unique_customers)}  icon="🏢" color="#14b8a6" />
            <KPICard title="Orders"        value={formatNumber(kpis?.unique_orders)}     icon="📋" color="#f97316" />
          </div>

          {/* Charts */}
          <div style={{ marginBottom: 20 }}>
            <SalesTrendChart data={data?.monthly_trend || []} title={`${title} — Monthly Trend`} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <PieChartCard data={data?.by_region   || []} title="By Region"   />
            <HBarChart    data={data?.by_customer  || []} title="Top Customers" limit={10} color={color} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <HBarChart data={data?.by_am || []} title="Top AMs" limit={10} color={color} />
          </div>

          {/* Drill-down table */}
          <DataTable
            records={records}
            total={total}
            page={curPage}
            perPage={perPage}
            onPageChange={setPage}
            title={`${title} Transactions`}
            onExportAll={handleExportAll}
          />
        </>
      )}
    </Layout>
  );
}
