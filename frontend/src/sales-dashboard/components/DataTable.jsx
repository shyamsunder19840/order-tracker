import React, { useState, useMemo } from 'react';
import { formatCurrency, formatDate, formatPct } from '../utils/formatters';

const COLUMNS = [
  { key: 'Order_Type',           label: 'Order Type',      width: 100 },
  { key: 'Order_Date',           label: 'Date',            width: 100, render: formatDate },
  { key: 'SO_No_',               label: 'SO No.',          width: 140 },
  { key: 'Master_Customer_ID',   label: 'Cust. ID',        width: 90 },
  { key: 'Master_Customer_Name', label: 'Customer',        width: 220 },
  { key: 'AM_Name',              label: 'AM Name',         width: 150 },
  { key: 'Sales_Teams',          label: 'Sales Team',      width: 90 },
  { key: 'Branch_Name',          label: 'Branch',          width: 100 },
  { key: 'Region',               label: 'Region',          width: 80 },
  { key: 'Technology',           label: 'Technology',      width: 100 },
  { key: 'Product_Type',         label: 'Product Type',    width: 100 },
  { key: 'Financial_Year',       label: 'FY',              width: 90 },
  { key: 'Quarter',              label: 'Quarter',         width: 70 },
  { key: 'Sales_Amount',         label: 'Sales (₹)',       width: 120, render: formatCurrency, numeric: true },
  { key: 'TGM',                  label: 'TGM (₹)',         width: 120, render: formatCurrency, numeric: true },
  { key: 'TGM_Pct',             label: 'TGM %',           width: 80,  render: formatPct,     numeric: true },
  { key: 'Band_Revised',         label: 'Deal Band',       width: 160 },
  { key: 'Project_No',           label: 'Project No.',     width: 100 },
];

const S = {
  wrap:   { background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 8px rgba(99,102,241,0.08), 0 4px 16px rgba(99,102,241,0.04)', border: '1px solid #ede9fe' },
  toolbar:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #ede9fe', background: '#faf8ff' },
  search: { padding: '7px 12px', borderRadius: 8, border: '1px solid #c7d2fe', fontSize: 13, width: 220, outline: 'none', background: '#fff' },
  tableWrap: { overflowX: 'auto', maxHeight: 520 },
  table:  { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: (numeric) => ({
    padding: '10px 12px', background: 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)',
    color: '#4f46e5', fontWeight: 700,
    textAlign: numeric ? 'right' : 'left', whiteSpace: 'nowrap',
    borderBottom: '2px solid #c7d2fe', position: 'sticky', top: 0, zIndex: 1,
    fontSize: 11, letterSpacing: 0.4, textTransform: 'uppercase',
  }),
  td: (numeric, striped) => ({
    padding: '8px 12px', borderBottom: '1px solid #f5f3ff',
    textAlign: numeric ? 'right' : 'left', whiteSpace: 'nowrap',
    background: striped ? '#faf8ff' : '#fff',
    color: '#374151',
  }),
  badge: (val) => ({
    display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
    background: val ? '#d1fae5' : '#f3f4f6',
    color:      val ? '#065f46' : '#6b7280',
  }),
  pager: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid #ede9fe', fontSize: 13, color: '#6b7280', background: '#faf8ff' },
  pageBtn: (disabled) => ({
    padding: '5px 12px', borderRadius: 8, border: '1px solid #c7d2fe',
    background: disabled ? '#f5f3ff' : '#fff', cursor: disabled ? 'not-allowed' : 'pointer',
    color: disabled ? '#c4b5fd' : '#4f46e5', fontSize: 13, fontWeight: 500,
  }),
  exportBtn: { padding: '6px 14px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 },
};

function exportCSV(records, columns) {
  const header = columns.map(c => c.label).join(',');
  const rows   = records.map(r =>
    columns.map(c => {
      const v = r[c.key];
      return typeof v === 'string' && v.includes(',') ? `"${v}"` : (v ?? '');
    }).join(',')
  );
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a'); a.href = url; a.download = 'sales_data.csv'; a.click();
  URL.revokeObjectURL(url);
}

export default function DataTable({ records = [], total, page, perPage, onPageChange, title = 'Transactions', onExportAll }) {
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol]  = useState('Order_Date');
  const [sortDir, setSortDir]  = useState('desc');
  const [exporting, setExporting] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return records;
    const q = search.toLowerCase();
    return records.filter(r =>
      COLUMNS.some(c => String(r[c.key] ?? '').toLowerCase().includes(q))
    );
  }, [records, search]);

  const sorted = useMemo(() => {
    if (!sortCol) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sortCol] ?? ''; const bv = b[sortCol] ?? '';
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortCol, sortDir]);

  const handleSort = (key) => {
    if (sortCol === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(key); setSortDir('asc'); }
  };

  const handleExport = async () => {
    // `records` is only whatever page is currently loaded (see SRMData.jsx
    // etc.) — exporting `sorted` would silently drop everything outside the
    // current page. When the parent supplies onExportAll, fetch the full
    // filtered set just for the export (never rendered into the table, so
    // it can't trigger the render-hang a large flat table causes).
    if (!onExportAll) { exportCSV(sorted, COLUMNS); return; }
    setExporting(true);
    try {
      const all = await onExportAll();
      exportCSV(all, COLUMNS);
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.ceil((total || sorted.length) / (perPage || sorted.length || 1));
  const currentPage = page || 1;

  return (
    <div style={S.wrap}>
      <div style={S.toolbar}>
        <span style={{ fontWeight: 700, color: '#1e1b4b', fontSize: 14 }}>
          {title} <span style={{ color: '#6b7280', fontWeight: 400 }}>({total ?? sorted.length} records)</span>
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            style={S.search} placeholder="Search…"
            value={search} onChange={e => setSearch(e.target.value)}
          />
          <button style={S.exportBtn} onClick={handleExport} disabled={exporting}>
            {exporting ? 'Exporting…' : '↓ CSV'}
          </button>
        </div>
      </div>

      <div style={S.tableWrap}>
        <table style={S.table}>
          <thead>
            <tr>
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  style={{ ...S.th(col.numeric), minWidth: col.width, cursor: 'pointer' }}
                  onClick={() => handleSort(col.key)}
                >
                  {col.label} {sortCol === col.key ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr><td colSpan={COLUMNS.length} style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>No records found</td></tr>
            ) : sorted.map((row, i) => (
              <tr key={row.SystemId || i}>
                {COLUMNS.map(col => (
                  <td key={col.key} style={S.td(col.numeric, i % 2 === 1)}>
                    {col.render ? col.render(row[col.key]) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {onPageChange && (
        <div style={S.pager}>
          <span>Page {currentPage} of {totalPages || 1}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={S.pageBtn(currentPage <= 1)} disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)}>← Prev</button>
            <button style={S.pageBtn(currentPage >= totalPages)} disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)}>Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}
