import { configureStore } from '@reduxjs/toolkit'
import authReducer    from './authSlice.js'
import ordersReducer  from './ordersSlice.js'
import trackerReducer from './trackerSlice.js'

export default configureStore({
  reducer: {
    auth:    authReducer,
    orders:  ordersReducer,
    tracker: trackerReducer,
  },
})
