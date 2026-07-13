import React from 'react'
import { useSelector } from 'react-redux'
import { exportToExcel, today } from '../utils/exportExcel.js'

const PIPELINE_STEPS = [
  { key: 'SONo',           label: 'SO Created' },
  { key: 'PONo',           label: 'PO Created' },
  { key: 'ShipmentNo',     label: 'Shipped' },
  { key: 'SalesInvNo',     label: 'Sales Invoice' },
  { key: 'GRNNo',          label: 'GRN' },
  { key: 'PurchInvoiceNo', label: 'Purch. Invoice' },
  { key: 'PaymentReceivedfromCustomer', label: 'Payment Received' },
  { key: 'PaidPaymenttoVendor',         label: 'Vendor Paid' },
]

function isStepDone(value) {
  if (!value || value.trim() === '' || value.trim().toLowerCase() === 'not created') return false
  return true
}

function isLineComplete(order) {
  const payment = (order.PaymentReceivedfromCustomer || '').trim().toLowerCase()
  const vendor  = (order.PaidPaymenttoVendor || '').trim().toLowerCase()
  return (
    (payment === 'paid' || payment === 'received') &&
    (vendor  === 'paid' || vendor  === 'received')
  )
}

function CellValue({ value }) {
  if (!value || value.trim() === '') {
    return <span className="cell-empty">—</span>
  }
  if (value.trim().toLowerCase() === 'not created') {
    return <span className="cell-not-created">Not Created</span>
  }
  return <span>{value}</span>
}

function PipelineBar({ order }) {
  const completedCount = PIPELINE_STEPS.filter((s) => isStepDone(order[s.key])).length
  const pct = Math.round((completedCount / PIPELINE_STEPS.length) * 100)

  return (
    <div className="pipeline-wrap">
      <div className="pipeline-bar-bg">
        <div
          className="pipeline-bar-fill"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="pipeline-pct">{pct}%</span>
    </div>
  )
}

// Columns for Excel export — label shown in header, key is the field name in each order object
const EXPORT_COLS = [
  { label: 'Customer PO No.',       key: 'Customer PO No.'              },
  { label: 'Part No.',              key: 'Part No'                      },
  { label: 'Description',           key: 'Description'                  },
  { label: 'Quantity',              key: 'Quantity'                     },
  { label: 'SO No.',                key: 'SONo'                         },
  { label: 'PO No.',                key: 'PONo'                         },
  { label: 'Delivery Date',         key: 'DeliveryDate'                 },
  { label: 'Shipment No.',          key: 'ShipmentNo'                   },
  { label: 'Sales Invoice No.',     key: 'SalesInvNo'                   },
  { label: 'GRN No.',               key: 'GRNNo'                        },
  { label: 'Purchase Invoice No.',  key: 'PurchInvoiceNo'               },
  { label: 'Payment from Customer', key: 'PaymentReceivedfromCustomer'  },
  { label: 'Payment to Vendor',     key: 'PaidPaymenttoVendor'          },
]

export default function OrderTable() {
  const { items: rawItems, count, loading, error, searched, query } = useSelector((s) => s.orders)
  const items = Array.isArray(rawItems) ? rawItems : []

  function handleExport() {
    const filename = `OrderDetail_${(query || 'export').replace(/\s+/g, '_')}_${today()}`
    exportToExcel(items, EXPORT_COLS, filename, 'Order Lines')
  }

  if (loading) {
    return (
      <div className="state-box">
        <div className="spinner" />
        <p>Fetching order data…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="state-box error-box">
        <span className="error-icon">⚠</span>
        <p>{error}</p>
      </div>
    )
  }

  if (searched && count === 0) {
    return (
      <div className="state-box">
        <p>No orders found for this Customer PO Number.</p>
      </div>
    )
  }

  if (!searched) return null

  const completeCount = items.filter(isLineComplete).length

  return (
    <div className="table-section">
      <div className="table-header-row">
        <h3 className="table-title">
          Order Lines <span className="badge-count">{count}</span>
        </h3>
        <div className="summary-badges">
          <span className="badge badge-complete">{completeCount} Complete</span>
          <span className="badge badge-progress">{count - completeCount} In Progress</span>
          <button
            className="btn btn-export btn-sm"
            onClick={handleExport}
            title="Download order lines as Excel">
            ⬇ Export Excel
          </button>
        </div>
      </div>

      <div className="table-scroll">
        <table className="order-table">
          <thead>
            <tr>
              <th>Customer PO No.</th>
              <th>Part No.</th>
              <th>Description</th>
              <th>Qty</th>
              <th>SO No.</th>
              <th>PO No.</th>
              <th>Delivery Date</th>
              <th>Shipment No.</th>
              <th>Sales Inv. No.</th>
              <th>GRN No.</th>
              <th>Purch. Invoice No.</th>
              <th>Payment from Customer</th>
              <th>Payment to Vendor</th>
              <th>Progress</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((order, idx) => {
              const complete = isLineComplete(order)
              return (
                <tr key={idx} className={complete ? 'row-complete' : 'row-progress'}>
                  <td><strong>{order['Customer PO No.']}</strong></td>
                  <td className="mono">{order['Part No']}</td>
                  <td className="col-desc">{order['Description']}</td>
                  <td className="text-center">{order['Quantity']}</td>
                  <td className="mono"><CellValue value={order['SONo']} /></td>
                  <td className="mono"><CellValue value={order['PONo']} /></td>
                  <td><CellValue value={order['DeliveryDate']} /></td>
                  <td><CellValue value={order['ShipmentNo']} /></td>
                  <td><CellValue value={order['SalesInvNo']} /></td>
                  <td><CellValue value={order['GRNNo']} /></td>
                  <td><CellValue value={order['PurchInvoiceNo']} /></td>
                  <td>
                    <CellValue value={order['PaymentReceivedfromCustomer']} />
                  </td>
                  <td>
                    <CellValue value={order['PaidPaymenttoVendor']} />
                  </td>
                  <td style={{ minWidth: '130px' }}>
                    <PipelineBar order={order} />
                  </td>
                  <td>
                    {complete ? (
                      <span className="status-badge status-complete">Complete</span>
                    ) : (
                      <span className="status-badge status-inprogress">In Progress</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
