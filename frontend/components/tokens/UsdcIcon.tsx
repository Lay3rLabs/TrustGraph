export interface UsdcIconProps {
  className?: string
}

export const UsdcIcon = ({ className }: UsdcIconProps) => {
  return <img src="/tokens/usdc.svg" alt="USDC" className={className} />
}
