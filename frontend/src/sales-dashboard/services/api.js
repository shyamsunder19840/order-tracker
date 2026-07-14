import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export const salesAPI = {
  // Core
  getAll:         (params) => api.get('/sales/',                { params }),
  getKPIs:        (params) => api.get('/sales/kpis/',           { params }),
  getCharts:      (params) => api.get('/sales/charts/',         { params }),
  getFiltersMeta: ()       => api.get('/sales/filters/meta/'),

  // Group-by
  getByTechnology:  (params) => api.get('/sales/by-technology/',   { params }),
  getByProductType: (params) => api.get('/sales/by-product-type/', { params }),
  getByRegion:      (params) => api.get('/sales/by-region/',       { params }),
  getBySegment:     (params) => api.get('/sales/by-segment/',      { params }),
  getBySalesTeam:   (params) => api.get('/sales/by-salesteam/',    { params }),
  getByCustomer:    (params) => api.get('/sales/by-customer/',     { params }),
  getByAM:          (params) => api.get('/sales/by-am/',           { params }),
  getByMonth:       (params) => api.get('/sales/by-month/',        { params }),
  getByDealBand:    (params) => api.get('/sales/by-dealband/',     { params }),
  getByFY:          (params) => api.get('/sales/by-fy/',           { params }),

  // Technology pages
  getCisco:         (params) => api.get('/sales/cisco/',            { params }),
  getNonCisco:      (params) => api.get('/sales/non-cisco/',        { params }),
  getAMC:           (params) => api.get('/sales/amc/',              { params }),
  getSAAS:          (params) => api.get('/sales/saas/',             { params }),
  getCable:         (params) => api.get('/sales/cable/',            { params }),

  // Sheet-equivalent pages
  getBandWise:      (params) => api.get('/sales/band-wise/',        { params }),
  getSalesSummary:  (params) => api.get('/sales/sales-summary/',    { params }),
  getTechSummary:   (params) => api.get('/sales/tech-summary/',     { params }),
  getBigDeals:      (params) => api.get('/sales/big-deals/',        { params }),
  getLargeDeals:    (params) => api.get('/sales/large-deals/',      { params }),
  getFYPage:        (params) => api.get('/sales/fy/',               { params }),

  // Reference + control
  getMasterData:    ()       => api.get('/master-data/'),
  refresh:          ()       => api.post('/refresh/'),
};

// Fetches every page of a paginated endpoint and concatenates the row lists.
// A single request with a huge per_page (e.g. the full ~90k-record dataset)
// produces a ~90MB JSON response that's prone to proxy/network failures
// ("AxiosError: Network Error") and heavy browser memory pressure — chunking
// into moderate-size pages keeps each request small and reliable.
export async function fetchAllPages(apiCall, params, getPage = (data) => data, chunkSize = 2000) {
  let page = 1;
  let all  = [];
  while (true) {
    const res    = await apiCall({ ...params, page, per_page: chunkSize });
    const { results, pages } = getPage(res.data);
    all = all.concat(results);
    if (!pages || page >= pages || results.length === 0) break;
    page += 1;
  }
  return all;
}

export default api;
