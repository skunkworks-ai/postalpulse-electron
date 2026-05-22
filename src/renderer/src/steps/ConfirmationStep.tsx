import React from 'react'
import { ChevronRight, Scan, Weight, Maximize } from 'lucide-react'
import { motion } from 'motion/react'
import type { ParcelData } from '../types'
import KioskButton from '../components/KioskButton/KioskButton'

interface ConfirmationStepProps {
  detectedParcel: ParcelData | null
  onDiscard: () => void
  onConfirm: () => void
}

const ConfirmationStep = ({
  detectedParcel,
  onDiscard,
  onConfirm
}: ConfirmationStepProps): React.JSX.Element => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 20 }}
    className="flex-1 flex flex-col items-center justify-center p-6"
  >
    <div className="bg-white w-full max-w-xl rounded-[32px] p-12 shadow-2xl shadow-slate-200/50 border border-slate-200 relative">
      <div className="absolute -top-4 left-10 bg-[#003366] text-white px-5 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-blue-900/20">
        Metric Confirmation
      </div>
      <h3 className="text-2xl font-black text-[#003366] italic tracking-tighter uppercase mb-10">
        Analysis Finalized
      </h3>

      <div className="space-y-4">
        <div className="p-6 bg-slate-50/50 rounded-[24px] border border-slate-100 flex items-center justify-between transition-colors hover:bg-slate-50">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-white shadow-sm border border-slate-200 rounded-2xl flex items-center justify-center text-[#003366]">
              <Scan size={26} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Volumetric Class
              </p>
              <p className="text-lg font-black text-[#003366] italic uppercase">{detectedParcel?.size}</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50/50 rounded-[24px] border border-slate-100 flex items-center justify-between transition-colors hover:bg-slate-50">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-white shadow-sm border border-slate-200 rounded-2xl flex items-center justify-center text-[#E71921]">
              <Maximize size={26} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Spatial Dimensions
              </p>
              <p className="text-lg font-black text-[#003366]">
                {detectedParcel?.dimensions}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50/50 rounded-[24px] border border-slate-100 flex items-center justify-between transition-colors hover:bg-slate-50">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-white shadow-sm border border-slate-200 rounded-2xl flex items-center justify-center text-sky-600">
              <Weight size={26} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Mass Density
              </p>
              <p className="text-lg font-black text-[#003366]">
                {detectedParcel?.weight} LBS
              </p>
            </div>
          </div>
        </div>

        <div className="pt-10 flex justify-between items-end border-b border-slate-100 pb-8 mt-4">
          <div>
            <p className="font-bold uppercase text-[10px] text-slate-400 tracking-[0.2em]">
              Total Tariff
            </p>
            <p className="text-4xl font-black text-[#003366] mt-1 tracking-tighter italic">
              ${detectedParcel?.price.toFixed(2)}
            </p>
          </div>
          <div className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-lg text-[10px] font-black border border-emerald-100 uppercase italic">
            Rate Confirmed
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <KioskButton
            onClick={onDiscard}
            className="bg-white text-slate-600 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest border-2 border-slate-200 hover:border-[#E71921] hover:text-[#E71921] transition-all cursor-pointer"
          >
            Discard
          </KioskButton>
          <KioskButton
            onClick={onConfirm}
            className="bg-[#003366] text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-900/10 flex items-center justify-center gap-2 hover:bg-[#002244] transition-all cursor-pointer"
          >
            Set Destination <ChevronRight size={16} strokeWidth={3} />
          </KioskButton>
        </div>
      </div>
    </div>
  </motion.div>
)

export default ConfirmationStep
