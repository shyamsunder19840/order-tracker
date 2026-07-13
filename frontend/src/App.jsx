import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { checkStatus, disconnectBC } from './store/authSlice.js'
import { clearResults } from './store/ordersSlice.js'
import { setSelectedRow, clearFilters } from './store/trackerSlice.js'
import ConnectScreen     from './components/ConnectScreen.jsx'
import TrackerTable      from './components/TrackerTable.jsx'
import OrderDetailModal  from './components/OrderDetailModal.jsx'
import SettingsModal     from './components/SettingsModal.jsx'

export default function App() {
  const dispatch = useDispatch()
  const { connected, checking }  = useSelector((s) => s.auth)
  const { selectedRow }          = useSelector((s) => s.tracker)
  const { searched }             = useSelector((s) => s.orders)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => { dispatch(checkStatus()) }, [dispatch])

  if (checking) {
    return (
      <div className="app-init">
        <div className="spinner" />
        <p>Connecting…</p>
      </div>
    )
  }

  if (!connected) return <ConnectScreen />

  function handleCloseDetail() {
    dispatch(setSelectedRow(null))
    dispatch(clearResults())
  }

  const showDetail = !!(selectedRow || searched)

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="logo-mark">OT</div>
          <div>
            <h1 className="header-title">Sales Order Tracker</h1>
            <p className="header-sub">Business Central · Supply Chain Progress</p>
          </div>
          <button
            className="btn-settings"
            onClick={() => setShowSettings(true)}
            title="App Settings">
            ⚙
          </button>
          <button
            className="btn-logout"
            onClick={() => {
              dispatch(setSelectedRow(null))
              dispatch(clearResults())
              dispatch(clearFilters())
              dispatch(disconnectBC())
            }}
            title="Sign Out">
            ⏻
          </button>
        </div>
      </header>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      {showDetail && <OrderDetailModal onClose={handleCloseDetail} />}

      <main className="app-main">
        <TrackerTable />
      </main>

      <footer className="app-footer">
        <p>Connected to Business Central · {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}
