import { CheckCircle2 } from 'lucide-react'
import { Toast } from 'react-hot-toast'

import { ToastCard } from './ToastCard'

export interface SuccessToastProps {
  toast: Toast
}

export const SuccessToast = (props: SuccessToastProps) => (
  <ToastCard
    preMessage={
      <CheckCircle2
        size={20}
        className="text-green-600 dark:text-green-400 flex-shrink-0"
      />
    }
    {...props}
  />
)
