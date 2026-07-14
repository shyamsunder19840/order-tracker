import { configureStore } from '@reduxjs/toolkit'
import authReducer    from './authSlice.js'
import ordersReducer  from './ordersSlice.js'
import trackerReducer from './trackerSlice.js'
import salesReducer   from '../sales-dashboard/store/slices/salesSlice.js'
import filterReducer  from '../sales-dashboard/store/slices/filterSlice.js'
import uiReducer      from '../sales-dashboard/store/slices/uiSlice.js'

export default configureStore({
  reducer: {
    auth:    authReducer,
    orders:  ordersReducer,
    tracker: trackerReducer,
    sales:   salesReducer,
    filters: filterReducer,
    ui:      uiReducer,
  },
})
