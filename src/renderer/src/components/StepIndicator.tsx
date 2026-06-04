import React from 'react'
import { Scan, Package, User, Truck, CheckCircle, CreditCard, CheckSquare, Navigation } from 'lucide-react'
import { STEPS } from '../constants'

interface StepIndicatorProps {
  currentStep: string
}

const STEP_ICONS = {
  [STEPS.WELCOME]: Navigation,
  [STEPS.DETECTION]: Scan,
  [STEPS.CONFIRMATION]: Package,
  [STEPS.SENDER]: User,
  [STEPS.RECIPIENT]: Truck,
  [STEPS.VERIFY]: CheckSquare,
  [STEPS.PAYMENT]: CreditCard,
  [STEPS.SUCCESS]: CheckCircle
}

const STEP_ORDER = [
  // STEPS.WELCOME,
  STEPS.DETECTION,
  STEPS.CONFIRMATION,
  STEPS.SENDER,
  STEPS.RECIPIENT,
  STEPS.VERIFY,
  STEPS.PAYMENT,
  // STEPS.SUCCESS
]

const StepIndicator = ({ currentStep }: StepIndicatorProps): React.JSX.Element => {
  const currentStepIndex = STEP_ORDER.indexOf(currentStep)

  if (currentStep === STEPS.WELCOME) return <></> // Hide step indicator on welcome step;

  return (
    <div className="w-full bg-slate-50 border-b border-slate-200 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-center gap-3 sm:gap-6 overflow-x-auto">
        {STEP_ORDER.map((step, index) => {
          const Icon = STEP_ICONS[step]
          const isActive = index === currentStepIndex
          const isCompleted = index < currentStepIndex
          const isUpcoming = index > currentStepIndex

          return (
            <div key={step} className="flex items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shrink-0 ${
                  isActive
                    ? 'bg-[#003366] shadow-lg'
                    : isCompleted
                      ? 'bg-green-500'
                      : isUpcoming
                        ? 'bg-slate-200'
                        : 'bg-slate-300'
                }`}
              >
                <Icon
                  className={`w-6 h-6 ${
                    isActive || isCompleted ? 'text-white' : 'text-slate-500'
                  }`}
                />
              </div>

              {index < STEP_ORDER.length - 1 && (
                <div
                  className={`w-7 sm:w-10 h-1 ml-2 rounded-full ${
                    isCompleted ? 'bg-green-500' : 'bg-slate-300'
                  }`}
                ></div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default StepIndicator
