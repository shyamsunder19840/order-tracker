import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

export const checkStatus = createAsyncThunk('auth/checkStatus', async () => {
  const r = await axios.get('/api/status/')
  return r.data.connected
})

export const connectBC = createAsyncThunk(
  'auth/connect',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      await axios.post('/api/connect/', { username, password })
      return true
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Connection failed')
    }
  }
)

export const disconnectBC = createAsyncThunk('auth/disconnect', async () => {
  await axios.post('/api/disconnect/')
})

const authSlice = createSlice({
  name: 'auth',
  initialState: { connected: false, checking: true, connecting: false, error: null },
  reducers: {
    clearAuthError(state) { state.error = null },
  },
  extraReducers: (b) => {
    b
      .addCase(checkStatus.fulfilled, (state, a) => { state.connected = a.payload; state.checking = false })
      .addCase(checkStatus.rejected,  (state)    => { state.connected = false;    state.checking = false })
      .addCase(connectBC.pending,     (state)    => { state.connecting = true;  state.error = null })
      .addCase(connectBC.fulfilled,   (state)    => { state.connecting = false; state.connected = true })
      .addCase(connectBC.rejected,    (state, a) => { state.connecting = false; state.error = a.payload })
      .addCase(disconnectBC.fulfilled, (state)   => { state.connected = false; state.error = null })
  },
})

export const { clearAuthError } = authSlice.actions

export default authSlice.reducer
