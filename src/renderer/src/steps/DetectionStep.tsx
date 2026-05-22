import React, { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Move } from 'lucide-react'
import { BOX_SPECS } from '../constants'
import type { ParcelData } from '../types'
import KioskButton from '../components/KioskButton/KioskButton'

interface DetectionStepProps {
  onSuccess: (parcel: ParcelData) => void
}

const DetectionStep = ({ onSuccess }: DetectionStepProps): React.JSX.Element => {
  const [detectionProgress, setDetectionProgress] = useState(0)
  const [detectionError, setDetectionError] = useState(false)

  const handleDetectionSuccess = (): void => {
    const mockData: ParcelData = {
      size: 'MEDIUM FLAT RATE',
      dimensions: '11.25" x 8.75" x 6.0"',
      weight: 1.45,
      price: BOX_SPECS.MEDIUM.price
    }
    onSuccess(mockData)
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

  return (
    <motion.div
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
                <KioskButton
                  onClick={resetDetection}
                  className="bg-[#003366] text-white px-8 py-3 rounded-xl font-black uppercase text-sm shadow-lg hover:bg-black transition-all"
                >
                  RESTART SCAN
                </KioskButton>
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
        <KioskButton
          onClick={() => setDetectionError(true)}
          className="text-slate-300 hover:text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] cursor-pointer transition-colors"
        >
          Debug: Trigger Visibility Error
        </KioskButton>
      )}
    </motion.div>
  )
}

export default DetectionStep
