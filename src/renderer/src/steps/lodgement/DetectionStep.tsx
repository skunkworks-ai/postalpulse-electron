import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RefreshCcw, HardDrive } from 'lucide-react'
import { motion } from 'motion/react'
import type { RootState } from '../../store'
import en from '../../translations/lodgement.en'

interface DetectionStepProps {
  barcodeId: string
  onSuccess: (transaction: LodgementTransaction) => void
  onFailure: (message: string) => void
}

interface LodgementTransaction {
  senderName?: string
  senderEmail?: string
  senderAddress?: string
  recipientName?: string
  recipientAddress?: string
  parcelSize?: string
  parcelActualDimensions?: string
  parcelWeight?: string | number
  parcelPrice?: string | number
}

interface BarcodeLookupResponse {
  transaction?: LodgementTransaction
  error?: string
}

const DetectionStep = ({ barcodeId, onSuccess, onFailure }: DetectionStepProps): React.JSX.Element => {
  const melpostBookingServerURL = useSelector((state: RootState) => state.config.melpostBookingServerURL)
  const copy = en.steps.detection

  useEffect(() => {
    let cancelled = false

    const lookupByBarcode = async (): Promise<void> => {
      if (!barcodeId.trim()) {
        onFailure('No barcode scanned. Please scan a valid barcode to continue.')
        return
      }

      const baseURL = melpostBookingServerURL.trim().replace(/\/+$/, '')
      if (!baseURL) {
        onFailure('Booking server URL is not configured. Please contact support.')
        return
      }

      try {
        const requestURL = `${baseURL}/barcode_id/${encodeURIComponent(barcodeId.trim())}?format=json`
        const bookingGet = window.api.bookingServerGet ?? window.api.googleMapsGet
        const payload = (await bookingGet({
          url: requestURL,
          method: 'GET'
        })) as BarcodeLookupResponse

        if (cancelled) return

        if (payload.error || !payload.transaction) {
          onFailure(`Booking not found for barcode ${barcodeId.trim()}. Please scan again.`)
          return
        }

        onSuccess(payload.transaction)
      } catch (error) {
        console.error('Failed barcode lookup:', error)
        if (!cancelled) {
          onFailure('Failed to validate barcode. Please scan again.')
        }
      }
    }

    void lookupByBarcode()

    return () => {
      cancelled = true
    }
  }, [barcodeId, melpostBookingServerURL, onFailure, onSuccess])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="kiosk-step flex-1 flex flex-col items-center justify-center p-6"
    >
      <div className="kiosk-card bg-white w-full max-w-xl rounded-4xl p-10 sm:p-16 shadow-[0_40px_80px_rgba(0,0,0,0.08)] border border-slate-200 text-center relative overflow-hidden">

        <div className="relative w-56 h-56 mx-auto flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-6 z-30 bg-white"
          >
            <RefreshCcw size={160} className="text-(--pp-brand-accent) animate-spin [animation-direction:reverse] stroke-1" />
            <HardDrive size={60} className="absolute translate-y-12 text-(--pp-brand-primary) stroke-2" />
            <h6 className="text-2xl font-black text-(--pp-brand-primary) font-varela-round">
              {copy.headingPrefix}
            </h6>
          </motion.div>
        </div>

        <div className="">
          <p
            className="font-bold text-gray-400 text-sm"
          >
            {copy.description}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export default DetectionStep
