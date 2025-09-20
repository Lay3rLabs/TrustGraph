'use client'

import clsx from 'clsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { WalletConnectionButton } from '@/components/WalletConnectionButton'

import Logo from './Logo'

const menuItems: {
  label: string
  href: string
  icon: string
  iconClassName?: string
}[] = [
  {
    label: 'Hyperstition',
    href: '/hyperstition',
    icon: '/pyramid.svg',
    iconClassName: 'w-5 h-5',
  },
  {
    label: 'Points',
    href: '/points',
    icon: '/points.svg',
    iconClassName: 'w-6 h-6',
  },
]

export const Nav = () => {
  const pathname = usePathname()

  return (
    <nav className="grid grid-cols-[1fr_auto_1fr] justify-center items-start">
      <Link href="/">
        <Logo
          className="w-14 h-14 cursor-pointer transition-opacity hover:opacity-80 active:opacity-70"
          animatorLabel="nav"
          blinkInterval
          blinkOnClick
          blinkOnHover
        />
      </Link>

      <div className="flex justify-center items-stretch gap-6 text-primary-foreground rounded-full bg-popover-foreground/30 transition-[background-color,box-shadow] hover:bg-popover-foreground/40 hover:shadow-lg px-6 text-base h-12">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'transition-opacity hover:opacity-80 active:opacity-70 flex items-center gap-2',
              // If home and none are selected, make all items active.
              pathname === '/' || pathname === item.href
                ? 'opacity-100'
                : 'opacity-50'
            )}
          >
            <img
              src={item.icon}
              alt={item.label}
              className={item.iconClassName}
            />
            {item.label}
          </Link>
        ))}
      </div>

      <WalletConnectionButton className="justify-self-end" />
    </nav>
  )
}
