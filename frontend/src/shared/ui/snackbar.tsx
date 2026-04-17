import { createPortal } from 'react-dom'
import { InformationCircleIcon, ExclamationCircleIcon, XMarkIcon } from '@heroicons/react/24/solid'
import { useEffect } from 'react'
import { useSnackbar } from '@/hooks/use-snackbar'
import { ERROR_CONTACT_MANAGER_SUFFIX } from '@/shared/config/error-messages'

export type SnackbarMessage = string | { text: string; variant: 'error' }

interface SnackbarProps {
  message: SnackbarMessage | null
  onClose: () => void
  duration?: number
}

function parseMessage(message: SnackbarMessage): { text: string; isError: boolean } {
  if (typeof message === 'string') return { text: message, isError: false }
  return { text: message.text, isError: message.variant === 'error' }
}

export function Snackbar({ message, onClose, duration }: SnackbarProps) {
  const parsed = message ? parseMessage(message) : null
  const effectiveDuration = duration ?? (parsed?.isError ? 6000 : 3500)

  useEffect(() => {
    if (!message) return
    const timer = setTimeout(onClose, effectiveDuration)
    return () => clearTimeout(timer)
  }, [message, onClose, effectiveDuration])

  if (!parsed) return null
  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-100 animate-in slide-in-from-top-2 fade-in duration-200">
      <div
        className={`flex items-start gap-3 rounded-xl px-5 py-3 shadow-lg min-w-[280px] max-w-[360px] ${
          parsed.isError
            ? 'bg-red-600 shadow-red-500/15'
            : 'bg-zinc-900 shadow-black/10'
        }`}
      >
        {parsed.isError ? (
          <ExclamationCircleIcon className="size-4 text-white/90 shrink-0 mt-0.5" />
        ) : (
          <InformationCircleIcon className="size-4 text-white/80 shrink-0 mt-0.5" />
        )}
        <div className="flex flex-col gap-0.5 flex-1">
          <span className="text-sm font-medium text-white">{parsed.text}</span>
          {parsed.isError && (
            <span className="text-xs text-white/80">
              {ERROR_CONTACT_MANAGER_SUFFIX}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex size-6 items-center justify-center rounded-md text-white/40 hover:text-white/80 transition-colors shrink-0 mt-0.5"
        >
          <XMarkIcon className="size-3.5" />
        </button>
      </div>
    </div>,
    document.body,
  )
}

export function GlobalSnackbar() {
  const { message, clear } = useSnackbar()
  return <Snackbar message={message} onClose={clear} />
}
