import Papa from 'papaparse'

/**
 * Parse a CSV File object into an array of guest data objects.
 * Only uses columns: name, group, knows — all other columns are ignored.
 * Returns a Promise that resolves to an array of objects.
 */
export function parseGuestCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
      complete: (results) => {
        const rows = results.data.map((row) => ({
          name:  (row.name  || '').trim(),
          group: (row.group || '').trim().toLowerCase(),
          knows: (row.knows || '').trim(),
        })).filter((r) => r.name)
        resolve(rows)
      },
      error: (err) => reject(err),
    })
  })
}
