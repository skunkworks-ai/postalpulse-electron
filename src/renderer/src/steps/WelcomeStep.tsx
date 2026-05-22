import React from 'react'
import { ChevronRight, Navigation, Mail } from 'lucide-react'
import { motion } from 'motion/react'
import KioskButton from '../components/KioskButton/KioskButton'

interface WelcomeStepProps {
  onStart: () => void
}

const WelcomeStep = ({ onStart }: WelcomeStepProps): React.JSX.Element => (
  <motion.div
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

        <KioskButton
          onClick={onStart}
          className="w-fit bg-[#003366] hover:bg-[#002244] text-white px-10 py-5 rounded-xl font-black text-xl flex items-center gap-4 transition-all hover:translate-x-2 shadow-xl shadow-blue-900/20"
        >
          START SHIPMENT <ChevronRight strokeWidth={3} />
        </KioskButton>
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
)

export default WelcomeStep
