import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { exchangeCodeForTokens, validateCallbackState } from '../auth/pkce.js'
import './TokensPage.css'

export default function AuthCallback({ onTokensChange }) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('processing')

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      setStatus(`error:${error}`)
      return
    }
    if (!code) {
      setStatus('error:missing_code')
      return
    }

    validateCallbackState(state)
    exchangeCodeForTokens(code)
      .then(({ data }) => {
        onTokensChange({ accessToken: data.access_token, refreshToken: data.refresh_token })
        setStatus('ok')
        navigate('/tokens', { replace: true })
      })
      .catch((e) => setStatus(`error:${e.message}`))
  }, [searchParams, navigate, onTokensChange])

  if (status === 'processing') return <section className="tokens-page glass-panel"><p>Đang xử lý đăng nhập PKCE...</p></section>
  if (status.startsWith('error:')) {
    return (
      <section className="tokens-page glass-panel">
        <p className="notice error">PKCE callback lỗi: {status.replace('error:', '')}</p>
        <button type="button" className="button-secondary" onClick={() => navigate('/tokens')}>Quay lại Tokens</button>
      </section>
    )
  }
  return null
}
