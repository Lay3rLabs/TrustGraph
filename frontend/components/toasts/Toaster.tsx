import { Toaster as HotToaster } from 'react-hot-toast'

import { ErrorToast } from './ErrorToast'
import { LoadingToast } from './LoadingToast'
import { SuccessToast } from './SuccessToast'

export const Toaster = () => (
  <HotToaster
    position="bottom-right"
    reverseOrder
    toastOptions={{
      duration: 6000,
      // Show for entire duration of promise.
      loading: {
        duration: Infinity,
      },
      style: {
        borderRadius: '0',
        background: 'none',
        color: '#fff',
        boxShadow: 'none',
      },
    }}
  >
    {(t) =>
      t.type === 'error' ? (
        <ErrorToast toast={t} />
      ) : t.type === 'loading' ? (
        <LoadingToast toast={t} />
      ) : (
        <SuccessToast toast={t} />
      )
    }
  </HotToaster>
)
