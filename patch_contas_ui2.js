const fs = require('fs')

let code = fs.readFileSync('/Users/thye/Dev/tivo/app/app/contas/page.tsx', 'utf8')

// 1. Add detalhesModal to state
code = code.replace(
  `const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)`,
  `const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)\n  const [detalhesModal, setDetalhesModal] = useState<any | null>(null)`
)

// 2. Update FORM_VAZIO and abrirEdicao to include observacao
code = code.replace(
  `const FORM_VAZIO = { descricao: '', valor: '', categoria: 'Outros', vencimento: '', tipo: 'unica', parcelas: '1' }`,
  `const FORM_VAZIO = { descricao: '', valor: '', categoria: 'Outros', vencimento: '', tipo: 'unica', parcelas: '1', observacao: '' }`
)

code = code.replace(
  `      parcelas: String(c.parcela_total || 1),`,
  `      parcelas: String(c.parcela_total || 1),\n      observacao: c.observacao || '',`
)

// 3. Update payload to include observacao
code = code.replace(
  `      vencimento: form.vencimento || null,
    }`,
  `      vencimento: form.vencimento || null,\n      observacao: form.observacao || null,\n    }`
)

// 4. Improve Form UI with labels
const oldFormUI = `<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input className="input" placeholder="Descrição (ex: Conta de luz)" value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <input className="input" placeholder="Valor (R$)" type="number" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} />
              <input className="input" type="date" value={form.vencimento} onChange={e => setForm({ ...form, vencimento: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
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
            <button onClick={salvar} className="btn-primary" disabled={saving || !form.descricao || !form.valor || (form.tipo === 'parcelada' && (!form.parcelas || Number(form.parcelas) < 2))} style={{ width: '100%' }}>
              {saving ? 'Salvando...' : editandoId ? 'Salvar alterações' : 'Criar conta'}
            </button>
          </div>`

const newFormUI = `<div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
          </div>`

code = code.replace(oldFormUI, newFormUI)

// 5. Change card click to open detalhesModal instead of abrirEdicao
code = code.replace(
  `onClick={(e) => { e.stopPropagation(); abrirEdicao(c) }}><Pencil size={12} /></button>`,
  `onClick={(e) => { e.stopPropagation(); abrirEdicao(c) }}><Pencil size={12} /></button>`
) // leave pencil as is, it's correct

code = code.replace(
  `onClick={() => abrirEdicao(c)}>`,
  `onClick={() => setDetalhesModal(c)}>`
) // replace card click

// 6. Insert Detalhes Modal UI
const modalUI = `
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
                    {detalhesModal.tipo === 'parcelada' && \` (\${detalhesModal.parcela_atual}/\${detalhesModal.parcela_total})\`}
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
`

code = code.replace(
  `    <div style={{ padding: '20px 16px' }}>`,
  `    <div style={{ padding: '20px 16px' }}>` + modalUI
)

fs.writeFileSync('/Users/thye/Dev/tivo/app/app/contas/page.tsx', code)
console.log('Contas form and modal patched')
