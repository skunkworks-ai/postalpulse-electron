import React, { useState } from 'react'
import { RefreshCcw, CreditCard } from 'lucide-react'
import { motion } from 'motion/react'
import PriorityStripes from '../components/PriorityStripes'
import KioskButton from '../components/KioskButton/KioskButton'
import type { ParcelData } from '../types'
import en from '../translations/en'

interface PaymentStepProps {
  detectedParcel: ParcelData | null
  onSuccess: () => void
  onBack: () => void
}

const PaymentStep = ({ detectedParcel, onSuccess, onBack }: PaymentStepProps): React.JSX.Element => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const copy = en.steps.payment

  const handlePayment = (): void => {
    setIsProcessing(true)
    setTimeout(() => {
      setIsProcessing(false)
      setIsPrinting(true)
      setTimeout(() => {
        setIsPrinting(false)
        onSuccess()
      }, 2000)
    }, 3500)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="kiosk-step flex-1 flex flex-col items-center justify-center p-6"
    >
      <div className="kiosk-card bg-white w-full max-w-xl rounded-4xl p-10 sm:p-16 shadow-[0_40px_80px_rgba(0,0,0,0.08)] border border-slate-200 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full">
          <PriorityStripes />
        </div>

        <div className="relative w-56 h-56 mx-auto mb-10 flex items-center justify-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-2.5 bg-slate-900 rounded-full z-20 shadow-2xl" />

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
              className="flex flex-col items-center gap-6 z-30 bg-white p-8 rounded-4xl shadow-2xl border border-slate-100"
            >
              <RefreshCcw size={48} className="text-[#003366] animate-spin stroke-3" />
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#003366] italic">
                {isPrinting ? copy.generatingTag : copy.processing}
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
              {copy.title}
            </p>
            <p className="text-7xl font-bold text-slate-900 tracking-tighter mb-10 leading-none">
              ${detectedParcel?.price.toFixed(2)}
            </p>

            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl mb-10">
              <p className="text-slate-500 font-semibold text-sm italic">
                {copy.description}
              </p>
            </div>

            <KioskButton
              onClick={handlePayment}
              className="w-full bg-slate-900 text-white py-6 rounded-xl font-bold uppercase text-sm tracking-widest shadow-2xl shadow-slate-900/20 transition-all hover:bg-slate-800 cursor-pointer"
            >
              {copy.simulateEncryption}
            </KioskButton>
          </motion.div>
        ) : (
          <div className="py-12">
            <motion.p
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-indigo-600 font-bold uppercase tracking-[0.3em] text-[10px]"
            >
              {copy.secureLink}
            </motion.p>
          </div>
        )}

        {!isProcessing && (
          <KioskButton
            onClick={onBack}
            className="mt-8 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-rose-500 transition-colors cursor-pointer"
          >
            {copy.deauthorizeTransaction}
          </KioskButton>
        )}
      </div>
    </motion.div>
  )
}

export default PaymentStep
