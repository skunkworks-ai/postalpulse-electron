import { useRef, useEffect, useCallback } from 'react'
import { useKeyboard } from './useKeyboard'

type ControlledInputProps = {
  name?: string
  value: string
  setValue: (val: string) => void
  placeholder?: string
  className?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const ControlledInput: React.FC<ControlledInputProps> = ({
  name,
  value,
  setValue,
  placeholder,
  className,
  onChange
}) => {
  const { registerInput, unregisterInput } = useKeyboard()
  const ref = useRef<HTMLInputElement | null>(null)
  // Keep latest setter in a ref so the keyboard always calls the current one
  // without causing re-registration on every render
  const setValueRef = useRef(setValue)
  useEffect(() => {
    setValueRef.current = setValue
  })

  const stableSetter = useCallback<React.Dispatch<string>>((val) => {
    setValueRef.current(val)
  }, [])

  useEffect(() => {
    const inputEl = ref.current
    if (inputEl) registerInput(inputEl, stableSetter)
    return () => {
      if (inputEl) unregisterInput(inputEl)
    }
  }, [registerInput, unregisterInput, stableSetter])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setValue(e.target.value)
    onChange?.(e)
  }

  return (
    <input
      ref={ref}
      name={name}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
    />
  )
}

export default ControlledInput
