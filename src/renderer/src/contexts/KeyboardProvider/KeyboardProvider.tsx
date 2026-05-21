import React, { useState, useRef, useEffect, ReactNode } from 'react'
import Keyboard from 'react-simple-keyboard'

import tapMP3 from '../../assets/tap.mp3'
import backspaceSVG from './backspace.svg'
import shiftSVG from './shift.svg'
import spacebarSVG from './spacebar.svg'
import hidekeyboardSVG from './hidekeyboard.svg'
import keyboardSVG from './keyboard.svg'
import numericSVG from './numeric.svg'

import 'react-simple-keyboard/build/css/index.css'
import './Keyboard.css'

type LayoutName = 'default' | 'shift' | 'numeric' | 'capslock'

import { KeyboardContext } from './KeyboardContext'

export interface KeyboardContextProps {
  show: () => void
  hide: () => void
  toggle: () => void
  registerInput: (
    el: HTMLInputElement | HTMLTextAreaElement,
    setter: React.Dispatch<string>
  ) => void
  unregisterInput: (el: HTMLInputElement | HTMLTextAreaElement) => void
}

interface KeyboardProviderProps {
  children: ReactNode
}

export const KeyboardProvider: React.FC<KeyboardProviderProps> = ({ children }) => {
  const [layoutName, setLayoutName] = useState<LayoutName>('default')
  const [capsLock, setCapsLock] = useState(false)
  const [visible, setVisible] = useState(false)
  const keyboardRef = useRef<unknown | null>(null)
  const tapSound = new Audio(tapMP3)

  // Map of inputs to their React state setters
  const inputSetters = useRef(
    new Map<HTMLInputElement | HTMLTextAreaElement, React.Dispatch<string>>()
  ).current

  const registerInput = (
    el: HTMLInputElement | HTMLTextAreaElement,
    setter: React.Dispatch<string>
  ): void => {
    inputSetters.set(el, setter)
  }

  const unregisterInput = (el: HTMLInputElement | HTMLTextAreaElement): void => {
    inputSetters.delete(el)
  }

  // Keyboard layouts
  const layout = {
    default: [
      '` 1 2 3 4 5 6 7 8 9 0 {bksp}',
      '{tab} q w e r t y u i o p { }',
      '{shift} a s d f g h j k l : {shift}',
      '{capslock} z x c v b n m , . ? {capslock}',
      '{numeric} {space} {hidekeyboard}'
    ],
    shift: [
      '~ ! @ # $ % ^ & * ( ) {bksp}',
      '{tab} Q W E R T Y U I O P [ ]',
      '{shift} A S D F G H J K L ; {shift}',
      '{capslock} Z X C V B N M , . / {capslock}',
      '{numeric} {space} {hidekeyboard}'
    ],
    capslock: [
      '~ ! @ # $ % ^ & * ( ) {bksp}',
      '{tab} Q W E R T Y U I O P [ ]',
      '{shift} A S D F G H J K L ;',
      '{capslock} Z X C V B N M , . / {capslock}',
      '{numeric} {space} {hidekeyboard}'
    ],
    numeric: ['{tab} {bksp}', '1 2 3', '4 5 6', '7 8 9', '{abc} 0 . {hidekeyboard}']
  }

  // Helper functions for caret-aware insertion
  const insertAtCaretState = (
    currentValue: string,
    char: string,
    selectionStart: number,
    selectionEnd: number
  ): { newValue: string; newCaret: number } => {
    const newValue = currentValue.slice(0, selectionStart) + char + currentValue.slice(selectionEnd)
    return { newValue, newCaret: selectionStart + char.length }
  }

  const backspaceAtCaretState = (
    currentValue: string,
    selectionStart: number,
    selectionEnd: number
  ): { newValue: string; newCaret: number } => {
    if (selectionStart === 0 && selectionEnd === 0)
      return { newValue: currentValue, newCaret: selectionStart }
    const newValue = currentValue.slice(0, selectionStart - 1) + currentValue.slice(selectionEnd)
    return { newValue, newCaret: selectionStart - 1 }
  }

  const deleteAtCaretState = (
    currentValue: string,
    selectionStart: number,
    selectionEnd: number
  ): { newValue: string; newCaret: number } => {
    const newValue = currentValue.slice(0, selectionStart) + currentValue.slice(selectionEnd + 1)
    return { newValue, newCaret: selectionStart }
  }

  // Key press handler
  const handleKeyPress = (button: string): void => {
    // Play sound (non-blocking)
    tapSound.currentTime = 0
    tapSound.play().catch(() => {
      /* ignore play errors */
    })

    const active = document.activeElement as HTMLInputElement | HTMLTextAreaElement | null
    if (!active) return

    const setter = inputSetters.get(active)
    if (!setter) return

    const start = active.selectionStart || 0
    const end = active.selectionEnd || 0
    const currentValue = active.value

    let newValue = currentValue
    let newCaret = start

    switch (button) {
      case '{tab}': {
        const focusable = Array.from(
          document.querySelectorAll('input, textarea, [tabindex]:not([tabindex="-1"])')
        ) as HTMLElement[]
        const idx = focusable.indexOf(active)
        let nextIdx = idx + 1
        if (nextIdx >= focusable.length) nextIdx = 0
        const next = focusable[nextIdx]
        if (next) next.focus()
        return
      }
      case '{shift}': {
        if (layoutName === 'default') {
          setLayoutName('shift')
        } else if (layoutName === 'shift') {
          setLayoutName('default')
        } else if (layoutName === 'capslock') {
          setLayoutName('shift')
        }
        return
      }
      case '{capslock}': {
        setCapsLock((prev) => {
          const newState = !prev
          setLayoutName(newState ? 'capslock' : 'default')
          return newState
        })
        return
      }
      case '{numeric}':
        setLayoutName('numeric')
        return
      case '{abc}':
        setLayoutName(capsLock ? 'capslock' : 'default')
        return
      case '{bksp}': {
        const res = backspaceAtCaretState(currentValue, start, end)
        newValue = res.newValue
        newCaret = res.newCaret
        break
      }
      case '{del}': {
        const res = deleteAtCaretState(currentValue, start, end)
        newValue = res.newValue
        newCaret = res.newCaret
        break
      }
      case '{enter}': {
        const res = insertAtCaretState(currentValue, '\n', start, end)
        newValue = res.newValue
        newCaret = res.newCaret
        break
      }
      case '{space}': {
        const res = insertAtCaretState(currentValue, ' ', start, end)
        newValue = res.newValue
        newCaret = res.newCaret
        break
      }
      case '{hidekeyboard}': {
        setVisible(false)
        break
      }
      default: {
        const res = insertAtCaretState(currentValue, button, start, end)
        newValue = res.newValue
        newCaret = res.newCaret
        if (layoutName === 'shift' && !capsLock) {
          setLayoutName('default')
        } else if (layoutName === 'shift' && capsLock) {
          setLayoutName('capslock')
        }
        break
      }
    }

    // update React state
    setter(newValue)

    // restore caret after render
    requestAnimationFrame(() => {
      active.setSelectionRange(newCaret, newCaret)
      active.focus()
    })
  }

  // Auto-show/hide keyboard on input focus
  useEffect(() => {
    const handleFocus = (e: FocusEvent): void => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') setVisible(true)
    }
    const handleBlur = (e: FocusEvent): void => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') setVisible(false)
    }
    const handlePointerDown = (e: PointerEvent): void => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') setVisible(true)
    }

    document.addEventListener('focusin', handleFocus)
    document.addEventListener('focusout', handleBlur)
    document.addEventListener('pointerdown', handlePointerDown)

    return () => {
      document.removeEventListener('focusin', handleFocus)
      document.removeEventListener('focusout', handleBlur)
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [])

  return (
    <KeyboardContext.Provider
      value={{
        show: () => setVisible(true),
        hide: () => setVisible(false),
        toggle: () => setVisible((v) => !v),
        registerInput,
        unregisterInput
      }}
    >
      {children}
      {visible && (
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
          <Keyboard
            keyboardRef={(r) => (keyboardRef.current = r)}
            layout={layout}
            layoutName={layoutName}
            onKeyPress={handleKeyPress}
            preventMouseDownDefault={true}
            physicalKeyboardHighlight={false}
            display={{
              '{bksp}': `<img src="${backspaceSVG}" alt="Backspace" style="width:50px;" />`,
              '{shift}': `<img src="${shiftSVG}" alt="Shift" style="width:50px;" />`,
              '{capslock}': `<img src="${shiftSVG}" alt="CapsLock" style="width:50px;" />`,
              '{tab}': `<img src="${shiftSVG}" alt="Tab" style="width:50px;" class="rotate-90" />`,
              '{space}': `<img src="${spacebarSVG}" alt="Space" style="width:50px;" />`,
              '{hidekeyboard}': `<img src="${hidekeyboardSVG}" alt="Hide Keyboard" style="width:50px;" />`,
              '{numeric}': `<img src="${numericSVG}" alt="Numeric Keyboard" style="width:50px;" />`,
              '{abc}': `<img src="${keyboardSVG}" alt="Alphabet Keyboard" style="width:50px;" />`
            }}
            buttonTheme={[
              layoutName === 'shift'
                ? { class: 'shift-active', buttons: '{shift}' }
                : { class: 'shift-inactive', buttons: '{shift}' },
              layoutName === 'capslock'
                ? { class: 'capslock-active', buttons: '{capslock}' }
                : { class: 'capslock-inactive', buttons: '{capslock}' }
            ]}
          />
        </div>
      )}
    </KeyboardContext.Provider>
  )
}
