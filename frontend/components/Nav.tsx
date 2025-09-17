'use client'

import clsx from 'clsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { WalletConnectionButton } from '@/components/WalletConnectionButton'

const menuItems: {
  label: string
  href: string
}[] = [
  {
    label: 'Hyperstition',
    href: '/backroom/hyperstition',
  },
  {
    label: 'Points',
    href: '/backroom/points',
  },
  {
    label: 'Memetics',
    href: '/backroom/memetics',
  },
]

export const Nav = () => {
  const pathname = usePathname()

  return (
    <nav className="grid grid-cols-[1fr_auto_1fr] justify-center items-start">
      <Link href="/">
        <img
          src="/logo.svg"
          alt="EN0VA"
          className="w-14 h-14 cursor-pointer transition-opacity hover:opacity-80 active:opacity-70"
        />
      </Link>

      <div className="flex justify-center items-stretch gap-8 text-primary-foreground rounded-full bg-popover-foreground/30 transition-[background-color,box-shadow] hover:bg-popover-foreground/40 hover:shadow-lg px-8 text-base h-12">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'transition-opacity hover:opacity-80 active:opacity-70 flex items-center',
              // If home and none are selected, make all items active.
              pathname === '/' || pathname === item.href
                ? 'opacity-100'
                : 'opacity-50'
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <WalletConnectionButton className="justify-self-end" />
    </nav>
  )
}
