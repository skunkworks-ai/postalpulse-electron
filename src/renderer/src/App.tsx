import { useState, useEffect, useRef } from 'react'
import {
  ChevronRight,
  Scan,
  Weight,
  CreditCard,
  CheckCircle2,
  RefreshCcw,
  Truck,
  Mail,
  Navigation,
  Search,
  MapPin,
  Edit2,
  Undo2,
  FileText,
  ShieldCheck,
  Timer,
  X,
  Move,
  QrCode,
  Printer,
  Maximize
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import ControlledInput from './contexts/KeyboardProvider/ControlledInput'
import ConfigPage from './pages/Config/Config'

// --- Constants & Config ---
const BOX_SPECS = {
  SMALL: { name: 'SMALL FLAT RATE', maxL: 8.7, maxW: 5.5, maxH: 1.7, maxWeight: 1, price: 10.2 },
  MEDIUM: { name: 'MEDIUM FLAT RATE', maxL: 11.3, maxW: 8.8, maxH: 6.0, maxWeight: 3, price: 17.1 },
  LARGE: { name: 'LARGE FLAT RATE', maxL: 12.3, maxW: 12.0, maxH: 6.0, maxWeight: 5, price: 22.8 }
}

const STEPS = {
  WELCOME: 'WELCOME',
  DETECTION: 'DETECTION',
  CONFIRMATION: 'CONFIRMATION',
  SENDER: 'SENDER',
  RECIPIENT: 'RECIPIENT',
  VERIFY: 'VERIFY',
  PAYMENT: 'PAYMENT',
  SUCCESS: 'SUCCESS'
}

const IDLE_TIMEOUT_SEC = 60
const COUNTDOWN_SEC = 10

const MOCK_ADDRESSES = [
  {
    full: '1600 Pennsylvania Avenue NW, Washington, DC 20500',
    street: '1600 Pennsylvania Avenue NW',
    city: 'Washington',
    state: 'DC',
    zip: '20500'
  },
  {
    full: '221B Baker Street, London, OH 43140',
    street: '221B Baker Street',
    city: 'London',
    state: 'OH',
    zip: '43140'
  },
  {
    full: '742 Evergreen Terrace, Springfield, IL 62704',
    street: '742 Evergreen Terrace',
    city: 'Springfield',
    state: 'IL',
    zip: '62704'
  },
  {
    full: '123 Main St, New York, NY 10001',
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    zip: '10001'
  },
  {
    full: '456 Ocean Drive, Miami, FL 33139',
    street: '456 Ocean Drive',
    city: 'Miami',
    state: 'FL',
    zip: '33139'
  }
]

interface AddressSuggestion {
  full: string
  street: string
  city: string
  state: string
  zip: string
}

interface AddressRecord {
  name: string
  email?: string
  street: string
  city: string
  state: string
  zip: string
  isValidated: boolean
}

interface ParcelData {
  size: string
  dimensions: string
  weight: number
  price: number
}

// --- Static UI Components ---
const PriorityStripes = (): React.JSX.Element => (
  <div className="flex w-full h-2 overflow-hidden">
    {[...Array(30)].map((_, i) => (
      <div key={i} className="flex flex-1">
        <div className="flex-1 bg-[#003366] -skew-x-12 mx-[0.5px]" />
        <div className="flex-1 bg-[#E71921] -skew-x-12 mx-[0.5px]" />
      </div>
    ))}
  </div>
)

const Header = ({ onLogoTap }: { onLogoTap?: () => void }): React.JSX.Element => (
  <header className="w-full bg-white border-b border-slate-200 shadow-sm relative z-50">
    <div className="py-4 px-8 flex justify-between items-center max-w-7xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 bg-[#003366] rounded flex items-center justify-center overflow-hidden shadow-lg shadow-blue-900/20 cursor-pointer select-none"
          onClick={onLogoTap}
        >
          <Navigation className="text-white fill-current w-7 h-7 -rotate-45" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[#003366] leading-none italic tracking-tighter">
            POSTAL<span className="text-[#E71921]">PULSE</span>
          </h1>
          <p className="text-[9px] tracking-[0.2em] text-[#003366] font-bold uppercase mt-1">
            Official Service Point
          </p>
        </div>
      </div>
      <div className="flex items-center gap-6 text-sm font-semibold text-slate-500">
        <div className="bg-blue-50 border border-blue-100 text-[#003366] px-4 py-1.5 rounded-md text-xs font-bold uppercase">
          Verified Hub
        </div>
        <div className="w-8 h-8 bg-slate-100 rounded-full border border-slate-200 flex items-center justify-center cursor-pointer overflow-hidden">
          <div className="w-4 h-4 bg-slate-400 rounded-sm rotate-45"></div>
        </div>
      </div>
    </div>
    <PriorityStripes />
  </header>
)

const App = (): React.JSX.Element => {
  const [currentStep, setCurrentStep] = useState(STEPS.WELCOME)
  const [detectionProgress, setDetectionProgress] = useState(0)
  const [detectionError, setDetectionError] = useState(false)
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

  // Payment States
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)

  // Timeout State
  const [showTimeoutModal, setShowTimeoutModal] = useState(false)
  const [countdown, setCountdown] = useState(COUNTDOWN_SEC)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Shared Form State
  const [isManualEntry, setIsManualEntry] = useState(false)
  const [addressSearch, setAddressSearch] = useState('')
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])

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
  const resetApp = (): void => {
    setSender({ name: '', email: '', street: '', city: '', state: '', zip: '', isValidated: false })
    setRecipient({ name: '', street: '', city: '', state: '', zip: '', isValidated: false })
    setAddressSearch('')
    setDetectedParcel(null)
    setDetectionProgress(0)
    setDetectionError(false)
    setIsManualEntry(false)
    setSuggestions([])
    setShowTimeoutModal(false)
    setIsProcessing(false)
    setIsPrinting(false)
    setCurrentStep(STEPS.WELCOME)
  }

  const startIdleTimer = (): void => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    if (currentStep === STEPS.WELCOME || currentStep === STEPS.SUCCESS) return

    idleTimerRef.current = setTimeout(() => {
      setShowTimeoutModal(true)
      setCountdown(COUNTDOWN_SEC)
    }, IDLE_TIMEOUT_SEC * 1000)
  }

  useEffect(() => {
    const handleActivity = (): void => {
      if (!showTimeoutModal) {
        startIdleTimer()
      }
    }

    window.addEventListener('mousemove', handleActivity)
    window.addEventListener('mousedown', handleActivity)
    window.addEventListener('keypress', handleActivity)
    window.addEventListener('touchstart', handleActivity)

    startIdleTimer()

    return () => {
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('mousedown', handleActivity)
      window.removeEventListener('keypress', handleActivity)
      window.removeEventListener('touchstart', handleActivity)
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    }
  }, [currentStep, showTimeoutModal])

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
    startIdleTimer()
  }

  // --- Detection Logic ---
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (currentStep === STEPS.DETECTION && !detectionError) {
      setDetectionProgress(0)
      interval = setInterval(() => {
        setDetectionProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            handleDetectionSuccess()
            return 100
          }
          return prev + 2
        })
      }, 40)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [currentStep, detectionError])

  const handleDetectionSuccess = (): void => {
    const mockData: ParcelData = {
      size: 'MEDIUM FLAT RATE',
      dimensions: '11.25" x 8.75" x 6.0"',
      weight: 1.45,
      price: BOX_SPECS.MEDIUM.price
    }
    setDetectedParcel(mockData)
    setCurrentStep(STEPS.CONFIRMATION)
  }

  // --- Payment Logic ---
  const handlePayment = (): void => {
    setIsProcessing(true)
    // Simulate authorization
    setTimeout(() => {
      setIsProcessing(false)
      setIsPrinting(true)
      // Simulate printer warmup
      setTimeout(() => {
        setIsPrinting(false)
        setCurrentStep(STEPS.SUCCESS)
      }, 2000)
    }, 3500)
  }

  const handleAddressSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value
    setAddressSearch(value)
    if (value.length > 2) {
      const filtered = MOCK_ADDRESSES.filter((addr) =>
        addr.full.toLowerCase().includes(value.toLowerCase())
      )
      setSuggestions(filtered)
    } else {
      setSuggestions([])
    }
  }

  const selectAddress = (addr: AddressSuggestion): void => {
    const updateFn = currentStep === STEPS.SENDER ? setSender : setRecipient
    updateFn((prev) => ({
      ...prev,
      street: addr.street,
      city: addr.city,
      state: addr.state,
      zip: addr.zip,
      isValidated: true
    }))
    setAddressSearch(addr.full)
    setSuggestions([])
    setIsManualEntry(false)
  }

  const handleFormInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'sender' | 'recipient'
  ): void => {
    const { name, value } = e.target
    const updateFn = type === 'sender' ? setSender : setRecipient
    updateFn((prev) => ({ ...prev, [name]: value, isValidated: false }))
  }

  const resetDetection = (): void => {
    setDetectionError(false)
    setDetectionProgress(0)
    setCurrentStep(STEPS.DETECTION)
  }

  const goToNextStep = (): void => {
    if (currentStep === STEPS.SENDER) {
      setAddressSearch('')
      setIsManualEntry(false)
      setCurrentStep(STEPS.RECIPIENT)
    } else if (currentStep === STEPS.RECIPIENT) {
      setCurrentStep(STEPS.VERIFY)
    } else if (currentStep === STEPS.VERIFY) {
      setCurrentStep(STEPS.PAYMENT)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col overflow-hidden select-none">
      <Header onLogoTap={handleLogoTap} />

      <main className="flex-1 flex flex-col relative bg-slate-50/50">
        <AnimatePresence mode="wait">
          {/* Step: WELCOME */}
          {currentStep === STEPS.WELCOME && (
            <motion.div
              key={STEPS.WELCOME}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex-1 flex items-center justify-center p-6"
            >
              <div className="bg-white w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[550px] border border-slate-100">
                <div className="flex-1 p-16 flex flex-col justify-center space-y-8 relative">
                  <div className="space-y-4">
                    <div className="inline-block bg-[#003366]/10 text-[#003366] px-3 py-1 rounded text-xs font-black uppercase tracking-[0.2em]">
                      Delivering for America
                    </div>
                    <h2 className="text-6xl font-black text-[#003366] leading-[1.1] italic tracking-tighter">
                      THE NEXT <br />
                      <span className="text-[#E71921]">LOGISTICS ERA.</span>
                    </h2>
                    <p className="text-slate-500 text-xl max-w-md font-medium leading-relaxed">
                      Automated parcel verification and instant postage generation for everyone.
                    </p>
                  </div>

                  <button
                    onClick={() => setCurrentStep(STEPS.DETECTION)}
                    className="w-fit bg-[#003366] hover:bg-[#002244] text-white px-10 py-5 rounded-xl font-black text-xl flex items-center gap-4 transition-all hover:translate-x-2 active:scale-95 shadow-xl shadow-blue-900/20"
                  >
                    START SHIPMENT <ChevronRight strokeWidth={3} />
                  </button>
                </div>

                <div className="hidden md:block w-[40%] bg-[#F1F5F9] relative overflow-hidden p-12 flex flex-col justify-center border-l border-slate-100">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Navigation size={240} className="-rotate-45" />
                  </div>
                  <motion.div
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 3 }}
                    className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 relative z-10"
                  >
                    <div className="flex items-center gap-3 mb-4 border-b-2 border-[#003366]/10 pb-4">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <Mail className="text-[#003366]" size={20} />
                      </div>
                      <div className="h-2 w-24 bg-slate-100 rounded-full" />
                    </div>
                    <div className="space-y-2 mb-6">
                      <div className="h-3 w-full bg-slate-100 rounded" />
                      <div className="h-3 w-3/4 bg-slate-100 rounded" />
                    </div>
                    <div className="flex justify-between items-center bg-blue-50 p-2 rounded">
                      <div className="w-8 h-8 bg-white rounded shadow-sm" />
                      <div className="h-2 w-20 bg-[#003366]/20 rounded-full" />
                    </div>
                  </motion.div>
                  <div className="mt-8 flex gap-2 justify-center opacity-30">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#003366]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step: DETECTION */}
          {currentStep === STEPS.DETECTION && (
            <motion.div
              key={STEPS.DETECTION}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 flex flex-col items-center justify-center p-6 space-y-10"
            >
              <div className="text-center space-y-3">
                <h2
                  className={`text-4xl font-black italic uppercase tracking-tighter ${detectionError ? 'text-[#E71921]' : 'text-[#003366]'}`}
                >
                  {detectionError ? 'Alignment Error' : 'Automatic Sensing'}
                </h2>
                <div className="h-1.5 w-24 bg-[#E71921] mx-auto rounded-full" />
                <p className="text-slate-500 font-bold text-sm uppercase tracking-widest max-w-md">
                  {detectionError
                    ? 'Please reposition your parcel.'
                    : 'Optical array is analyzing parcel volume.'}
                </p>
              </div>

              <div className="relative">
                <div
                  className={`w-[400px] h-[480px] rounded-[40px] overflow-hidden border-[12px] transition-all duration-500 relative shadow-2xl ${
                    detectionError
                      ? 'border-red-500 bg-red-50 scale-105'
                      : 'border-white bg-slate-100 shadow-blue-900/10'
                  }`}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    {detectionError ? (
                      <div className="text-center p-10 space-y-6">
                        <motion.div
                          animate={{ y: [0, -10, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="w-20 h-20 bg-red-100 text-[#E71921] rounded-full flex items-center justify-center mx-auto"
                        >
                          <Move className="w-12 h-12" />
                        </motion.div>
                        <div className="space-y-2">
                          <p className="text-lg font-black text-[#003366] uppercase italic tracking-tighter">
                            Detection Failed
                          </p>
                          <p className="text-sm font-bold text-slate-500 italic">
                            Please align your parcel with the markings on the scale surface.
                          </p>
                        </div>
                        <button
                          onClick={resetDetection}
                          className="bg-[#003366] text-white px-8 py-3 rounded-xl font-black uppercase text-sm shadow-lg hover:bg-black transition-all"
                        >
                          RESTART SCAN
                        </button>
                      </div>
                    ) : (
                      <div className="relative w-full h-full bg-[#001122]">
                        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:20px_20px]" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-44 bg-white rounded shadow-2xl flex flex-col justify-between p-1 overflow-hidden transition-all duration-300">
                          <div className="flex-1 bg-[#F1F5F9] border border-slate-200 rounded-sm flex flex-col items-center justify-center">
                            <div className="text-[12px] font-black text-[#003366] italic">
                              PRIORITY MAIL
                            </div>
                            <div className="text-[7px] font-bold text-[#E71921] uppercase">
                              Verified Tier
                            </div>
                          </div>
                        </div>
                        <motion.div
                          className="absolute top-0 left-0 w-full h-1 bg-[#E71921] shadow-[0_0_20px_#E71921]"
                          animate={{ top: ['0%', '100%', '0%'] }}
                          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                {!detectionError && (
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-[#003366] px-8 py-3 rounded-2xl shadow-xl border-4 border-white flex items-center gap-4">
                    <span className="text-sm font-black text-white uppercase tracking-widest">
                      {detectionProgress}% MAPPING
                    </span>
                  </div>
                )}
              </div>
              {!detectionError && (
                <button
                  onClick={() => setDetectionError(true)}
                  className="text-slate-300 hover:text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] cursor-pointer transition-colors"
                >
                  Debug: Trigger Visibility Error
                </button>
              )}
            </motion.div>
          )}

          {/* Step: CONFIRMATION */}
          {currentStep === STEPS.CONFIRMATION && (
            <motion.div
              key={STEPS.CONFIRMATION}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex-1 flex flex-col items-center justify-center p-6"
            >
              <div className="bg-white w-full max-w-xl rounded-[32px] p-12 shadow-2xl shadow-slate-200/50 border border-slate-200 relative">
                <div className="absolute -top-4 left-10 bg-[#003366] text-white px-5 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-blue-900/20">
                  Metric Confirmation
                </div>
                <h3 className="text-2xl font-black text-[#003366] italic tracking-tighter uppercase mb-10">
                  Analysis Finalized
                </h3>

                <div className="space-y-4">
                  <div className="p-6 bg-slate-50/50 rounded-[24px] border border-slate-100 flex items-center justify-between transition-colors hover:bg-slate-50">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-white shadow-sm border border-slate-200 rounded-2xl flex items-center justify-center text-[#003366]">
                        <Scan size={26} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          Volumetric Class
                        </p>
                        <p className="text-lg font-black text-[#003366] italic uppercase">{detectedParcel?.size}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-50/50 rounded-[24px] border border-slate-100 flex items-center justify-between transition-colors hover:bg-slate-50">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-white shadow-sm border border-slate-200 rounded-2xl flex items-center justify-center text-[#E71921]">
                        <Maximize size={26} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          Spatial Dimensions
                        </p>
                        <p className="text-lg font-black text-[#003366]">
                          {detectedParcel?.dimensions}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-50/50 rounded-[24px] border border-slate-100 flex items-center justify-between transition-colors hover:bg-slate-50">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-white shadow-sm border border-slate-200 rounded-2xl flex items-center justify-center text-sky-600">
                        <Weight size={26} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          Mass Density
                        </p>
                        <p className="text-lg font-black text-[#003366]">
                          {detectedParcel?.weight} LBS
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-10 flex justify-between items-end border-b border-slate-100 pb-8 mt-4">
                    <div>
                      <p className="font-bold uppercase text-[10px] text-slate-400 tracking-[0.2em]">
                        Total Tariff
                      </p>
                      <p className="text-4xl font-black text-[#003366] mt-1 tracking-tighter italic">
                        ${detectedParcel?.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-lg text-[10px] font-black border border-emerald-100 uppercase italic">
                      Rate Confirmed
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <button
                      onClick={() => setCurrentStep(STEPS.DETECTION)}
                      className="bg-white text-slate-600 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest border-2 border-slate-200 hover:border-[#E71921] hover:text-[#E71921] transition-all cursor-pointer"
                    >
                      Discard
                    </button>
                    <button
                      onClick={() => setCurrentStep(STEPS.SENDER)}
                      className="bg-[#003366] text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-900/10 flex items-center justify-center gap-2 hover:bg-[#002244] transition-all cursor-pointer"
                    >
                      Set Destination <ChevronRight size={16} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step: SENDER & RECIPIENT */}
          {(currentStep === STEPS.SENDER || currentStep === STEPS.RECIPIENT) && (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="flex-1 flex flex-col items-center justify-center p-6"
            >
              <div className="bg-white w-full max-w-2xl rounded-[32px] p-12 shadow-2xl shadow-slate-200/50 border border-slate-200 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-slate-100">
                  <motion.div
                    className="h-full bg-[#003366]"
                    animate={{ width: currentStep === STEPS.SENDER ? '50%' : '100%' }}
                    transition={{ duration: 0.6, ease: 'circOut' }}
                  />
                </div>

                <div className="flex items-center justify-between mb-12">
                  <div className="flex items-center gap-5">
                    <div
                      className={`w-14 h-14 ${currentStep === STEPS.SENDER ? 'bg-[#003366] shadow-blue-900/20' : 'bg-[#E71921] shadow-red-900/20'} text-white rounded-2xl flex items-center justify-center shadow-xl transition-all duration-500`}
                    >
                      {currentStep === STEPS.SENDER ? <Undo2 size={26} /> : <Truck size={26} />}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-[#003366] italic tracking-tighter uppercase">
                        {currentStep === STEPS.SENDER ? 'Origin Intel' : 'Delivery Node'}
                      </h3>
                      <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">
                        Section {currentStep === STEPS.SENDER ? 'A' : 'B'} of Protocol
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                      Entity Identifier
                    </label>
                    <ControlledInput
                      name="name"
                      value={currentStep === STEPS.SENDER ? sender.name : recipient.name}
                      setValue={(val) => {
                        const updateFn = currentStep === STEPS.SENDER ? setSender : setRecipient
                        updateFn((prev) => ({ ...prev, name: val, isValidated: false }))
                      }}
                      placeholder={
                        currentStep === STEPS.SENDER ? 'Sender ID / Name' : 'Recipient ID / Name'
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600/30 focus:outline-none font-semibold text-slate-900 transition-all placeholder:text-slate-300"
                    />
                  </div>

                  {!isManualEntry ? (
                    <div className="space-y-2 relative">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                        Global Address Registry
                      </label>
                      <div className="relative">
                        <Search
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                          size={18}
                        />
                        <ControlledInput
                          value={addressSearch}
                          setValue={setAddressSearch}
                          onChange={handleAddressSearch}
                          placeholder="Search global coordinates..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 pl-12 focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600/30 focus:outline-none font-semibold text-slate-900 transition-all placeholder:text-slate-300"
                        />
                      </div>

                      {suggestions.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-200 overflow-hidden z-[100]"
                        >
                          {suggestions.map((addr, i) => (
                            <button
                              key={i}
                              onClick={() => selectAddress(addr)}
                              className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 border-b border-slate-100 text-left transition-colors cursor-pointer group"
                            >
                              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
                                <MapPin size={16} />
                              </div>
                              <span className="font-semibold text-slate-600 group-hover:text-slate-900 text-sm transition-colors">
                                {addr.full}
                              </span>
                            </button>
                          ))}
                        </motion.div>
                      )}

                      <button
                        onClick={() => setIsManualEntry(true)}
                        className="text-[10px] font-bold text-indigo-600 uppercase hover:text-indigo-700 flex items-center gap-1.5 mt-2 transition-all cursor-pointer"
                      >
                        <Edit2 size={10} /> Override Manual
                      </button>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-slate-50 rounded-[24px] border border-slate-200"
                    >
                      <div className="md:col-span-3 space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                          Spatial Path
                        </label>
                        <ControlledInput
                          name="street"
                          value={currentStep === STEPS.SENDER ? sender.street : recipient.street}
                          setValue={(val) => {
                            const updateFn = currentStep === STEPS.SENDER ? setSender : setRecipient
                            updateFn((prev) => ({ ...prev, street: val, isValidated: false }))
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg p-3 font-semibold text-slate-900 focus:outline-none focus:border-indigo-600/30"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                          Municipality
                        </label>
                        <ControlledInput
                          name="city"
                          value={currentStep === STEPS.SENDER ? sender.city : recipient.city}
                          setValue={(val) => {
                            const updateFn = currentStep === STEPS.SENDER ? setSender : setRecipient
                            updateFn((prev) => ({ ...prev, city: val, isValidated: false }))
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg p-3 font-semibold text-slate-900 focus:outline-none focus:border-indigo-600/30"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                          State Code
                        </label>
                        <ControlledInput
                          name="state"
                          value={currentStep === STEPS.SENDER ? sender.state : recipient.state}
                          setValue={(val) => {
                            const updateFn = currentStep === STEPS.SENDER ? setSender : setRecipient
                            updateFn((prev) => ({ ...prev, state: val, isValidated: false }))
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg p-3 font-semibold text-slate-900 focus:outline-none focus:border-indigo-600/30"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                          Zone Index
                        </label>
                        <ControlledInput
                          name="zip"
                          value={currentStep === STEPS.SENDER ? sender.zip : recipient.zip}
                          setValue={(val) => {
                            const updateFn = currentStep === STEPS.SENDER ? setSender : setRecipient
                            updateFn((prev) => ({ ...prev, zip: val, isValidated: false }))
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg p-3 font-semibold text-slate-900 focus:outline-none focus:border-indigo-600/30"
                        />
                      </div>
                    </motion.div>
                  )}

                  {((currentStep === STEPS.SENDER && sender.isValidated) ||
                    (currentStep === STEPS.RECIPIENT && recipient.isValidated)) && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3"
                    >
                      <CheckCircle2 className="text-emerald-600" size={16} />
                      <span className="text-emerald-700 font-bold text-[10px] uppercase tracking-widest">
                        Entry Validation Sync: 100%
                      </span>
                    </motion.div>
                  )}
                </div>

                <div className="mt-12 flex gap-4">
                  <button
                    onClick={() =>
                      setCurrentStep(
                        currentStep === STEPS.SENDER ? STEPS.CONFIRMATION : STEPS.SENDER
                      )
                    }
                    className="flex-1 bg-white text-slate-500 py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Return
                  </button>
                  <button
                    onClick={goToNextStep}
                    disabled={
                      currentStep === STEPS.SENDER
                        ? !sender.name || !sender.street
                        : !recipient.name || !recipient.street
                    }
                    className="flex-[2] bg-[#003366] hover:bg-black disabled:opacity-30 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all cursor-pointer"
                  >
                    {currentStep === STEPS.SENDER ? 'Confirm Origin' : 'Lock Node'}{' '}
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step: VERIFY */}
          {currentStep === STEPS.VERIFY && (
            <motion.div
              key={STEPS.VERIFY}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex-1 flex flex-col items-center justify-center p-6"
            >
              <div className="bg-white w-full max-w-4xl rounded-[32px] p-12 shadow-2xl shadow-slate-200/50 border border-slate-200 relative">
                <div className="absolute -top-4 left-10 bg-[#003366] text-white px-5 py-1.5 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-xl flex items-center gap-2">
                  <ShieldCheck size={14} className="text-[#E71921]" /> Protocol Verification
                </div>

                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-3xl font-black text-[#003366] italic tracking-tighter uppercase leading-none mb-2">
                      Pre-Transit Audit
                    </h3>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                      Perform final data validation before ledger commitment.
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                    <FileText size={32} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="p-8 bg-slate-50/50 rounded-[24px] border-2 border-slate-100 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-[#003366] font-black text-[10px] uppercase tracking-widest">
                        <Navigation size={12} className="-rotate-45" /> Origin Intel
                      </div>
                      <div>
                        <p className="text-xl font-black text-[#003366] italic uppercase leading-tight">
                          {sender.name}
                        </p>
                        <div className="mt-3 text-slate-500 font-bold text-sm leading-relaxed tracking-tight">
                          <p>{sender.street}</p>
                          <p>
                            {sender.city}, {sender.state} {sender.zip}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setCurrentStep(STEPS.SENDER)}
                      className="w-fit mt-6 text-[10px] font-black text-[#003366] uppercase hover:text-[#E71921] transition-colors cursor-pointer"
                    >
                      Modify Node A
                    </button>
                  </div>

                  <div className="p-8 bg-slate-50/50 rounded-[24px] border-2 border-slate-100 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-[#E71921] font-black text-[10px] uppercase tracking-widest">
                        <Truck size={12} /> Target Node
                      </div>
                      <div>
                        <p className="text-xl font-black text-[#003366] italic uppercase leading-tight">
                          {recipient.name}
                        </p>
                        <div className="mt-3 text-slate-500 font-bold text-sm leading-relaxed tracking-tight">
                          <p>{recipient.street}</p>
                          <p>
                            {recipient.city}, {recipient.state} {recipient.zip}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setCurrentStep(STEPS.RECIPIENT)}
                      className="w-fit mt-6 text-[10px] font-black text-[#003366] uppercase hover:text-[#E71921] transition-colors cursor-pointer"
                    >
                      Modify Node B
                    </button>
                  </div>
                </div>

                <div className="p-8 bg-[#003366] rounded-[24px] shadow-xl shadow-blue-900/10 flex flex-col md:flex-row md:items-center justify-between gap-8 text-white relative overflow-hidden border-b-8 border-[#E71921]">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <CreditCard size={120} />
                  </div>
                  <div className="flex items-center gap-10 relative z-10">
                    <div className="space-y-1.5 text-center md:text-left">
                      <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest opacity-80">
                        Class
                      </p>
                      <p className="text-base font-black italic uppercase">{detectedParcel?.size}</p>
                    </div>
                    <div className="w-px h-10 bg-white/20 hidden md:block" />
                    <div className="space-y-1.5 text-center md:text-left">
                      <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest opacity-80">
                        Dimensions
                      </p>
                      <p className="whitespace-nowrap text-sm font-black">
                        {detectedParcel?.dimensions}
                      </p>
                    </div>
                    <div className="w-px h-10 bg-white/20 hidden md:block" />
                    <div className="space-y-1.5 text-center md:text-left">
                      <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest opacity-80">
                        Payload
                      </p>
                      <p className="text-base font-black italic">{detectedParcel?.weight} LBS</p>
                    </div>
                  </div>

                  <div className="text-center md:text-right relative z-10">
                    <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest mb-1 opacity-80">
                      Authorized Rate
                    </p>
                    <p className="text-5xl font-black tracking-tighter italic leading-none">
                      ${detectedParcel?.price.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="mt-10 flex gap-4">
                  <button
                    onClick={() => setCurrentStep(STEPS.RECIPIENT)}
                    className="flex-1 bg-white text-slate-500 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest border-2 border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={goToNextStep}
                    className="flex-[2] bg-[#003366] hover:bg-black text-white py-5 rounded-xl font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-blue-900/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.01] cursor-pointer"
                  >
                    EXECUTE TRANSACTION <ChevronRight size={18} strokeWidth={3} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step: PAYMENT */}
          {currentStep === STEPS.PAYMENT && (
            <motion.div
              key={STEPS.PAYMENT}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex-1 flex flex-col items-center justify-center p-6"
            >
              <div className="bg-white w-full max-w-xl rounded-[32px] p-16 shadow-[0_40px_80px_rgba(0,0,0,0.08)] border border-slate-200 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full">
                  <PriorityStripes />
                </div>

                <div className="relative w-56 h-56 mx-auto mb-10 flex items-center justify-center">
                  {/* The "Slot" */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-2.5 bg-slate-900 rounded-full z-20 shadow-2xl" />

                  {/* The Animated Card / Processing Spinner */}
                  {!isProcessing ? (
                    <motion.div
                      className="z-10"
                      animate={{ y: [40, 20, -20, 20, 40] }}
                      transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                    >
                      <CreditCard size={100} className="text-indigo-600 stroke-[1.5]" />
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center gap-6 z-30 bg-white p-8 rounded-[32px] shadow-2xl border border-slate-100"
                    >
                      <RefreshCcw size={48} className="text-[#003366] animate-spin stroke-[3]" />
                      <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#003366] italic">
                        {isPrinting ? 'Generating Tag' : 'Processing'}
                      </span>
                    </motion.div>
                  )}
                </div>

                {!isProcessing ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">
                      Postage Allocation
                    </p>
                    <p className="text-6xl font-bold text-slate-900 tracking-tighter mb-10 leading-none">
                      ${detectedParcel?.price.toFixed(2)}
                    </p>

                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl mb-10">
                      <p className="text-slate-500 font-semibold text-sm italic">
                        Terminal active. Please insert secure credentials or tap NFC reader.
                      </p>
                    </div>

                    <button
                      onClick={handlePayment}
                      className="w-full bg-slate-900 text-white py-5 rounded-xl font-bold uppercase text-xs tracking-widest shadow-2xl shadow-slate-900/20 transition-all hover:bg-slate-800 active:scale-95 cursor-pointer"
                    >
                      SIMULATE ENCRYPTION
                    </button>
                  </motion.div>
                ) : (
                  <div className="py-12">
                    <motion.p
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="text-indigo-600 font-bold uppercase tracking-[0.3em] text-[10px]"
                    >
                      Establishing Secure Link...
                    </motion.p>
                  </div>
                )}

                {!isProcessing && (
                  <button
                    onClick={() => setCurrentStep(STEPS.VERIFY)}
                    className="mt-8 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-rose-500 transition-colors cursor-pointer"
                  >
                    De-authorize Transaction
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* Step: SUCCESS */}
          {currentStep === STEPS.SUCCESS && (
            <motion.div
              key={STEPS.SUCCESS}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center p-6 space-y-12 max-w-5xl mx-auto w-full"
            >
              <div className="text-center space-y-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', damping: 12 }}
                  className="w-24 h-24 bg-emerald-500 text-white rounded-[28px] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20 border-4 border-white"
                >
                  <CheckCircle2 size={48} strokeWidth={2.5} />
                </motion.div>
                <div className="space-y-1">
                  <h2 className="text-4xl font-bold text-slate-900 tracking-tight">
                    TRANSACTION SECURED
                  </h2>
                  <p className="text-slate-400 font-semibold text-sm uppercase tracking-widest">
                    Protocol finalized effectively.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                {/* Action 1: Physical Label */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-10 rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden group"
                >
                  <div className="absolute -top-10 -right-10 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
                    <Printer size={200} />
                  </div>
                  <div className="inline-flex items-center gap-2 bg-blue-50 text-[#003366] px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest mb-6">
                    <Printer size={14} /> PHY-OUTPUT READY
                  </div>
                  <h4 className="text-2xl font-black text-[#003366] italic uppercase tracking-tighter mb-3">
                    Retrieve Tag
                  </h4>
                  <p className="text-slate-500 font-bold text-sm mb-10 leading-relaxed italic">
                    Your secure identification tag has been deployed to the output module located at
                    the base of the terminal.
                  </p>

                  <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100 relative z-10">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                      Tracking Hash
                    </p>
                    <p className="text-2xl font-black text-[#003366] font-mono tracking-tight">
                      9405 5000 0000 0000 01
                    </p>
                  </div>
                </motion.div>

                {/* Action 2: Digital Receipt */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-[#003366] p-10 rounded-[32px] flex flex-col justify-between text-white border-b-8 border-[#E71921]"
                >
                  <div>
                    <div className="inline-flex items-center gap-2 bg-white/10 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest mb-6">
                      <FileText size={14} /> DIGI-RECORD
                    </div>
                    <h4 className="text-2xl font-black italic tracking-tighter uppercase mb-3">Access Receipt</h4>
                    <p className="text-blue-100 font-bold text-sm mb-10 leading-relaxed">
                      Transmit a copy of this official record to your personal digital repository.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <button className="w-full bg-white/10 hover:bg-white/20 border-2 border-white/10 py-4 rounded-xl font-black text-white text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95">
                      <Mail size={18} className="text-[#E71921]" /> Dispatch via Email
                    </button>
                    <button className="w-full bg-white/10 hover:bg-white/20 border-2 border-white/10 py-4 rounded-xl font-black text-white text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95">
                      <QrCode size={18} className="text-[#E71921]" /> Dynamic QR Scan
                    </button>
                  </div>
                </motion.div>
              </div>

              <button
                onClick={resetApp}
                className="w-full max-w-md bg-[#003366] text-white py-6 rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl shadow-blue-900/40 flex items-center justify-center gap-3 transition-all hover:bg-black active:scale-95 cursor-pointer"
              >
                TERMINATE SESSION <RefreshCcw size={18} />
              </button>
            </motion.div>
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
