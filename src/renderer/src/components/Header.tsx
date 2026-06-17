import React from 'react'
import { useSelector } from 'react-redux'
import PriorityStripes from './PriorityStripes'
import en from '../translations/booking.en'
import meldCXSquare from '../assets/meldCX_square.png'
import type { RootState } from '../store'

const headerTexts = en.header

const Header = ({ onLogoTap }: { onLogoTap?: () => void }): React.JSX.Element => {
  const configuredTitle = useSelector((state: RootState) => state.config.headerTitle)
  const displayTitle = configuredTitle?.trim() || headerTexts.title
  const pulseIndex = displayTitle.toUpperCase().indexOf('POST')

  return (
    <header className="w-full bg-white border-b border-slate-200 shadow-sm relative z-50">
      <div className="py-5 px-6 sm:px-8 flex justify-between items-center max-w-7xl mx-auto w-full gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-14 h-14 bg-(--pp-white) rounded-xl flex items-center justify-center overflow-hidden shadow-lg shadow-blue-900/20 cursor-pointer select-none"
            onClick={onLogoTap}
          >
            <img src={meldCXSquare} alt="MeldCX logo" className="w-11 h-11" draggable={false} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-(--pp-brand-primary) leading-none tracking-tighter font-varela-round">
              {pulseIndex >= 0 ? (
                <>
                  {displayTitle.slice(0, pulseIndex)}
                  <span className="text-(--pp-brand-accent)">
                    {displayTitle.slice(pulseIndex, pulseIndex + 5)}
                  </span>
                  {displayTitle.slice(pulseIndex + 5)}
                </>
              ) : (
                displayTitle
              )}
            </h1>
            <p className="kiosk-subtext text-[10px] tracking-[0.2em] text-(--pp-brand-primary) font-bold mt-1 font-varela-round uppercase">
              {headerTexts.subtitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 sm:gap-6 text-sm font-semibold text-slate-500">
          <div className="bg-blue-50 border border-blue-100 text-(--pp-brand-primary) px-4 py-2 rounded-md text-sm font-bold whitespace-nowrap">
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
}

export default Header
