import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useSelector } from 'react-redux'
import { ChevronRight, Search, MapPin, Edit2, Undo2, Truck, CheckCircle2, AlertCircle } from 'lucide-react'
import { motion } from 'motion/react'
import ControlledInput from '../contexts/KeyboardProvider/ControlledInput'
import KioskButton from '../components/KioskButton/KioskButton'
import { STEPS, MOCK_ADDRESSES, MOCK_GOOGLE_MAPS } from '../constants'
import type { AddressRecord, AddressSuggestion } from '../types'
import type { RootState } from '../store'

interface AddressStepProps {
  currentStep: string
  sender: AddressRecord
  setSender: React.Dispatch<React.SetStateAction<AddressRecord>>
  recipient: AddressRecord
  setRecipient: React.Dispatch<React.SetStateAction<AddressRecord>>
  onBack: () => void
  onNext: () => void
  initialManualEntry?: boolean
}

const AddressStep = ({
  currentStep,
  sender,
  setSender,
  recipient,
  setRecipient,
  onBack,
  onNext,
  initialManualEntry = false
}: AddressStepProps): React.JSX.Element => {
  const [isManualEntry, setIsManualEntry] = useState(initialManualEntry)
  const [addressSearch, setAddressSearch] = useState('')
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchWrapperRef = useRef<HTMLDivElement>(null)
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null)

  useEffect(() => {
    if (suggestions.length > 0 && searchWrapperRef.current) {
      const rect = searchWrapperRef.current.getBoundingClientRect()
      setDropdownRect({ top: rect.bottom + 8, left: rect.left, width: rect.width })
    } else {
      setDropdownRect(null)
    }
  }, [suggestions.length])

  const googleMapsApiKey = useSelector((state: RootState) => state.config.googleMapsApiKey)

  const isSender = currentStep === STEPS.SENDER
  const current = isSender ? sender : recipient
  const setCurrent = isSender ? setSender : setRecipient

  const handleAddressSearch = (value: string): void => {
    setAddressSearch(value)
    setSuggestions([])

    if (value.length < 3) return

    if (!googleMapsApiKey || MOCK_GOOGLE_MAPS) {
      // Fallback: filter mock data when no API key is configured
      setSuggestions(
        MOCK_ADDRESSES.filter((addr) => addr.full.toLowerCase().includes(value.toLowerCase()))
      )
      return
    }

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(async () => {
      try {
        const data = await window.api.googleMapsGet({
          url: 'https://places.googleapis.com/v1/places:autocomplete',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': googleMapsApiKey
          },
          body: JSON.stringify({ input: value, includedRegionCodes: ['us'] })
        }) as { suggestions?: { placePrediction: { placeId: string; text: { text: string } } }[] }
        console.log('Google Maps API response:', data)
        const mapped: AddressSuggestion[] = (data.suggestions ?? []).map((s) => ({
          full: s.placePrediction.text.text,
          street: '',
          city: '',
          state: '',
          zip: '',
          placeId: s.placePrediction.placeId
        }))
        setSuggestions(mapped)
      } catch {
        setSuggestions([])
      }
    }, 400)
  }

  const cassValidate = async (
    street: string,
    city: string,
    state: string,
    zip: string
  ): Promise<{ street: string; city: string; state: string; zip: string; isValidated: boolean } | null> => {
    if (!googleMapsApiKey && !MOCK_GOOGLE_MAPS) {
      console.warn('[CASS] Skipped — no API key configured and MOCK_GOOGLE_MAPS is false')
      return null
    }
    if (MOCK_GOOGLE_MAPS) {
      console.log('[CASS] Mock mode — returning uppercased address, isValidated: true')
      return {
        street: street.toUpperCase(),
        city: city.toUpperCase(),
        state: state.toUpperCase(),
        zip: zip.includes('-') ? zip : `${zip}-0001`,
        isValidated: true
      }
    }
    try {
      const data = (await window.api.googleMapsGet({
        url: 'https://addressvalidation.googleapis.com/v1:validateAddress',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': googleMapsApiKey },
        body: JSON.stringify({
          address: {
            addressLines: [street],
            locality: city,
            administrativeArea: state,
            postalCode: zip,
            regionCode: 'US'
          },
          // CRITICAL FIX: You must explicitly request CASS data from Google
          enableUspsCass: true 
        })
      })) as {
        result?: {
          uspsData?: {
            standardizedAddress?: {
              firstAddressLine?: string
              city?: string
              state?: string
              zipCode?: string
              zipCodeExtension?: string
            }
            cassProcessed?: boolean
            dpvConfirmation?: string
          }
          address?: {
            postalAddress?: {
              addressLines?: string[]
              locality?: string
              administrativeArea?: string
              postalCode?: string
            }
          }
        }
      }
      console.log('[CASS] Full response:', JSON.stringify(data, null, 2))
      const usps = data.result?.uspsData
      
      // CRITICAL FIX: Check both cassProcessed AND DPV status
      // 'Y' = Confirmed delivery point, 'S' = Confirmed primary address but sub-premise (suite/apt) is missing/invalid
      const isDpvValid = usps?.dpvConfirmation === 'Y' || usps?.dpvConfirmation === 'S'

      if (usps?.cassProcessed && isDpvValid) {
        const std = usps.standardizedAddress ?? {}
        const fullZip = std.zipCodeExtension
          ? `${std.zipCode}-${std.zipCodeExtension}`
          : (std.zipCode ?? zip)
        console.log('[CASS] Validated — cassProcessed: true, dpvConfirmation:', usps.dpvConfirmation)
        return {
          street: std.firstAddressLine ?? street,
          city: std.city ?? city,
          state: std.state ?? state,
          zip: fullZip,
          isValidated: true
        }
      }
      if (usps && !usps.cassProcessed) {
        console.warn('[CASS] Not validated — uspsData present but cassProcessed is false/missing. dpvConfirmation:', usps.dpvConfirmation)
      } else if (usps && !isDpvValid) {
        console.warn('[CASS] Not validated — CASS processed but DPV confirmation failed. dpvConfirmation:', usps.dpvConfirmation)
      } else if (!data.result?.uspsData) {
        console.warn('[CASS] Not validated — no uspsData in response. Full result:', JSON.stringify(data.result, null, 2))
      }
      const postal = data.result?.address?.postalAddress
      if (postal) {
        console.log('[CASS] Falling back to postalAddress (not CASS certified)')
        return {
          street: postal.addressLines?.[0] ?? street,
          city: postal.locality ?? city,
          state: postal.administrativeArea ?? state,
          zip: postal.postalCode ?? zip,
          isValidated: false
        }
      }
      console.warn('[CASS] No uspsData or postalAddress in response — returning null')
      return null
    } catch (err) {
      console.error('[CASS] Request failed:', err)
      return null
    }
  }

  const selectAddress = async (addr: AddressSuggestion): Promise<void> => {
    if (addr.placeId && googleMapsApiKey && !MOCK_GOOGLE_MAPS) {
      try {
        const data = await window.api.googleMapsGet({
          url: `https://places.googleapis.com/v1/places/${addr.placeId}`,
          headers: {
            'X-Goog-Api-Key': googleMapsApiKey,
            'X-Goog-FieldMask': 'addressComponents,formattedAddress'
          }
        }) as { addressComponents?: { types: string[]; longText: string; shortText: string }[]; formattedAddress?: string }
        if (data.addressComponents) {
          const comps = data.addressComponents
          const get = (type: string, short = false): string => {
            const c = comps.find((x) => x.types.includes(type))
            return c ? (short ? c.shortText : c.longText) : ''
          }
          const street = [get('street_number'), get('route')].filter(Boolean).join(' ')
          const city =
            get('locality') ||
            get('sublocality_level_1') ||
            get('administrative_area_level_2')
          const state = get('administrative_area_level_1', true)
          const zip = get('postal_code')
          setIsValidating(true)
          const cass = await cassValidate(street, city, state, zip)
          setIsValidating(false)
          setCurrent((prev) => ({
            ...prev,
            ...(cass ?? { street, city, state, zip, isValidated: false })
          }))
          setAddressSearch(data.formattedAddress ?? addr.full)
          setSuggestions([])
          setIsManualEntry(false)
          return
        }
      } catch {
        // fall through to basic population
      }
    }
    // Pre-resolved suggestion (mock data) — still run CASS so isValidated reflects mock result
    setIsValidating(true)
    const cass = await cassValidate(addr.street, addr.city, addr.state, addr.zip)
    setIsValidating(false)
    setCurrent((prev) => ({
      ...prev,
      ...(cass ?? { street: addr.street, city: addr.city, state: addr.state, zip: addr.zip, isValidated: false })
    }))
    setAddressSearch(addr.full)
    setSuggestions([])
    setIsManualEntry(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="flex-1 flex flex-col items-center justify-center p-6"
    >
      <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl shadow-slate-200/50 border border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-slate-100">
          <motion.div
            className="h-full bg-[#003366]"
            animate={{ width: isSender ? '50%' : '100%' }}
            transition={{ duration: 0.6, ease: 'circOut' }}
          />
        </div>

        <div className="p-12">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-5">
            <div
              className={`w-14 h-14 ${isSender ? 'bg-[#003366] shadow-blue-900/20' : 'bg-[#E71921] shadow-red-900/20'} text-white rounded-2xl flex items-center justify-center shadow-xl transition-all duration-500`}
            >
              {isSender ? <Undo2 size={26} /> : <Truck size={26} />}
            </div>
            <div>
              <h3 className="text-2xl font-black text-[#003366] italic tracking-tighter uppercase">
                {isSender ? 'Origin Intel' : 'Delivery Node'}
              </h3>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">
                Section {isSender ? 'A' : 'B'} of Protocol
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Entity Identifier
            </label>
            <ControlledInput
              name="name"
              value={current.name}
              setValue={(val) => setCurrent((prev) => ({ ...prev, name: val, isValidated: false }))}
              placeholder={isSender ? 'Sender ID / Name' : 'Recipient ID / Name'}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600/30 focus:outline-none font-semibold text-slate-900 transition-all placeholder:text-slate-300"
            />
          </div>

          {!isManualEntry ? (
            <div className="space-y-2" ref={searchWrapperRef}>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Global Address Registry
              </label>
              <div className="relative">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                  size={18}
                />
                <ControlledInput
                  value={addressSearch}
                  setValue={handleAddressSearch}
                  placeholder="Search global coordinates..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 pl-12 focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600/30 focus:outline-none font-semibold text-slate-900 transition-all placeholder:text-slate-300"
                />
              </div>

              {suggestions.length > 0 && dropdownRect && createPortal(
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ position: 'fixed', top: dropdownRect.top, left: dropdownRect.left, width: dropdownRect.width, zIndex: 9999 }}
                  className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-200 overflow-hidden"
                >
                  {suggestions.map((addr, i) => (
                    <KioskButton
                      key={i}
                      onClick={() => selectAddress(addr)}
                      className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 border-b border-slate-100 text-left transition-colors cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
                        <MapPin size={16} />
                      </div>
                      <span className="font-semibold text-slate-600 group-hover:text-slate-900 text-sm transition-colors">
                        {addr.full}
                      </span>
                    </KioskButton>
                  ))}
                </motion.div>,
                document.body
              )}

              <KioskButton
                onClick={() => setIsManualEntry(true)}
                className="text-[10px] font-bold text-indigo-600 uppercase hover:text-indigo-700 flex items-center gap-1.5 mt-2 transition-all cursor-pointer"
              >
                <Edit2 size={10} /> Override Manual
              </KioskButton>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-slate-50 rounded-[24px] border border-slate-200"
            >
              <div className="md:col-span-3 flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Manual Entry
                </span>
                <KioskButton
                  onClick={() => setIsManualEntry(false)}
                  className="text-[10px] font-bold text-indigo-600 uppercase hover:text-indigo-700 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Search size={10} /> Switch to Search
                </KioskButton>
              </div>
              <div className="md:col-span-3 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Spatial Path
                </label>
                <ControlledInput
                  name="street"
                  value={current.street}
                  setValue={(val) =>
                    setCurrent((prev) => ({ ...prev, street: val, isValidated: false }))
                  }
                  className="w-full bg-white border border-slate-200 rounded-lg p-3 font-semibold text-slate-900 focus:outline-none focus:border-indigo-600/30"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Municipality
                </label>
                <ControlledInput
                  name="city"
                  value={current.city}
                  setValue={(val) =>
                    setCurrent((prev) => ({ ...prev, city: val, isValidated: false }))
                  }
                  className="w-full bg-white border border-slate-200 rounded-lg p-3 font-semibold text-slate-900 focus:outline-none focus:border-indigo-600/30"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  State Code
                </label>
                <ControlledInput
                  name="state"
                  value={current.state}
                  setValue={(val) =>
                    setCurrent((prev) => ({ ...prev, state: val, isValidated: false }))
                  }
                  className="w-full bg-white border border-slate-200 rounded-lg p-3 font-semibold text-slate-900 focus:outline-none focus:border-indigo-600/30"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Zone Index
                </label>
                <ControlledInput
                  name="zip"
                  value={current.zip}
                  setValue={(val) =>
                    setCurrent((prev) => ({ ...prev, zip: val, isValidated: false }))
                  }
                  className="w-full bg-white border border-slate-200 rounded-lg p-3 font-semibold text-slate-900 focus:outline-none focus:border-indigo-600/30"
                />
              </div>
              <div className="md:col-span-3">
                <KioskButton
                  onClick={async () => {
                    if (!current.street || !current.city || !current.state) return
                    setIsValidating(true)
                    const cass = await cassValidate(current.street, current.city, current.state, current.zip)
                    setIsValidating(false)
                    if (cass) setCurrent((prev) => ({ ...prev, ...cass }))
                  }}
                  disabled={isValidating || !current.street || !current.city || !current.state}
                  className="w-full py-3 rounded-xl font-black uppercase text-[10px] tracking-widest border border-[#003366] text-[#003366] hover:bg-[#003366] hover:text-white disabled:opacity-30 transition-all cursor-pointer"
                >
                  {isValidating ? 'Validating...' : 'CASS Validate'}
                </KioskButton>
              </div>
            </motion.div>
          )}

          {isValidating && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3"
            >
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-blue-700 font-bold text-[10px] uppercase tracking-widest">
                CASS Validation in Progress...
              </span>
            </motion.div>
          )}

          {!isValidating && current.isValidated && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3"
            >
              <CheckCircle2 className="text-emerald-600" size={16} />
              <span className="text-emerald-700 font-bold text-[10px] uppercase tracking-widest">
                Entry Validation Sync: 100%
              </span>
            </motion.div>
          )}

          {!isValidating && !current.isValidated && current.street && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-3"
            >
              <AlertCircle className="text-amber-500" size={16} />
              <span className="text-amber-700 font-bold text-[10px] uppercase tracking-widest">
                Address Not CASS Validated
              </span>
            </motion.div>
          )}
        </div>

        <div className="mt-12 flex gap-4">
          <KioskButton
            onClick={onBack}
            className="flex-1 bg-white text-slate-500 py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Return
          </KioskButton>
          <KioskButton
            onClick={onNext}
            disabled={!current.name || !current.street}
            className="flex-[2] bg-[#003366] hover:bg-black disabled:opacity-30 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all cursor-pointer"
          >
            {isSender ? 'Confirm Origin' : 'Lock Node'}{' '}
            <ChevronRight size={16} />
          </KioskButton>
        </div>
        </div>
      </div>
    </motion.div>
  )
}

export default AddressStep
