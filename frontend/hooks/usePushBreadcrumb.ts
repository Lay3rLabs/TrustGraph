'use client'

import { useSetAtom } from 'jotai'
import { usePathname } from 'next/navigation'
import { useCallback } from 'react'

import { NETWORKS } from '@/lib/config'
import { mightBeEnsName } from '@/lib/utils'
import { Breadcrumb, breadcrumbsAtom } from '@/state/nav'

/**
 * Returns a function to push a breadcrumb before navigating to a new page. If no breadcrumb is provided to the push function, one will be automatically generated based on the current path.
 */
export const usePushBreadcrumb = (defaultBreadcrumb?: Partial<Breadcrumb>) => {
  const pathname = usePathname()
  const setBreadcrumbs = useSetAtom(breadcrumbsAtom)

  return useCallback(
    (breadcrumb?: Partial<Breadcrumb>) => {
      const finalBreadcrumb: Breadcrumb = {
        title: '',
        route: pathname,
        ...defaultBreadcrumb,
        ...breadcrumb,
      }

      if (!finalBreadcrumb.title) {
        const lastSegment = pathname.split('/').pop()
        if (
          lastSegment &&
          pathname.startsWith('/network/') &&
          NETWORKS.some((n) => n.id === lastSegment)
        ) {
          // Network name
          finalBreadcrumb.title = NETWORKS.find(
            (n) => n.id === lastSegment
          )!.name
        } else if (
          lastSegment &&
          pathname.startsWith('/account/') &&
          mightBeEnsName(lastSegment)
        ) {
          // ENS name
          finalBreadcrumb.title = lastSegment
        } else if (lastSegment === 'governance') {
          finalBreadcrumb.title = 'proposals'
        } else if (
          // Trailing slash ensures this is a specific resource page, not the list page
          pathname.startsWith('/account/') ||
          pathname.startsWith('/attestations/') ||
          // Should never happen...
          pathname.startsWith('/network/')
        ) {
          // Resource type
          finalBreadcrumb.title = pathname.split('/')[1]!
        } else {
          finalBreadcrumb.title = 'previous page'
        }
      }

      setBreadcrumbs((b) => [...b, finalBreadcrumb])
    },
    [setBreadcrumbs, pathname]
  )
}
