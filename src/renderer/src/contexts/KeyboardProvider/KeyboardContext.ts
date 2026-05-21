import { createContext } from 'react'
import type { KeyboardContextProps } from './KeyboardProvider'

export const KeyboardContext = createContext<KeyboardContextProps | undefined>(undefined)
