import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { salesAPI } from '../../services/api';

// ── Thunks ─────────────────────────────────────────────────────────────────────
//
// Every page dispatches its fetch on mount, including when just navigating
// back to a section already visited with the same filters — without a guard
// that's a full network round-trip + backend re-aggregation every single
// time. `condition` lets a thunk bail out before any request is made: if the
// stateKey's cached data was already fetched with this exact params and no
// "Refresh Data" has happened since, skip it entirely (no pending/fulfilled
// action, no spinner, no request) and the existing cached data just renders
// immediately. A real refetch still happens whenever params change or after
// a refresh, since `meta[stateKey]` is compared against both.
function cachedThunk(type, apiFn, stateKey) {
  return createAsyncThunk(
    type,
    (params) => apiFn(params).then(r => r.data),
    {
      condition: (params, { getState }) => {
        const state = getState().sales;
        const cached = state.meta[stateKey];
        if (!cached) return true;
        if (cached.paramsKey !== JSON.stringify(params ?? null)) return true;
        if (cached.refreshedAt !== state.lastRefreshAt) return true;
        return false;
      },
    }
  );
}

export const fetchKPIs         = cachedThunk('sales/fetchKPIs',         salesAPI.getKPIs,         'kpis');
export const fetchCharts       = cachedThunk('sales/fetchCharts',       salesAPI.getCharts,       'charts');
export const fetchSalesList    = cachedThunk('sales/fetchSalesList',    salesAPI.getAll,          'salesList');
export const fetchFiltersMeta  = cachedThunk('sales/fetchFiltersMeta',  salesAPI.getFiltersMeta,  'filtersMeta');
export const fetchCisco        = cachedThunk('sales/fetchCisco',        salesAPI.getCisco,        'cisco');
export const fetchNonCisco     = cachedThunk('sales/fetchNonCisco',     salesAPI.getNonCisco,     'nonCisco');
export const fetchAMC          = cachedThunk('sales/fetchAMC',          salesAPI.getAMC,          'amc');
export const fetchSAAS         = cachedThunk('sales/fetchSAAS',         salesAPI.getSAAS,         'saas');
export const fetchCable        = cachedThunk('sales/fetchCable',        salesAPI.getCable,        'cable');
export const fetchByRegion     = cachedThunk('sales/fetchByRegion',     salesAPI.getByRegion,     'byRegion');
export const fetchBySegment    = cachedThunk('sales/fetchBySegment',    salesAPI.getBySegment,    'bySegment');
export const fetchBySalesTeam  = cachedThunk('sales/fetchBySalesTeam',  salesAPI.getBySalesTeam,  'bySalesTeam');
export const fetchMasterData   = cachedThunk('sales/fetchMasterData',   salesAPI.getMasterData,   'masterData');
export const fetchBandWise     = cachedThunk('sales/fetchBandWise',     salesAPI.getBandWise,     'bandWise');
export const fetchSalesSummary = cachedThunk('sales/fetchSalesSummary', salesAPI.getSalesSummary, 'salesSummary');
export const fetchTechSummary  = cachedThunk('sales/fetchTechSummary',  salesAPI.getTechSummary,  'techSummary');
export const fetchBigDeals     = cachedThunk('sales/fetchBigDeals',     salesAPI.getBigDeals,     'bigDeals');
export const fetchLargeDeals   = cachedThunk('sales/fetchLargeDeals',   salesAPI.getLargeDeals,   'largeDeals');
export const fetchFYPage       = cachedThunk('sales/fetchFYPage',       salesAPI.getFYPage,       'fyPage');
export const refreshData       = createAsyncThunk('sales/refreshData',      ()  => salesAPI.refresh().then(r => r.data));

// ── Helper: build standard extra reducers for a single state key ──────────────

function addCases(builder, thunk, stateKey) {
  builder
    .addCase(thunk.pending,   (s) => { s.loading[stateKey] = true;  s.errors[stateKey] = null; })
    .addCase(thunk.fulfilled, (s, a) => {
      s.loading[stateKey] = false;
      s[stateKey] = a.payload;
      s.meta[stateKey] = { paramsKey: JSON.stringify(a.meta.arg ?? null), refreshedAt: s.lastRefreshAt };
    })
    .addCase(thunk.rejected,  (s, a) => {
      s.loading[stateKey] = false;
      // A condition-skipped dispatch also resolves as "rejected" with
      // aborted:true/condition — ignore that case, it isn't a real failure.
      if (a.meta.condition) return;
      s.errors[stateKey] = a.error.message;
    });
}

// ── Slice ──────────────────────────────────────────────────────────────────────

const salesSlice = createSlice({
  name: 'sales',
  initialState: {
    kpis:          null,
    charts:        null,
    salesList:     null,
    filtersMeta:   null,
    cisco:         null,
    nonCisco:      null,
    amc:           null,
    saas:          null,
    cable:         null,
    byRegion:      null,
    bySegment:     null,
    bySalesTeam:   null,
    masterData:    null,
    bandWise:      null,
    salesSummary:  null,
    techSummary:   null,
    bigDeals:      null,
    largeDeals:    null,
    fyPage:        null,
    loading:       {},
    errors:        {},
    meta:          {},
    refreshMsg:    null,
    lastRefreshAt: 0,
  },
  reducers: {
    clearRefreshMsg(state) { state.refreshMsg = null; },
  },
  extraReducers: (builder) => {
    addCases(builder, fetchKPIs,         'kpis');
    addCases(builder, fetchCharts,       'charts');
    addCases(builder, fetchSalesList,    'salesList');
    addCases(builder, fetchFiltersMeta,  'filtersMeta');
    addCases(builder, fetchCisco,        'cisco');
    addCases(builder, fetchNonCisco,     'nonCisco');
    addCases(builder, fetchAMC,          'amc');
    addCases(builder, fetchSAAS,         'saas');
    addCases(builder, fetchCable,        'cable');
    addCases(builder, fetchByRegion,     'byRegion');
    addCases(builder, fetchBySegment,    'bySegment');
    addCases(builder, fetchBySalesTeam,  'bySalesTeam');
    addCases(builder, fetchMasterData,   'masterData');
    addCases(builder, fetchBandWise,     'bandWise');
    addCases(builder, fetchSalesSummary, 'salesSummary');
    addCases(builder, fetchTechSummary,  'techSummary');
    addCases(builder, fetchBigDeals,     'bigDeals');
    addCases(builder, fetchLargeDeals,   'largeDeals');
    addCases(builder, fetchFYPage,       'fyPage');

    builder
      .addCase(refreshData.pending,   (s)     => { s.loading.refreshData = true; s.refreshMsg = null; })
      .addCase(refreshData.fulfilled, (s)     => { s.loading.refreshData = false; s.refreshMsg = 'Data refreshed!'; s.lastRefreshAt = Date.now(); })
      .addCase(refreshData.rejected,  (s, a)  => { s.loading.refreshData = false; s.refreshMsg = 'Refresh failed: ' + a.error.message; });
  },
});

export const { clearRefreshMsg } = salesSlice.actions;
export const selectLastRefreshAt = (s) => s.sales.lastRefreshAt;
export default salesSlice.reducer;
