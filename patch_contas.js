const fs = require('fs')

let code = fs.readFileSync('/Users/thye/Dev/tivo/app/app/contas/page.tsx', 'utf8')

// 1. Update FORM_VAZIO
code = code.replace(
  `const FORM_VAZIO = { descricao: '', valor: '', categoria: 'Outros', vencimento: '' }`,
  `const FORM_VAZIO = { descricao: '', valor: '', categoria: 'Outros', vencimento: '', tipo: 'unica', parcelas: '1' }`
)

// 2. Update abrirEdicao
code = code.replace(
  `      vencimento: c.vencimento || '',`,
  `      vencimento: c.vencimento || '',
      tipo: c.tipo || 'unica',
      parcelas: String(c.parcela_total || 1),`
)

// 3. Update salvar logic
const oldSalvarLogic = `    if (editandoId) {
      const { error } = await supabase.from('contas').update(payload).eq('id', editandoId)
      if (error) { showToast('Erro ao atualizar conta.', 'error'); setSaving(false); return }
      showToast('Conta atualizada com sucesso ✓')
    } else {
      const { error } = await supabase.from('contas').insert({
        ...payload,
        usuario_id: session!.user.id,
        status: 'pendente',
      })
      if (error) { showToast('Erro ao criar conta.', 'error'); setSaving(false); return }
      showToast('Conta criada com sucesso ✓')
    }`

const newSalvarLogic = `    if (editandoId) {
      // Na edição pelo form, permitimos alterar campos básicos da parcela específica, mas ignoramos alteração de parcelamento em si para simplificar
      const { error } = await supabase.from('contas').update(payload).eq('id', editandoId)
      if (error) { showToast('Erro ao atualizar.', 'error'); setSaving(false); return }
      showToast('Atualizado com sucesso ✓')
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
    }`

code = code.replace(oldSalvarLogic, newSalvarLogic)

// 4. Update the Form UI
const oldUI = `            <select className="input" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}
              style={{ appearance: 'none' }}>
              {categorias.map(c => <option key={c}>{c}</option>)}
            </select>
            <button onClick={salvar} className="btn-primary" disabled={saving || !form.descricao || !form.valor} style={{ width: '100%' }}>`

const newUI = `            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <select className="input" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} style={{ appearance: 'none' }}>
                {categorias.map(c => <option key={c}>{c}</option>)}
              </select>
              <select className="input" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} disabled={!!editandoId} style={{ appearance: 'none' }}>
                <option value="unica">Única</option>
                <option value="parcelada">Parcelada</option>
                <option value="recorrente">Recorrente</option>
              </select>
            </div>
            {form.tipo === 'parcelada' && !editandoId && (
              <input className="input" placeholder="Número de parcelas (ex: 12)" type="number" min="2" max="120" value={form.parcelas} onChange={e => setForm({ ...form, parcelas: e.target.value })} />
            )}
            <button onClick={salvar} className="btn-primary" disabled={saving || !form.descricao || !form.valor || (form.tipo === 'parcelada' && (!form.parcelas || Number(form.parcelas) < 2))} style={{ width: '100%' }}>`

code = code.replace(oldUI, newUI)

fs.writeFileSync('/Users/thye/Dev/tivo/app/app/contas/page.tsx', code)
console.log('ContasPage patched')
