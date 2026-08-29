import { createContext, useContext } from 'react'

export const AuthContext = createContext({
  user: null,
  status: 'loading', // 'loading' | 'authenticated' | 'anonymous'
  isCustomer: false,
  isOwner: false,
  login: async () => {},
  register: async () => {},
  loginWithGoogle: async () => {},
  logout: async () => {},
  refresh: async () => {},
  patchUser: () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}
