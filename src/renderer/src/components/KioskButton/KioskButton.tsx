import React, { useRef } from 'react'
import tapMP3 from '@renderer/assets/tap.mp3'
import { USER_ACTIVITY_EVENT } from '@renderer/constants'

interface KioskButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  soundUrl?: string
}

const KioskButton: React.FC<KioskButtonProps> = ({
  children,
  className = '',
  soundUrl = tapMP3,
  disabled,
  type = 'button',
  ...rest
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const playSound = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(soundUrl)
    }
    audioRef.current.currentTime = 0
    audioRef.current.play().catch(() => {})
  }

  const handlePointerDown = () => {
    if (disabled) return
    window.dispatchEvent(new Event(USER_ACTIVITY_EVENT))
    playSound()
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onPointerDown={handlePointerDown}
      className={`${className} transition-transform duration-100 ease-out active:scale-95`}
      {...rest}
    >
      {children}
    </button>
  )
}

export default KioskButton
