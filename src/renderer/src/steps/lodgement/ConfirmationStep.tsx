import React from 'react'
import { ChevronRight, Scan, Weight, Maximize, User, Truck } from 'lucide-react'
import { motion } from 'motion/react'
import type { AddressRecord, ParcelData } from '../../types'
import KioskButton from '../../components/KioskButton/KioskButton'
import en from '../../translations/lodgement.en'

const POUNDS_TO_KILOGRAMS = 0.45359237

interface ConfirmationStepProps {
  detectedParcel: ParcelData | null,
  sender: AddressRecord | null,
  recipient: AddressRecord | null,
  onDiscard: () => void
  onConfirm: () => void
}

const ConfirmationStep = ({
  detectedParcel,
  sender,
  recipient,
  onDiscard,
  onConfirm
}: ConfirmationStepProps): React.JSX.Element => {
  const copy = en.steps.confirmation
  const weightKg = detectedParcel ? (detectedParcel.weight * POUNDS_TO_KILOGRAMS).toFixed(2) : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="kiosk-step flex-1 flex flex-col items-center justify-center p-6"
    >
      <div className="kiosk-card bg-white w-full max-w-xl rounded-4xl p-10 sm:p-12 shadow-2xl shadow-slate-200/50 border border-slate-200 relative">
        <div className="absolute -top-4 left-10 bg-(--pp-brand-primary) text-white px-5 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-blue-900/20">
          {copy.badge}
        </div>
        <h3 className="kiosk-title text-4xl font-black text-(--pp-brand-primary) tracking-tighter mb-10 font-varela-round">
          {copy.title}
        </h3>

        <div className="space-y-4">

          <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 flex items-center justify-between transition-colors hover:bg-slate-50">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-white shadow-sm border border-slate-200 rounded-2xl flex items-center justify-center text-sky-600">
                <User size={26} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  {copy.senderLabel}
                </p>
                <p className="text-lg font-black text-(--pp-brand-primary)">
                  {sender?.name || 'N/A'}
                </p>
                <p className="mt-1 text-[11px] font-bold text-slate-400 tracking-[0.16em]">
                  {sender?.street || 'N/A'}, {sender?.city || 'N/A'}, {sender?.state || 'N/A'} {sender?.zip || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 flex items-center justify-between transition-colors hover:bg-slate-50">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-white shadow-sm border border-slate-200 rounded-2xl flex items-center justify-center text-sky-600">
                <Truck size={26} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  {copy.recipientLabel}
                </p>
                <p className="text-lg font-black text-(--pp-brand-primary)">
                  {recipient?.name || 'N/A'}
                </p>
                <p className="mt-1 text-[11px] font-bold text-slate-400 tracking-[0.16em]">
                  {recipient?.street || 'N/A'}, {recipient?.city || 'N/A'}, {recipient?.state || 'N/A'} {recipient?.zip || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 flex items-center justify-between transition-colors hover:bg-slate-50">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-white shadow-sm border border-slate-200 rounded-2xl flex items-center justify-center text-(--pp-brand-accent)">
                <Maximize size={26} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  {copy.actualDimensions}
                </p>
                <p className="text-lg font-black text-(--pp-brand-primary)">
                  {detectedParcel?.actualDimensions}
                </p>
                <p className="mt-1 text-[11px] font-bold text-slate-400 tracking-[0.16em]">
                  {detectedParcel?.actualDimensionsMetric}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 flex items-center justify-between transition-colors hover:bg-slate-50">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-white shadow-sm border border-slate-200 rounded-2xl flex items-center justify-center text-(--pp-brand-primary)">
                <Scan size={26} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  {copy.volumetricClass}
                </p>
                <p className="text-lg font-black text-(--pp-brand-primary) uppercase">{detectedParcel?.size}</p>
              </div>
            </div>
          </div>

          {/* <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 flex items-center justify-between transition-colors hover:bg-slate-50">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-white shadow-sm border border-slate-200 rounded-2xl flex items-center justify-center text-(--pp-brand-accent)">
                <Maximize size={26} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  {copy.boxDimensions}
                </p>
                <p className="text-lg font-black text-(--pp-brand-primary)">
                  {detectedParcel?.dimensions}
                </p>
                <p className="mt-1 text-[11px] font-bold text-slate-400 tracking-[0.16em]">
                  {detectedParcel?.dimensionsMetric}
                </p>
              </div>
            </div>
          </div> */}

          <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 flex items-center justify-between transition-colors hover:bg-slate-50">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-white shadow-sm border border-slate-200 rounded-2xl flex items-center justify-center text-sky-600">
                <Weight size={26} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  {copy.massDensity}
                </p>
                <p className="text-lg font-black text-(--pp-brand-primary)">
                  {detectedParcel?.weight} LBS
                </p>
                <p className="mt-1 text-[11px] font-bold text-slate-400 uppercase tracking-[0.16em]">
                  {copy.massDensityMetric} {weightKg ? `(${weightKg} kg)` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* <div className="pt-10 flex justify-between items-end border-b border-slate-100 pb-8 mt-4">
            <div className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-lg text-[10px] font-black border border-emerald-100 uppercase">
              {copy.rateConfirmed}
            </div>
            <div>
              <p className="font-bold uppercase text-[10px] text-slate-400 tracking-[0.2em]">
                {copy.totalTariff}
              </p>
              <p className="text-5xl font-black text-(--pp-brand-primary) mt-1 tracking-tighter">
                ${detectedParcel?.price.toFixed(2)}
              </p>
            </div>
          </div> */}

          <div className="grid grid-cols-1 gap-4 mt-6">
            <KioskButton
              onClick={onConfirm}
              className="bg-(--pp-brand-accent) text-black py-5 rounded-xl font-black uppercase text-sm tracking-widest shadow-xl shadow-blue-900/10 flex items-center justify-center gap-2 hover:bg-(--pp-brand-accent-dark) transition-all cursor-pointer font-varela-round"
            >
              {copy.setDestination} <ChevronRight size={16} strokeWidth={3} />
            </KioskButton>
            <KioskButton
              onClick={onDiscard}
              className="bg-white text-slate-600 py-5 rounded-xl font-black uppercase text-sm tracking-widest border-2 border-slate-200 hover:border-(--pp-brand-primary) hover:text-(--pp-brand-primary) transition-all cursor-pointer font-varela-round"
            >
              {copy.discard}
            </KioskButton>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default ConfirmationStep
