import { useState, useEffect, useRef, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { ChevronRight, Timer, X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import bgImage from './assets/bg.png'
import ConfigPage from './pages/Config/Config'
import Header from './components/Header'
import StepIndicator from './components/StepIndicator'
import WelcomeStep from './steps/lodgement/WelcomeStep'
import DetectionStep from './steps/lodgement/DetectionStep'
import ConfirmationStep from './steps/lodgement/ConfirmationStep'
import ScanningStep from './steps/lodgement/ScanningStep'
import SuccessStep from './steps/lodgement/SuccessStep'
import { LODGEMENT_STEPS, IDLE_TIMEOUT_SEC, COUNTDOWN_SEC, USER_ACTIVITY_EVENT, BOX_SPECS } from './constants'
import type { RootState } from './store'
import { logSession } from './utils/transactionLogger'
import type { AddressRecord, ParcelData } from './types'

const METER_TO_INCH = 39.37007874
const INCH_TO_METER = 0.0254
const BARCODE_CLEAR_TIMEOUT_MS = 500

interface LodgementTransaction {
  barcodeId?: string
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

const parseDimensionsInInches = (dimensions: string): [number, number, number] | null => {
  const numbers = dimensions.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? []
  if (numbers.length < 3) return null
  const [length, width, height] = numbers
  if ([length, width, height].some((value) => !Number.isFinite(value) || value <= 0)) {
    return null
  }
  return [length, width, height]
}

const parseUSAddress = (fullAddress: string): { street: string; city: string; state: string; zip: string } => {
  const trimmed = fullAddress.trim()
  if (!trimmed) {
    return { street: '', city: '', state: '', zip: '' }
  }

  const segments = trimmed.split(',').map((segment) => segment.trim()).filter(Boolean)
  if (segments.length < 3) {
    return { street: trimmed, city: '', state: '', zip: '' }
  }

  const street = segments.slice(0, segments.length - 2).join(', ')
  const city = segments[segments.length - 2] ?? ''
  const stateZip = segments[segments.length - 1] ?? ''
  const stateZipMatch = stateZip.match(/^([A-Z]{2})\s+([A-Z0-9-]+)$/i)

  return {
    street,
    city,
    state: stateZipMatch?.[1]?.toUpperCase() ?? stateZip,
    zip: stateZipMatch?.[2] ?? ''
  }
}

const formatDimensionsInMeters = (length: number, width: number, height: number): string =>
  `${(length * INCH_TO_METER).toFixed(2)}m x ${(width * INCH_TO_METER).toFixed(2)}m x ${(height * INCH_TO_METER).toFixed(2)}m`

const LodgementApp = (): React.JSX.Element => {
  const appName = 'MeldPOST Lodgement'
  const themeColors = useSelector((state: RootState) => state.config.colors)
  const melpostBookingServerURL = useSelector((state: RootState) => state.config.melpostBookingServerURL)
  const [currentStep, setCurrentStep] = useState(LODGEMENT_STEPS.WELCOME)
  const [detectedParcel, setDetectedParcel] = useState<ParcelData | null>(null)
  const [scannedBarcodeId, setScannedBarcodeId] = useState('')
  const [scanError, setScanError] = useState<string | null>(null)
  const [manualAddressEntry, setManualAddressEntry] = useState(false)
  const barcodeBufferRef = useRef('')
  const barcodeClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lodgementSuccessSyncedBarcodeRef = useRef<string | null>(null)

  // Config page state
  const [showConfig, setShowConfig] = useState(false)
  const logoTapCountRef = useRef(0)
  const logoTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleLogoTap = (): void => {
    logoTapCountRef.current += 1
    if (logoTapTimerRef.current) clearTimeout(logoTapTimerRef.current)
    logoTapTimerRef.current = setTimeout(() => {
      logoTapCountRef.current = 0
    }, 1500)
    if (logoTapCountRef.current >= 5) {
      logoTapCountRef.current = 0
      if (logoTapTimerRef.current) clearTimeout(logoTapTimerRef.current)
      setShowConfig(true)
    }
  }

  // Timeout State
  const [showTimeoutModal, setShowTimeoutModal] = useState(false)
  const [countdown, setCountdown] = useState(COUNTDOWN_SEC)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const idleRemainingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const idleDeadlineRef = useRef<number | null>(null)
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Sender State
  const [sender, setSender] = useState<AddressRecord>({
    name: '',
    email: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    isValidated: false
  })

  // Recipient State
  const [recipient, setRecipient] = useState<AddressRecord>({
    name: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    isValidated: false
  })

  // --- Timeout Logic ---
  const resetAddresses = (): void => {
    setSender({ name: '', email: '', street: '', city: '', state: '', zip: '', isValidated: false })
    setRecipient({ name: '', street: '', city: '', state: '', zip: '', isValidated: false })
  }

  const startDetectionFromBarcode = (barcodeId: string): void => {
    setScanError(null)
    setScannedBarcodeId(barcodeId.trim().toUpperCase())
    setCurrentStep(LODGEMENT_STEPS.DETECTION)
  }

  const mapTransactionToState = (transaction: LodgementTransaction): void => {
    const normalizedSize = (transaction.parcelSize ?? '').trim().toUpperCase()
    const box = Object.values(BOX_SPECS).find((spec) => spec.name === normalizedSize) ?? BOX_SPECS.LARGE
    const weight = Number(transaction.parcelWeight)
    const price = Number(transaction.parcelPrice)
    const actualDimensions = (transaction.parcelActualDimensions ?? '').trim()
    const parsedActualDimensions = parseDimensionsInInches(actualDimensions)
    const actualDimensionsMetric = parsedActualDimensions
      ? formatDimensionsInMeters(parsedActualDimensions[0], parsedActualDimensions[1], parsedActualDimensions[2])
      : formatDimensionsInMeters(box.maxL, box.maxW, box.maxH)

    const senderAddress = parseUSAddress(transaction.senderAddress ?? '')
    const recipientAddress = parseUSAddress(transaction.recipientAddress ?? '')

    setSender({
      name: transaction.senderName ?? '',
      email: transaction.senderEmail ?? '',
      street: senderAddress.street,
      city: senderAddress.city,
      state: senderAddress.state,
      zip: senderAddress.zip,
      isValidated: true
    })

    setRecipient({
      name: transaction.recipientName ?? '',
      street: recipientAddress.street,
      city: recipientAddress.city,
      state: recipientAddress.state,
      zip: recipientAddress.zip,
      isValidated: true
    })

    const resolvedPrice = Number.isFinite(price) ? price : box.price
    setDetectedParcel({
      size: box.name,
      dimensions: `${box.maxL}" x ${box.maxW}" x ${box.maxH}"`,
      dimensionsMetric: formatDimensionsInMeters(box.maxL, box.maxW, box.maxH),
      actualDimensions: actualDimensions || `${box.maxL}" x ${box.maxW}" x ${box.maxH}"`,
      actualDimensionsMetric,
      weight: Number.isFinite(weight) ? weight : 0,
      boxPrice: box.price,
      price: resolvedPrice
    })
  }

  const resetApp = (): void => {
    setShowTimeoutModal(false)
    setScanError(null)
    setScannedBarcodeId('')
    lodgementSuccessSyncedBarcodeRef.current = null
    barcodeBufferRef.current = ''
    setCurrentStep(LODGEMENT_STEPS.WELCOME)
  }

  const updateLodgementTransaction = useCallback(async (patch: {
    parcelStatus: string
    scanningTime?: string
    lodgementTime?: string
  }): Promise<void> => {
    if (!scannedBarcodeId.trim()) return
    const baseURL = melpostBookingServerURL.trim().replace(/\/+$/, '')
    if (!baseURL) return

    const requestURL = `${baseURL}/barcode_id/${encodeURIComponent(scannedBarcodeId.trim())}?format=json`
    const bookingRequest = window.api.bookingServerGet ?? window.api.googleMapsGet

    try {
      await bookingRequest({
        url: requestURL,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
      })
    } catch (error) {
      console.error('Failed to update lodgement transaction:', error)
    }
  }, [melpostBookingServerURL, scannedBarcodeId])

  useEffect(() => {
    if (currentStep !== LODGEMENT_STEPS.SUCCESS) return
    if (!scannedBarcodeId.trim()) return
    if (lodgementSuccessSyncedBarcodeRef.current === scannedBarcodeId) return

    lodgementSuccessSyncedBarcodeRef.current = scannedBarcodeId
    const lodgementTime = new Date().toISOString()
    void updateLodgementTransaction({
      parcelStatus: 'LODGEMENT_SUCCESS',
      lodgementTime
    })
  }, [currentStep, scannedBarcodeId, updateLodgementTransaction])

  const startIdleTimer = (): void => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    if (idleRemainingIntervalRef.current) clearInterval(idleRemainingIntervalRef.current)
    idleDeadlineRef.current = null

    if (IDLE_TIMEOUT_SEC === 0) return
    if (currentStep === LODGEMENT_STEPS.WELCOME) return

    idleDeadlineRef.current = Date.now() + IDLE_TIMEOUT_SEC * 1000
    console.log(`[Idle Timer] ${IDLE_TIMEOUT_SEC}s remaining`)

    idleRemainingIntervalRef.current = setInterval(() => {
      if (!idleDeadlineRef.current) return
      const remainingSec = Math.max(0, Math.ceil((idleDeadlineRef.current - Date.now()) / 1000))
      console.log(`[Idle Timer] ${remainingSec}s remaining`)
      if (remainingSec <= 0 && idleRemainingIntervalRef.current) {
        clearInterval(idleRemainingIntervalRef.current)
        idleRemainingIntervalRef.current = null
      }
    }, 1000)

    idleTimerRef.current = setTimeout(() => {
      if (idleRemainingIntervalRef.current) {
        clearInterval(idleRemainingIntervalRef.current)
        idleRemainingIntervalRef.current = null
      }
      setShowTimeoutModal(true)
      setCountdown(COUNTDOWN_SEC)
    }, IDLE_TIMEOUT_SEC * 1000)
  }

  useEffect(() => {
    startIdleTimer()
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      if (idleRemainingIntervalRef.current) clearInterval(idleRemainingIntervalRef.current)
    }
  }, [currentStep])

  useEffect(() => {
    const resetIdleFromActivity = (): void => {
      if (showTimeoutModal) return
      startIdleTimer()
    }

    window.addEventListener(USER_ACTIVITY_EVENT, resetIdleFromActivity)
    document.addEventListener('keydown', resetIdleFromActivity, true)
    document.addEventListener('input', resetIdleFromActivity, true)

    return () => {
      window.removeEventListener(USER_ACTIVITY_EVENT, resetIdleFromActivity)
      document.removeEventListener('keydown', resetIdleFromActivity, true)
      document.removeEventListener('input', resetIdleFromActivity, true)
    }
  }, [currentStep, showTimeoutModal])

  useEffect(() => {
    if (showTimeoutModal) {
      console.log(`[Timeout Countdown] ${COUNTDOWN_SEC}s remaining`)
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
            resetApp()
            return 0
          }
          const next = prev - 1
          console.log(`[Timeout Countdown] ${next}s remaining`)
          return next
        })
      }, 1000)
    } else {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    }

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    }
  }, [showTimeoutModal])

  const stayActive = (): void => {
    setShowTimeoutModal(false)
    startIdleTimer()
  }

  useEffect(() => {
    const rootStyle = document.documentElement.style
    rootStyle.setProperty('--pp-brand-primary', themeColors.brandPrimary)
    rootStyle.setProperty('--pp-brand-primary-dark', themeColors.brandPrimaryDark)
    rootStyle.setProperty('--pp-brand-accent', themeColors.brandAccent)
    rootStyle.setProperty('--pp-brand-accent-dark', themeColors.brandAccentDark)
    rootStyle.setProperty('--pp-background', themeColors.background)
    rootStyle.setProperty('--pp-black', themeColors.black)
    rootStyle.setProperty('--pp-white', themeColors.white)
    rootStyle.setProperty('--pp-danger-dark', themeColors.dangerDark)
    rootStyle.setProperty('--pp-keyboard', themeColors.keyboard)
  }, [themeColors])

  useEffect(() => {
    if (currentStep !== LODGEMENT_STEPS.WELCOME) return

    const clearBarcodeBufferLater = (): void => {
      if (barcodeClearTimerRef.current) clearTimeout(barcodeClearTimerRef.current)
      barcodeClearTimerRef.current = setTimeout(() => {
        barcodeBufferRef.current = ''
      }, BARCODE_CLEAR_TIMEOUT_MS)
    }

    const handleBarcodeScanInput = (event: KeyboardEvent): void => {
      if (event.key === 'Enter') {
        const value = barcodeBufferRef.current.trim()
        barcodeBufferRef.current = ''
        if (value) {
          event.preventDefault()
          startDetectionFromBarcode(value)
        }
        return
      }

      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        barcodeBufferRef.current += event.key
        clearBarcodeBufferLater()
      }
    }

    window.addEventListener('keydown', handleBarcodeScanInput)
    return () => {
      window.removeEventListener('keydown', handleBarcodeScanInput)
      if (barcodeClearTimerRef.current) {
        clearTimeout(barcodeClearTimerRef.current)
        barcodeClearTimerRef.current = null
      }
      barcodeBufferRef.current = ''
    }
  }, [currentStep])

  return (
    <div className="kiosk-app min-h-screen bg-(--pp-background) text-slate-900 font-sans flex flex-col overflow-hidden select-none">
      <Header onLogoTap={handleLogoTap} />
      {/* <StepIndicator currentStep={currentStep} /> */}

      <main className="kiosk-stage flex-1 flex flex-col relative bg-slate-50/50 overflow-hidden z-10">
        <div id="background-image" className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center z-0">
          <img
            src={bgImage}
            alt=""
            aria-hidden="true"
            className="w-full max-w-none object-contain translate-y-8 select-none scale-180 origin-center opacity-50"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-full bg-linear-to-b from-(--pp-background) via-white/20 to-transparent scale-180 origin-center z-10" />
        </div>

        <div id="container" className="z-1 flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            {currentStep === LODGEMENT_STEPS.WELCOME && (
              <WelcomeStep
                key={LODGEMENT_STEPS.WELCOME}
                scanError={scanError}
                onStart={() => {
                  setScanError('Please scan a booking barcode to continue.')
                }}
              />
            )}
            {currentStep === LODGEMENT_STEPS.DETECTION && (
              <DetectionStep
                key={LODGEMENT_STEPS.DETECTION}
                barcodeId={scannedBarcodeId}
                onSuccess={(transaction) => {
                  mapTransactionToState(transaction)
                  setCurrentStep(LODGEMENT_STEPS.CONFIRMATION)
                }}
                onFailure={(message) => {
                  setScanError(message)
                  setCurrentStep(LODGEMENT_STEPS.WELCOME)
                }}
              />
            )}
            {currentStep === LODGEMENT_STEPS.CONFIRMATION && (
              <ConfirmationStep
                key={LODGEMENT_STEPS.CONFIRMATION}
                onConfirm={() => setCurrentStep(LODGEMENT_STEPS.SCANNING)}
                onDiscard={() => {
                  setScanError(null)
                  setScannedBarcodeId('')
                  lodgementSuccessSyncedBarcodeRef.current = null
                  setDetectedParcel(null)
                  resetAddresses()
                  setCurrentStep(LODGEMENT_STEPS.WELCOME)
                }}
                detectedParcel={detectedParcel}
                sender={sender}
                recipient={recipient}
              />
            )}
            {currentStep === LODGEMENT_STEPS.SCANNING && (
              <ScanningStep
                key={LODGEMENT_STEPS.SCANNING}
                onSuccess={() => {
                  const scanningTime = new Date().toISOString()
                  void updateLodgementTransaction({
                    parcelStatus: 'LODGEMENT_SCANNING',
                    scanningTime
                  })
                  setCurrentStep(LODGEMENT_STEPS.SUCCESS)
                }} />
            )}
            {currentStep === LODGEMENT_STEPS.SUCCESS && (
              <SuccessStep
                key={LODGEMENT_STEPS.SUCCESS}
                onReset={() => {
                  setScanError(null)
                  setScannedBarcodeId('')
                  lodgementSuccessSyncedBarcodeRef.current = null
                  setDetectedParcel(null)
                  resetAddresses()
                  setCurrentStep(LODGEMENT_STEPS.WELCOME)
                }}
              />
            )}
            
          </AnimatePresence>
        </div>
      </main>

      {/* --- Config Page (hidden: tap logo 5×) --- */}
      <AnimatePresence>{showConfig && <ConfigPage onClose={() => setShowConfig(false)} />}</AnimatePresence>

      {/* --- Timeout Modal --- */}
      {showTimeoutModal && (
        <div className="fixed inset-0 z-999 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="kiosk-card bg-white w-full max-w-md rounded-4xl p-10 shadow-[0_40px_80px_rgba(0,0,0,0.2)] relative z-10 text-center border border-slate-200"
          >
            <div className="w-24 h-24  text-(--pp-brand-accent) rounded-3xl flex items-center justify-center mx-auto mb-8 transform ">
              <Timer size={80} strokeWidth={2.5} />
            </div>
            <h3 className="kiosk-title text-2xl font-black text-(--pp-brand-primary) tracking-tighter mb-2 leading-none font-varela-round">
              Your session is about to expire
            </h3>
            <p className="kiosk-subtext text-slate-400 font-bold text-xs uppercase tracking-widest mb-10">
              You'll be returned to the welcome screen, tap "Extend Session" to stay active.
            </p>

            <div className="w-24 h-24 rounded-4xl flex items-center justify-center mx-auto mb-12">
              <span className="text-8xl font-black text-(--pp-brand-primary) font-varela-round">{countdown}</span>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={stayActive}
                className="w-full bg-(--pp-brand-primary) text-white py-5 rounded-xl font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-blue-900/20 flex items-center justify-center gap-3 active:scale-95 transition-all cursor-pointer"
              >
                EXTEND SESSION <ChevronRight size={18} />
              </button>
              <button
                onClick={resetApp}
                className="w-full text-slate-400 font-bold uppercase text-[9px] tracking-[0.2em] hover:text-rose-500 flex items-center justify-center gap-2 py-3 transition-colors cursor-pointer"
              >
                <X size={14} /> End Session
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <footer className="bg-white py-5 px-10 border-t border-slate-100 flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] z-1">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Node Status: Operational</span>
          </div>
          <span className="opacity-30">|</span>
          <span>{appName} Core Protocol v0.0.0</span>
        </div>
        <div className="flex gap-6 items-center">
          <span>Security Layer: AES-256</span>
          <span>© 2026 meldCX</span>
        </div>
      </footer>
    </div>
  )
}

export default LodgementApp
