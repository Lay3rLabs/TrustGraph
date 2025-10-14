'use client'

import clsx from 'clsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ComponentType } from 'react'

import { WalletConnectionButton } from '@/components/WalletConnectionButton'
import { useResponsiveMount } from '@/hooks/useResponsiveMount'

import Logo from './Logo'

const menuItems: {
  label: string
  href: string
  Icon?: ComponentType<{ className?: string }>
  iconClassName?: string
}[] = [
  {
    label: 'Attestations',
    href: '/attestations',
  },
  {
    label: 'Governance',
    href: '/governance',
  },
  {
    label: 'Network',
    href: '/network',
  },
]

export const Nav = () => {
  const pathname = usePathname()
  const isAtLeastSmall = useResponsiveMount('sm')

  return (
    <nav className="grid grid-cols-[1fr_auto_1fr] justify-center items-start">
      <Link href="/">
        <Logo className={clsx(isAtLeastSmall ? 'w-10 h-10' : 'w-8 h-8')} />
      </Link>

      <div className="flex justify-center items-stretch gap-4 sm:gap-6 text-foreground rounded-full bg-card border border-border transition-[background-color,box-shadow] hover:shadow-md px-4 sm:px-6 text-base h-10 sm:h-12">
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
            {item.Icon && <item.Icon className={item.iconClassName} />}
            <span className="hidden md:block">{item.label}</span>
          </Link>
        ))}
      </div>

      <WalletConnectionButton className="justify-self-end" />
    </nav>
  )
}
