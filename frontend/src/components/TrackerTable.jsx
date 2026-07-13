import React, { useEffect, useMemo, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchTrackerOrders, setFilter, clearFilters, setSelectedRow } from '../store/trackerSlice.js'
import { fetchOrders, setQuery, clearResults } from '../store/ordersSlice.js'
import { exportToExcel, today } from '../utils/exportExcel.js'

// ── Exact field names from BC OrderTrackerAPI ────────────────────────────────
const F = {
  soNo:      'SONo',
  custName:  'CustomerName',
  custId:    'CustomerID',
  amId:      'AMID',
  amName:    'AMName',
  year:      'FinancialYear',
  quarter:   'Quater',          // note: API spells it "Quater"
  month:     'Month',
  region:    'Region',
  dept:      'Department',
  tech:      'Technology',
  techTeam:  'TechnologyTeams',
  orderType: 'OrderType',
  custPo:    'CustomerOrderNo', // drives the detail search
  orderDate: 'OrderDate',
}

// ── Filter bar config ────────────────────────────────────────────────────────
const FILTERS = [
  { key: 'amId',            label: 'AM ID',            field: F.amId,     type: 'select' },
  { key: 'financialYear',   label: 'Financial Year',   field: F.year,     type: 'select' },
  { key: 'quarter',         label: 'Quarter',          field: F.quarter,  type: 'select' },
  { key: 'region',          label: 'Region',           field: F.region,   type: 'select' },
  { key: 'department',      label: 'Department',       field: F.dept,     type: 'select' },
  { key: 'technology',      label: 'Technology',       field: F.tech,     type: 'select' },
  { key: 'customerOrderNo', label: 'Customer Order No',field: F.custPo,   type: 'text'   },
]

// ── Table columns  (sequence per user requirement) ───────────────────────────
const COLUMNS = [
  { label: 'Customer Order No', field: F.custPo,    cls: 'mono'        },
  { label: 'AM ID',             field: F.amId,      cls: 'text-center' },
  { label: 'AM Name',           field: F.amName,    cls: ''            },
  { label: 'Order Type',        field: F.orderType, cls: 'text-center' },
  { label: 'SO No.',            field: F.soNo,      cls: 'mono'        },
  { label: 'Customer',          field: F.custName,  cls: 'col-cust'    },
  { label: 'Order Date',        field: F.orderDate, cls: 'text-center', fmt: fmtDate },
  { label: 'Region',            field: F.region,    cls: 'text-center' },
  { label: 'Department',        field: F.dept,      cls: 'text-center' },
  { label: 'Technology',        field: F.tech,      cls: ''            },
  { label: 'Tech Team',         field: F.techTeam,  cls: ''            },
  { label: 'Financial Year',    field: F.year,      cls: 'text-center' },
  { label: 'Quarter',           field: F.quarter,   cls: 'text-center' },
  { label: 'Month',             field: F.month,     cls: 'text-center' },
]

// ── Helpers ──────────────────────────────────────────────────────────────────
const val = (row, field) => row[field] ?? ''

/** YYYY-MM-DD → DD-MM-YYYY  (leaves anything else untouched) */
function fmtDate(v) {
  if (!v) return ''
  const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[3]}-${m[2]}-${m[1]}` : v
}

/** Build unique sorted options; for AM ID also pairs in the AM Name */
function uniqueSorted(items, field) {
  return [...new Set(items.map((r) => val(r, field)).filter(Boolean))].sort()
}

/** AM ID dropdown options: "E301 - Rahul KrishnaKumar" */
function amIdOptions(items) {
  const map = new Map()
  items.forEach((r) => {
    const id   = val(r, F.amId)
    const name = val(r, F.amName)
    if (id && !map.has(id)) map.set(id, name)
  })
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, name]) => ({ value: id, label: name ? `${id} - ${name}` : id }))
}

function deduplicateBySoNo(items) {
  const seen = new Set()
  return items.filter((row) => {
    const k = val(row, F.soNo)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function TrackerTable() {
  const dispatch = useDispatch()
  const { items, loading, error, filters, selectedRow } = useSelector((s) => s.tracker)
  const { loading: detailLoading }                      = useSelector((s) => s.orders)

  // Auto-fetch on mount
  useEffect(() => { dispatch(fetchTrackerOrders()) }, [dispatch])

  // ── Client-side filter + dedup ──
  const displayed = useMemo(() => {
    let rows = Array.isArray(items) ? items : []
    FILTERS.forEach(({ key, field, type }) => {
      const v = filters[key]
      if (!v) return
      rows = rows.filter((r) =>
        type === 'text'
          ? String(val(r, field)).toLowerCase().includes(v.toLowerCase())
          : val(r, field) === v
      )
    })
    return deduplicateBySoNo(rows)
  }, [items, filters])

  // ── Dropdown options (built from full unfiltered list) ──
  const options = useMemo(() => {
    const src = Array.isArray(items) ? items : []
    const result = {}
    FILTERS.forEach(({ key, field }) => { result[key] = uniqueSorted(src, field) })
    result._amIdCombined = amIdOptions(src)   // {value, label} pairs for AM ID
    return result
  }, [items])

  // ── Row click → open detail modal using SO No. ──
  function handleRowClick(row) {
    const soNo = val(row, F.soNo)
    if (!soNo) return
    dispatch(setSelectedRow(row))
    dispatch(setQuery(soNo))
    dispatch(fetchOrders(soNo))
  }

  const hasFilters    = Object.values(filters).some(Boolean)
  const selectedSoNo  = selectedRow ? val(selectedRow, F.soNo) : null
  const totalUniq     = useMemo(() => deduplicateBySoNo(Array.isArray(items) ? items : []).length, [items])

  // ── Excel export (apply same fmt transforms as the table display) ──
  function handleExport() {
    const exportCols = COLUMNS.map((c) => ({ label: c.label, key: c.field }))
    // Pre-format rows so date columns are DD-MM-YYYY in Excel too
    const exportRows = displayed.map((row) => {
      const clone = { ...row }
      COLUMNS.forEach(({ field, fmt }) => { if (fmt) clone[field] = fmt(row[field]) })
      return clone
    })
    exportToExcel(exportRows, exportCols, `OrderTracker_${today()}`, 'Order Tracker')
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="tracker-section">

      {/* Header */}
      <div className="tracker-header">
        <div className="tracker-title">
          <span>📊 Order Tracker</span>
          {!loading && items.length > 0 && (
            <span className="badge-count">
              {displayed.length} of {totalUniq} orders
            </span>
          )}
        </div>
        <div className="tracker-actions">
          {hasFilters && (
            <button className="btn btn-secondary btn-sm"
              onClick={() => dispatch(clearFilters())}>
              ✕ Clear Filters
            </button>
          )}
          <button
            className="btn btn-export btn-sm"
            onClick={handleExport}
            disabled={loading || displayed.length === 0}
            title="Download visible rows as Excel">
            ⬇ Export Excel
          </button>
          <button className="btn btn-primary btn-sm"
            onClick={() => dispatch(fetchTrackerOrders())}
            disabled={loading}>
            {loading ? 'Loading…' : '↻ Refresh'}
          </button>
        </div>
      </div>

      {/* Filter row */}
      <div className="tracker-filters">
        {FILTERS.map(({ key, label, type }) => (
          <div key={key} className="filter-group">
            <label className="filter-label">{label}</label>
            {type === 'text' ? (
              <input
                className="filter-input"
                type="text"
                placeholder="Search…"
                value={filters[key]}
                onChange={(e) => dispatch(setFilter({ key, value: e.target.value }))}
              />
            ) : key === 'amId' ? (
              /* AM ID: show "E461 - Rahul KrishnaKumar" in the dropdown */
              <select
                className="filter-select"
                value={filters[key]}
                onChange={(e) => dispatch(setFilter({ key, value: e.target.value }))}>
                <option value="">All</option>
                {options._amIdCombined.map(({ value, label: optLabel }) => (
                  <option key={value} value={value}>{optLabel}</option>
                ))}
              </select>
            ) : (
              <select
                className="filter-select"
                value={filters[key]}
                onChange={(e) => dispatch(setFilter({ key, value: e.target.value }))}>
                <option value="">All</option>
                {options[key].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            )}
          </div>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="state-box">
          <div className="spinner" />
          <p>Loading tracker data…</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="state-box error-box">
          <span className="error-icon">⚠</span>
          <p>{error}</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }}
            onClick={() => dispatch(fetchTrackerOrders())}>Retry</button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && items.length === 0 && (
        <div className="state-box">
          <p>No data found. Click Refresh to load.</p>
        </div>
      )}

      {/* No match after filter */}
      {!loading && !error && items.length > 0 && displayed.length === 0 && (
        <div className="state-box">
          <p>No records match the selected filters.</p>
          <button className="btn btn-secondary" style={{ marginTop: 16 }}
            onClick={() => dispatch(clearFilters())}>Clear Filters</button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && displayed.length > 0 && (
        <div className="table-scroll">
          <table className="order-table tracker-tbl">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                {COLUMNS.map((c) => <th key={c.field}>{c.label}</th>)}
                <th style={{ width: 110 }}>Detail</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((row, idx) => {
                const soNo       = val(row, F.soNo)
                const custPo     = val(row, F.custPo)
                const isSelected = soNo && soNo === selectedSoNo

                return (
                  <tr
                    key={soNo || idx}
                    className={`tracker-row${isSelected ? ' tracker-row--selected' : ''}`}
                    onClick={() => handleRowClick(row)}
                    title={soNo ? `Click to view line detail for SO: ${soNo}` : 'No SO No. available'}>
                    <td className="text-center cell-muted">{idx + 1}</td>
                    {COLUMNS.map((c) => {
                      const raw      = val(row, c.field)
                      const display  = c.fmt ? c.fmt(raw) : raw
                      return (
                        <td key={c.field} className={c.cls}>
                          {display || <span className="cell-empty">—</span>}
                        </td>
                      )
                    })}
                    <td>
                      {soNo ? (
                        <button
                          className="btn-detail"
                          onClick={(e) => { e.stopPropagation(); handleRowClick(row) }}
                          disabled={detailLoading && isSelected}>
                          {isSelected && detailLoading ? 'Loading…' : '🔍 View'}
                        </button>
                      ) : (
                        <span className="cell-empty">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
