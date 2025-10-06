'use client'

import clsx from 'clsx'
import { Fullscreen } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ComponentType,
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react'
import useLocalStorageState from 'use-local-storage-state'

import { WalletConnectionButton } from '@/components/WalletConnectionButton'
import { useResponsiveMount } from '@/hooks/useResponsiveMount'

import { PointsIcon } from './icons/PointsIcon'
import { PyramidIcon } from './icons/PyramidIcon'
import Logo from './Logo'
import { Popup } from './Popup'
import { SymbientChat } from './SymbientChat'

const menuItems: {
  label: string
  href: string
  Icon: ComponentType<{ className?: string }>
  iconClassName?: string
}[] = [
  {
    label: 'Symbient',
    href: '/symbient',
    Icon: Logo,
    iconClassName: 'w-6 h-6',
  },
  {
    label: 'Hyperstition',
    href: '/hyperstition',
    Icon: PyramidIcon,
    iconClassName: 'w-5 h-5',
  },
  {
    label: 'Points',
    href: '/points',
    Icon: PointsIcon,
    iconClassName: 'w-6 h-6',
  },
]

export const Nav = () => {
  const pathname = usePathname()
  const [hasOpenedSymbientChat, setHasOpenedSymbientChat] =
    useLocalStorageState('has_opened_symbient_chat', {
      defaultValue: false,
    })

  const prepareSymbientChatRef = useRef(() => {})
  const setOpenRef = useRef<Dispatch<SetStateAction<boolean>> | null>(null)

  const isAtLeastSmall = useResponsiveMount('sm')

  const [maybeOpen, setMaybeOpen] = useState(false)
  useEffect(() => {
    const timeout = setTimeout(() => {
      setMaybeOpen(true)
    }, 1500)
    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    if (isAtLeastSmall && !hasOpenedSymbientChat && maybeOpen) {
      setOpenRef.current?.(true)
    }
  }, [isAtLeastSmall, setHasOpenedSymbientChat, maybeOpen])

  return (
    <nav className="grid grid-cols-[1fr_auto_1fr] justify-center items-start">
      <Popup
        popupClassName="max-w-lg max-h-[90vh] overflow-hidden !pb-0 !bg-popover-foreground/80 backdrop-blur-sm"
        position="right"
        wrapperClassName="h-14"
        onOpen={() => {
          prepareSymbientChatRef.current()
          setHasOpenedSymbientChat(true)
        }}
        setOpenRef={setOpenRef}
        popupPadding={24}
        trigger={{
          type: 'custom',
          Renderer: ({ onClick, open }) => (
            <Logo
              onClick={pathname !== '/symbient' ? onClick : undefined}
              className={clsx(
                'cursor-pointer transition-opacity hover:opacity-80 active:opacity-70',
                isAtLeastSmall ? 'w-14 h-14' : 'w-10 h-10',
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
        {pathname !== '/symbient' && (
          <>
            <SymbientChat
              className="!p-0 !bg-transparent h-[42rem] max-h-full"
              prepareRef={prepareSymbientChatRef}
            />

            <Link
              href="/symbient"
              className="absolute top-2 right-2 sm:top-4 sm:right-4 p-1 rounded-sm bg-popover-foreground/90"
              onClick={() => setOpenRef.current?.(false)}
            >
              <Fullscreen className="w-4 h-4 sm:w-5 sm:h-5 transition-opacity text-primary-foreground/60 hover:opacity-80 active:opacity-70" />
            </Link>
          </>
        )}
      </Popup>

      <div className="flex justify-center items-stretch gap-4 sm:gap-6 text-primary-foreground rounded-full bg-popover-foreground/30 transition-[background-color,box-shadow] hover:bg-popover-foreground/40 hover:shadow-lg px-4 sm:px-6 text-base h-10 sm:h-12">
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
            <item.Icon className={item.iconClassName} />
            <span className="hidden sm:block">{item.label}</span>
          </Link>
        ))}
      </div>

      <WalletConnectionButton className="justify-self-end" />
    </nav>
  )
}
