'use client'
import { useEffect, useState } from 'react'
import { Plus, Target, X, Pencil, Trash2, PlusCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useToast } from '../components/Toast'

const FORM_VAZIO = { descricao: '', valor_alvo: '', valor_atual: '', prazo: '' }

export default function MetasPage() {
  const [metas, setMetas] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(FORM_VAZIO)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  // Aporte: { metaId, valor }
  const [aporte, setAporte] = useState<{ metaId: string; valorAtual: number } | null>(null)
  const [aporteValor, setAporteValor] = useState('')
  const { show: showToast, ToastComponent } = useToast()
  const supabase = createClient()

  async function load() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data } = await supabase.from('metas').select('*').eq('usuario_id', session.user.id).order('criado_em', { ascending: false })
    setMetas(data || [])
  }

  useEffect(() => { load() }, [])

  const abrirNovaForm = () => {
    setEditandoId(null)
    setForm(FORM_VAZIO)
    setShowForm(true)
  }

  const abrirEdicao = (m: any) => {
    setEditandoId(m.id)
    setForm({
      descricao: m.descricao,
      valor_alvo: String(m.valor_alvo),
      valor_atual: String(m.valor_atual),
      prazo: m.prazo || '',
    })
    setShowForm(true)
  }

  const cancelarForm = () => {
    setShowForm(false)
    setEditandoId(null)
    setForm(FORM_VAZIO)
  }

  const salvar = async () => {
    if (!form.descricao || !form.valor_alvo) return
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()

    const payload = {
      descricao: form.descricao,
      valor_alvo: parseFloat(form.valor_alvo),
      valor_atual: parseFloat(form.valor_atual || '0'),
      prazo: form.prazo || null,
    }

    if (editandoId) {
      const { error } = await supabase.from('metas').update(payload).eq('id', editandoId)
      if (error) { showToast('Erro ao atualizar meta.', 'error'); setSaving(false); return }
      showToast('Meta atualizada com sucesso ✓')
    } else {
      const { error } = await supabase.from('metas').insert({ ...payload, usuario_id: session!.user.id })
      if (error) { showToast('Erro ao criar meta.', 'error'); setSaving(false); return }
      showToast('Meta criada com sucesso ✓')
    }

    cancelarForm()
    setSaving(false)
    load()
  }

  const deletar = async (id: string) => {
    await supabase.from('metas').delete().eq('id', id)
    setConfirmDeleteId(null)
    showToast('Meta removida.')
    load()
  }

  const registrarAporte = async () => {
    if (!aporte || !aporteValor) return
    const novoValor = aporte.valorAtual + parseFloat(aporteValor.replace(',', '.'))
    const { error } = await supabase.from('metas').update({ valor_atual: novoValor }).eq('id', aporte.metaId)
    if (error) { showToast('Erro ao registrar aporte.', 'error'); return }
    showToast(`Aporte registrado ✓`)
    setAporte(null)
    setAporteValor('')
    load()
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div style={{ padding: '20px 16px' }}>
      {ToastComponent}

      {/* Dialog de confirmação de exclusão */}
      {confirmDeleteId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          zIndex: 200, padding: '0 16px 24px',
        }}>
          <div className="card anim-up" style={{ padding: '24px', width: '100%', maxWidth: 480 }}>
            <h3 style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Excluir meta?</h3>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20 }}>Essa ação não pode ser desfeita.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmDeleteId(null)} className="btn-ghost" style={{ flex: 1 }}>Cancelar</button>
              <button onClick={() => deletar(confirmDeleteId)} className="btn-primary" style={{ flex: 1, background: 'var(--red)' }}>
                <Trash2 size={14} /> Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog de aporte */}
      {aporte && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          zIndex: 200, padding: '0 16px 24px',
        }}>
          <div className="card anim-up" style={{ padding: '24px', width: '100%', maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 500 }}>Registrar aporte</h3>
              <button onClick={() => { setAporte(null); setAporteValor('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>
              Saldo atual: <strong style={{ color: 'var(--green-400)' }}>{fmt(aporte.valorAtual)}</strong>
            </p>
            <input
              className="input"
              type="number"
              placeholder="Quanto você guardou? (R$)"
              value={aporteValor}
              onChange={e => setAporteValor(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && registrarAporte()}
              autoFocus
              style={{ marginBottom: 12 }}
            />
            <button onClick={registrarAporte} className="btn-primary" disabled={!aporteValor} style={{ width: '100%' }}>
              Confirmar aporte
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 2 }}>Metas</h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 300 }}>Seus objetivos financeiros</p>
        </div>
        <button onClick={abrirNovaForm} className="btn-primary" style={{ padding: '10px 16px', gap: 6 }}>
          <Plus size={16} /> Nova
        </button>
      </div>

      {showForm && (
        <div className="card anim-up" style={{ padding: '20px', marginBottom: 20, borderColor: 'var(--border-em)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 500 }}>{editandoId ? 'Editar meta' : 'Nova meta'}</h3>
            <button onClick={cancelarForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}>
              <X size={18} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input className="input" placeholder="Ex: Viagem para a praia, Reserva de emergência..." value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <input className="input" placeholder="Valor alvo (R$)" type="number" value={form.valor_alvo} onChange={e => setForm({ ...form, valor_alvo: e.target.value })} />
              <input className="input" placeholder="Já tenho (R$)" type="number" value={form.valor_atual} onChange={e => setForm({ ...form, valor_atual: e.target.value })} />
            </div>
            <input className="input" type="date" placeholder="Prazo" value={form.prazo} onChange={e => setForm({ ...form, prazo: e.target.value })} />
            <button onClick={salvar} className="btn-primary" disabled={saving || !form.descricao || !form.valor_alvo} style={{ width: '100%' }}>
              {saving ? 'Salvando...' : editandoId ? 'Salvar alterações' : 'Criar meta'}
            </button>
          </div>
        </div>
      )}

      {metas.length === 0 ? (
        <div className="card" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <Target size={40} style={{ color: 'var(--text-3)', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-2)', fontSize: 14 }}>Nenhuma meta ainda.<br />Defina um objetivo financeiro!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {metas.map(m => {
            const pct = Math.min(100, Math.round((Number(m.valor_atual) / Number(m.valor_alvo)) * 100))
            return (
              <div key={m.id} className="card" style={{ padding: '18px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 2 }}>{m.descricao}</div>
                    {m.prazo && (
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                        Prazo: {new Date(m.prazo + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <div style={{ fontSize: 16, fontFamily: 'var(--font-display)', color: pct >= 100 ? 'var(--green-400)' : 'var(--text-1)' }}>
                      {pct}%
                    </div>
                    <button onClick={() => abrirEdicao(m)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', paddingTop: 2 }}>
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setConfirmDeleteId(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', paddingTop: 2 }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Barra de progresso */}
                <div style={{ background: 'var(--bg-surface)', borderRadius: 4, height: 6, marginBottom: 8 }}>
                  <div style={{
                    height: '100%', borderRadius: 4,
                    background: pct >= 100 ? 'var(--green-400)' : 'linear-gradient(90deg, var(--green-600), var(--green-400))',
                    width: `${pct}%`, transition: 'width 0.5s',
                  }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--text-3)' }}>
                  <span>{fmt(Number(m.valor_atual))} acumulado</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span>Meta: {fmt(Number(m.valor_alvo))}</span>
                    {pct < 100 && (
                      <button
                        onClick={() => { setAporte({ metaId: m.id, valorAtual: Number(m.valor_atual) }); setAporteValor('') }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 3,
                          background: 'var(--green-dim)', border: '1px solid var(--border-em)',
                          borderRadius: 20, color: 'var(--green-400)', fontSize: 11,
                          padding: '3px 9px', cursor: 'pointer', fontFamily: 'var(--font-body)',
                        }}
                      >
                        <PlusCircle size={11} /> Aporte
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
