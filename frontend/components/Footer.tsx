import { Github, Globe, TwitterIcon } from 'lucide-react'

export const Footer = () => {
  return (
    <footer className="mt-8 pt-6 pb-4 sm:pb-0 border-t border-primary/20">
      <div className="flex flex-row items-center justify-center flex-wrap gap-x-8 gap-y-6 px-6 sm:gap-x-12 text-sm text-primary-foreground/50">
        <a
          href="https://x.com/0xEN0VA"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-opacity hover:opacity-80 active:opacity-70 flex flex-col items-center gap-1"
        >
          <TwitterIcon className="w-4 h-4" />
          @0xEN0VA
        </a>
        <a
          href="https://www.wavs.xyz"
          target="_blank"
          rel="noopener noreferrer"
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
    </footer>
  )
}
