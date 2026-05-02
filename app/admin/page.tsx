'use client'
import { useEffect, useState } from 'react'
import { Users, DollarSign, Tag, Settings2, Plus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const [stats, setStats] = useState({ usuarios: 0, premium: 0, receita: 0 })
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [cupons, setCupons] = useState<any[]>([])
  const [planos, setPlanos] = useState<any[]>([])
  const [tab, setTab] = useState<'usuarios' | 'cupons' | 'planos'>('usuarios')
  const [showCupomForm, setShowCupomForm] = useState(false)
  const [cupomForm, setCupomForm] = useState({ codigo: '', tipo: 'percentual', valor: '', validade: '', limite_usos: '' })
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login'); return }

      // Verificação server-side de admin — nunca expõe ADMIN_EMAIL ao client
      const checkRes = await fetch('/api/admin/check')
      const { isAdmin } = await checkRes.json()
      if (!isAdmin) { router.push('/app/chat'); return }

      const { data: usr } = await supabase.from('usuarios').select('*, planos(nome)').order('criado_em', { ascending: false })
      const { data: cup } = await supabase.from('cupons').select('*').order('criado_em', { ascending: false })
      const { data: pln } = await supabase.from('planos').select('*').order('valor')
      const { data: pag } = await supabase.from('pagamentos').select('valor_final').eq('status', 'aprovado')

      setUsuarios(usr || [])
      setCupons(cup || [])
      setPlanos(pln || [])
      const premium = (usr || []).filter(u => u.planos?.nome === 'Premium').length
      const receita = (pag || []).reduce((a, p) => a + Number(p.valor_final), 0)
      setStats({ usuarios: (usr || []).length, premium, receita })
    }
    load()
  }, [])

  const criarCupom = async () => {
    await supabase.from('cupons').insert({
      codigo: cupomForm.codigo.toUpperCase(),
      tipo: cupomForm.tipo,
      valor: parseFloat(cupomForm.valor),
      validade: cupomForm.validade || null,
      limite_usos: cupomForm.limite_usos ? parseInt(cupomForm.limite_usos) : null,
    })
    setShowCupomForm(false)
    setCupomForm({ codigo: '', tipo: 'percentual', valor: '', validade: '', limite_usos: '' })
    const { data } = await supabase.from('cupons').select('*').order('criado_em', { ascending: false })
    setCupons(data || [])
  }

  const atualizarPlano = async (id: string, valor: number) => {
    await supabase.from('planos').update({ valor, atualizado_em: new Date().toISOString() }).eq('id', id)
    const { data } = await supabase.from('planos').select('*').order('valor')
    setPlanos(data || [])
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div style={{ padding: '20px 16px', maxWidth: 600, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, #166534, #4ade80)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>💰</div>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>Tivo Admin</h1>
          <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Painel de administração</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 24 }}>
        {[
          { icon: Users, label: 'Usuários', value: stats.usuarios },
          { icon: DollarSign, label: 'Premium', value: stats.premium },
          { icon: Tag, label: 'Receita', value: fmt(stats.receita) },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="card" style={{ padding: '14px 12px', textAlign: 'center' }}>
            <Icon size={16} style={{ color: 'var(--green-400)', margin: '0 auto 6px' }} />
            <div style={{ fontSize: 18, fontFamily: 'var(--font-display)', color: 'var(--text-1)' }}>{value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'var(--bg-surface)', padding: 4, borderRadius: 'var(--radius-md)' }}>
        {(['usuarios', 'cupons', 'planos'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)',
            background: tab === t ? 'var(--bg-card)' : 'transparent',
            border: tab === t ? '1px solid var(--border)' : '1px solid transparent',
            color: tab === t ? 'var(--text-1)' : 'var(--text-3)',
            fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)',
            textTransform: 'capitalize',
          }}>{t}</button>
        ))}
      </div>

      {/* Usuários */}
      {tab === 'usuarios' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {usuarios.map(u => (
            <div key={u.id} className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, background: 'var(--bg-surface)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0,
              }}>👤</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.nome || u.email}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                  {new Date(u.criado_em).toLocaleDateString('pt-BR')}
                </div>
              </div>
              <span className={`badge ${u.planos?.nome === 'Premium' ? 'badge-amber' : 'badge-green'}`}>
                {u.planos?.nome || 'Gratuito'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Cupons */}
      {tab === 'cupons' && (
        <>
          <button onClick={() => setShowCupomForm(true)} className="btn-primary" style={{ width: '100%', marginBottom: 12 }}>
            <Plus size={16} /> Novo cupom
          </button>

          {showCupomForm && (
            <div className="card anim-up" style={{ padding: '18px', marginBottom: 12, borderColor: 'var(--border-em)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <h3 style={{ fontSize: 14, fontWeight: 500 }}>Novo cupom</h3>
                <button onClick={() => setShowCupomForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}>
                  <X size={16} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input className="input" placeholder="Código (ex: BEMVINDO)" value={cupomForm.codigo} onChange={e => setCupomForm({ ...cupomForm, codigo: e.target.value })} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <select className="input" value={cupomForm.tipo} onChange={e => setCupomForm({ ...cupomForm, tipo: e.target.value })} style={{ appearance: 'none' }}>
                    <option value="percentual">Percentual (%)</option>
                    <option value="fixo">Valor fixo (R$)</option>
                  </select>
                  <input className="input" placeholder={cupomForm.tipo === 'percentual' ? 'Ex: 50' : 'Ex: 9.45'} type="number" value={cupomForm.valor} onChange={e => setCupomForm({ ...cupomForm, valor: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input className="input" type="date" placeholder="Validade" value={cupomForm.validade} onChange={e => setCupomForm({ ...cupomForm, validade: e.target.value })} />
                  <input className="input" type="number" placeholder="Limite de usos" value={cupomForm.limite_usos} onChange={e => setCupomForm({ ...cupomForm, limite_usos: e.target.value })} />
                </div>
                <button onClick={criarCupom} className="btn-primary" disabled={!cupomForm.codigo || !cupomForm.valor}>
                  Criar cupom
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {cupons.map(c => (
              <div key={c.id} className="card" style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--green-400)', fontFamily: 'monospace' }}>{c.codigo}</span>
                  <span className={`badge ${c.ativo ? 'badge-green' : 'badge-red'}`}>{c.ativo ? 'ativo' : 'inativo'}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  {c.tipo === 'percentual' ? `${c.valor}% de desconto` : `R$ ${c.valor} de desconto`}
                  {c.limite_usos && ` · ${c.usos_realizados}/${c.limite_usos} usos`}
                  {c.validade && ` · até ${new Date(c.validade).toLocaleDateString('pt-BR')}`}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Planos */}
      {tab === 'planos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {planos.map(p => (
            <div key={p.id} className="card" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>{p.nome}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{p.descricao}</div>
                </div>
                <span className="badge badge-green">{p.duracao_dias === 36500 ? 'vitalício' : `${p.duracao_dias} dias`}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  className="input"
                  type="number"
                  defaultValue={p.valor}
                  step="0.01"
                  style={{ flex: 1 }}
                  id={`plano-${p.id}`}
                />
                <button className="btn-primary" style={{ padding: '10px 16px', flexShrink: 0 }}
                  onClick={() => {
                    const el = document.getElementById(`plano-${p.id}`) as HTMLInputElement
                    atualizarPlano(p.id, parseFloat(el.value))
                  }}>
                  <Settings2 size={14} /> Salvar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
