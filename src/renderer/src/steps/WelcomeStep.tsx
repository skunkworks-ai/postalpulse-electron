import React from 'react'
import { ChevronRight, Navigation, Mail } from 'lucide-react'
import { motion } from 'motion/react'
import KioskButton from '../components/KioskButton/KioskButton'
import en from '../translations/en'

interface WelcomeStepProps {
  onStart: () => void
}

const WelcomeStep = ({ onStart }: WelcomeStepProps): React.JSX.Element => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.98 }}
    className="kiosk-step flex-1 flex items-center justify-center p-6"
  >
    <div className="flex flex-col xl:flex-row h-auto xl:h-137.5 border border-none text-center">
      <div className="flex-1 p-10 sm:p-14 xl:p-16 flex flex-col justify-center space-y-8 relative">
        <div className="space-y-4">
          <div className="inline-block bg-[#003366]/10 text-[#003366] px-3 py-1 rounded text-xs font-black uppercase tracking-[0.2em]">
            {en.steps.welcome.badge}
          </div>
          <h2 className="text-8xl font-black text-[#003366] italic ">
            {en.steps.welcome.headingPrefix} <br />
            <span className="text-[#E71921]">{en.steps.welcome.headingHighlight}</span>
          </h2>
          <p className="text-slate-500 text-xl max-w-md font-medium leading-relaxed">
            {en.steps.welcome.description}
          </p>
        </div>
      </div>

      <div className=" xl:flex w-full mb-10 relative overflow-hidden p-12 flex-col justify-center">
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
          <div className="h-60" />
          <div className="space-y-2 mb-6">
            <div className="h-3 w-full bg-slate-100 rounded" />
            <div className="h-3 w-3/4 bg-slate-100 rounded" />
          </div>
          <div className="flex justify-between items-center bg-blue-50 p-2 rounded">
            <div className="w-8 h-8 bg-white rounded shadow-sm" />
            <div className="h-2 w-20 bg-[#003366]/20 rounded-full" />
          </div>
        </motion.div>
      </div>

        <KioskButton
          onClick={onStart}
          className="w-full bg-[#003366] hover:bg-[#002244] text-white px-10 py-8 rounded-3xl font-black text-3xl flex items-center justify-center gap-4 transition-all hover:translate-x-2 shadow-xl shadow-blue-900/20"
        >
          {en.steps.welcome.startShipment} <ChevronRight strokeWidth={3} />
        </KioskButton>
    </div>
  </motion.div>
)

export default WelcomeStep
