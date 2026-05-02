'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Bot, Sparkles, ArrowRight, Send } from 'lucide-react'

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
      options: { emailRedirectTo: `${location.origin}/api/auth/callback` }
    })
    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/api/auth/callback` }
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
      background: '#0a0c10',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glows */}
      <div style={{
        position: 'absolute', top: '20%', left: '20%',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
        pointerEvents: 'none', filter: 'blur(60px)',
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '10%',
        width: '300px', height: '300px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)',
        pointerEvents: 'none', filter: 'blur(40px)',
      }} />

      <div style={{ width: '100%', maxWidth: '400px', position: 'relative', zIndex: 10 }}>
        {/* Logo Section */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 24, margin: '0 auto 20px',
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 40px rgba(99,102,241,0.3)',
            border: '1px solid rgba(255,255,255,0.1)',
            position: 'relative'
          }}>
            <Bot size={36} color="white" />
            <div style={{ position: 'absolute', top: -4, right: -4, color: '#f59e0b' }}>
              <Sparkles size={20} fill="#f59e0b" />
            </div>
          </div>
          <h1 style={{ 
            fontFamily: 'var(--font-display)', fontSize: 42, fontWeight: 700,
            background: 'linear-gradient(to bottom, #fff, #c7d2fe)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: 8, letterSpacing: '-1px'
          }}>
            Tivo
          </h1>
          <p style={{ color: 'var(--text-3)', fontSize: 15, fontWeight: 300, letterSpacing: '0.5px' }}>
            Seu assistente financeiro inteligente
          </p>
        </div>

        {!sent ? (
          <div className="card anim-up" style={{ 
            padding: '32px 28px', 
            background: 'rgba(17, 24, 39, 0.7)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, color: '#fff' }}>
              Boas-vindas
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 28, fontWeight: 300, lineHeight: 1.5 }}>
              Acesse sua conta para gerenciar suas finanças com o poder da IA.
            </p>

            {/* Google Login */}
            <button onClick={handleGoogle} className="btn-secondary" style={{
              width: '100%', marginBottom: 20, gap: 12, display: 'flex',
              alignItems: 'center', justifyContent: 'center', height: '52px',
              fontSize: 15, fontWeight: 500, background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)', color: '#fff'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              </svg>
              Continuar com Google
            </button>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20,
              color: 'var(--text-3)', fontSize: 13,
            }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
              <span>ou</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <input
                className="input"
                type="email"
                placeholder="Seu melhor e-mail"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleMagicLink()}
                style={{ height: '52px', fontSize: 15 }}
              />
            </div>

            {error && (
              <p style={{ fontSize: 13, color: '#ef4444', marginBottom: 16, background: 'rgba(239,68,68,0.1)', padding: '10px', borderRadius: '8px' }}>{error}</p>
            )}

            <button onClick={handleMagicLink} className="btn-primary" disabled={loading || !email} style={{ 
              width: '100%', height: '52px', fontSize: 16, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}>
              {loading ? 'Preparando...' : (
                <>Entrar com Link Mágico <ArrowRight size={18} /></>
              )}
            </button>
          </div>
        ) : (
          <div className="card anim-up" style={{ 
            padding: '40px 28px', textAlign: 'center',
            background: 'rgba(17, 24, 39, 0.7)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.08)'
          }}>
            <div style={{ 
              width: 80, height: 80, borderRadius: '50%', background: 'rgba(34,197,94,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px'
            }}>
              <Send size={32} color="#4ade80" />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12, color: '#fff' }}>
              Link enviado!
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-2)', fontWeight: 300, lineHeight: 1.6 }}>
              Enviamos um acesso seguro para <strong style={{ color: '#fff' }}>{email}</strong>.<br/>
              Confira sua caixa de entrada.
            </p>
            <button onClick={() => setSent(false)} className="btn-ghost" style={{ marginTop: 28, width: '100%', color: 'var(--text-3)' }}>
              Usar outro e-mail
            </button>
          </div>
        )}

        <div style={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          marginTop: 32, color: 'var(--text-3)', fontSize: 13
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
          Seus dados estão protegidos e seguros
        </div>
      </div>
    </div>
  )
}
