import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion } from 'motion/react'
import { Settings, Save, X, CheckCircle2, Camera, Weight, Globe } from 'lucide-react'
import { RootState } from '../../store'
import {
  setUnisonAddressURL,
  setRealSenseAddressURL,
  setCasPD2AddressURL,
  setUnit,
  setGoogleMapsApiKey
} from '../../features/config/configSlice'
import ControlledInput from '../../contexts/KeyboardProvider/ControlledInput'

interface ConfigPageProps {
  onClose: () => void
}

interface Field {
  label: string
  key: keyof import('../../features/config/configSlice').ConfigState
  icon: React.ReactNode
  description: string
}

const FIELDS: Field[] = [
  {
    label: 'Camera / Unison',
    key: 'unisonAddressURL',
    icon: <Camera size={18} />,
    description: 'RGB + depth camera stream'
  },
  {
    label: 'Dimensioning / RealSense',
    key: 'realSenseAddressURL',
    icon: <Camera size={18} />,
    description: 'Parcel volumetric service'
  },
  {
    label: 'Scale / CasPD2',
    key: 'casPD2AddressURL',
    icon: <Weight size={18} />,
    description: 'Integrated scale weight'
  },
  {
    label: 'Google Maps API Key',
    key: 'googleMapsApiKey',
    icon: <Globe size={18} />,
    description: 'Places Autocomplete & Address Validation'
  }
]

const ConfigPage: React.FC<ConfigPageProps> = ({ onClose }) => {
  const dispatch = useDispatch()
  const config = useSelector((state: RootState) => state.config)

  const [values, setValues] = useState({
    unisonAddressURL: config.unisonAddressURL,
    realSenseAddressURL: config.realSenseAddressURL,
    casPD2AddressURL: config.casPD2AddressURL,
    unit: config.unit,
    googleMapsApiKey: config.googleMapsApiKey
  })

  const [saved, setSaved] = useState(false)

  const handleSave = (): void => {
    dispatch(setUnisonAddressURL(values.unisonAddressURL))
    dispatch(setRealSenseAddressURL(values.realSenseAddressURL))
    dispatch(setCasPD2AddressURL(values.casPD2AddressURL))
    dispatch(setUnit(values.unit as 'lb' | 'kg'))
    dispatch(setGoogleMapsApiKey(values.googleMapsApiKey))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9998] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 20 }}
        className="bg-white w-full max-w-3xl rounded-[32px] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.25)] border border-slate-200 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-[#003366] px-10 py-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white">
              <Settings size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">
                Kiosk Configuration
              </h2>
              <p className="text-[9px] font-bold text-blue-200 uppercase tracking-[0.2em] mt-0.5">
                Service endpoint settings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-10 space-y-4">
          {FIELDS.map((field) => (
            <div key={field.key} className="flex items-center gap-5">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-[#003366] flex-shrink-0">
                {field.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {field.label}
                  </span>
                  <span className="text-[9px] text-slate-300 font-medium">— {field.description}</span>
                </div>
                <ControlledInput
                  value={values[field.key] as string}
                  setValue={(val) => setValues((prev) => ({ ...prev, [field.key]: val }))}
                  placeholder={`http://localhost:...`}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono text-sm text-slate-900 focus:outline-none focus:border-[#003366]/30 focus:ring-2 focus:ring-[#003366]/10 transition-all"
                />
              </div>
            </div>
          ))}

          {/* Unit toggle */}
          <div className="flex items-center gap-5 pt-2">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-[#003366] flex-shrink-0">
              <Weight size={18} />
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                Weight Unit
              </span>
              <div className="flex gap-3">
                {(['lb', 'kg'] as const).map((u) => (
                  <button
                    key={u}
                    onClick={() => setValues((prev) => ({ ...prev, unit: u }))}
                    className={`px-6 py-2.5 rounded-xl font-black uppercase text-sm tracking-widest transition-all cursor-pointer ${
                      values.unit === u
                        ? 'bg-[#003366] text-white shadow-lg shadow-blue-900/20'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-10 py-6 border-t border-slate-100 flex items-center justify-between flex-shrink-0 bg-slate-50/50">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            Changes are persisted to Electron Store
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className={`px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                saved
                  ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                  : 'bg-[#003366] text-white hover:bg-[#002244] shadow-blue-900/20'
              }`}
            >
              {saved ? (
                <>
                  <CheckCircle2 size={14} /> Saved
                </>
              ) : (
                <>
                  <Save size={14} /> Save Config
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default ConfigPage
