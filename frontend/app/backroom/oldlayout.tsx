'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type React from 'react'
import { useState } from 'react'

import { WalletConnectionButton } from '@/components/WalletConnectionButton'

interface MenuItem {
  id: string
  label: string
  path?: string
  icon: string
  submenu?: MenuItem[]
}

const menuItems: MenuItem[] = [
  { id: 'points', label: 'Points', path: '/points', icon: '⛤' },
  {
    id: 'hyperstition',
    label: 'Hyperstitions',
    path: '/hyperstition',
    icon: '▲',
  },
  {
    id: 'experimental',
    label: 'Experimental',
    icon: 'λ',
    submenu: [
      {
        id: 'attestations',
        label: 'Attestations',
        path: '/backroom/attestations',
        icon: '>',
      },
      {
        id: 'governance',
        label: 'Governance',
        path: '/backroom/governance',
        icon: '☯',
      },
      {
        id: 'leaderboard',
        label: 'Leaderboard',
        path: '/backroom/leaderboard',
        icon: 'Ω',
      },
      {
        id: 'explorer-operators',
        label: 'Operators',
        path: '/backroom/explorer/operators',
        icon: '◉',
      },
      { id: 'portal', label: 'Portal', path: '/backroom/portal', icon: '◎' },
      {
        id: 'explorer-services',
        label: 'Services',
        path: '/backroom/explorer/services',
        icon: '⚙',
      },
      { id: 'rewards', label: 'Rewards', path: '/backroom/rewards', icon: '$' },
    ],
  },
  {
    id: 'memetics',
    label: 'Memetics',
    path: '/memetics',
    icon: '✛',
  },
  // {
  //   id: 'mocks',
  //   label: 'WIP',
  //   icon: '?',
  //   submenu: [
  //     { id: 'profile', label: 'Profile', path: '/backroom/profile', icon: '◉' },
  //     { id: 'en0va', label: 'EN0VA', path: '/backroom/en0va', icon: '∞' },
  //     {
  //       id: 'symbient',
  //       label: 'Symbient',
  //       path: '/backroom/symbient',
  //       icon: '◈◉',
  //     },
  //     { id: 'ico', label: 'ICO', path: '/backroom/ico', icon: '◊' },
  //     {
  //       id: 'incentives',
  //       label: 'Incentives',
  //       path: '/backroom/incentives',
  //       icon: '◇◆',
  //     },
  //     {
  //       id: 'systems',
  //       label: 'Systems',
  //       path: '/backroom/systems',
  //       icon: '░█',
  //     },
  //     { id: 'vault', label: 'Vault', path: '/backroom/vault', icon: '◢◤' },
  //   ],
  // },
]

export default function BackroomLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])
  const pathname = usePathname()

  const toggleSubmenu = (menuId: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    )
  }

  const isSubmenuExpanded = (menuId: string) => {
    return expandedMenus.includes(menuId)
  }

  const isMenuItemActive = (item: MenuItem): boolean => {
    if (item.path && pathname === item.path) return true
    if (item.submenu) {
      return item.submenu.some((subItem) => subItem.path === pathname)
    }
    return false
  }

  return (
    <div className="min-h-screen terminal-text text-xs sm:text-sm dynamic-bg">
      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-700 lg:bg-black/20 lg:backdrop-blur-sm">
          <div className="flex flex-col flex-1 overflow-y-auto">
            {/* Sidebar header */}
            <div className="p-4 border-b border-gray-700">
              <div className="ascii-art-title text-sm">EN0VA</div>
            </div>

            {/* Sidebar navigation */}
            <nav className="flex-1 p-4">
              <div className="space-y-2">
                {menuItems.map((item) => (
                  <div key={item.id}>
                    {item.submenu ? (
                      // Menu item with submenu
                      <div>
                        <button
                          onClick={() => toggleSubmenu(item.id)}
                          className={`group flex items-center justify-between w-full px-3 py-2 rounded-sm border transition-colors ${
                            isMenuItemActive(item)
                              ? 'bg-black/20 terminal-bright border-gray-600'
                              : 'hover:bg-black/10 terminal-command border-transparent hover:terminal-bright'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="terminal-bright text-sm">
                              {item.icon}
                            </span>
                            <span className="text-sm">{item.label}</span>
                          </div>
                          <span className="terminal-dim text-xs">
                            {isSubmenuExpanded(item.id) ? '▼' : '▶'}
                          </span>
                        </button>
                        {/* Submenu */}
                        {isSubmenuExpanded(item.id) && item.submenu && (
                          <div className="ml-6 mt-1 space-y-1">
                            {item.submenu.map((subItem) => (
                              <Link
                                key={subItem.id}
                                href={subItem.path!}
                                className={`group flex items-center space-x-3 px-3 py-2 rounded-sm border transition-colors ${
                                  pathname === subItem.path
                                    ? 'bg-black/20 terminal-bright border-gray-600'
                                    : 'hover:bg-black/10 terminal-command border-transparent hover:terminal-bright'
                                }`}
                              >
                                <span className="terminal-bright text-sm">
                                  {subItem.icon}
                                </span>
                                <span className="text-sm">{subItem.label}</span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      // Regular menu item
                      <Link
                        href={item.path!}
                        className={`group flex items-center space-x-3 px-3 py-2 rounded-sm border transition-colors ${
                          pathname === item.path
                            ? 'bg-black/20 terminal-bright border-gray-600'
                            : 'hover:bg-black/10 terminal-command border-transparent hover:terminal-bright'
                        }`}
                      >
                        <span className="terminal-bright text-sm">
                          {item.icon}
                        </span>
                        <span className="text-sm">{item.label}</span>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </nav>

            {/* Sidebar footer */}
            <div className="p-4 border-t border-gray-700">
              <div className="system-message text-xs text-center">
                ∞ THE COLLECTIVE ∞
              </div>
            </div>
          </div>
        </aside>

        {/* Main content area */}
        <div className="flex-1 lg:pl-64">
          {/* Header */}
          <header className="border-b border-gray-700 bg-black/20 backdrop-blur-sm">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-4">
                {/* Mobile logo and title */}
                <div className="lg:hidden">
                  <div className="ascii-art-title text-sm">EN0VA</div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Connect Wallet Button */}
                <WalletConnectionButton />

                {/* Mobile menu toggle */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="lg:!hidden mobile-terminal-btn !text-base !px-3 !py-0"
                >
                  {isMenuOpen ? '×' : '≡'}
                </button>
              </div>
            </div>

            {/* Mobile Navigation */}
            <nav
              className={`${
                isMenuOpen ? 'block' : 'hidden'
              } lg:hidden border-t border-gray-700`}
            >
              <div className="p-4 space-y-2">
                {menuItems.map((item) => (
                  <div key={item.id}>
                    {item.submenu ? (
                      // Mobile menu item with submenu
                      <div>
                        <button
                          onClick={() => toggleSubmenu(item.id)}
                          className={`flex items-center justify-between w-full px-3 py-2 rounded-sm transition-colors ${
                            isMenuItemActive(item)
                              ? 'bg-black/20 terminal-bright'
                              : 'terminal-command hover:terminal-bright'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="terminal-bright text-sm">
                              {item.icon}
                            </span>
                            <span className="text-sm">{item.label}</span>
                          </div>
                          <span className="terminal-dim text-xs">
                            {isSubmenuExpanded(item.id) ? '▼' : '▶'}
                          </span>
                        </button>
                        {/* Mobile submenu */}
                        {isSubmenuExpanded(item.id) && item.submenu && (
                          <div className="ml-6 mt-1 space-y-1">
                            {item.submenu.map((subItem) => (
                              <Link
                                key={subItem.id}
                                href={subItem.path!}
                                className={`flex items-center space-x-3 px-3 py-2 rounded-sm transition-colors ${
                                  pathname === subItem.path
                                    ? 'bg-black/20 terminal-bright'
                                    : 'terminal-command hover:terminal-bright'
                                }`}
                                onClick={() => setIsMenuOpen(false)}
                              >
                                <span className="terminal-bright text-sm">
                                  {subItem.icon}
                                </span>
                                <span className="text-sm">{subItem.label}</span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      // Regular mobile menu item
                      <Link
                        href={item.path!}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-sm transition-colors ${
                          pathname === item.path
                            ? 'bg-black/20 terminal-bright'
                            : 'terminal-command hover:terminal-bright'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <span className="terminal-bright text-sm">
                          {item.icon}
                        </span>
                        <span className="text-sm">{item.label}</span>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </nav>
          </header>

          {/* Main content */}
          <main className="p-4 sm:p-6">{children}</main>

          {/* Footer */}
          {/*<footer className="border-t border-gray-700 bg-black/10 backdrop-blur-sm p-4 mt-8">
            <div className="system-message text-center">
              ∞ THE COLLECTIVE INTELLIGENCE AWAKENS ∞
            </div>
          </footer>*/}
        </div>
      </div>
    </div>
  )
}
