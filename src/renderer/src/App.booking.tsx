import { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { ChevronRight, Timer, X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import bgImage from './assets/bg.png'
import ConfigPage from './pages/Config/Config'
import Header from './components/Header'
import StepIndicator from './components/StepIndicator'
import WelcomeStep from './steps/booking/WelcomeStep'
import DetectionStep from './steps/booking/DetectionStep'
import ConfirmationStep from './steps/booking/ConfirmationStep'
import AddressStep from './steps/booking/AddressStep'
import VerifyStep from './steps/booking/VerifyStep'
import PaymentStep from './steps/booking/PaymentStep'
import SuccessStep from './steps/booking/SuccessStep'
import { STEPS, IDLE_TIMEOUT_SEC, COUNTDOWN_SEC, USER_ACTIVITY_EVENT, PARCEL_STATUSES, MOCK_GOOGLE_MAPS } from './constants'
import type { RootState } from './store'
import type { AddressRecord, ParcelData } from './types'

interface BookingTransactionRecord {
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
  successTime: string
  timestamp: string
  senderName: string
  senderEmail: string
  senderAddress: string
  recipientName: string
  recipientAddress: string
  parcelSize: string
  parcelWeight: number
  parcelPrice: number
  loggedAt?: string
}

const formatAddress = (address: AddressRecord): string =>
  `${address.street}, ${address.city}, ${address.state} ${address.zip}`

const createBookingTransaction = (): BookingTransactionRecord => {
  const startTransactionTime = new Date().toISOString()
  const uuid = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`

  return {
    uuid,
    barcodeId: '', // Generate when payment succeeds
    startTransactionTime,
    endTransactionTime: '',
    parcelStatus: PARCEL_STATUSES.DETECTION,
    detectionTime: startTransactionTime,
    confirmationTime: '',
    senderTime: '',
    recipientTime: '',
    verifyTime: '',
    paymentTime: '',
    scanningTime: '',
    successTime: '',
    timestamp: startTransactionTime,
    senderName: '',
    senderEmail: '',
    senderAddress: '',
    recipientName: '',
    recipientAddress: '',
    parcelSize: '',
    parcelWeight: 0,
    parcelPrice: 0
  }
}

const BookingApp = (): React.JSX.Element => {
  const appName = 'MeldPOST Booking'
  const themeColors = useSelector((state: RootState) => state.config.colors)
  const googleMapsApiKey = useSelector((state: RootState) => state.config.googleMapsApiKey)
  const allowUnvalidatedAddress = !MOCK_GOOGLE_MAPS && !googleMapsApiKey?.trim()
  const [currentStep, setCurrentStep] = useState(STEPS.WELCOME)
  const [detectedParcel, setDetectedParcel] = useState<ParcelData | null>(null)
  const [manualAddressEntry, setManualAddressEntry] = useState(false)
  const [activeBarcodeId, setActiveBarcodeId] = useState('')
  const transactionRef = useRef<BookingTransactionRecord | null>(null)
  const loggingInFlightRef = useRef(false)

  const startBookingTransaction = (): void => {
    const transaction = createBookingTransaction()
    transactionRef.current = transaction
    loggingInFlightRef.current = false
    setActiveBarcodeId(transaction.barcodeId)
  }

  const clearBookingTransaction = (): void => {
    transactionRef.current = null
    loggingInFlightRef.current = false
    setActiveBarcodeId('')
  }

  const updateBookingTransaction = (patch: Partial<BookingTransactionRecord>): void => {
    if (!transactionRef.current) return
    transactionRef.current = {
      ...transactionRef.current,
      ...patch
    }
  }

  const markBookingStatus = (status: string): void => {
    if (!transactionRef.current) return
    const timestamp = new Date().toISOString()
    const patch: Partial<BookingTransactionRecord> = { parcelStatus: status }

    if (status === PARCEL_STATUSES.DETECTION) patch.detectionTime = timestamp
    if (status === PARCEL_STATUSES.CONFIRMATION) patch.confirmationTime = timestamp
    if (status === PARCEL_STATUSES.SENDER) patch.senderTime = timestamp
    if (status === PARCEL_STATUSES.RECIPIENT) patch.recipientTime = timestamp
    if (status === PARCEL_STATUSES.VERIFY) patch.verifyTime = timestamp
    if (status === PARCEL_STATUSES.PAYMENT) patch.paymentTime = timestamp
    if (status === PARCEL_STATUSES.SUCCESS) {
      patch.successTime = timestamp
      patch.endTransactionTime = timestamp
    }

    updateBookingTransaction(patch)
  }

  const finalizeBookingTransaction = async (): Promise<void> => {
    if (!transactionRef.current) return
    if (transactionRef.current.loggedAt || loggingInFlightRef.current) return

    loggingInFlightRef.current = true
    const timestamp = new Date().toISOString()
    
    // Generate barcode ID on success
    const barcodeId = transactionRef.current.uuid.replace(/-/g, '').slice(0, 16).toUpperCase()
    setActiveBarcodeId(barcodeId)
    
    const transaction = {
      ...transactionRef.current,
      barcodeId,
      parcelStatus: PARCEL_STATUSES.SUCCESS,
      successTime: timestamp,
      endTransactionTime: timestamp,
      timestamp,
      senderName: sender.name,
      senderEmail: sender.email || '',
      senderAddress: formatAddress(sender),
      recipientName: recipient.name,
      recipientAddress: formatAddress(recipient),
      parcelSize: detectedParcel?.size ?? '',
      parcelWeight: detectedParcel?.weight ?? 0,
      parcelPrice: detectedParcel?.price ?? 0
    }

    try {
      await (window as any).api.logTransaction(transaction)
      transactionRef.current = {
        ...transaction,
        loggedAt: new Date().toISOString()
      }
    } finally {
      loggingInFlightRef.current = false
    }
  }

  const abandonBookingTransaction = (): void => {
    if (!transactionRef.current) return
    if (transactionRef.current.loggedAt || loggingInFlightRef.current) return

    loggingInFlightRef.current = true

    // Capture all available state into the record before any cleanup
    const transaction = {
      ...transactionRef.current,
      senderName: sender.name,
      senderEmail: sender.email || '',
      senderAddress: sender.name ? formatAddress(sender) : '',
      recipientName: recipient.name,
      recipientAddress: recipient.name ? formatAddress(recipient) : '',
      parcelSize: detectedParcel?.size ?? transactionRef.current.parcelSize,
      parcelWeight: detectedParcel?.weight ?? transactionRef.current.parcelWeight,
      parcelPrice: detectedParcel?.price ?? transactionRef.current.parcelPrice
    }
    // Fire-and-forget — don't block the synchronous UI reset
    ;(window as any).api
      .logTransaction(transaction)
      .then(() => {
        if (transactionRef.current?.uuid === transaction.uuid) {
          transactionRef.current = {
            ...transaction,
            loggedAt: new Date().toISOString()
          }
        }
      })
      .catch((err: unknown) => {
        console.error('Failed to log abandoned transaction:', err)
      })
      .finally(() => {
        loggingInFlightRef.current = false
      })
  }

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

  const resetApp = (): void => {
    abandonBookingTransaction()
    resetAddresses()
    setDetectedParcel(null)
    setShowTimeoutModal(false)
    clearBookingTransaction()
    setCurrentStep(STEPS.WELCOME)
  }

  const startIdleTimer = (): void => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    if (idleRemainingIntervalRef.current) clearInterval(idleRemainingIntervalRef.current)
    idleDeadlineRef.current = null

    if (IDLE_TIMEOUT_SEC === 0) return
    if (currentStep === STEPS.WELCOME || currentStep === STEPS.SUCCESS) return

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
    rootStyle.setProperty('--pp-background', themeColors.background)
    rootStyle.setProperty('--pp-black', themeColors.black)
    rootStyle.setProperty('--pp-white', themeColors.white)
    rootStyle.setProperty('--pp-danger-dark', themeColors.dangerDark)
    rootStyle.setProperty('--pp-keyboard', themeColors.keyboard)
  }, [themeColors])

  return (
    <div className="kiosk-app min-h-screen bg-(--pp-background) text-slate-900 font-sans flex flex-col overflow-hidden select-none">
      <Header onLogoTap={handleLogoTap} />
      <StepIndicator currentStep={currentStep} />

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
            {currentStep === STEPS.WELCOME && (
              <WelcomeStep
                key={STEPS.WELCOME}
                onStart={() => {
                  startBookingTransaction()
                  setCurrentStep(STEPS.DETECTION)
                }}
              />
            )}

            {currentStep === STEPS.DETECTION && (
              <DetectionStep
                key={STEPS.DETECTION}
                onSuccess={(parcel) => {
                  setDetectedParcel(parcel)
                  updateBookingTransaction({
                    parcelSize: parcel.size,
                    parcelWeight: parcel.weight,
                    parcelPrice: parcel.price
                  })
                  markBookingStatus(PARCEL_STATUSES.CONFIRMATION)
                  
                  // Capture image from MJPEG stream
                  if (transactionRef.current) {
                    const config = (window as any).api.getConfig()
                    Promise.resolve(config).then((cfg: any) => {
                      if (cfg?.unisonAddressURL) {
                        const mjpegUrl = `${cfg.unisonAddressURL}/stream`
                        ;(window as any).api.captureMjpegFrame(mjpegUrl, transactionRef.current!.uuid)
                          .catch((err: any) => console.error('Image capture failed:', err))
                      }
                    })
                  }
                  
                  setCurrentStep(STEPS.CONFIRMATION)
                }}
              />
            )}

            {currentStep === STEPS.CONFIRMATION && (
              <ConfirmationStep
                key={STEPS.CONFIRMATION}
                detectedParcel={detectedParcel}
                onDiscard={() => {
                  resetAddresses()
                  clearBookingTransaction()
                  setCurrentStep(STEPS.DETECTION)
                }}
                onConfirm={() => {
                  markBookingStatus(PARCEL_STATUSES.SENDER)
                  setCurrentStep(STEPS.SENDER)
                }}
              />
            )}

            {(currentStep === STEPS.SENDER || currentStep === STEPS.RECIPIENT) && (
              <AddressStep
                key={currentStep}
                currentStep={currentStep}
                sender={sender}
                setSender={setSender}
                recipient={recipient}
                setRecipient={setRecipient}
                initialManualEntry={manualAddressEntry}
                onBack={() => {
                  if (currentStep === STEPS.SENDER) {
                    setManualAddressEntry(false)
                    setCurrentStep(STEPS.CONFIRMATION)
                  } else {
                    setCurrentStep(STEPS.SENDER)
                  }
                }}
                onNext={() => {
                  if (currentStep === STEPS.SENDER) {
                    markBookingStatus(PARCEL_STATUSES.RECIPIENT)
                    setCurrentStep(STEPS.RECIPIENT)
                  } else {
                    markBookingStatus(PARCEL_STATUSES.VERIFY)
                    setManualAddressEntry(false)
                    setCurrentStep(STEPS.VERIFY)
                  }
                }}
              />
            )}

            {currentStep === STEPS.VERIFY && (
              <VerifyStep
                key={STEPS.VERIFY}
                sender={sender}
                recipient={recipient}
                detectedParcel={detectedParcel}
                allowUnvalidatedAddress={allowUnvalidatedAddress}
                onBack={() => setCurrentStep(STEPS.RECIPIENT)}
                onNext={() => {
                  markBookingStatus(PARCEL_STATUSES.PAYMENT)
                  setCurrentStep(STEPS.PAYMENT)
                }}
                onEditSender={() => {
                  setManualAddressEntry(true)
                  setCurrentStep(STEPS.SENDER)
                }}
                onEditRecipient={() => {
                  setManualAddressEntry(true)
                  setCurrentStep(STEPS.RECIPIENT)
                }}
              />
            )}

            {currentStep === STEPS.PAYMENT && (
              <PaymentStep
                key={STEPS.PAYMENT}
                detectedParcel={detectedParcel}
                onSuccess={async () => {
                  markBookingStatus(PARCEL_STATUSES.PAYMENT)
                  await finalizeBookingTransaction()
                  setCurrentStep(STEPS.SUCCESS)
                }}
                onBack={() => setCurrentStep(STEPS.VERIFY)}
              />
            )}

            {currentStep === STEPS.SUCCESS && <SuccessStep key={STEPS.SUCCESS} barcodeId={activeBarcodeId} onReset={resetApp} />}
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

export default BookingApp
