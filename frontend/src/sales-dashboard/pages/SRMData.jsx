import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Layout from '../components/Layout/Layout';
import GlobalFilters from '../components/GlobalFilters';
import DataTable from '../components/DataTable';
import { fetchSalesList ,  selectLastRefreshAt } from '../store/slices/salesSlice';
import { selectFilterParams, setPage } from '../store/slices/filterSlice';
import { salesAPI, fetchAllPages } from '../services/api';

export default function SRMData() {
  const dispatch = useDispatch();
  const params         = useSelector(selectFilterParams);
  const lastRefreshAt  = useSelector(selectLastRefreshAt);
  const salesList = useSelector(s => s.sales.salesList);
  const loading   = useSelector(s => s.sales.loading.salesList);

  // Fetching everything in one page (per_page well beyond the dataset size)
  // was tried and reverted: rendering 10k+ plain <tr> rows with no
  // virtualization froze the tab. The table already has working Prev/Next
  // pagination below (page/perPage/onPageChange wired to the server
  // response), so a moderate page size keeps every record reachable
  // without hanging the browser.
  useEffect(() => {
    dispatch(fetchSalesList({ ...params, per_page: 200 }));
  }, [dispatch, JSON.stringify(params), lastRefreshAt]);

  const handlePageChange = (p) => {
    dispatch(setPage(p));
  };

  // Fetched on demand for CSV export only — never stored in Redux or
  // rendered into the table, so it doesn't hit the many-rows render-hang
  // that ruled out loading everything into the visible page at once.
  // Fetched in chunks (not one per_page=huge request) — a single ~90MB
  // response for the full unfiltered dataset caused "AxiosError: Network
  // Error" over the dev proxy.
  const handleExportAll = () => fetchAllPages(salesAPI.getAll, params);

  return (
    <Layout title="SRM Data — All Transactions">
      <GlobalFilters />
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 80, color: '#6366f1' }}>
          <div style={{ width: 56, height: 56, border: '5px solid #e0e7ff', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.9s linear infinite', marginBottom: 18 }} />
          <div style={{ fontSize: 17, fontWeight: 600 }}>Loading SRM Data…</div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 6 }}>Fetching 88K records from Business Central</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
      {!loading && (
        <DataTable
          records={salesList?.results || []}
          total={salesList?.total}
          page={salesList?.page}
          perPage={salesList?.per_page}
          onPageChange={handlePageChange}
          onExportAll={handleExportAll}
          title="SRM Data"
        />
      )}
    </Layout>
  );
}
