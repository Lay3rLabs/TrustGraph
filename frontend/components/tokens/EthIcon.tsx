export interface EthIconProps {
  className?: string
}

export const EthIcon = ({ className }: EthIconProps) => {
  return <img src="/tokens/eth.svg" alt="ETH" className={className} />
}
