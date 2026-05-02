'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock, CalendarDays, X } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Resumo {
  receitasMes: number
  contasMes: number
  saldoFinal: number
  totalPago: number
  totalVencido: number
  proximosVencimentos: any[]
}

type FiltroTempo = 'mes_atual' | 'proximos_30' | 'todos'

export default function PainelPage() {
  const [resumo, setResumo] = useState<Resumo>({
    receitasMes: 0, contasMes: 0, saldoFinal: 0, totalPago: 0, totalVencido: 0, proximosVencimentos: [],
  })
  const [loading, setLoading] = useState(true)
  const [abaAtiva, setAbaAtiva] = useState<'resumo' | 'vencimentos'>('resumo')
  const [transacoes, setTransacoes] = useState<any[]>([])
  const [filtro, setFiltro] = useState<FiltroTempo>('mes_atual')
  const [detalhesModal, setDetalhesModal] = useState<any | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login'); return }

      const hojeDate = new Date()
      const hoje = hojeDate.toISOString().split('T')[0]
      const inicioMes = new Date(hojeDate.getFullYear(), hojeDate.getMonth(), 1).toISOString().split('T')[0]
      const fimMes = new Date(hojeDate.getFullYear(), hojeDate.getMonth() + 1, 0).toISOString().split('T')[0]
      
      const mais30Dias = new Date(hojeDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      // 1. Busca Receitas do mês atual
      const { data: receitas } = await supabase
        .from('receitas')
        .select('*')
        .eq('usuario_id', session.user.id)
        .gte('data_recebimento', inicioMes)
        .lte('data_recebimento', fimMes)
      
      const receitasMes = (receitas || []).reduce((acc, curr) => acc + Number(curr.valor), 0)

      // 2. Busca Contas
      const { data: todasContas } = await supabase
        .from('contas')
        .select('*')
        .eq('usuario_id', session.user.id)

      if (!todasContas) { setLoading(false); return }

      const contasDoMes = todasContas.filter(c => c.vencimento >= inicioMes && c.vencimento <= fimMes)
      const contasMes = contasDoMes.reduce((a, c) => a + Number(c.valor), 0)
      const saldoFinal = receitasMes - contasMes
      
      const totalPago = contasDoMes.filter(c => c.status === 'pago').reduce((a, c) => a + Number(c.valor), 0)
      const totalVencido = todasContas.filter(c => c.status !== 'pago' && c.vencimento < hoje).reduce((a, c) => a + Number(c.valor), 0)

      // Preparar transações para o resumo (Pagas + Recebidas do mês)
      const t = [
        ...(contasDoMes || []).map(c => ({ ...c, tipo_transacao: 'despesa', data_ref: c.vencimento })),
        ...(receitas || []).map(r => ({ ...r, tipo_transacao: 'receita', data_ref: r.data_recebimento }))
      ].sort((a, b) => b.data_ref.localeCompare(a.data_ref))
      setTransacoes(t)

      // 3. Próximos Vencimentos
      let pendentes = todasContas.filter(c => c.status !== 'pago')
      if (filtro === 'mes_atual') {
        pendentes = pendentes.filter(c => c.vencimento >= inicioMes && c.vencimento <= fimMes)
      } else if (filtro === 'proximos_30') {
        pendentes = pendentes.filter(c => c.vencimento >= hoje && c.vencimento <= mais30Dias)
      }

      const gruposMap = new Map()
      const pendentesAgrupadas = []
      for (const c of pendentes) {
        if (!c.grupo_id) pendentesAgrupadas.push(c)
        else {
          if (!gruposMap.has(c.grupo_id)) gruposMap.set(c.grupo_id, c)
          else {
            const existente = gruposMap.get(c.grupo_id)
            if (new Date(c.vencimento) < new Date(existente.vencimento)) gruposMap.set(c.grupo_id, c)
          }
        }
      }
      pendentesAgrupadas.push(...Array.from(gruposMap.values()))
      pendentesAgrupadas.sort((a, b) => a.vencimento.localeCompare(b.vencimento))

      setResumo({ receitasMes, contasMes, saldoFinal, totalPago, totalVencido, proximosVencimentos: pendentesAgrupadas.slice(0, 10) })
      setLoading(false)
    }
    load()
  }, [filtro, supabase, router])

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const fmtDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  const mesName = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const hoje = new Date().toISOString().split('T')[0]

  return (
    <div style={{ padding: '20px 16px' }}>
      {/* Modal de Detalhes */}
      {detalhesModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: '20px', backdropFilter: 'blur(4px)'
        }} onClick={() => setDetalhesModal(null)}>
          <div className="card anim-up" style={{ padding: '24px', width: '100%', maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-1)' }}>Detalhes</h3>
              <button onClick={() => setDetalhesModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Descrição</div>
                <div style={{ fontSize: 16, color: 'var(--text-1)' }}>{detalhesModal.descricao}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Valor</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: detalhesModal.tipo_transacao === 'receita' ? 'var(--green-400)' : 'var(--text-1)' }}>
                    {fmt(Number(detalhesModal.valor))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Data</div>
                  <div style={{ fontSize: 15, color: 'var(--text-1)' }}>{fmtDate(detalhesModal.data_ref || detalhesModal.vencimento)}</div>
                </div>
              </div>
            </div>
            <button onClick={() => setDetalhesModal(null)} className="btn-primary" style={{ width: '100%', marginTop: 24 }}>Fechar</button>
          </div>
        </div>
      )}

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 4, textTransform: 'capitalize' }}>Painel</h1>
      <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 24 }}>{mesName}</p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 20, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        <button 
          onClick={() => setAbaAtiva('resumo')}
          style={{
            padding: '8px 4px', background: 'none', border: 'none',
            borderBottom: abaAtiva === 'resumo' ? '2px solid var(--primary)' : '2px solid transparent',
            color: abaAtiva === 'resumo' ? 'var(--text-1)' : 'var(--text-3)',
            fontSize: 14, fontWeight: abaAtiva === 'resumo' ? 500 : 400, cursor: 'pointer'
          }}
        >
          Resumo
        </button>
        <button 
          onClick={() => setAbaAtiva('vencimentos')}
          style={{
            padding: '8px 4px', background: 'none', border: 'none',
            borderBottom: abaAtiva === 'vencimentos' ? '2px solid var(--primary)' : '2px solid transparent',
            color: abaAtiva === 'vencimentos' ? 'var(--text-1)' : 'var(--text-3)',
            fontSize: 14, fontWeight: abaAtiva === 'vencimentos' ? 500 : 400, cursor: 'pointer'
          }}
        >
          Vencimentos
        </button>
      </div>

      {abaAtiva === 'resumo' ? (
        <div className="anim-up">
          {/* Card de Saldo */}
          <div className="card" style={{ padding: '24px', marginBottom: 12, background: 'var(--bg-card)', position: 'relative', overflow: 'hidden' }}>
             <div style={{ position: 'absolute', top: -10, right: -10, opacity: 0.1 }}>
               {resumo.saldoFinal >= 0 ? <TrendingUp size={80} color="var(--green-400)" /> : <TrendingDown size={80} color="var(--red)" />}
             </div>
             <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Saldo Projetado</div>
             <div style={{ fontSize: 32, fontWeight: 700, color: resumo.saldoFinal >= 0 ? 'var(--green-400)' : 'var(--red)', marginBottom: 4 }}>
               {fmt(resumo.saldoFinal)}
             </div>
             <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Referente a {mesName}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 32 }}>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Receitas</div>
              <div style={{ fontSize: 18, color: 'var(--green-400)', fontWeight: 600 }}>{fmt(resumo.receitasMes)}</div>
            </div>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Saídas</div>
              <div style={{ fontSize: 18, color: 'var(--text-1)', fontWeight: 600 }}>{fmt(resumo.contasMes)}</div>
            </div>
          </div>

          <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 16 }}>Movimentações do Mês</h2>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-3)' }}>Carregando...</div>
          ) : transacoes.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Nenhuma movimentação este mês.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {transacoes.map((t, idx) => (
                <div key={idx} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => setDetalhesModal(t)}>
                  <div style={{ 
                    width: 36, height: 36, borderRadius: 10, 
                    background: t.tipo_transacao === 'receita' ? 'var(--green-dim)' : 'var(--bg-hover)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {t.tipo_transacao === 'receita' ? <TrendingUp size={18} color="var(--green-400)" /> : <TrendingDown size={18} color="var(--text-3)" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, color: 'var(--text-1)', marginBottom: 2 }}>{t.descricao}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{fmtDate(t.data_ref)} • {t.categoria || 'Outros'}</div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: t.tipo_transacao === 'receita' ? 'var(--green-400)' : 'var(--text-1)' }}>
                    {t.tipo_transacao === 'receita' ? '+' : '-'} {fmt(Number(t.valor))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="anim-up">
          {/* Próximos Vencimentos */}
          {resumo.totalVencido > 0 && (
            <div className="card" style={{ padding: '14px 16px', borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
              <AlertCircle size={20} color="var(--red)" />
              <div>
                <div style={{ fontSize: 13, color: 'var(--red)', fontWeight: 500 }}>Contas em Atraso</div>
                <div style={{ fontSize: 15, color: 'var(--red)', fontWeight: 600 }}>{fmt(resumo.totalVencido)}</div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 500 }}>Pendências</h2>
            <select 
              value={filtro}
              onChange={(e) => setFiltro(e.target.value as FiltroTempo)}
              style={{
                background: 'var(--surface-1)', border: '1px solid var(--border)',
                color: 'var(--text-2)', fontSize: 12, padding: '4px 8px', borderRadius: 6, outline: 'none'
              }}
            >
              <option value="mes_atual">Este mês</option>
              <option value="proximos_30">Próximos 30 dias</option>
              <option value="todos">Todos</option>
            </select>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-3)' }}>Carregando...</div>
          ) : resumo.proximosVencimentos.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <CheckCircle size={32} color="var(--green-400)" style={{ margin: '0 auto 12px', opacity: 0.6 }} />
              <p style={{ color: 'var(--text-2)', fontSize: 14 }}>Tudo em dia!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {resumo.proximosVencimentos.map(c => (
                <div key={c.id} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => setDetalhesModal(c)}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      {c.vencimento < hoje ? <AlertCircle size={14} color="var(--red)" /> : <Clock size={14} color="var(--amber)" />}
                      <span style={{ fontSize: 14, color: 'var(--text-1)' }}>{c.descricao}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Vence em {fmtDate(c.vencimento)}</div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: c.vencimento < hoje ? 'var(--red)' : 'var(--text-1)' }}>{fmt(Number(c.valor))}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
