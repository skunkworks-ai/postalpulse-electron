import { createServer, IncomingMessage, ServerResponse } from 'http'
import { readFileSync, existsSync, writeFileSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import { networkInterfaces } from 'os'
import { getTransactionCsvPath } from './transactionLogger'

export const WEB_SERVER_PORT = 18080

// ─── Types ────────────────────────────────────────────────────────────────────

interface TransactionRow {
  uuid: string
  barcodeId: string
  startTransactionTime: string
  endTransactionTime: string
  parcelStatus: string
  detectionTime: string
  confirmationTime: string
  senderTime: string
  recipientTime: string
  verifyTime: string
  paymentTime: string
  scanningTime: string
  lodgementTime: string
  successTime: string
  timestamp: string
  senderName: string
  senderEmail: string
  senderAddress: string
  recipientName: string
  recipientAddress: string
  parcelSize: string
  parcelWeight: string
  parcelPrice: string
  parcelActualDimensions: string
}

interface TransactionUpdatePayload {
  parcelStatus?: string
  scanningTime?: string
  lodgementTime?: string
}

const TRANSACTION_CSV_HEADERS =
  'UUID,Barcode ID,Start Transaction Time,End Transaction Time,Parcel Status,Detection Time,Confirmation Time,Sender Time,Recipient Time,Verify Time,Payment Time,Scanning Time,Lodgement Time,Success Time,Timestamp,Sender Name,Sender Email,Sender Address,Recipient Name,Recipient Address,Parcel Size,Parcel Weight (lbs),Parcel Price ($),Parcel Actual Dimensions\n'

// ─── CSV Parsing ──────────────────────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current)
      current = ''
    } else {
      current += char
    }
  }
  fields.push(current)
  return fields
}

function parseCSV(content: string): TransactionRow[] {
  const lines = content.trim().split('\n')
  if (lines.length < 2) return []

  const rows: TransactionRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const f = parseCSVLine(lines[i])
    if (f.length < 22) continue

    if (f.length >= 24) {
      rows.push({
        uuid: f[0],
        barcodeId: f[1],
        startTransactionTime: f[2],
        endTransactionTime: f[3],
        parcelStatus: f[4],
        detectionTime: f[5],
        confirmationTime: f[6],
        senderTime: f[7],
        recipientTime: f[8],
        verifyTime: f[9],
        paymentTime: f[10],
        scanningTime: f[11],
        lodgementTime: f[12],
        successTime: f[13],
        timestamp: f[14],
        senderName: f[15],
        senderEmail: f[16],
        senderAddress: f[17],
        recipientName: f[18],
        recipientAddress: f[19],
        parcelSize: f[20],
        parcelWeight: f[21],
        parcelPrice: f[22],
        parcelActualDimensions: f[23] ?? ''
      })
      continue
    }

    if (f.length === 23) {
      rows.push({
        uuid: f[0],
        barcodeId: f[1],
        startTransactionTime: f[2],
        endTransactionTime: f[3],
        parcelStatus: f[4],
        detectionTime: f[5],
        confirmationTime: f[6],
        senderTime: f[7],
        recipientTime: f[8],
        verifyTime: f[9],
        paymentTime: f[10],
        scanningTime: f[11],
        lodgementTime: '',
        successTime: f[12],
        timestamp: f[13],
        senderName: f[14],
        senderEmail: f[15],
        senderAddress: f[16],
        recipientName: f[17],
        recipientAddress: f[18],
        parcelSize: f[19],
        parcelWeight: f[20],
        parcelPrice: f[21],
        parcelActualDimensions: f[22] ?? ''
      })
      continue
    }

    rows.push({
      uuid: f[0],
      barcodeId: f[1],
      startTransactionTime: f[2],
      endTransactionTime: f[3],
      parcelStatus: f[4],
      detectionTime: f[5],
      confirmationTime: f[6],
      senderTime: f[7],
      recipientTime: f[8],
      verifyTime: f[9],
      paymentTime: f[10],
      scanningTime: f[11],
      lodgementTime: '',
      successTime: f[12],
      timestamp: f[13],
      senderName: f[14],
      senderEmail: f[15],
      senderAddress: f[16],
      recipientName: f[17],
      recipientAddress: f[18],
      parcelSize: f[19],
      parcelWeight: f[20],
      parcelPrice: f[21],
      parcelActualDimensions: ''
    })
  }
  return rows
}

function escapeCSVField(field: string | number | undefined): string {
  if (field === null || field === undefined) return ''
  const stringField = String(field)
  if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
    return `"${stringField.replace(/"/g, '""')}"`
  }
  return stringField
}

function transactionRowToCSVLine(row: TransactionRow): string {
  const fields = [
    row.uuid,
    row.barcodeId,
    row.startTransactionTime,
    row.endTransactionTime,
    row.parcelStatus,
    row.detectionTime,
    row.confirmationTime,
    row.senderTime,
    row.recipientTime,
    row.verifyTime,
    row.paymentTime,
    row.scanningTime,
    row.lodgementTime,
    row.successTime,
    row.timestamp,
    row.senderName,
    row.senderEmail,
    row.senderAddress,
    row.recipientName,
    row.recipientAddress,
    row.parcelSize,
    row.parcelWeight,
    row.parcelPrice,
    row.parcelActualDimensions
  ]

  return fields.map(escapeCSVField).join(',')
}

function writeCSV(filePath: string, rows: TransactionRow[]): void {
  const csv = TRANSACTION_CSV_HEADERS + rows.map(transactionRowToCSVLine).join('\n') + '\n'
  writeFileSync(filePath, csv, 'utf-8')
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getLocalIPs(): string[] {
  const nets = networkInterfaces()
  const ips: string[] = []
  for (const iface of Object.values(nets)) {
    for (const net of iface ?? []) {
      if (net.family === 'IPv4' && !net.internal) ips.push(net.address)
    }
  }
  return ips
}

function getCapturePath(uuid: string): string | null {
  const dir = join(app.getPath('userData'), 'transaction_captures')
  const fp = join(dir, `${uuid}.jpg`)
  return existsSync(fp) ? fp : null
}

function getJsBarcodeVendorPath(): string | null {
  const candidates = [
    join(app.getAppPath(), 'node_modules', 'jsbarcode', 'dist', 'JsBarcode.all.min.js'),
    join(process.resourcesPath, 'app.asar', 'node_modules', 'jsbarcode', 'dist', 'JsBarcode.all.min.js'),
    join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'jsbarcode', 'dist', 'JsBarcode.all.min.js')
  ]

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate
  }

  return null
}

function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Serialize data as JSON safe for embedding inside a <script> tag. */
function safeJson(data: unknown): string {
  return JSON.stringify(data).replace(/<\/script>/gi, '<\\/script>')
}

// ─── Template helpers ────────────────────────────────────────────────────────

/** Absolute path to the views directory (works in dev and packaged builds). */
function getViewsDir(): string {
  return join(app.getAppPath(), 'resources', 'views')
}

/** Read an HTML/CSS template file from the views directory. */
function loadTemplate(name: string): string {
  return readFileSync(join(getViewsDir(), name), 'utf-8')
}

/**
 * Replace all `{{KEY}}` tokens in a template with the supplied values.
 * Uses split/join so it works in every TypeScript target without replaceAll.
 */
function fillTemplate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (html, [key, value]) => html.split(`{{${key}}}`).join(value),
    template
  )
}

function renderIndexPage(transactions: TransactionRow[]): string {
  return fillTemplate(loadTemplate('index.html'), {
    DATA_JSON: safeJson(transactions)
  })
}

function renderDetailPage(t: TransactionRow, imageBase64: string | null): string {
  return fillTemplate(loadTemplate('detail.html'), {
    DATA_JSON: safeJson({ transaction: t, imageBase64 })
  })
}

// ─── Server ───────────────────────────────────────────────────────────────────

export function startWebServer(): void {
  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const method = (req.method ?? 'GET').toUpperCase()
    const rawUrl = req.url ?? '/'
    const queryStart = rawUrl.indexOf('?')
    const url = queryStart === -1 ? rawUrl : rawUrl.slice(0, queryStart)
    const queryString = queryStart === -1 ? '' : rawUrl.slice(queryStart + 1)
    const params = new URLSearchParams(queryString)
    const detailMatch = url.match(/^\/barcode_id\/(.+)$/)

    if (method === 'PUT' && detailMatch) {
      const barcodeId = decodeURIComponent(detailMatch[1])
      let requestBody = ''

      req.on('data', (chunk) => {
        requestBody += chunk.toString()
      })

      req.on('end', () => {
        try {
          const csvPath = getTransactionCsvPath()
          const csvContent = existsSync(csvPath) ? readFileSync(csvPath, 'utf-8') : ''
          const transactions = parseCSV(csvContent)
          const transaction = transactions.find((row) => row.barcodeId === barcodeId)

          if (!transaction) {
            res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify({ error: 'Not found', barcodeId }))
            return
          }

          const payload = (requestBody.trim() ? JSON.parse(requestBody) : {}) as TransactionUpdatePayload
          const now = new Date().toISOString()
          const scanningTime = payload.scanningTime?.trim() || ''
          const lodgementTime = payload.lodgementTime?.trim() || ''
          const parcelStatus = payload.parcelStatus?.trim() || ''

          if (scanningTime) {
            transaction.scanningTime = scanningTime
            transaction.timestamp = scanningTime
          }

          if (lodgementTime) {
            transaction.lodgementTime = lodgementTime
            transaction.endTransactionTime = lodgementTime
            transaction.timestamp = lodgementTime
          }

          if (parcelStatus) {
            transaction.parcelStatus = parcelStatus
          }

          if (parcelStatus === 'LODGEMENT_SCANNING' && !transaction.scanningTime) {
            transaction.scanningTime = now
            transaction.timestamp = now
          }

          if (parcelStatus === 'LODGEMENT_SUCCESS') {
            if (!transaction.lodgementTime) {
              transaction.lodgementTime = now
            }
            transaction.endTransactionTime = transaction.lodgementTime
            transaction.timestamp = transaction.lodgementTime
          }

          writeCSV(csvPath, transactions)

          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ success: true, transaction }, null, 2))
        } catch (err) {
          console.error('[WebServer] PUT update error:', err)
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ error: 'Invalid request payload' }))
        }
      })

      req.on('error', (err) => {
        console.error('[WebServer] PUT request error:', err)
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify({ error: 'Failed to read request body' }))
      })

      return
    }

    try {
      const csvPath = getTransactionCsvPath()
      const csvContent = existsSync(csvPath) ? readFileSync(csvPath, 'utf-8') : ''
      const transactions = parseCSV(csvContent)
      const transactionsForDisplay = [...transactions].reverse()

      // GET /vendor/jsbarcode.js — serve bundled JsBarcode library
      if (url === '/vendor/jsbarcode.js') {
        const vendorPath = getJsBarcodeVendorPath()
        if (!vendorPath) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
          res.end('JsBarcode vendor file not found')
          return
        }

        res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' })
        res.end(readFileSync(vendorPath))
        return
      }

      // GET /static/:file — serve files from resources/views/
      if (url.startsWith('/static/')) {
        const fileName = url.slice('/static/'.length)
        const filePath = join(getViewsDir(), fileName)
        if (!existsSync(filePath)) {
          res.writeHead(404, { 'Content-Type': 'text/plain' })
          res.end('Not found')
          return
        }
        const ext = fileName.split('.').pop() ?? ''
        const mime: Record<string, string> = {
          css: 'text/css; charset=utf-8',
          js: 'text/javascript; charset=utf-8',
          html: 'text/html; charset=utf-8'
        }
        res.writeHead(200, { 'Content-Type': mime[ext] ?? 'application/octet-stream' })
        res.end(readFileSync(filePath))
        return
      }

      // GET /
      if (url === '/' || url === '') {
        const html = renderIndexPage(transactionsForDisplay)
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(html)
        return
      }

      // GET /barcode_id/:id  and  /barcode_id/:id?format=json
      if (detailMatch) {
        const barcodeId = decodeURIComponent(detailMatch[1])
        const tx = transactions.find((t) => t.barcodeId === barcodeId)

        if (!tx) {
          if (params.get('format') === 'json') {
            res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify({ error: 'Not found', barcodeId }))
            return
          }
          const html = fillTemplate(loadTemplate('404.html'), { BARCODE_ID: esc(barcodeId) })
          res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
          res.end(html)
          return
        }

        let imageBase64: string | null = null
        const capturePath = getCapturePath(tx.uuid)
        if (capturePath) {
          imageBase64 = readFileSync(capturePath).toString('base64')
        }

        if (params.get('format') === 'json') {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ transaction: tx, imageBase64 }, null, 2))
          return
        }

        const html = renderDetailPage(tx, imageBase64)
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(html)
        return
      }

      // GET /:uuid  and  /:uuid?format=json
      const uuidMatch = url.match(/^\/([^\/]+)$/)
      if (uuidMatch) {
        const uuid = decodeURIComponent(uuidMatch[1])
        const tx = transactions.find((t) => t.uuid === uuid)

        if (!tx) {
          if (params.get('format') === 'json') {
            res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify({ error: 'Not found', uuid }))
            return
          }
          const html = fillTemplate(loadTemplate('404.html'), { BARCODE_ID: esc(uuid) })
          res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
          res.end(html)
          return
        }

        let imageBase64: string | null = null
        const capturePath = getCapturePath(tx.uuid)
        if (capturePath) {
          imageBase64 = readFileSync(capturePath).toString('base64')
        }

        if (params.get('format') === 'json') {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ transaction: tx, imageBase64 }, null, 2))
          return
        }

        const html = renderDetailPage(tx, imageBase64)
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(html)
        return
      }

      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end('Not found')
    } catch (err) {
      console.error('[WebServer] Request error:', err)
      res.writeHead(500, { 'Content-Type': 'text/plain' })
      res.end(`Internal server error: ${err}`)
    }
  })

  server.listen(WEB_SERVER_PORT, '0.0.0.0', () => {
    const ips = getLocalIPs()
    console.log('[WebServer] Transaction viewer started:')
    console.log(`  Local:   http://localhost:${WEB_SERVER_PORT}`)
    for (const ip of ips) {
      console.log(`  Network: http://${ip}:${WEB_SERVER_PORT}`)
    }
  })

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[WebServer] Port ${WEB_SERVER_PORT} is already in use.`)
    } else {
      console.error('[WebServer] Error:', err)
    }
  })
}
