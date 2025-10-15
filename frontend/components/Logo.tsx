export type LogoProps = {
  className?: string
  onClick?: () => void
}

const Logo = ({ className, onClick }: LogoProps) => {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 cursor-pointer transition-opacity hover:opacity-80 active:opacity-70"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 138.24 138.24"
        className={className}
      >
        <defs>
          <style>
            {`.cls-1 {
              fill: #1f88c1;
            }`}
          </style>
        </defs>
        <path
          className="cls-1"
          d="M138.24,57h-39.87l28.19-28.19-17.14-17.14c-33.36,33.36-61.54,17.23-73.87,6.65l-6.68-6.7L11.72,28.76l28.19,28.25H0v24.24h39.87l-28.19,28.19,17.14,17.14,28.19-28.19v39.87h24.24v-39.82l28.13,28.19,17.15-17.12-28.19-28.25h39.91v-24.24Z"
        />
        <circle className="cls-1" cx="69.12" cy="12.12" r="12.12" />
      </svg>
      <span className="hidden sm:block text-lg font-bold text-foreground whitespace-nowrap">
        TrustGraph
      </span>
    </div>
  )
}

export default Logo
