import { Navigate } from 'react-router-dom'
import { getAuthTokens } from './session'

export default function RequireAuth({ children }) {
  const { accessToken } = getAuthTokens()
  if (!accessToken) return <Navigate to="/login" replace />
  return children
}
