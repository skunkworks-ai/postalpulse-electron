import React from 'react'
import { CheckCircle2, RefreshCcw, Printer, Mail, QrCode, FileText } from 'lucide-react'
import { motion } from 'motion/react'
import KioskButton from '../components/KioskButton/KioskButton'
import en from '../translations/en'

interface SuccessStepProps {
  onReset: () => void
}

const SuccessStep = ({ onReset }: SuccessStepProps): React.JSX.Element => {
  const copy = en.steps.success

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="kiosk-step flex-1 flex flex-col items-center justify-center p-6 space-y-12 max-w-5xl mx-auto w-full"
    >
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 12 }}
          className="w-24 h-24 bg-emerald-500 text-white rounded-[28px] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20 border-4 border-white"
        >
          <CheckCircle2 size={48} strokeWidth={2.5} />
        </motion.div>
        <div className="space-y-1">
          <h2 className="kiosk-title text-4xl font-bold text-slate-900 tracking-tight">
            {copy.title}
          </h2>
          <p className="kiosk-subtext text-slate-400 font-semibold text-sm uppercase tracking-widest">
            {copy.subtitle}
          </p>
        </div>
      </div>

      <div className="kiosk-card grid grid-cols-1 xl:grid-cols-2 gap-8 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-10 rounded-4xl border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden group"
        >
          <div className="absolute -top-10 -right-10 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
            <Printer size={200} />
          </div>
          <div className="inline-flex items-center gap-2 bg-blue-50 text-[#003366] px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest mb-6">
            <Printer size={14} /> {copy.phyOutputReady}
          </div>
          <h4 className="text-2xl font-black text-[#003366] italic uppercase tracking-tighter mb-3">
            {copy.retrieveTag}
          </h4>
          <p className="text-slate-500 font-bold text-sm mb-10 leading-relaxed italic">
            {copy.retrieveTagDescription}
          </p>

          <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100 relative z-10">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              {copy.trackingHashLabel}
            </p>
            <p className="text-2xl font-black text-[#003366] font-mono tracking-tight">
              9405 5000 0000 0000 01
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#003366] p-10 rounded-4xl flex flex-col justify-between text-white border-b-8 border-[#E71921]"
        >
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest mb-6">
              <FileText size={14} /> {copy.digiRecord}
            </div>
            <h4 className="text-2xl font-black italic tracking-tighter uppercase mb-3">{copy.accessReceipt}</h4>
            <p className="text-blue-100 font-bold text-sm mb-10 leading-relaxed">
              {copy.accessReceiptDescription}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <KioskButton className="w-full bg-white/10 hover:bg-white/20 border-2 border-white/10 py-4 rounded-xl font-black text-white text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all">
              <Mail size={18} className="text-[#E71921]" /> {copy.dispatchViaEmail}
            </KioskButton>
            <KioskButton className="w-full bg-white/10 hover:bg-white/20 border-2 border-white/10 py-4 rounded-xl font-black text-white text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all">
              <QrCode size={18} className="text-[#E71921]" /> {copy.dynamicQrScan}
            </KioskButton>
          </div>
        </motion.div>
      </div>

      <KioskButton
        onClick={onReset}
        className="w-full max-w-md bg-[#003366] text-white py-6 rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl shadow-blue-900/40 flex items-center justify-center gap-3 transition-all hover:bg-black cursor-pointer"
      >
        {copy.terminateSession} <RefreshCcw size={18} />
      </KioskButton>
    </motion.div>
  )
}

export default SuccessStep
