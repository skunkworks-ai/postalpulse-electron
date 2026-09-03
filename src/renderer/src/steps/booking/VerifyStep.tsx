import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { ChevronRight, CreditCard, Truck, ShieldCheck, FileText, User } from 'lucide-react'
import { motion } from 'motion/react'
import type { AddressRecord, ParcelData, ShippingRate } from '../../types'
import type { RootState } from '../../store'
import KioskButton from '../../components/KioskButton/KioskButton'
import en from '../../translations/booking.en'

interface VerifyStepProps {
  sender: AddressRecord
  recipient: AddressRecord
  detectedParcel: ParcelData | null
  allowUnvalidatedAddress?: boolean
  onBack: () => void
  onNext: () => void
  onEditSender: () => void
  onEditRecipient: () => void
  onRateSelected: (rate: ShippingRate) => void
}

const formatServiceLabel = (service: string): string =>
  service
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ')

const zip5 = (zip: string): string => zip.replace(/\D/g, '').slice(0, 5)

const VerifyStep = ({
  sender,
  recipient,
  detectedParcel,
  allowUnvalidatedAddress = false,
  onBack,
  onNext,
  onEditSender,
  onEditRecipient,
  onRateSelected
}: VerifyStepProps): React.JSX.Element => {
  const copy = en.steps.verify
  const { revAddressBaseURL, revAddressApiKey } = useSelector((state: RootState) => state.config)

  const [rates, setRates] = useState<ShippingRate[]>([])
  const [ratesLoading, setRatesLoading] = useState(true)
  const [ratesError, setRatesError] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const ratesRequestIdRef = useRef(0)

  const boxPrice = detectedParcel?.boxPrice ?? 0
  const parcelWeight = detectedParcel?.weight
  const selectedRate = rates.find((rate) => rate.service === selectedService) ?? null
  const postage = selectedRate?.price ?? 0
  const total = postage + boxPrice
  const isProceedDisabled =
    (!allowUnvalidatedAddress && (!sender.isValidated || !recipient.isValidated)) ||
    ratesLoading ||
    !!ratesError ||
    !selectedRate

  const loadRates = useCallback(async (): Promise<void> => {
    const requestId = ++ratesRequestIdRef.current

    if (parcelWeight == null || !Number.isFinite(parcelWeight)) {
      setRatesLoading(false)
      setRatesError(copy.ratesError)
      return
    }

    setRatesLoading(true)
    setRatesError(null)
    setSelectedService(null)
    setRates([])

    const originZip = zip5(sender.zip)
    const destinationZip = zip5(recipient.zip)

    if (originZip.length !== 5 || destinationZip.length !== 5) {
      if (requestId === ratesRequestIdRef.current) {
        setRatesLoading(false)
        setRatesError(copy.ratesError)
      }
      return
    }

    try {
      const base = (revAddressBaseURL || 'https://api.revaddress.com').replace(/\/$/, '')
      const requestUrl = `${base}/api/rates`
      // Live RevAddress schema (USPS v3): weight is pounds, not oz.
      // See https://revaddress.com/docs/api-reference/
      const requestBody = {
        originZIPCode: originZip,
        destinationZIPCode: destinationZip,
        weight: Math.max(0.1, Number(parcelWeight.toFixed(3)))
      }

      console.log('[RevAddress rates] request', {
        url: requestUrl,
        method: 'POST',
        hasApiKey: Boolean(revAddressApiKey),
        body: requestBody
      })

      const data = (await window.api.bookingServerGet({
        url: requestUrl,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(revAddressApiKey ? { 'X-API-Key': revAddressApiKey } : {})
        },
        body: JSON.stringify(requestBody)
      })) as {
        rates?: {
          rateOptions?: Array<{ mailClass?: string; totalBasePrice?: number; zone?: string }>
        }
        serviceStandards?: {
          estimates?: Array<{ mailClass?: string; days?: number }>
        }
        error?: string
        message?: string
        __httpStatus?: number
        __httpOk?: boolean
      }

      console.log('[RevAddress rates] response', data)

      if (requestId !== ratesRequestIdRef.current) return

      const rateOptions = data.rates?.rateOptions
      if (data?.__httpOk === false || data?.error || !rateOptions) {
        const message = data.message || data.error || copy.ratesError
        console.warn('[RevAddress rates] API error', {
          status: data.__httpStatus,
          error: data.error,
          message: data.message
        })
        setRates([])
        setRatesError(message)
        return
      }

      const deliveryDaysByClass = new Map(
        (data.serviceStandards?.estimates ?? [])
          .filter((estimate) => typeof estimate.mailClass === 'string')
          .map((estimate) => [estimate.mailClass as string, estimate.days ?? 0])
      )

      const parsed: ShippingRate[] = rateOptions
        .filter(
          (option) =>
            typeof option.mailClass === 'string' &&
            typeof option.totalBasePrice === 'number' &&
            Number.isFinite(option.totalBasePrice)
        )
        .map((option) => ({
          service: option.mailClass as string,
          price: option.totalBasePrice as number,
          deliveryDays: deliveryDaysByClass.get(option.mailClass as string) ?? 0
        }))

      console.log('[RevAddress rates] parsed', {
        rawCount: rateOptions.length,
        acceptedCount: parsed.length,
        rates: parsed
      })

      setRates(parsed)
      setRatesError(parsed.length === 0 ? copy.noRates : null)
    } catch (error) {
      console.error('[RevAddress rates] fetch failed', error)
      if (requestId === ratesRequestIdRef.current) {
        setRates([])
        setRatesError(error instanceof Error ? error.message : copy.ratesError)
      }
    } finally {
      if (requestId === ratesRequestIdRef.current) {
        setRatesLoading(false)
      }
    }
  }, [
    sender.zip,
    recipient.zip,
    parcelWeight,
    revAddressBaseURL,
    revAddressApiKey,
    copy.ratesError,
    copy.noRates
  ])

  useEffect(() => {
    void loadRates()
  }, [loadRates])

  const handleSelectRate = (rate: ShippingRate): void => {
    setSelectedService(rate.service)
    onRateSelected(rate)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="kiosk-step flex-1 flex flex-col items-center justify-center p-6"
    >
      <div className="kiosk-card bg-white w-full max-w-full rounded-4xl p-10 sm:p-12 shadow-2xl shadow-slate-200/50 border border-slate-200 relative">
        <div className="absolute -top-4 left-10 bg-(--pp-brand-primary) text-white px-5 py-1.5 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-xl flex items-center gap-2">
          <ShieldCheck size={14} className="text-(--pp-white)" /> {copy.badge}
        </div>

        <div className="flex items-center justify-between mb-10">
          <div>
            <h3 className="kiosk-title text-3xl font-black text-(--pp-brand-primary) tracking-tighter leading-none mb-2 font-varela-round">
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
              <div className="flex items-center gap-2 text-(--pp-brand-accent) font-black text-[16px] uppercase tracking-widest font-varela-round">
                <User size={20} /> {copy.originIntel}
              </div>
              <div>
                <p className="text-xl font-black text-(--pp-brand-primary) uppercase leading-tight">
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
              className="w-fit text-[16px] font-black text-(--pp-brand-primary) uppercase hover:text-(--pp-brand-accent) transition-colors cursor-pointer mt-5"
            >
              {copy.modifyOrigin}
            </KioskButton>
          </div>

          <div className="p-6 bg-slate-50/50 rounded-3xl border-2 border-slate-100 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-(--pp-brand-accent) font-black text-[16px] uppercase tracking-widest font-varela-round">
                <Truck size={20} /> {copy.targetNode}
              </div>
              <div>
                <p className="text-xl font-black text-(--pp-brand-primary) uppercase leading-tight">
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
              className="w-fit text-[16px] font-black text-(--pp-brand-primary) uppercase hover:text-(--pp-brand-accent) transition-colors cursor-pointer mt-5"
            >
              {copy.modifyTarget}
            </KioskButton>
          </div>
        </div>

        <div className="p-8 bg-(--pp-brand-primary) rounded-3xl shadow-xl shadow-blue-900/10 flex flex-col xl:flex-row xl:items-center justify-between gap-8 text-white relative overflow-hidden border-b-8 border-(--pp-brand-accent) mb-8">
          <div className="absolute top-0 -right-40 p-8 opacity-10">
            <CreditCard size={300} />
          </div>
          <div className="flex items-center gap-20 relative z-10 justify-center">
            <div className="space-y-1.5 text-center xl:text-left">
              <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest opacity-80">
                {copy.class}
              </p>
              <p className="text-base font-black uppercase">{detectedParcel?.size}</p>
            </div>
            <div className="w-px h-10 bg-white/20 hidden xl:block" />
            <div className="space-y-1.5 text-center xl:text-left">
              <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest opacity-80">
                {copy.actualDimensions}
              </p>
              <p className="whitespace-nowrap text-sm font-black">
                {detectedParcel?.actualDimensions}
              </p>
            </div>
            <div className="w-px h-10 bg-white/20 hidden xl:block" />
            <div className="space-y-1.5 text-center xl:text-left">
              <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest opacity-80">
                {copy.payload}
              </p>
              <p className="text-base font-black">{detectedParcel?.weight} LBS</p>
            </div>
          </div>
        </div>

        <div className="mb-8 space-y-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {copy.shippingOptions}
          </p>

          {ratesLoading && (
            <p className="text-sm font-bold text-slate-500 py-6 text-center">{copy.loadingRates}</p>
          )}

          {!ratesLoading && ratesError && (
            <div className="flex flex-col items-center gap-4 py-6">
              <p className="text-sm font-bold text-slate-500 text-center">{ratesError}</p>
              <KioskButton
                onClick={() => {
                  void loadRates()
                }}
                className="bg-white text-(--pp-brand-primary) py-3 px-6 rounded-xl font-black uppercase text-xs tracking-widest border-2 border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {copy.retryRates}
              </KioskButton>
            </div>
          )}

          {!ratesLoading && !ratesError && rates.length > 0 && (
            <div className="space-y-3" role="radiogroup" aria-label={copy.shippingOptions}>
              {rates.map((rate) => {
                const isSelected = selectedService === rate.service
                return (
                  <label
                    key={rate.service}
                    className={`flex items-center justify-between gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-(--pp-brand-accent) bg-(--pp-brand-accent)/5'
                        : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <input
                        type="radio"
                        name="shipping-rate"
                        value={rate.service}
                        checked={isSelected}
                        onChange={() => handleSelectRate(rate)}
                        className="w-5 h-5 accent-(--pp-brand-primary) shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-base font-black text-(--pp-brand-primary) uppercase tracking-tight">
                          {formatServiceLabel(rate.service)}
                        </p>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                          {copy.deliveryDays}: {rate.deliveryDays} {copy.deliveryDaysUnit}
                        </p>
                      </div>
                    </div>
                    <p className="text-xl font-black text-(--pp-brand-primary) shrink-0">
                      ${rate.price.toFixed(2)}
                    </p>
                  </label>
                )
              })}
            </div>
          )}
        </div>

        <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 mb-2">
          {!selectedRate ? (
            <p className="text-sm font-bold text-slate-400 text-center uppercase tracking-widest">
              {copy.selectRate}
            </p>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-[10px] font-bold uppercase tracking-widest">{copy.postage}</span>
                <span className="text-base font-black text-(--pp-brand-primary)">
                  ${postage.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-[10px] font-bold uppercase tracking-widest">{copy.box}</span>
                <span className="text-base font-black text-(--pp-brand-primary)">
                  ${boxPrice.toFixed(2)}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-4 flex justify-between items-end">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {copy.total}
                </span>
                <p className="text-5xl font-black text-(--pp-brand-primary) tracking-tighter leading-none">
                  ${total.toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-10 flex flex-col gap-4">
          <KioskButton
            onClick={() => {
              if (isProceedDisabled) return
              onNext()
            }}
            disabled={isProceedDisabled}
            className="bg-(--pp-brand-accent) hover:bg-(--pp-black) text-white py-8 rounded-xl font-black uppercase text-2xl tracking-widest shadow-2xl shadow-blue-900/20 flex items-center justify-center gap-3 transition-all cursor-pointer font-varela-round disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {copy.executeTransaction} <ChevronRight size={18} strokeWidth={3} />
          </KioskButton>
          <KioskButton
            onClick={onBack}
            className="bg-white text-slate-500 py-5 rounded-xl font-black uppercase text-sm tracking-widest border-2 border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer font-varela-round"
          >
            {copy.back}
          </KioskButton>
        </div>
      </div>
    </motion.div>
  )
}

export default VerifyStep
