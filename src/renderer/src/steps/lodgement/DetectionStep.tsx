import React, { useEffect } from 'react'
import { RefreshCcw, HardDrive } from 'lucide-react'
import { motion } from 'motion/react'
import PriorityStripes from '../../components/PriorityStripes'
import en from '../../translations/lodgement.en'

interface DetectionStepProps {
  onSuccess: () => void
}

const DetectionStep = ({ onSuccess }: DetectionStepProps): React.JSX.Element => {
  const copy = en.steps.detection

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      onSuccess()
    }, 1500)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [onSuccess])

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
