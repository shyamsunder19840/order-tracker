import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

export const fetchTrackerOrders = createAsyncThunk(
  'tracker/fetchOrders',
  async (_, { rejectWithValue }) => {
    try {
      const r = await axios.get('/api/tracker/')
      return r.data
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.error || err.message || 'Failed to fetch tracker data.'
      )
    }
  }
)

const EMPTY_FILTERS = {
  amId:            '',
  financialYear:   '',
  quarter:         '',
  region:          '',
  department:      '',
  technology:      '',
  customerOrderNo: '',
}

const trackerSlice = createSlice({
  name: 'tracker',
  initialState: {
    items:       [],
    count:       0,
    loading:     false,
    error:       null,
    filters:     { ...EMPTY_FILTERS },
    selectedRow: null,   // the full row object the user clicked
  },
  reducers: {
    setFilter(state, { payload: { key, value } }) {
      state.filters[key] = value
    },
    clearFilters(state) {
      state.filters = { ...EMPTY_FILTERS }
    },
    setSelectedRow(state, { payload }) {
      state.selectedRow = payload
    },
  },
  extraReducers: (b) => {
    b
      .addCase(fetchTrackerOrders.pending,   (state) => {
        state.loading = true; state.error = null
      })
      .addCase(fetchTrackerOrders.fulfilled, (state, { payload }) => {
        state.loading = false
        state.error   = null
        state.items   = Array.isArray(payload.orders) ? payload.orders : []
        state.count   = payload.count ?? state.items.length
      })
      .addCase(fetchTrackerOrders.rejected,  (state, { payload }) => {
        state.loading = false
        state.error   = String(payload ?? 'Unknown error')
      })
  },
})

export const { setFilter, clearFilters, setSelectedRow } = trackerSlice.actions
export default trackerSlice.reducer
