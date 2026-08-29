import { createContext, useContext } from 'react'

export const ToastContext = createContext({
  toasts: [],
  notify: () => {},
  dismiss: () => {},
})

export function useToast() {
  return useContext(ToastContext)
}
