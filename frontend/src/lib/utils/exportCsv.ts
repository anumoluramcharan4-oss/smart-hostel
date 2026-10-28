export function exportToCsv<T extends object>(
  filename: string,
  rows: T[],
  headers?: { key: keyof T; label: string }[]
) {
  if (!rows || !rows.length) {
    alert('No data to export')
    return
  }

  const effectiveHeaders =
    headers ||
    (Object.keys(rows[0]) as Array<keyof T>).map((key) => ({
      key,
      label: String(key).charAt(0).toUpperCase() + String(key).slice(1),
    }))

  const headerRow = effectiveHeaders.map((h) => `"${h.label}"`).join(',')

  const dataRows = rows.map((row) =>
    effectiveHeaders
      .map((header) => {
        const val = (row as Record<string, unknown>)[header.key as string]
        if (val === null || val === undefined) return '""'
        if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`
        return `"${String(val).replace(/"/g, '""')}"`
      })
      .join(',')
  )

  const csvContent = [headerRow, ...dataRows].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
