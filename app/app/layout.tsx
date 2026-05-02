'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageCircle, BarChart2, FileText, Target, Settings, TrendingUp, Shield } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const navItems = [
  { href: '/app/painel',        icon: BarChart2,     label: 'Painel' },
  { href: '/app/receitas',      icon: TrendingUp,    label: 'Receitas' },
  { href: '/app/chat',          icon: MessageCircle, label: 'Chat' },
  { href: '/app/contas',        icon: FileText,      label: 'Contas' },
  { href: '/app/metas',         icon: Target,        label: 'Metas' },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
        setIsAdmin(true)
      }
    })
  }, [])

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '480px',
      margin: '0 auto',
      position: 'relative',
    }}>

      {/* Top App Bar */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px',
        background: 'var(--bg-base)',
        zIndex: 100,
      }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 20,
          fontWeight: 600,
          background: 'linear-gradient(90deg, var(--green-400), var(--green-500))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Tivo.
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          {isAdmin && (
            <Link href="/app/admin" style={{
              background: pathname.startsWith('/app/admin') ? 'var(--green-400)' : 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: pathname.startsWith('/app/admin') ? '#fff' : 'var(--text-2)',
              transition: 'all 0.2s',
            }}>
              <Shield size={18} />
            </Link>
          )}
          
          <Link href="/app/configuracoes" style={{
            background: pathname.startsWith('/app/configuracoes') ? 'var(--green-400)' : 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: pathname.startsWith('/app/configuracoes') ? '#fff' : 'var(--text-2)',
            transition: 'all 0.2s',
          }}>
            <Settings size={18} />
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main style={{ flex: 1, overflowY: 'auto', paddingBottom: '60px' }}>
        {children}
      </main>

      {/* Bottom nav */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '480px',
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        zIndex: 50,
        paddingBottom: 'env(safe-area-inset-bottom)',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 10px'
      }}>
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          const isChat = href === '/app/chat'
          
          return (
            <Link key={href} href={href} style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '12px 0 10px', textDecoration: 'none',
              color: active ? 'var(--green-400)' : 'var(--text-3)',
              transition: 'all 0.2s',
              gap: 4,
            }}>
              {isChat ? (
                <div style={{
                  background: active ? 'var(--green-400)' : 'var(--green-dim)',
                  color: active ? '#fff' : 'var(--green-400)',
                  padding: '6px',
                  borderRadius: '12px',
                  marginBottom: '2px'
                }}>
                  <Icon size={20} strokeWidth={active ? 2 : 1.5} />
                </div>
              ) : (
                <Icon size={20} strokeWidth={active ? 2 : 1.5} />
              )}
              <span style={{ fontSize: 10, fontWeight: active ? 500 : 300 }}>{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
