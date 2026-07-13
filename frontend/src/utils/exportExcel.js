import * as XLSX from 'xlsx'

/**
 * Export an array of data rows to a formatted .xlsx file.
 *
 * @param {object[]} rows      - Array of plain objects (each row)
 * @param {object[]} columns   - [{ label: 'Column Header', key: 'fieldName' }, ...]
 * @param {string}   filename  - Output filename (without extension)
 * @param {string}   sheetName - Excel sheet tab name
 */
export function exportToExcel(rows, columns, filename = 'export', sheetName = 'Data') {
  // Build the 2-D array: header row + data rows
  const header = columns.map((c) => c.label)
  const data   = rows.map((row) =>
    columns.map((c) => {
      const v = row[c.key]
      return v === undefined || v === null ? '' : v
    })
  )

  const ws = XLSX.utils.aoa_to_sheet([header, ...data])

  // ── Column widths (auto-fit to longest value in each column) ──
  const colWidths = columns.map((c, i) => {
    const maxLen = Math.max(
      c.label.length,
      ...rows.map((r) => String(r[c.key] ?? '').length)
    )
    return { wch: Math.min(Math.max(maxLen + 2, 10), 60) }
  })
  ws['!cols'] = colWidths

  // ── Style the header row (bold, blue background) ──
  // SheetJS community edition doesn't support cell styles, but we set
  // the header row height for visual breathing room.
  ws['!rows'] = [{ hpt: 20 }]  // row 1 height in points

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)

  const safeFile = filename.replace(/[/\\?%*:|"<>]/g, '_')
  XLSX.writeFile(wb, `${safeFile}.xlsx`)
}

/** Returns today's date as YYYY-MM-DD for filenames */
export function today() {
  return new Date().toISOString().slice(0, 10)
}
