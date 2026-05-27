import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { completePkceCallback } from '../../api/authApi'
import { getTenantRole } from '../../auth/session'

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const oauthError = searchParams.get('error')

    if (oauthError) {
      setError(oauthError)
      return
    }
    if (!code) {
      setError('Missing authorization code')
      return
    }

    completePkceCallback({ code, state })
      .then(() => {
        const role = getTenantRole()
        if (role === 'buyer') navigate('/buyer', { replace: true })
        else if (role === 'seller') navigate('/seller', { replace: true })
        else navigate('/admin', { replace: true })
      })
      .catch((e) => setError(e.message))
  }, [navigate, searchParams])

  if (error) {
    return (
      <section className="min-h-screen grid place-items-center bg-[#f7f9fb]">
        <div className="bg-white rounded-xl border border-red-200 px-6 py-5">
          <p className="text-red-700 text-sm">Đăng nhập thất bại: {error}</p>
        </div>
      </section>
    )
  }

  return (
    <section className="min-h-screen grid place-items-center bg-[#f7f9fb]">
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
        <p className="text-gray-700 text-sm">Đang xử lý đăng nhập...</p>
      </div>
    </section>
  )
}
