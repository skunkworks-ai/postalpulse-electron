import { useContext } from 'react'
import { KeyboardContext } from './KeyboardContext'
import type { KeyboardContextProps } from './KeyboardProvider'

export const useKeyboard = (): KeyboardContextProps => {
  const ctx = useContext(KeyboardContext)
  if (!ctx) throw new Error('useKeyboard must be used within KeyboardProvider')
  return ctx
}
