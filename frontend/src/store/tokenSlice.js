import { createSlice } from '@reduxjs/toolkit'

const STORAGE_KEY = 'bc_bearer_token'

const tokenSlice = createSlice({
  name: 'token',
  initialState: {
    value: localStorage.getItem(STORAGE_KEY) || '',
    modalOpen: false,
  },
  reducers: {
    setToken(state, action) {
      state.value = action.payload.trim()
      if (state.value) {
        localStorage.setItem(STORAGE_KEY, state.value)
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    },
    openModal(state)  { state.modalOpen = true  },
    closeModal(state) { state.modalOpen = false },
  },
})

export const { setToken, openModal, closeModal } = tokenSlice.actions
export default tokenSlice.reducer
