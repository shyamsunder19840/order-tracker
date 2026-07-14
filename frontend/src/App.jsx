import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { checkStatus, disconnectBC } from './store/authSlice.js'
import { clearResults } from './store/ordersSlice.js'
import { setSelectedRow, clearFilters } from './store/trackerSlice.js'
import ConnectScreen      from './components/ConnectScreen.jsx'
import TrackerTable       from './components/TrackerTable.jsx'
import OrderDetailModal   from './components/OrderDetailModal.jsx'
import SettingsModal      from './components/SettingsModal.jsx'
import SalesDashboardApp  from './sales-dashboard/SalesDashboardApp.jsx'
import logo               from './assets/logo.png'

const TABS = [
  { key: 'sales',   label: 'Sales Dashboard' },
  { key: 'tracker', label: 'Order Tracker' },
]

export default function App() {
  const dispatch = useDispatch()
  const { connected, checking }  = useSelector((s) => s.auth)
  const { selectedRow }          = useSelector((s) => s.tracker)
  const { searched }             = useSelector((s) => s.orders)
  const [showSettings, setShowSettings] = useState(false)
  const [activeTab, setActiveTab]       = useState('sales')

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
          <div className="logo-mark">
            <img src={logo} alt="Proactive" className="logo-img" />
          </div>

          <div className="tab-switcher">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={`tab-btn ${activeTab === tab.key ? 'tab-btn-active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'tracker' && (
            <button
              className="btn-settings"
              onClick={() => setShowSettings(true)}
              title="Order Tracker Settings">
              ⚙
            </button>
          )}
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

      <div className="app-main-tabs">
        <div className={`tab-panel ${activeTab === 'sales' ? '' : 'tab-panel-hidden'}`}>
          <SalesDashboardApp />
        </div>
        <div className={`app-main tab-panel ${activeTab === 'tracker' ? '' : 'tab-panel-hidden'}`}>
          <TrackerTable />
        </div>
      </div>
    </div>
  )
}
