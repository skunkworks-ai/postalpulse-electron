import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { motion } from 'motion/react'
import { Move } from 'lucide-react'
import { BOX_SPECS } from '../constants'
import type { ParcelData } from '../types'
import type { RootState } from '../store'
import KioskButton from '../components/KioskButton/KioskButton'
import en from '../translations/en'

interface DetectionStepProps {
  onSuccess: (parcel: ParcelData) => void
}

const DetectionStep = ({ onSuccess }: DetectionStepProps): React.JSX.Element => {
  const casPD2AddressURL = useSelector((state: RootState) => state.config.casPD2AddressURL)
  const realSenseAddressURL = useSelector((state: RootState) => state.config.realSenseAddressURL)
  const [detectionProgress, setDetectionProgress] = useState(0)
  const [detectionError, setDetectionError] = useState(false)

  const handleDetectionSuccess = async (): Promise<void> => {
    try {
      const res = await fetch(casPD2AddressURL)
      const data = await res.json()
      const weight = parseFloat(data.weight ?? data.value ?? 0)

      // Determine box size based on weight
      let size = BOX_SPECS.SMALL
      if (weight > 6.6) size = BOX_SPECS.LARGE
      else if (weight > 2.2) size = BOX_SPECS.MEDIUM

      const parcel: ParcelData = {
        size: size.name,
        dimensions: `${size.maxL}" x ${size.maxW}" x ${size.maxH}"`,
        weight,
        price: size.price
      }
      onSuccess(parcel)
    } catch {
      setDetectionError(true)
    }
  }

  useEffect(() => {
    if (detectionError) return
    setDetectionProgress(0)
    const interval = setInterval(() => {
      setDetectionProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          handleDetectionSuccess()
          return 100
        }
        return prev + 2
      })
    }, 40)
    return () => clearInterval(interval)
  }, [detectionError])

  const resetDetection = (): void => {
    setDetectionError(false)
    setDetectionProgress(0)
  }

  const proceedWithSampleParcel = (): void => {
    const sampleSize = BOX_SPECS.MEDIUM
    const sampleParcel: ParcelData = {
      size: sampleSize.name,
      dimensions: `${sampleSize.maxL}" x ${sampleSize.maxW}" x ${sampleSize.maxH}"`,
      weight: 3.5,
      price: sampleSize.price
    }
    onSuccess(sampleParcel)
  }

  const copy = detectionError ? en.steps.detection.error : en.steps.detection.idle

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="kiosk-step flex-1 flex flex-col items-center justify-center p-6 space-y-10"
    >
      <div className="text-center space-y-3">
        <h2
          className={`kiosk-title text-4xl font-black italic uppercase tracking-tighter ${detectionError ? 'text-[#E71921]' : 'text-[#003366]'}`}
        >
          {copy.title}
        </h2>
        <div className="h-1.5 w-24 bg-[#E71921] mx-auto rounded-full" />
        <p className="kiosk-subtext text-slate-500 font-bold text-sm uppercase tracking-widest max-w-md">
          {copy.description}
        </p>
      </div>

      <div className="relative">
        <div
          className={`detection-frame w-100 h-120 rounded-[40px] overflow-hidden border-12 transition-all duration-500 relative shadow-2xl ${
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
                    {en.steps.detection.failureTitle}
                  </p>
                  <p className="text-sm font-bold text-slate-500 italic">
                    {en.steps.detection.failureDescription}
                  </p>
                </div>
                <KioskButton
                  onClick={resetDetection}
                  className="bg-[#003366] text-white px-8 py-4 rounded-xl font-black uppercase text-base shadow-lg hover:bg-black transition-all"
                >
                  {en.steps.detection.restartScan}
                </KioskButton>
                <KioskButton
                  onClick={proceedWithSampleParcel}
                  className="bg-[#E71921] text-white px-8 py-4 rounded-xl font-black uppercase text-base shadow-lg hover:bg-[#c9151c] transition-all"
                >
                  {en.steps.detection.tempProceed}
                </KioskButton>
              </div>
            ) : (
              <div className="relative w-full h-full bg-[#001122]">
                <img
                  src={realSenseAddressURL}
                  alt={en.steps.detection.cameraFeedAlt}
                  className="absolute inset-0 w-full h-full object-cover"
                />
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
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-[#003366] px-5 py-3 rounded-2xl shadow-xl border-4 border-white flex items-center gap-4">
            <span className="text-base font-black text-white uppercase tracking-widest">
              {detectionProgress}% {en.steps.detection.mappingSuffix}
            </span>
          </div>
        )}
      </div>

      {!detectionError && (
        <KioskButton
          onClick={() => setDetectionError(true)}
          className="text-slate-300 hover:text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] cursor-pointer transition-colors"
        >
          {en.steps.detection.debugTrigger}
        </KioskButton>
      )}
    </motion.div>
  )
}

export default DetectionStep
