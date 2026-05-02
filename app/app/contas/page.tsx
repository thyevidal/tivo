'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { Plus, Check, Clock, AlertCircle, X, Pencil, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useToast } from '../components/Toast'

const categorias = ['Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Serviços', 'Outros']

const FORM_VAZIO = { descricao: '', valor: '', categoria: 'Outros', vencimento: '', tipo: 'unica', parcelas: '1', observacao: '' }

export default function ContasPage() {
  const [contas, setContas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(FORM_VAZIO)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [confirmEditGroup, setConfirmEditGroup] = useState<any | null>(null)
  const [detalhesModal, setDetalhesModal] = useState<any | null>(null)
  const [abaAtiva, setAbaAtiva] = useState<'pendentes' | 'historico'>('pendentes')
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth())
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear())
  const { show: showToast, ToastComponent } = useToast()
  const supabase = createClient()

  async function load() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data } = await supabase
      .from('contas')
      .select('*')
      .eq('usuario_id', session.user.id)
      .order('vencimento', { ascending: true })
    setContas(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const abrirNovaForm = () => {
    setEditandoId(null)
    setForm(FORM_VAZIO)
    setShowForm(true)
  }

  const abrirEdicao = (c: any) => {
    setEditandoId(c.id)
    setForm({
      descricao: c.descricao,
      valor: String(c.valor),
      categoria: c.categoria || 'Outros',
      vencimento: c.vencimento || '',
      tipo: c.tipo || 'unica',
      parcelas: String(c.parcela_total || 1),
      observacao: c.observacao || '',
    })
    setShowForm(true)
  }

  const cancelarForm = () => {
    setShowForm(false)
    setEditandoId(null)
    setForm(FORM_VAZIO)
  }

  const salvar = async () => {
    if (!form.descricao || !form.valor) return
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()

    const payload = {
      descricao: form.descricao,
      valor: parseFloat(form.valor.replace(',', '.')),
      categoria: form.categoria,
      vencimento: form.vencimento || null,
      observacao: form.observacao || null,
    }

    if (editandoId) {
      const cOriginal = contas.find(c => c.id === editandoId)
      if (cOriginal?.grupo_id) {
        setConfirmEditGroup({ payload, original: cOriginal })
        setSaving(false)
        return // Interrompe para mostrar o modal
      }
      
      const { error } = await supabase.from('contas').update(payload).eq('id', editandoId)
      if (error) { showToast('Erro ao atualizar.', 'error'); setSaving(false); return }
      showToast('Atualizado com sucesso ✓')
      cancelarForm()
      setSaving(false)
      load()
      return
    } else {
      const tipo = form.tipo || 'unica'
      const parcelasNum = parseInt(form.parcelas) || 1
      const qtd = tipo === 'parcelada' ? parcelasNum : (tipo === 'recorrente' ? 12 : 1)
      
      const inserts = []
      const grupo_id = crypto.randomUUID()
      let baseDate = payload.vencimento ? new Date(payload.vencimento + 'T12:00:00Z') : new Date()

      for (let i = 0; i < qtd; i++) {
        const currentVencimento = new Date(baseDate)
        currentVencimento.setMonth(baseDate.getMonth() + i)
        
        inserts.push({
          ...payload,
          vencimento: currentVencimento.toISOString().split('T')[0],
          usuario_id: session!.user.id,
          status: 'pendente',
          tipo: tipo,
          grupo_id: tipo !== 'unica' ? grupo_id : null,
          parcela_atual: tipo !== 'unica' ? (i + 1) : null,
          parcela_total: tipo === 'parcelada' ? parcelasNum : null,
        })
      }

      const { error } = await supabase.from('contas').insert(inserts)
      if (error) { showToast('Erro ao criar.', 'error'); setSaving(false); return }
      showToast('Criado com sucesso ✓')
      cancelarForm()
      setSaving(false)
      load()
    }
  }

  const executarEdicaoGrupo = async (applyToFuture: boolean) => {
    if (!confirmEditGroup) return
    setSaving(true)
    const { payload, original } = confirmEditGroup
    
    if (applyToFuture) {
      const { error } = await supabase.from('contas').update({
        descricao: payload.descricao,
        valor: payload.valor,
        categoria: payload.categoria,
        observacao: payload.observacao
        // Nao atualizamos o vencimento em lote pois ele é sequencial
      }).eq('grupo_id', original.grupo_id).eq('status', 'pendente').gte('vencimento', original.vencimento)
      
      // Atualizar o vencimento apenas da parcela atual manualmente se foi alterado
      if (payload.vencimento !== original.vencimento) {
        await supabase.from('contas').update({ vencimento: payload.vencimento }).eq('id', original.id)
      }
      
      if (error) { showToast('Erro ao atualizar em lote.', 'error') }
      else { showToast('Parcelas atualizadas ✓') }
    } else {
      const { error } = await supabase.from('contas').update(payload).eq('id', original.id)
      if (error) { showToast('Erro ao atualizar.', 'error') }
      else { showToast('Atualizado com sucesso ✓') }
    }
    
    setConfirmEditGroup(null)
    cancelarForm()
    setSaving(false)
    load()
  }

  const marcarPago = async (id: string) => {
    await supabase.from('contas').update({ status: 'pago' }).eq('id', id)
    showToast('Conta marcada como paga ✓')
    load()
  }

  const deletar = async (id: string, deleteFuture: boolean = false) => {
    const c = contas.find(c => c.id === id)
    if (!c) return
    
    if (deleteFuture && c.grupo_id) {
      await supabase.from('contas').delete().eq('grupo_id', c.grupo_id).eq('status', 'pendente').gte('vencimento', c.vencimento)
      showToast('Parcelas removidas.')
    } else {
      await supabase.from('contas').delete().eq('id', id)
      showToast('Conta removida.')
    }
    setConfirmDeleteId(null)
    load()
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const hoje = new Date().toISOString().split('T')[0]

  const mesesAbreviados = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const ultimosMeses = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    return { mes: d.getMonth(), ano: d.getFullYear() }
  })

  const statusIcon = (c: any) => {
    if (c.status === 'pago') return <Check size={14} color="var(--green-400)" />
    if (c.vencimento && c.vencimento < hoje) return <AlertCircle size={14} color="var(--red)" />
    return <Clock size={14} color="var(--amber)" />
  }

  const pendentesRaw = contas.filter(c => c.status !== 'pago')
  const pagasRaw = contas.filter(c => c.status === 'pago')

  // Agrupa as contas pendentes para mostrar apenas a próxima parcela de cada grupo
  const gruposMap = new Map()
  const pendentes = []
  
  for (const c of pendentesRaw) {
    if (!c.grupo_id) {
      pendentes.push(c)
    } else {
      if (!gruposMap.has(c.grupo_id)) {
        gruposMap.set(c.grupo_id, c)
      } else {
        const existente = gruposMap.get(c.grupo_id)
        if (new Date(c.vencimento) < new Date(existente.vencimento)) {
          gruposMap.set(c.grupo_id, c)
        }
      }
    }
  }
  pendentes.push(...Array.from(gruposMap.values()))
  pendentes.sort((a, b) => new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime())

  // Para as pagas, filtramos pelo mês selecionado se estiver na aba histórico
  const pagas = pagasRaw.filter(c => {
    if (!c.vencimento) return false
    const d = new Date(c.vencimento + 'T00:00:00')
    return d.getMonth() === mesSelecionado && d.getFullYear() === anoSelecionado
  })
  
  const totalHistorico = pagas.reduce((acc, c) => acc + Number(c.valor), 0)

  return (
    <div style={{ padding: '20px 16px' }}>

      {/* Dialog de Edição em Lote */}
      {confirmEditGroup && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          zIndex: 200, padding: '0 16px 24px',
        }}>
          <div className="card anim-up" style={{ padding: '24px', width: '100%', maxWidth: 480 }}>
            <h3 style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Aplicar alterações?</h3>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20 }}>
              Esta conta faz parte de um parcelamento/recorrência. Deseja aplicar as alterações de valor e descrição em todas as parcelas futuras também?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={() => executarEdicaoGrupo(true)} className="btn-primary" disabled={saving}>
                Aplicar nesta e nas futuras
              </button>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setConfirmEditGroup(null); setSaving(false); }} className="btn-ghost" style={{ flex: 1 }} disabled={saving}>
                  Cancelar
                </button>
                <button onClick={() => executarEdicaoGrupo(false)} className="btn-primary" style={{ flex: 1, background: 'var(--surface-2)' }} disabled={saving}>
                  Apenas nesta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal de Detalhes */}
      {detalhesModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: '20px', backdropFilter: 'blur(4px)'
        }} onClick={() => setDetalhesModal(null)}>
          <div className="card anim-up" style={{ padding: '24px', width: '100%', maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-1)' }}>Detalhes da Conta</h3>
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
                  <div style={{ fontSize: 16, fontFamily: 'var(--font-display)', color: detalhesModal.vencimento < hoje ? 'var(--red)' : 'var(--text-1)' }}>
                    {fmt(Number(detalhesModal.valor))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Vencimento</div>
                  <div style={{ fontSize: 15, color: 'var(--text-1)' }}>{detalhesModal.vencimento ? new Date(detalhesModal.vencimento + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</div>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Categoria</div>
                  <div style={{ fontSize: 14, color: 'var(--text-1)' }}>{detalhesModal.categoria || 'Outros'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Tipo</div>
                  <div style={{ fontSize: 14, color: 'var(--text-1)', textTransform: 'capitalize' }}>
                    {detalhesModal.tipo} 
                    {detalhesModal.tipo === 'parcelada' && ` (${detalhesModal.parcela_atual}/${detalhesModal.parcela_total})`}
                  </div>
                </div>
              </div>
              
              {detalhesModal.observacao && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Observação</div>
                  <div style={{ fontSize: 14, color: 'var(--text-2)' }}>{detalhesModal.observacao}</div>
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => { abrirEdicao(detalhesModal); setDetalhesModal(null); }} className="btn-ghost" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Pencil size={16} /> Editar
              </button>
              <button onClick={() => setDetalhesModal(null)} className="btn-primary" style={{ flex: 1 }}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {ToastComponent}

      {/* Dialog de confirmação de exclusão */}
      {confirmDeleteId && (() => {
        const cToDelete = contas.find(c => c.id === confirmDeleteId)
        const isGroup = cToDelete?.grupo_id
        return (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            zIndex: 200, padding: '0 16px 24px',
          }}>
            <div className="card anim-up" style={{ padding: '24px', width: '100%', maxWidth: 480 }}>
              <h3 style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Excluir conta?</h3>
              <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20 }}>
                {isGroup ? 'Esta conta faz parte de um parcelamento/recorrência. Deseja excluir apenas ela ou todas as parcelas pendentes futuras?' : 'Essa ação não pode ser desfeita.'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {isGroup && (
                  <button onClick={() => deletar(confirmDeleteId, true)} className="btn-primary" style={{ background: 'var(--red)' }}>
                    <Trash2 size={14} /> Excluir esta e as futuras
                  </button>
                )}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setConfirmDeleteId(null)} className="btn-ghost" style={{ flex: 1 }}>
                    Cancelar
                  </button>
                  <button onClick={() => deletar(confirmDeleteId, false)} className="btn-primary"
                    style={{ flex: 1, background: isGroup ? 'var(--surface-2)' : 'var(--red)' }}>
                    <Trash2 size={14} /> {isGroup ? 'Excluir apenas esta' : 'Excluir'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 2 }}>Contas</h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 300 }}>{pendentes.length} pendentes</p>
        </div>
        <button onClick={abrirNovaForm} className="btn-primary" style={{ padding: '10px 16px', gap: 6 }}>
          <Plus size={16} /> Nova
        </button>
      </div>

      {/* Form criação / edição */}
      {showForm && (
        <div className="card anim-up" style={{ padding: '20px', marginBottom: 20, borderColor: 'var(--border-em)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 500 }}>{editandoId ? 'Editar conta' : 'Nova conta'}</h3>
            <button onClick={cancelarForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}>
              <X size={18} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, display: 'block' }}>Descrição</label>
              <input className="input" placeholder="Ex: Conta de luz" value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, display: 'block' }}>Valor (R$)</label>
                <input className="input" placeholder="0,00" type="number" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, display: 'block' }}>Vencimento</label>
                <input className="input" type="date" value={form.vencimento} onChange={e => setForm({ ...form, vencimento: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, display: 'block' }}>Categoria</label>
                <select className="input" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} style={{ appearance: 'none' }}>
                  {categorias.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, display: 'block' }}>Tipo</label>
                <select className="input" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} disabled={!!editandoId} style={{ appearance: 'none' }}>
                  <option value="unica">Única</option>
                  <option value="parcelada">Parcelada</option>
                  <option value="recorrente">Recorrente</option>
                </select>
              </div>
            </div>
            {form.tipo === 'parcelada' && !editandoId && (
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, display: 'block' }}>Número de parcelas</label>
                <input className="input" placeholder="Ex: 12" type="number" min="2" max="120" value={form.parcelas} onChange={e => setForm({ ...form, parcelas: e.target.value })} />
              </div>
            )}
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, display: 'block' }}>Observação (Opcional)</label>
              <textarea className="input" placeholder="Detalhes adicionais..." value={form.observacao} onChange={e => setForm({ ...form, observacao: e.target.value })} style={{ minHeight: 60, resize: 'vertical' }} />
            </div>
            <button onClick={salvar} className="btn-primary" disabled={saving || !form.descricao || !form.valor || (form.tipo === 'parcelada' && (!form.parcelas || Number(form.parcelas) < 2))} style={{ width: '100%', marginTop: 8 }}>
              {saving ? 'Salvando...' : editandoId ? 'Salvar alterações' : 'Criar conta'}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 20, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        <button 
          onClick={() => setAbaAtiva('pendentes')}
          style={{
            padding: '8px 4px',
            background: 'none',
            border: 'none',
            borderBottom: abaAtiva === 'pendentes' ? '2px solid var(--primary)' : '2px solid transparent',
            color: abaAtiva === 'pendentes' ? 'var(--text-1)' : 'var(--text-3)',
            fontSize: 14,
            fontWeight: abaAtiva === 'pendentes' ? 500 : 400,
            cursor: 'pointer'
          }}
        >
          Em Aberto
        </button>
        <button 
          onClick={() => setAbaAtiva('historico')}
          style={{
            padding: '8px 4px',
            background: 'none',
            border: 'none',
            borderBottom: abaAtiva === 'historico' ? '2px solid var(--primary)' : '2px solid transparent',
            color: abaAtiva === 'historico' ? 'var(--text-1)' : 'var(--text-3)',
            fontSize: 14,
            fontWeight: abaAtiva === 'historico' ? 500 : 400,
            cursor: 'pointer'
          }}
        >
          Histórico
        </button>
      </div>

      {/* Seletor de Mês e Total (apenas Histórico) */}
      {abaAtiva === 'historico' && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 16, marginBottom: 12, scrollbarWidth: 'none' }} className="no-scrollbar">
            {ultimosMeses.map((item, i) => (
              <button
                key={i}
                onClick={() => { setMesSelecionado(item.mes); setAnoSelecionado(item.ano); }}
                style={{
                  padding: '6px 12px',
                  borderRadius: 20,
                  border: '1px solid',
                  borderColor: mesSelecionado === item.mes && anoSelecionado === item.ano ? 'var(--primary)' : 'var(--border)',
                  background: mesSelecionado === item.mes && anoSelecionado === item.ano ? 'var(--primary-dim)' : 'var(--surface-1)',
                  color: mesSelecionado === item.mes && anoSelecionado === item.ano ? 'var(--primary)' : 'var(--text-2)',
                  fontSize: 12,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                {mesesAbreviados[item.mes]} {item.ano}
              </button>
            ))}
          </div>
          
          {pagas.length > 0 && (
            <div className="card" style={{ padding: '16px', background: 'var(--bg-hover)', border: 'none', marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>Total pago no mês</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-1)' }}>{fmt(totalHistorico)}</div>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-3)', padding: 40 }}>Carregando...</div>
      ) : (abaAtiva === 'pendentes' ? pendentes : pagas).length === 0 ? (
        <div className="card" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>{abaAtiva === 'pendentes' ? '📋' : '📅'}</div>
          <p style={{ color: 'var(--text-2)', fontSize: 14 }}>
            {abaAtiva === 'pendentes' ? 'Nenhuma conta pendente.' : 'Nenhuma conta paga neste mês.'}
          </p>
        </div>
      ) : (
        <>
          {abaAtiva === 'pendentes' ? (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pendentes.map(c => (
                  <div key={c.id} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'background 0.2s' }} onClick={() => setDetalhesModal(c)}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        {statusIcon(c)}
                        <span style={{ fontSize: 14, color: 'var(--text-1)' }}>
                          {c.descricao}
                          {c.tipo === 'parcelada' && c.parcela_total > 1 && <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 6 }}>(Parcela {c.parcela_atual}/{c.parcela_total})</span>}
                          {c.tipo === 'recorrente' && <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 6 }}>(Recorrente)</span>}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                        {c.categoria} {c.vencimento && `· vence ${new Date(c.vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}`}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 15, fontWeight: 500, color: c.vencimento < hoje ? 'var(--red)' : 'var(--text-1)' }}>
                        {fmt(Number(c.valor))}
                      </div>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                        <button onClick={(e) => { e.stopPropagation(); marcarPago(c.id) }} style={{
                          fontSize: 10, color: 'var(--green-400)', background: 'none',
                          border: 'none', cursor: 'pointer',
                        }}>Marcar pago</button>
                        <button onClick={(e) => { e.stopPropagation(); abrirEdicao(c) }} style={{
                          background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)',
                          display: 'flex', alignItems: 'center',
                        }}><Pencil size={12} /></button>
                        <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(c.id) }} style={{
                          background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)',
                          display: 'flex', alignItems: 'center',
                        }}><Trash2 size={12} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pagas.map(c => (
                  <div key={c.id} className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, opacity: 0.8, cursor: 'pointer' }} onClick={() => setDetalhesModal(c)}>
                    <Check size={14} color="var(--green-400)" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, color: 'var(--text-1)', textDecoration: 'line-through', opacity: 0.7 }}>{c.descricao}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{c.categoria} · pago em {c.vencimento ? new Date(c.vencimento + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, color: 'var(--text-2)' }}>{fmt(Number(c.valor))}</div>
                      <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(c.id) }} style={{
                        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4
                      }}><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

