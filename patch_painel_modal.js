const fs = require('fs')

let code = fs.readFileSync('/Users/thye/Dev/tivo/app/app/painel/page.tsx', 'utf8')

// 1. Add state for the modal and X icon import
code = code.replace(
  `import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock, CalendarDays } from 'lucide-react'`,
  `import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock, CalendarDays, X } from 'lucide-react'`
)

code = code.replace(
  `  const [filtro, setFiltro] = useState<FiltroTempo>('mes_atual')`,
  `  const [filtro, setFiltro] = useState<FiltroTempo>('mes_atual')\n  const [detalhesModal, setDetalhesModal] = useState<any | null>(null)`
)

// 2. Add the modal UI right before the first return element (or after)
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
                  <div style={{ fontSize: 15, color: 'var(--text-1)' }}>{fmtDate(detalhesModal.vencimento)}</div>
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
            
            <button onClick={() => setDetalhesModal(null)} className="btn-primary" style={{ width: '100%', marginTop: 24 }}>
              Fechar
            </button>
          </div>
        </div>
      )}
`

code = code.replace(
  `    <div style={{ padding: '20px 16px' }}>`,
  `    <div style={{ padding: '20px 16px' }}>` + modalUI
)

// 3. Make cards clickable
code = code.replace(
  `            <div key={c.id} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>`,
  `            <div key={c.id} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'background 0.2s' }} onClick={() => setDetalhesModal(c)}>`
)

fs.writeFileSync('/Users/thye/Dev/tivo/app/app/painel/page.tsx', code)
console.log('PainelPage patched with details modal')
