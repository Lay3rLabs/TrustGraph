import clsx from 'clsx'
import { ReactNode, cloneElement } from 'react'
import { Toast, ToastBar, toast as hotToast } from 'react-hot-toast'

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
      <div
        className={clsx(
          'relative flex min-w-0 flex-row items-start gap-3 rounded-sm bg-popover-foreground p-4 text-sm text-primary-foreground shadow-2xl',
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
      </div>
    )}
  </ToastBar>
)
