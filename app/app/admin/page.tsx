'use client'
import { useState, useEffect } from 'react'
import { Users, CreditCard, Tag, MessageSquare, Activity, ChevronLeft, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import { getAdminUsers, getPlanos, salvarPlano, getCupons, salvarCupom, getFeedbacks, marcarFeedbackLido } from './actions'

type Tab = 'visao_geral' | 'usuarios' | 'planos' | 'cupons' | 'feedbacks'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('visao_geral')

  return (
    <div style={{ padding: '20px 16px', minHeight: '100dvh', background: 'var(--bg)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link href="/app/painel" style={{ color: 'var(--text-3)' }}>
          <ChevronLeft size={24} />
        </Link>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 2 }}>Painel Admin</h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 300 }}>Controle geral da plataforma</p>
        </div>
      </div>

      <div style={{ display: 'flex', overflowX: 'auto', gap: 10, paddingBottom: 10, marginBottom: 20, scrollbarWidth: 'none' }}>
        <TabButton active={activeTab === 'visao_geral'} onClick={() => setActiveTab('visao_geral')} icon={Activity} label="Visão Geral" />
        <TabButton active={activeTab === 'usuarios'} onClick={() => setActiveTab('usuarios')} icon={Users} label="Usuários" />
        <TabButton active={activeTab === 'planos'} onClick={() => setActiveTab('planos')} icon={CreditCard} label="Planos" />
        <TabButton active={activeTab === 'cupons'} onClick={() => setActiveTab('cupons')} icon={Tag} label="Cupons" />
        <TabButton active={activeTab === 'feedbacks'} onClick={() => setActiveTab('feedbacks')} icon={MessageSquare} label="Feedbacks" />
      </div>

      <div className="anim-up">
        {activeTab === 'visao_geral' && <VisaoGeralTab />}
        {activeTab === 'usuarios' && <UsuariosTab />}
        {activeTab === 'planos' && <PlanosTab />}
        {activeTab === 'cupons' && <CuponsTab />}
        {activeTab === 'feedbacks' && <FeedbacksTab />}
      </div>
    </div>
  )
}

function VisaoGeralTab() {
  const [data, setData] = useState<any>(null)
  
  useEffect(() => {
    getAdminUsers().then(users => {
      const assinaturasAtivas = users.filter((u: any) => u.assinatura && u.assinatura.status === 'ativo').length
      setData({ totalUsuarios: users.length, assinaturasAtivas })
    }).catch(console.error)
  }, [])

  if (!data) return <div style={{ color: 'var(--text-3)' }}>Carregando...</div>

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 8 }}>Total de Usuários</div>
        <div style={{ fontSize: 32, fontFamily: 'var(--font-display)' }}>{data.totalUsuarios}</div>
      </div>
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 8 }}>Assinaturas Ativas</div>
        <div style={{ fontSize: 32, fontFamily: 'var(--font-display)', color: 'var(--green-400)' }}>{data.assinaturasAtivas}</div>
      </div>
    </div>
  )
}

function UsuariosTab() {
  const [users, setUsers] = useState<any[]>([])
  
  useEffect(() => {
    getAdminUsers().then(setUsers).catch(console.error)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {users.length === 0 && <div style={{ color: 'var(--text-3)' }}>Carregando...</div>}
      {users.map(u => (
        <div key={u.id} className="card" style={{ padding: '16px' }}>
          <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>{u.email}</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12 }}>
            Criado em: {new Date(u.created_at).toLocaleDateString('pt-BR')}
          </div>
          
          <div style={{ background: 'var(--surface-1)', padding: 10, borderRadius: 8, fontSize: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: 'var(--text-2)' }}>Plano atual:</span>
              <span style={{ color: 'var(--green-400)' }}>{u.assinatura?.planos?.nome || 'Nenhum'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-2)' }}>Uso API (Mês):</span>
              <span>{u.usoApi.reqs_usadas} reqs / {u.usoApi.tokens_usados} tokens</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function PlanosTab() {
  const [planos, setPlanos] = useState<any[]>([])
  
  useEffect(() => {
    getPlanos().then(setPlanos).catch(console.error)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <button className="btn-primary" style={{ marginBottom: 10 }}>+ Novo Plano</button>
      {planos.length === 0 && <div style={{ color: 'var(--text-3)' }}>Carregando...</div>}
      {planos.map(p => (
        <div key={p.id} className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontWeight: 500, fontSize: 16 }}>{p.nome}</span>
            <span style={{ color: 'var(--green-400)', fontWeight: 500 }}>R$ {p.valor}</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
            Limites: {p.limite_reqs} requisições / {p.limite_tokens} tokens
          </div>
        </div>
      ))}
    </div>
  )
}

function CuponsTab() {
  const [cupons, setCupons] = useState<any[]>([])
  
  useEffect(() => {
    getCupons().then(setCupons).catch(console.error)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <button className="btn-primary" style={{ marginBottom: 10 }}>+ Novo Cupom</button>
      {cupons.length === 0 && <div style={{ color: 'var(--text-3)' }}>Nenhum cupom ou carregando...</div>}
      {cupons.map(c => (
        <div key={c.id} className="card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 500, fontSize: 16, color: 'var(--text-1)' }}>{c.codigo}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{c.usos_atuais} / {c.max_usos || '∞'} usos</div>
          </div>
          <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--green-400)' }}>
            {c.tipo === 'percentual' ? c.valor + '%' : 'R$ ' + c.valor}
          </div>
        </div>
      ))}
    </div>
  )
}

function FeedbacksTab() {
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  
  useEffect(() => {
    getFeedbacks().then(setFeedbacks).catch(console.error)
  }, [])

  const ler = async (id: string) => {
    await marcarFeedbackLido(id)
    setFeedbacks(fs => fs.map(f => f.id === id ? { ...f, lido: true } : f))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {feedbacks.length === 0 && <div style={{ color: 'var(--text-3)' }}>Nenhum feedback.</div>}
      {feedbacks.map(f => (
        <div key={f.id} className="card" style={{ padding: '16px', borderLeft: f.lido ? 'none' : '3px solid var(--amber)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
            <span>{f.email}</span>
            <span>{new Date(f.created_at).toLocaleDateString('pt-BR')}</span>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-1)', lineHeight: 1.5 }}>{f.mensagem}</p>
          {!f.lido && (
            <button onClick={() => ler(f.id)} style={{ marginTop: 12, fontSize: 12, color: 'var(--text-2)', background: 'var(--surface-1)', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer' }}>
              Marcar como lido
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

function TabButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
      background: active ? 'var(--green-dim)' : 'var(--surface-1)',
      border: `1px solid ${active ? 'var(--green-400)' : 'var(--border)'}`,
      color: active ? 'var(--green-400)' : 'var(--text-2)',
      borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer',
      whiteSpace: 'nowrap', transition: 'all 0.2s'
    }}>
      <Icon size={14} /> {label}
    </button>
  )
}
