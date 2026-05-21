import { useState, useEffect, useRef } from 'react'
import { ChevronRight, Timer, X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import ConfigPage from './pages/Config/Config'
import Header from './components/Header'
import WelcomeStep from './steps/WelcomeStep'
import DetectionStep from './steps/DetectionStep'
import ConfirmationStep from './steps/ConfirmationStep'
import AddressStep from './steps/AddressStep'
import VerifyStep from './steps/VerifyStep'
import PaymentStep from './steps/PaymentStep'
import SuccessStep from './steps/SuccessStep'
import { STEPS, IDLE_TIMEOUT_SEC, COUNTDOWN_SEC } from './constants'
import type { AddressRecord, ParcelData } from './types'

const App = (): React.JSX.Element => {
  const [currentStep, setCurrentStep] = useState(STEPS.WELCOME)
  const [detectedParcel, setDetectedParcel] = useState<ParcelData | null>(null)

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
    resetAddresses()
    setDetectedParcel(null)
    setShowTimeoutModal(false)
    setCurrentStep(STEPS.WELCOME)
  }

  const startIdleTimer = (): void => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    if (IDLE_TIMEOUT_SEC === 0) return
    if (currentStep === STEPS.WELCOME || currentStep === STEPS.SUCCESS) return

    idleTimerRef.current = setTimeout(() => {
      setShowTimeoutModal(true)
      setCountdown(COUNTDOWN_SEC)
    }, IDLE_TIMEOUT_SEC * 1000)
  }

  useEffect(() => {
    startIdleTimer()
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    }
  }, [currentStep])

  useEffect(() => {
    if (showTimeoutModal) {
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
            resetApp()
            return 0
          }
          return prev - 1
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
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col overflow-hidden select-none">
      <Header onLogoTap={handleLogoTap} />

      <main className="flex-1 flex flex-col relative bg-slate-50/50">
        <AnimatePresence mode="wait">
          {currentStep === STEPS.WELCOME && (
            <WelcomeStep key={STEPS.WELCOME} onStart={() => setCurrentStep(STEPS.DETECTION)} />
          )}

          {currentStep === STEPS.DETECTION && (
            <DetectionStep
              key={STEPS.DETECTION}
              onSuccess={(parcel) => {
                setDetectedParcel(parcel)
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
                setCurrentStep(STEPS.DETECTION)
              }}
              onConfirm={() => setCurrentStep(STEPS.SENDER)}
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
              onBack={() =>
                setCurrentStep(currentStep === STEPS.SENDER ? STEPS.CONFIRMATION : STEPS.SENDER)
              }
              onNext={() =>
                setCurrentStep(currentStep === STEPS.SENDER ? STEPS.RECIPIENT : STEPS.VERIFY)
              }
            />
          )}

          {currentStep === STEPS.VERIFY && (
            <VerifyStep
              key={STEPS.VERIFY}
              sender={sender}
              recipient={recipient}
              detectedParcel={detectedParcel}
              onBack={() => setCurrentStep(STEPS.RECIPIENT)}
              onNext={() => setCurrentStep(STEPS.PAYMENT)}
              onEditSender={() => setCurrentStep(STEPS.SENDER)}
              onEditRecipient={() => setCurrentStep(STEPS.RECIPIENT)}
            />
          )}

          {currentStep === STEPS.PAYMENT && (
            <PaymentStep
              key={STEPS.PAYMENT}
              detectedParcel={detectedParcel}
              onSuccess={() => setCurrentStep(STEPS.SUCCESS)}
              onBack={() => setCurrentStep(STEPS.VERIFY)}
            />
          )}

          {currentStep === STEPS.SUCCESS && (
            <SuccessStep key={STEPS.SUCCESS} onReset={resetApp} />
          )}
        </AnimatePresence>
      </main>

      {/* --- Config Page (hidden: tap logo 5×) --- */}
      <AnimatePresence>
        {showConfig && <ConfigPage onClose={() => setShowConfig(false)} />}
      </AnimatePresence>

      {/* --- Timeout Modal --- */}
      {showTimeoutModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md rounded-[32px] p-10 shadow-[0_40px_80px_rgba(0,0,0,0.2)] relative z-10 text-center border border-slate-200"
          >
            <div className="w-24 h-24 bg-red-50 text-[#E71921] rounded-[24px] flex items-center justify-center mx-auto mb-8 transform rotate-6 border-2 border-red-100 shadow-sm">
              <Timer size={40} strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-black text-[#003366] italic uppercase tracking-tighter mb-2 leading-none">
              Session Guard Active
            </h3>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-10">
              Terminal inactivity detected. Auto-purge in:
            </p>

            <div className="w-24 h-24 rounded-[32px] border-4 border-slate-100 bg-slate-50 flex items-center justify-center mx-auto mb-12 shadow-inner">
              <span className="text-4xl font-black text-[#003366] italic">{countdown}</span>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={stayActive}
                className="w-full bg-[#003366] text-white py-5 rounded-xl font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-blue-900/20 flex items-center justify-center gap-3 active:scale-95 transition-all cursor-pointer"
              >
                EXTEND SESSION <ChevronRight size={18} />
              </button>
              <button
                onClick={resetApp}
                className="w-full text-slate-400 font-bold uppercase text-[9px] tracking-[0.2em] hover:text-rose-500 flex items-center justify-center gap-2 py-3 transition-colors cursor-pointer"
              >
                <X size={14} /> PURGE DATA NOW
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <footer className="bg-white py-5 px-10 border-t border-slate-100 flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Node Status: Operational</span>
          </div>
          <span className="opacity-30">|</span>
          <span>PostalPulse Core Protocol v4.2.0</span>
        </div>
        <div className="flex gap-6 items-center">
          <span>Security Layer: AES-256</span>
          <span>© 2026 Unified Postal Systems</span>
        </div>
      </footer>
    </div>
  )
}

export default App
