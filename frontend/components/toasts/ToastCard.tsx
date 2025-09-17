import clsx from 'clsx'
import { ReactNode, cloneElement } from 'react'
import { Toast, ToastBar, toast as hotToast } from 'react-hot-toast'

import { Card } from '../Card'

export interface ToastCardProps {
  toast: Toast
  containerClassName?: string
  preMessage?: ReactNode
}

export const ToastCard = ({
  toast,
  containerClassName,
  preMessage,
}: ToastCardProps) => (
  <ToastBar toast={toast}>
    {({ message }) => (
      <Card
        type="popover"
        size="md"
        className={clsx(
          'relative flex min-w-0 flex-row items-start gap-3 text-sm text-primary-foreground',
          toast.type !== 'loading' && 'pr-10',
          containerClassName
        )}
      >
        {preMessage}

        <div className="min-w-0 grow break-words">
          {!message || typeof message === 'string' ? (
            <p>{message}</p>
          ) : (
            cloneElement(message, {
              className: '!block !m-0 break-words',
            } as any)
          )}
        </div>

        {toast.type !== 'loading' && (
          <button
            onClick={() => hotToast.dismiss(toast.id)}
            className={clsx(
              'terminal-dim hover:terminal-bright transition-colors absolute top-4 right-4 text-lg leading-5',
              toast.type === 'error' && '!text-primary-foreground'
            )}
          >
            ×
          </button>
        )}
      </Card>
    )}
  </ToastBar>
)
