import { Github, Globe } from 'lucide-react'

import { WavsIcon } from './icons/WavsIcon'
import { XIcon } from './icons/XIcon'

export const Footer = () => {
  return (
    <footer className="mt-8 pt-8 pb-4 sm:pb-0 border-t border-primary/20 flex flex-col items-center gap-6">
      <div className="flex flex-row items-center justify-center flex-wrap gap-x-8 gap-y-6 px-6 sm:gap-x-12 text-sm text-primary-foreground/50">
        <a
          href="https://x.com/0xEN0VA"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-opacity hover:opacity-80 active:opacity-70 flex flex-col items-center gap-1"
        >
          <XIcon className="w-4 h-4" />
          @0xEN0VA
        </a>
        <a
          href="https://www.wavs.xyz"
          target="_blank"
          className="transition-opacity hover:opacity-80 active:opacity-70 flex flex-col items-center gap-1"
        >
          <Globe className="w-4 h-4" />
          wavs.xyz
        </a>
        <a
          href="https://github.com/Lay3rLabs/WAVS"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-opacity hover:opacity-80 active:opacity-70 flex flex-col items-center gap-1"
        >
          <Github className="w-4 h-4" />
          GitHub
        </a>
      </div>

      <a
        href="https://www.wavs.xyz"
        target="_blank"
        className="transition-opacity hover:opacity-80 active:opacity-70 text-center text-sm text-primary-foreground/40 flex flex-row gap-1.5 items-center font-medium"
      >
        <p>Powered by</p>
        <WavsIcon className="w-14 h-5 -mb-0.5" />
      </a>
    </footer>
  )
}
