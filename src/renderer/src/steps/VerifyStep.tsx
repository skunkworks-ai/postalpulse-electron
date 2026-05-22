import React from 'react'
import { ChevronRight, CreditCard, Navigation, Truck, ShieldCheck, FileText } from 'lucide-react'
import { motion } from 'motion/react'
import type { AddressRecord, ParcelData } from '../types'
import KioskButton from '../components/KioskButton/KioskButton'

interface VerifyStepProps {
  sender: AddressRecord
  recipient: AddressRecord
  detectedParcel: ParcelData | null
  onBack: () => void
  onNext: () => void
  onEditSender: () => void
  onEditRecipient: () => void
}

const VerifyStep = ({
  sender,
  recipient,
  detectedParcel,
  onBack,
  onNext,
  onEditSender,
  onEditRecipient
}: VerifyStepProps): React.JSX.Element => (
  <motion.div
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
          <KioskButton
            onClick={onEditSender}
            className="w-fit mt-6 text-[10px] font-black text-[#003366] uppercase hover:text-[#E71921] transition-colors cursor-pointer"
          >
            Modify Node A
          </KioskButton>
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
          <KioskButton
            onClick={onEditRecipient}
            className="w-fit mt-6 text-[10px] font-black text-[#003366] uppercase hover:text-[#E71921] transition-colors cursor-pointer"
          >
            Modify Node B
          </KioskButton>
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
        <KioskButton
          onClick={onBack}
          className="flex-1 bg-white text-slate-500 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest border-2 border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          Back
        </KioskButton>
        <KioskButton
          onClick={onNext}
          className="flex-[2] bg-[#003366] hover:bg-black text-white py-5 rounded-xl font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-blue-900/20 flex items-center justify-center gap-3 transition-all cursor-pointer"
        >
          EXECUTE TRANSACTION <ChevronRight size={18} strokeWidth={3} />
        </KioskButton>
      </div>
    </div>
  </motion.div>
)

export default VerifyStep
