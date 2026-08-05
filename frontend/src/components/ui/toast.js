import toast from 'react-hot-toast'

/*
 * Thin wrapper over the single react-hot-toast instance mounted in App.
 * Keeps transient-action feedback consistent. Do NOT use toasts for critical
 * errors that need a persistent, explained recovery path — use ErrorState.
 */
export const notify = {
  success: (message, opts) => toast.success(message, opts),
  error: (message, opts) => toast.error(message, opts),
  loading: (message, opts) => toast.loading(message, opts),
  message: (message, opts) => toast(message, opts),
  dismiss: (id) => toast.dismiss(id),
  promise: (promise, msgs, opts) => toast.promise(promise, msgs, opts),
}

export default notify
