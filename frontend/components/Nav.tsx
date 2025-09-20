'use client'

import clsx from 'clsx'
import { Fullscreen } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Dispatch, SetStateAction, useRef } from 'react'

import { WalletConnectionButton } from '@/components/WalletConnectionButton'

import Logo from './Logo'
import { Popup } from './Popup'
import { SymbientChat } from './SymbientChat'

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

  const prepareSymbientChatRef = useRef(() => {})
  const setOpenRef = useRef<Dispatch<SetStateAction<boolean>> | null>(null)

  return (
    <nav className="grid grid-cols-[1fr_auto_1fr] justify-center items-start">
      <Popup
        popupClassName="max-w-lg max-h-[90vh] overflow-hidden !pb-0 !bg-popover-foreground/80 backdrop-blur-sm"
        position="right"
        wrapperClassName="h-14"
        onOpen={() => prepareSymbientChatRef.current()}
        setOpenRef={setOpenRef}
        popupPadding={24}
        trigger={{
          type: 'custom',
          Renderer: ({ onClick, open }) => (
            <Logo
              onClick={pathname !== '/' ? onClick : undefined}
              className={clsx(
                'w-14 h-14 cursor-pointer transition-opacity hover:opacity-80 active:opacity-70',
                open && 'fixed'
              )}
              animatorLabel="nav"
              blinkInterval
              blinkOnClick
              blinkOnHover
            />
          ),
        }}
      >
        {pathname !== '/' && (
          <>
            <SymbientChat
              className="!p-0 !bg-transparent h-[42rem] max-h-full"
              prepareRef={prepareSymbientChatRef}
            />

            <Link
              href="/"
              className="absolute top-4 right-4"
              onClick={() => setOpenRef.current?.(false)}
            >
              <Fullscreen className="w-6 h-6 transition-opacity text-primary-foreground/80 hover:opacity-80 active:opacity-70" />
            </Link>
          </>
        )}
      </Popup>

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
