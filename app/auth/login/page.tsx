'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const handleMagicLink = async () => {
    if (!email) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/app/chat` }
    })
    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/app/chat` }
    })
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'var(--bg-base)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)',
        width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(22,163,74,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '380px', position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #166534, #4ade80)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, boxShadow: '0 8px 32px rgba(74,222,128,0.25)',
          }}>💰</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--text-1)', marginBottom: 6 }}>
            Tivo
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: 14, fontWeight: 300 }}>
            Seu assistente financeiro inteligente
          </p>
        </div>

        {!sent ? (
          <div className="card anim-up" style={{ padding: '28px 24px' }}>
            <h2 style={{ fontSize: 18, fontWeight: 500, marginBottom: 4, color: 'var(--text-1)' }}>
              Entrar na sua conta
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 24, fontWeight: 300 }}>
              Sem senha. Enviamos um link mágico pro seu email.
            </p>

            {/* Google */}
            <button onClick={handleGoogle} className="btn-ghost" style={{
              width: '100%', marginBottom: 16, gap: 10, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar com Google
            </button>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
              color: 'var(--text-3)', fontSize: 12,
            }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              ou use seu email
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>
                Email
              </label>
              <input
                className="input"
                type="email"
                placeholder="voce@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleMagicLink()}
              />
            </div>

            {error && (
              <p style={{ fontSize: 12, color: 'var(--red)', marginBottom: 12 }}>{error}</p>
            )}

            <button onClick={handleMagicLink} className="btn-primary" disabled={loading || !email} style={{ width: '100%' }}>
              {loading ? 'Enviando...' : 'Enviar link de acesso'}
            </button>
          </div>
        ) : (
          <div className="card anim-up" style={{ padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
            <h2 style={{ fontSize: 20, fontFamily: 'var(--font-display)', marginBottom: 8 }}>
              Verifique seu email
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-2)', fontWeight: 300, lineHeight: 1.6 }}>
              Enviamos um link de acesso para <strong style={{ color: 'var(--text-1)' }}>{email}</strong>.
              Clique no link para entrar.
            </p>
            <button onClick={() => setSent(false)} className="btn-ghost" style={{ marginTop: 20, width: '100%' }}>
              Tentar outro email
            </button>
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)', marginTop: 24 }}>
          Seus dados financeiros são privados e seguros 🔒
        </p>
      </div>
    </div>
  )
}
