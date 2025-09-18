'use client'

import Logo from '@/components/Logo'

export default function Hallo() {
  return (
    <div className="w-full h-full flex justify-center items-center overflow-visible">
      <Logo className="w-128 h-128" blinkInterval blinkOnClick />
    </div>
  )
}
