import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (soNo, { rejectWithValue }) => {
    try {
      const r = await axios.get(
        `/api/orders/?so_no=${encodeURIComponent(soNo)}`
      )
      return r.data
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.error || err.message || 'Failed to fetch orders.'
      )
    }
  }
)

const ordersSlice = createSlice({
  name: 'orders',
  initialState: {
    items: [], count: 0, loading: false, error: null, searched: false, query: '',
  },
  reducers: {
    setQuery(state, a)  { state.query = a.payload },
    clearResults(state) {
      state.items = []; state.count = 0; state.error = null
      state.searched = false; state.query = ''
    },
  },
  extraReducers: (b) => {
    b
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true; state.error = null; state.searched = false; state.items = []
      })
      .addCase(fetchOrders.fulfilled, (state, a) => {
        state.loading  = false
        state.items    = Array.isArray(a.payload.orders) ? a.payload.orders : []
        state.count    = a.payload.count ?? state.items.length
        state.searched = true
      })
      .addCase(fetchOrders.rejected, (state, a) => {
        state.loading  = false
        state.error    = String(a.payload ?? 'Unknown error')
        state.searched = true
      })
  },
})

export const { setQuery, clearResults } = ordersSlice.actions
export default ordersSlice.reducer
