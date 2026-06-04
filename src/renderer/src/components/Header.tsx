import React from 'react'
import PriorityStripes from './PriorityStripes'
import en from '../translations/en'
import postalPulseIcon from '../assets/postalpulse-icon.png'

const headerTexts = en.header

const Header = ({ onLogoTap }: { onLogoTap?: () => void }): React.JSX.Element => (
  <header className="w-full bg-white border-b border-slate-200 shadow-sm relative z-50">
    <div className="py-5 px-6 sm:px-8 flex justify-between items-center max-w-7xl mx-auto w-full gap-4">
      <div className="flex items-center gap-3">
        <div
          className="w-14 h-14 bg-[#FFFFFF] rounded-xl flex items-center justify-center overflow-hidden shadow-lg shadow-blue-900/20 cursor-pointer select-none"
          onClick={onLogoTap}
        >
          <img src={postalPulseIcon} alt="PostalPulse logo" className="w-11 h-11" draggable={false} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-[#003366] leading-none italic tracking-tighter">
            {headerTexts.title.split('PULSE')[0]}<span className="text-[#E71921]">PULSE</span>
          </h1>
          <p className="kiosk-subtext text-[10px] tracking-[0.2em] text-[#003366] font-bold uppercase mt-1">
            {headerTexts.subtitle}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 sm:gap-6 text-sm font-semibold text-slate-500">
        <div className="bg-blue-50 border border-blue-100 text-[#003366] px-4 py-2 rounded-md text-sm font-bold uppercase whitespace-nowrap">
          {headerTexts.hub}
        </div>
        {/* <div className="w-10 h-10 bg-slate-100 rounded-full border border-slate-200 flex items-center justify-center cursor-pointer overflow-hidden">
          <div className="w-5 h-5 bg-slate-400 rounded-sm rotate-45"></div>
        </div> */}
      </div>
    </div>
    <PriorityStripes />
  </header>
)

export default Header
