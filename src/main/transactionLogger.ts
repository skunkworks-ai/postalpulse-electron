import { app } from 'electron'
import { join } from 'path'
import { appendFileSync, existsSync } from 'fs'

export interface TransactionRecord {
  timestamp: string
  senderName: string
  senderEmail: string
  senderAddress: string
  recipientName: string
  recipientAddress: string
  parcelSize: string
  parcelWeight: number
  parcelPrice: number
}

/**
 * Get the transactions CSV file path (same directory as config)
 */
export function getTransactionCsvPath(): string {
  const userDataPath = app.getPath('userData')
  return join(userDataPath, 'transaction.csv')
}

/**
 * Get CSV headers
 */
function getCSVHeaders(): string {
  return 'Timestamp,Sender Name,Sender Email,Sender Address,Recipient Name,Recipient Address,Parcel Size,Parcel Weight (lbs),Parcel Price ($)\n'
}

/**
 * Escape CSV fields to handle commas and quotes
 */
function escapeCSVField(field: string | number): string {
  if (field === null || field === undefined) {
    return ''
  }
  const stringField = String(field)
  if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
    return `"${stringField.replace(/"/g, '""')}"`
  }
  return stringField
}

/**
 * Convert a transaction record to a CSV row
 */
function recordToCSVRow(record: TransactionRecord): string {
  const fields = [
    record.timestamp,
    record.senderName,
    record.senderEmail,
    record.senderAddress,
    record.recipientName,
    record.recipientAddress,
    record.parcelSize,
    record.parcelWeight,
    record.parcelPrice
  ]
  return fields.map(escapeCSVField).join(',') + '\n'
}

/**
 * Log a transaction to the CSV file
 */
export function logTransaction(record: TransactionRecord): void {
  try {
    const filePath = getTransactionCsvPath()
    const fileExists = existsSync(filePath)

    // Write headers if file doesn't exist
    if (!fileExists) {
      appendFileSync(filePath, getCSVHeaders())
    }

    // Append the transaction record
    const csvRow = recordToCSVRow(record)
    appendFileSync(filePath, csvRow)
  } catch (error) {
    console.error('Failed to log transaction:', error)
  }
}
