const fs = require('fs')

let code = fs.readFileSync('/Users/thye/Dev/tivo/app/app/contas/page.tsx', 'utf8')

// 1. Add confirmEditGroup state
code = code.replace(
  `const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)`,
  `const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)\n  const [confirmEditGroup, setConfirmEditGroup] = useState<any | null>(null)`
)

// 2. Rewrite deletar to handle batch
const oldDeletar = `  const deletar = async (id: string) => {
    await supabase.from('contas').delete().eq('id', id)
    setConfirmDeleteId(null)
    showToast('Conta removida.')
    load()
  }`

const newDeletar = `  const deletar = async (id: string, deleteFuture: boolean = false) => {
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
  }`

code = code.replace(oldDeletar, newDeletar)

// 3. Rewrite salvar to intercept and ask for confirmEditGroup
const oldSalvar = `    if (editandoId) {
      // Na edição pelo form, permitimos alterar campos básicos da parcela específica, mas ignoramos alteração de parcelamento em si para simplificar
      const { error } = await supabase.from('contas').update(payload).eq('id', editandoId)
      if (error) { showToast('Erro ao atualizar.', 'error'); setSaving(false); return }
      showToast('Atualizado com sucesso ✓')
    } else {`

const newSalvar = `    if (editandoId) {
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
    } else {`

code = code.replace(oldSalvar, newSalvar)
// We also need to remove the trailing lines of the old edit logic since we moved them inside or above.
// Actually, `oldSalvar` replacement correctly handles the `if(editandoId)` block. Let's make sure `cancelarForm()`, `setSaving(false)`, `load()` in the original `salvar` are not duplicated for the `editandoId` return.
// Let's replace the rest of the salvar function carefully:
const oldSalvarEnd = `      const { error } = await supabase.from('contas').insert(inserts)
      if (error) { showToast('Erro ao criar.', 'error'); setSaving(false); return }
      showToast('Criado com sucesso ✓')
    }

    cancelarForm()
    setSaving(false)
    load()
  }`

const newSalvarEnd = `      const { error } = await supabase.from('contas').insert(inserts)
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
  }`

code = code.replace(oldSalvarEnd, newSalvarEnd)

// 4. Update Delete Modal UI
const oldDeleteModal = `      {/* Dialog de confirmação de exclusão */}
      {confirmDeleteId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          zIndex: 200, padding: '0 16px 24px',
        }}>
          <div className="card anim-up" style={{ padding: '24px', width: '100%', maxWidth: 480 }}>
            <h3 style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Excluir conta?</h3>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20 }}>
              Essa ação não pode ser desfeita.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmDeleteId(null)} className="btn-ghost" style={{ flex: 1 }}>
                Cancelar
              </button>
              <button onClick={() => deletar(confirmDeleteId)} className="btn-primary"
                style={{ flex: 1, background: 'var(--red)' }}>
                <Trash2 size={14} /> Excluir
              </button>
            </div>
          </div>
        </div>
      )}`

const newDeleteModal = `      {/* Dialog de confirmação de exclusão */}
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
      })()}`

code = code.replace(oldDeleteModal, newDeleteModal)

// 5. Add Edit Group Modal UI
const editGroupModal = `
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
`

code = code.replace(
  `      {/* Modal de Detalhes */}`,
  editGroupModal + `      {/* Modal de Detalhes */}`
)


fs.writeFileSync('/Users/thye/Dev/tivo/app/app/contas/page.tsx', code)
console.log('ContasPage patched with batch edit/delete')
