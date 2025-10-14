import { GithubIcon } from 'lucide-react'

import { WavsIcon } from './icons/WavsIcon'
import { XIcon } from './icons/XIcon'

export const Footer = () => {
  return (
    <footer className="mt-8 py-4 sm:pb-0 border-t border-border/40 flex flex-row justify-between items-center text-xs text-muted-foreground">
      <a
        href="https://www.wavs.xyz"
        target="_blank"
        className="transition-opacity hover:opacity-80 active:opacity-70 text-center text-primary-foreground/40 flex flex-row gap-1.5 items-center font-medium"
      >
        <p>Powered by</p>
        <WavsIcon className="w-14 h-5 -mb-0.5" />
      </a>

      <div className="flex flex-row items-center gap-3 ">
        <a
          href="https://x.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-foreground"
          aria-label="X (Twitter)"
        >
          <XIcon className="w-4 h-4" />
        </a>
        <a
          href="https://github.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-foreground"
          aria-label="GitHub"
        >
          <GithubIcon className="w-4 h-4" />
        </a>
      </div>
    </footer>
  )
}
