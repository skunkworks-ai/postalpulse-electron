import React from 'react'
import { ChevronRight, CreditCard, Truck, ShieldCheck, FileText, User } from 'lucide-react'
import { motion } from 'motion/react'
import type { AddressRecord, ParcelData } from '../types'
import KioskButton from '../components/KioskButton/KioskButton'
import en from '../translations/en'

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
}: VerifyStepProps): React.JSX.Element => {
  const copy = en.steps.verify

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="kiosk-step flex-1 flex flex-col items-center justify-center p-6"
    >
      <div className="kiosk-card bg-white w-full max-w-full rounded-4xl p-10 sm:p-12 shadow-2xl shadow-slate-200/50 border border-slate-200 relative">
        <div className="absolute -top-4 left-10 bg-[#003366] text-white px-5 py-1.5 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-xl flex items-center gap-2">
          <ShieldCheck size={14} className="text-[#FFFFFF]" /> {copy.badge}
        </div>

        <div className="flex items-center justify-between mb-10">
          <div>
            <h3 className="kiosk-title text-3xl font-black text-[#003366] italic tracking-tighter uppercase leading-none mb-2">
              {copy.title}
            </h3>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
              {copy.subtitle}
            </p>
          </div>
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
            <FileText size={32} />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          <div className="p-6 bg-slate-50/50 rounded-3xl border-2 border-slate-100 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#003366] font-black text-[16px] uppercase tracking-widest">
                <User size={24} /> {copy.originIntel}
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
              className="w-fit text-[16px] font-black text-[#003366] uppercase hover:text-[#E71921] transition-colors cursor-pointer"
            >
              {copy.modifyOrigin}
            </KioskButton>
          </div>

          <div className="p-6 bg-slate-50/50 rounded-3xl border-2 border-slate-100 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#E71921] font-black text-[16px] uppercase tracking-widest">
                <Truck size={24} /> {copy.targetNode}
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
              className="w-fit text-[16px] font-black text-[#003366] uppercase hover:text-[#E71921] transition-colors cursor-pointer"
            >
              {copy.modifyTarget}
            </KioskButton>
          </div>
        </div>

        <div className="p-8 bg-[#003366] rounded-3xl shadow-xl shadow-blue-900/10 flex flex-col xl:flex-row xl:items-center justify-between gap-8 text-white relative overflow-hidden border-b-8 border-[#E71921]">
          <div className="absolute top-0 right-[-10rem] p-8 opacity-10">
            <CreditCard size={300} />
          </div>
          <div className="flex items-center gap-10 relative z-10">
            <div className="space-y-1.5 text-center xl:text-left">
              <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest opacity-80">
                {copy.class}
              </p>
              <p className="text-base font-black italic uppercase">{detectedParcel?.size}</p>
            </div>
            <div className="w-px h-10 bg-white/20 hidden xl:block" />
            <div className="space-y-1.5 text-center xl:text-left">
              <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest opacity-80">
                {copy.dimensions}
              </p>
              <p className="whitespace-nowrap text-sm font-black">
                {detectedParcel?.dimensions}
              </p>
            </div>
            <div className="w-px h-10 bg-white/20 hidden xl:block" />
            <div className="space-y-1.5 text-center xl:text-left">
              <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest opacity-80">
                {copy.payload}
              </p>
              <p className="text-base font-black italic">{detectedParcel?.weight} LBS</p>
            </div>
          </div>

          <div className="text-center xl:text-right relative z-10">
            <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest mb-1 opacity-80">
              {copy.authorizedRate}
            </p>
            <p className="text-8xl font-black tracking-tighter italic leading-none">
              ${detectedParcel?.price.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4">
          <KioskButton
            onClick={onNext}
            className="bg-[#E71921] hover:bg-black text-white py-8 rounded-xl font-black uppercase text-2xl tracking-widest shadow-2xl shadow-blue-900/20 flex items-center justify-center gap-3 transition-all cursor-pointer"
          >
            {copy.executeTransaction} <ChevronRight size={18} strokeWidth={3} />
          </KioskButton>
          <KioskButton
            onClick={onBack}
            className="bg-white text-slate-500 py-5 rounded-xl font-black uppercase text-sm tracking-widest border-2 border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            {copy.back}
          </KioskButton>
        </div>
      </div>
    </motion.div>
  )
}

export default VerifyStep
