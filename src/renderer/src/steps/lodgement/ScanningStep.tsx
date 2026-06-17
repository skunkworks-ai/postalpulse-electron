import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { motion } from 'motion/react'
import { Move } from 'lucide-react'
import { BOX_SPECS, getFittingBox, kilogramsToPounds } from '../../constants'
import type { ParcelData } from '../../types'
import type { RootState } from '../../store'
import KioskButton from '../../components/KioskButton/KioskButton'
import en from '../../translations/lodgement.en'

interface ScanningStepProps {
  onSuccess: (parcel: ParcelData) => void
}

const ScanningStep = ({ onSuccess }: ScanningStepProps): React.JSX.Element => {
  const unisonAddressURL = useSelector((state: RootState) => state.config.unisonAddressURL)
  const [detectionProgress, setDetectionProgress] = useState(0)
  const [isDetecting, setIsDetecting] = useState(false)
  const [detectionError, setDetectionError] = useState<string | null>(null)

  let copy : any = en.steps.scanning.idle;
  if(detectionError) {
    copy = en.steps.scanning.error
  } else if (isDetecting) {
    copy = en.steps.scanning.detecting
  } else {
    copy = en.steps.scanning.idle
  }

  const simulateSuccessfulDetection = () => {
    setIsDetecting(true)
    setDetectionError(null)
    setDetectionProgress(0)

    let progress = 0
    const interval = setInterval(() => {
      progress += 5
      setDetectionProgress(progress)
      if (progress >= 100) {
        clearInterval(interval)
        setIsDetecting(false)
        onSuccess()
      }
    }, 100)
  }

  const simulateIncorrectDetection = () => {
    setIsDetecting(true)
    setDetectionError(null)
    setDetectionProgress(0)

    let progress = 0
    const interval = setInterval(() => {
      progress += 5
      setDetectionProgress(progress)
      if (progress >= 100) {
        clearInterval(interval)
        setIsDetecting(false)
        setDetectionError(en.steps.scanning.incorrectDetectionError.title)
      }
    }, 100)
  }

  const simulateMismatchDetection = () => {
    setIsDetecting(true)
    setDetectionError(null)
    setDetectionProgress(0)

    let progress = 0
    const interval = setInterval(() => {
      progress += 5
      setDetectionProgress(progress)
      if (progress >= 100) {
        clearInterval(interval)
        setIsDetecting(false)
        setDetectionError(en.steps.scanning.mismatchDetectionError.title)
      }
    }, 100)
  }

  const resetDetection = () => {
    setIsDetecting(false)
    setDetectionError(null)
    setDetectionProgress(0)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="kiosk-step flex-1 flex flex-col items-center justify-center p-6 space-y-10 -translate-y-50"
    >
      <div className="text-center space-y-3">
        <h2
          className={`kiosk-title text-4xl font-black tracking-tighter ${detectionError ? 'text-(--pp-brand-accent)' : 'text-(--pp-brand-primary)'} font-varela-round`}
        >
          {copy.title}
        </h2>
        <div className="h-1.5 w-24 bg-(--pp-brand-accent) mx-auto rounded-full" />
        <p className="kiosk-subtext text-slate-500 font-bold text-sm tracking-widest max-w-md">
          {copy.description}
        </p>
      </div>

      <div className="relative">
        <div
          className={`detection-frame w-150 h-80 rounded-[40px] overflow-hidden border-12 transition-all duration-500 relative shadow-2xl ${
            detectionError
              ? 'border-[#eb407a] bg-red-50 scale-105'
              : 'border-white bg-slate-100 shadow-blue-900/10'
          }`}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-full h-full bg-(--pp-black)">
              <img
                src={unisonAddressURL}
                alt={en.steps.scanning.cameraFeedAlt}
                className="absolute inset-0 w-full h-full object-cover"
              />
              {isDetecting &&
                <motion.div
                  className="absolute top-0 left-0 w-full h-1 bg-(--pp-brand-accent)"
                  style={{ boxShadow: '0 0 20px var(--pp-brand-accent)' }}
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                />
              }
            </div>
          </div>
        </div>
        {!detectionError && isDetecting && (
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-(--pp-brand-primary) px-5 py-3 rounded-2xl shadow-xl border-4 border-white flex items-center gap-4 font-varela-round">
            <span className="text-base font-black text-white uppercase tracking-widest">
              {detectionProgress}% {en.steps.scanning.mappingSuffix}
            </span>
          </div>
        )}
        {!detectionError && !isDetecting && (
          <div className="absolute w-full grid grid-cols-1 gap-4 mt-5 translate-y-50">
            <KioskButton onClick={simulateSuccessfulDetection} className="bg-emerald-500 text-white py-5 rounded-xl font-black uppercase text-sm tracking-widest shadow-xl shadow-blue-900/10 flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all cursor-pointer font-varela-round">
              {en.steps.scanning.simulateSuccessLabel}
            </KioskButton>
            <KioskButton onClick={simulateIncorrectDetection} className="bg-(--pp-brand-accent) text-black py-5 rounded-xl font-black uppercase text-sm tracking-widest shadow-xl shadow-blue-900/10 flex items-center justify-center gap-2 hover:bg-(--pp-brand-accent-dark) transition-all cursor-pointer font-varela-round">
              {en.steps.scanning.simulateIncorrectDetectionLabel}
            </KioskButton>
            <KioskButton onClick={simulateMismatchDetection} className="bg-red-500 text-white py-5 rounded-xl font-black uppercase text-sm tracking-widest shadow-xl shadow-blue-900/10 flex items-center justify-center gap-2 hover:bg-red-600 transition-all cursor-pointer font-varela-round">
              {en.steps.scanning.simulateMismatchDetectionLabel}
            </KioskButton>
            <KioskButton onClick={() => {}} className=" text-black py-5 rounded-xl font-black uppercase text-sm tracking-widest  flex items-center justify-center gap-2 transition-all cursor-pointer font-varela-round">
              {en.steps.scanning.cancelSessionLabel}
            </KioskButton>
          </div>
        )}
        {detectionError && !isDetecting && (
          <div className="absolute w-full grid grid-cols-1 gap-4 mt-5 translate-y-50 text-center">
            <p className="kiosk-subtext text-slate-500 font-bold text-sm tracking-widest max-w-md mx-auto mb-5 text-center">
              {detectionError}
            </p>
            <KioskButton onClick={simulateSuccessfulDetection} className="bg-emerald-500 text-white py-5 rounded-xl font-black uppercase text-sm tracking-widest shadow-xl shadow-blue-900/10 flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all cursor-pointer font-varela-round">
              {en.steps.scanning.simulateSuccessLabel}
            </KioskButton>
            <KioskButton onClick={resetDetection} className="bg-(--pp-brand-accent) text-black py-5 rounded-xl font-black uppercase text-sm tracking-widest shadow-xl shadow-blue-900/10 flex items-center justify-center gap-2 hover:bg-(--pp-brand-accent-dark) transition-all cursor-pointer font-varela-round">
              {en.steps.scanning.retrieveParcelLabel}
            </KioskButton>
          </div>
        )}
      </div>

    </motion.div>
  )
}

export default ScanningStep
