import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import OrderTable from './OrderTable.jsx'

export default function OrderDetailModal({ onClose }) {
  const { query, loading } = useSelector((s) => s.orders)

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="od-backdrop" onClick={onClose}>
      <div className="od-modal" onClick={(e) => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="od-header">
          <div className="od-title">
            <span className="od-icon">📋</span>
            <span>Order Line Detail</span>
            {query && (
              <span className="od-sub">
                SO No: <strong>{query}</strong>
              </span>
            )}
            {loading && <span className="od-loading">Loading…</span>}
          </div>
          <button className="od-close" onClick={onClose} title="Close (Esc)">✕</button>
        </div>

        {/* ── Body ── */}
        <div className="od-body">
          <OrderTable />
        </div>

      </div>
    </div>
  )
}
