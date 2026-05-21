import React from 'react'
import { Navigation } from 'lucide-react'
import PriorityStripes from './PriorityStripes'

const Header = ({ onLogoTap }: { onLogoTap?: () => void }): React.JSX.Element => (
  <header className="w-full bg-white border-b border-slate-200 shadow-sm relative z-50">
    <div className="py-4 px-8 flex justify-between items-center max-w-7xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 bg-[#003366] rounded flex items-center justify-center overflow-hidden shadow-lg shadow-blue-900/20 cursor-pointer select-none"
          onClick={onLogoTap}
        >
          <Navigation className="text-white fill-current w-7 h-7 -rotate-45 mt-2" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[#003366] leading-none italic tracking-tighter">
            POSTAL<span className="text-[#E71921]">PULSE</span>
          </h1>
          <p className="text-[9px] tracking-[0.2em] text-[#003366] font-bold uppercase mt-1">
            Official Service Point
          </p>
        </div>
      </div>
      <div className="flex items-center gap-6 text-sm font-semibold text-slate-500">
        <div className="bg-blue-50 border border-blue-100 text-[#003366] px-4 py-1.5 rounded-md text-xs font-bold uppercase">
          Verified Hub
        </div>
        <div className="w-8 h-8 bg-slate-100 rounded-full border border-slate-200 flex items-center justify-center cursor-pointer overflow-hidden">
          <div className="w-4 h-4 bg-slate-400 rounded-sm rotate-45"></div>
        </div>
      </div>
    </div>
    <PriorityStripes />
  </header>
)

export default Header
