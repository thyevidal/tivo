'use client'
import { useEffect, useState } from 'react'
import { LogOut, Bell, Crown, User } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useToast } from '../components/Toast'
import { useTheme } from 'next-themes'
import { Moon, Sparkles, MessageCircle, TrendingUp, Shield, X } from 'lucide-react'

interface Alertas {
  alerta_vencimento: boolean
  alerta_resumo_semanal: boolean
  alerta_metas: boolean
}

export default function ConfigPage() {
  const [user, setUser] = useState<any>(null)
  const [usuario, setUsuario] = useState<any>(null)
  const [upgradando, setUpgradando] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [alertas, setAlertas] = useState<Alertas>({
    alerta_vencimento: true,
    alerta_resumo_semanal: true,
    alerta_metas: true,
  })
  const { show: showToast, ToastComponent } = useToast()
  const { theme, setTheme } = useTheme()
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login'); return }
      setUser(session.user)

      let { data } = await supabase
        .from('usuarios')
        .select('*, planos(nome, valor)')
        .eq('email', session.user.email!)
        .single()

      if (!data) {
        const { data: plano } = await supabase.from('planos').select('id').eq('nome', 'Gratuito').single()
        await supabase.from('usuarios').upsert({
          id: session.user.id,
          email: session.user.email,
          nome: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0],
          avatar_url: session.user.user_metadata?.avatar_url,
          plano_id: plano?.id,
        })
        const { data: novo } = await supabase.from('usuarios').select('*, planos(nome, valor)').eq('email', session.user.email!).single()
        data = novo
      }

      setUsuario(data)

      // Carrega preferências de alertas (com fallback true se coluna não existir ainda)
      setAlertas({
        alerta_vencimento: data?.alerta_vencimento ?? true,
        alerta_resumo_semanal: data?.alerta_resumo_semanal ?? true,
        alerta_metas: data?.alerta_metas ?? true,
      })
    }
    load()
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const handleApoio = () => {
    setShowUpgradeModal(true)
  }

  const copiarChave = () => {
    navigator.clipboard.writeText('0f0b9a2d-1279-433a-9910-f8362563fea2')
    showToast('Chave PIX copiada!', 'success')
  }

  const toggleAlerta = async (campo: keyof Alertas) => {
    const novoValor = !alertas[campo]
    const novosAlertas = { ...alertas, [campo]: novoValor }
    setAlertas(novosAlertas)

    const { error } = await supabase
      .from('usuarios')
      .update({ [campo]: novoValor })
      .eq('email', user?.email)

    if (error) {
      // Reverte se falhar
      setAlertas(alertas)
      showToast('Erro ao salvar preferência.', 'error')
    }
  }

  const isPremium = usuario?.planos?.nome === 'Premium' &&
    usuario?.plano_expira_em && new Date(usuario.plano_expira_em) > new Date()

  const alertasConfig: { campo: keyof Alertas; label: string; sub: string }[] = [
    { campo: 'alerta_vencimento', label: 'Vencimento de contas', sub: '3 dias antes do vencimento' },
    { campo: 'alerta_resumo_semanal', label: 'Resumo semanal', sub: 'Balanço automático' },
    { campo: 'alerta_metas', label: 'Alerta de metas', sub: 'Aviso ao atingir um objetivo' },
  ]

  return (
    <div style={{ padding: '20px 16px' }}>
      {ToastComponent}

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 20 }}>Configurações</h1>

      <div className="card" style={{ padding: '20px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, #166534, #4ade80)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          }}>
            {user?.user_metadata?.avatar_url
              ? <img src={user.user_metadata.avatar_url} style={{ width: 48, height: 48 }} alt="avatar" />
              : <User size={22} color="white" />}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>{usuario?.nome || user?.user_metadata?.full_name || 'Usuário'}</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{user?.email}</div>
          </div>
        </div>

        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', padding: '12px 14px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Sparkles size={18} color="var(--amber)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Apoie o Tivo</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Ajude o projeto a continuar evoluindo</div>
          </div>
          <button className="btn-primary" onClick={handleApoio} style={{ padding: '8px 14px', fontSize: 12 }}>
            Colaborar
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: '20px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Bell size={16} color="var(--text-2)" />
          <h2 style={{ fontSize: 15, fontWeight: 500 }}>Alertas por email</h2>
        </div>
        {alertasConfig.map((item, i) => (
          <div key={item.campo} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 0', borderBottom: i < alertasConfig.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            <div>
              <div style={{ fontSize: 14 }}>{item.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{item.sub}</div>
            </div>
            {/* Toggle com estado real */}
            <div
              onClick={() => toggleAlerta(item.campo)}
              style={{
                width: 40, height: 22, borderRadius: 11,
                background: alertas[item.campo] ? 'var(--green-600)' : 'var(--bg-hover)',
                position: 'relative', cursor: 'pointer', flexShrink: 0,
                transition: 'background 0.2s',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{
                position: 'absolute', top: 2, width: 16, height: 16,
                borderRadius: '50%', background: 'white',
                left: alertas[item.campo] ? 'calc(100% - 18px)' : '2px',
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Aparência */}
      <div className="card" style={{ padding: '20px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Moon size={16} color="var(--text-2)" />
          <h2 style={{ fontSize: 15, fontWeight: 500 }}>Aparência</h2>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setTheme('light')}
            style={{
              flex: 1, padding: '10px', borderRadius: 'var(--radius-md)',
              border: `1px solid ${theme === 'light' ? 'var(--green-400)' : 'var(--border)'}`,
              background: theme === 'light' ? 'var(--green-dim)' : 'transparent',
              color: theme === 'light' ? 'var(--green-400)' : 'var(--text-2)',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s'
            }}>
            Claro
          </button>
          <button
            onClick={() => setTheme('dark')}
            style={{
              flex: 1, padding: '10px', borderRadius: 'var(--radius-md)',
              border: `1px solid ${theme === 'dark' ? 'var(--green-400)' : 'var(--border)'}`,
              background: theme === 'dark' ? 'var(--green-dim)' : 'transparent',
              color: theme === 'dark' ? 'var(--green-400)' : 'var(--text-2)',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s'
            }}>
            Escuro
          </button>
          <button
            onClick={() => setTheme('system')}
            style={{
              flex: 1, padding: '10px', borderRadius: 'var(--radius-md)',
              border: `1px solid ${theme === 'system' ? 'var(--green-400)' : 'var(--border)'}`,
              background: theme === 'system' ? 'var(--green-dim)' : 'transparent',
              color: theme === 'system' ? 'var(--green-400)' : 'var(--text-2)',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s'
            }}>
            Sistema
          </button>
        </div>
      </div>

      <button onClick={logout} className="btn-ghost" style={{
        width: '100%', color: 'var(--red)', borderColor: 'rgba(239,68,68,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        <LogOut size={16} /> Sair da conta
      </button>
      {showUpgradeModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: '20px', backdropFilter: 'blur(8px)'
        }} onClick={() => setShowUpgradeModal(false)}>
          <div className="card anim-up" style={{ padding: '32px 24px', width: '100%', maxWidth: 400, textAlign: 'center', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowUpgradeModal(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}>
              <X size={24} />
            </button>

            <div style={{
              width: 60, height: 60, borderRadius: 20, background: 'var(--green-dim)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
              color: 'var(--green-400)'
            }}>
              <Sparkles size={32} />
            </div>

            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--text-1)', marginBottom: 12 }}>Apoie o Projeto</h3>
            <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 24 }}>
              O Tivo é um projeto independente. Seu apoio voluntário ajuda a manter os servidores e a IA funcionando para todos.
            </p>

            <div style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 16, padding: 20, marginBottom: 24
            }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Escaneie o QR Code</div>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent('00020126830014BR.GOV.BCB.PIX01360f0b9a2d-1279-433a-9910-f8362563fea20221Obrigado pelo apoio!!5204000053039865802BR5925Thierry Henry Vidal Madou6009SAO PAULO621405103L83aR7LCH6304E578')}`}
                alt="QR Code PIX"
                style={{ width: 180, height: 180, borderRadius: 8, margin: '0 auto 16px', display: 'block', border: '10px solid white' }}
              />
              <div style={{ fontSize: 12, color: 'var(--text-1)', fontWeight: 500, wordBreak: 'break-all', marginBottom: 12 }}>
                0f0b9a2d-1279-433a-9910-f8362563fea2
              </div>
              <button className="btn-secondary" onClick={copiarChave} style={{ width: '100%', fontSize: 13, padding: '10px' }}>
                Copiar Chave PIX
              </button>
            </div>

            <div style={{
              background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 12, padding: '12px 16px', textAlign: 'left'
            }}>
              <div style={{ fontSize: 13, color: 'var(--amber)', fontWeight: 500, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <MessageCircle size={14} /> Dica Importante
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.4 }}>
                Na mensagem do seu PIX, escreva seu e-mail: <strong>{user?.email}</strong>. Assim posso registrar seu apoio e te avisar sobre novidades futuras!
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
