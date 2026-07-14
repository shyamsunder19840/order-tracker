import { createSlice } from '@reduxjs/toolkit';

function getCurrentFY() {
  const now   = new Date();
  const month = now.getMonth() + 1; // 1–12
  const year  = now.getFullYear();
  const start = month >= 4 ? year : year - 1;
  const end   = String(start + 1).slice(-2);
  return `F.Y.${start}-${end}`;
}

const DEFAULT_FY = getCurrentFY(); // e.g. "F.Y.2026-27"

const initialState = {
  financial_year: DEFAULT_FY,
  quarter:        '',
  region:         '',
  region_macro:   '',
  segment:        '',
  technology:     '',
  product_type:   '',
  sales_team:     '',
  am_name:        '',
  branch_name:    '',
  customer_name:  '',
  band:           '',
  order_type:     '',
  big_deal:       '',
  large_deal:     '',
  page:           1,
  per_page:       100,
};

const filterSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setFilter(state, action) {
      const { key, value } = action.payload;
      state[key] = value;
      state.page = 1;
    },
    resetFilters() {
      return { ...initialState };
    },
    setPage(state, action) {
      state.page = action.payload;
    },
  },
});

export const { setFilter, resetFilters, setPage } = filterSlice.actions;

export const selectFilterParams = (state) => {
  const f = state.filters;
  const params = {};
  Object.entries(f).forEach(([k, v]) => {
    if (v !== '' && v !== null && v !== undefined) params[k] = v;
  });
  return params;
};

export default filterSlice.reducer;
