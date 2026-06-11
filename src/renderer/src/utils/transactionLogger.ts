import type { AddressRecord, ParcelData } from '../types'

export interface SessionData {
  sender: AddressRecord
  recipient: AddressRecord
  parcel: ParcelData
}

/**
 * Log a completed session to the transaction CSV file
 */
export async function logSession(session: SessionData): Promise<void> {
  try {
    const timestamp = new Date().toISOString()
    const senderAddress = `${session.sender.street}, ${session.sender.city}, ${session.sender.state} ${session.sender.zip}`
    const recipientAddress = `${session.recipient.street}, ${session.recipient.city}, ${session.recipient.state} ${session.recipient.zip}`

    const record = {
      timestamp,
      senderName: session.sender.name,
      senderEmail: session.sender.email || '',
      senderAddress,
      recipientName: session.recipient.name,
      recipientAddress,
      parcelSize: session.parcel.size,
      parcelActualDimensions: session.parcel.actualDimensions,
      parcelWeight: session.parcel.weight,
      parcelPrice: session.parcel.price
    }

    await (window as any).api.logTransaction(record)
  } catch (error) {
    console.error('Failed to log session:', error)
  }
}
