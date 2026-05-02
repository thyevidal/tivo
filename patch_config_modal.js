const fs = require('fs')

let code = fs.readFileSync('/Users/thye/Dev/tivo/app/app/configuracoes/page.tsx', 'utf8')

// Add imports
code = code.replace("import { Moon } from 'lucide-react'", "import { Moon, Sparkles, MessageCircle, TrendingUp, Shield, X } from 'lucide-react'")

// Update Alertas interface
code = code.replace(
`interface Alertas {
  alerta_vencimento: boolean
  alerta_resumo_semanal: boolean
  alerta_conta_paga: boolean
}`,
`interface Alertas {
  alerta_vencimento: boolean
  alerta_resumo_semanal: boolean
  alerta_metas: boolean
}`
)

// Add modal state
code = code.replace(
  "const [upgradando, setUpgradando] = useState(false)",
  "const [upgradando, setUpgradando] = useState(false)\n  const [showUpgradeModal, setShowUpgradeModal] = useState(false)"
)

// Update Alertas initial state
code = code.replace(
`  const [alertas, setAlertas] = useState<Alertas>({
    alerta_vencimento: true,
    alerta_resumo_semanal: true,
    alerta_conta_paga: true,
  })`,
`  const [alertas, setAlertas] = useState<Alertas>({
    alerta_vencimento: true,
    alerta_resumo_semanal: true,
    alerta_metas: true,
  })`
)

// Update load() alerts mapping
code = code.replace(
`      setAlertas({
        alerta_vencimento: data?.alerta_vencimento ?? true,
        alerta_resumo_semanal: data?.alerta_resumo_semanal ?? true,
        alerta_conta_paga: data?.alerta_conta_paga ?? true,
      })`,
`      setAlertas({
        alerta_vencimento: data?.alerta_vencimento ?? true,
        alerta_resumo_semanal: data?.alerta_resumo_semanal ?? true,
        alerta_metas: data?.alerta_metas ?? true,
      })`
)

// Update alertasConfig array
code = code.replace(
`  const alertasConfig: { campo: keyof Alertas; label: string; sub: string }[] = [
    { campo: 'alerta_vencimento', label: 'Vencimento de contas', sub: '3 dias antes do vencimento' },
    { campo: 'alerta_resumo_semanal', label: 'Resumo semanal', sub: 'Todo domingo pela manhã' },
    { campo: 'alerta_conta_paga', label: 'Conta paga', sub: 'Confirmação de pagamento' },
  ]`,
`  const alertasConfig: { campo: keyof Alertas; label: string; sub: string }[] = [
    { campo: 'alerta_vencimento', label: 'Vencimento de contas', sub: '3 dias antes do vencimento' },
    { campo: 'alerta_resumo_semanal', label: 'Resumo semanal', sub: 'Balanço automático' },
    { campo: 'alerta_metas', label: 'Alerta de metas', sub: 'Aviso ao atingir um objetivo' },
  ]`
)

// Update upgrade button to open modal
code = code.replace(
`          {!isPremium && (
            <button className="btn-primary" onClick={handleUpgrade} disabled={upgradando} style={{ padding: '8px 14px', fontSize: 12 }}>
              {upgradando ? 'Aguarde...' : 'Upgrade R$18,90'}
            </button>
          )}`,
`          {!isPremium && (
            <button className="btn-primary" onClick={() => setShowUpgradeModal(true)} style={{ padding: '8px 14px', fontSize: 12 }}>
              Upgrade R$18,90
            </button>
          )}`
)

// Add Modal JSX at the end
const modalJSX = `
      {/* Modal de Upgrade */}
      {showUpgradeModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: '20px', backdropFilter: 'blur(4px)'
        }} onClick={() => setShowUpgradeModal(false)}>
          <div className="card anim-up" style={{ padding: '24px', width: '100%', maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--text-1)', marginBottom: 4 }}>Tivo Premium</h3>
                <p style={{ fontSize: 14, color: 'var(--text-2)' }}>Desbloqueie o poder máximo da IA</p>
              </div>
              <button onClick={() => setShowUpgradeModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', alignSelf: 'flex-start' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ color: 'var(--green-400)', flexShrink: 0 }}><Sparkles size={20} /></div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)' }}>Múltiplas Inteligências</div>
                  <div style={{ fontSize: 13, color: 'var(--text-2)' }}>Acesso a IAs avançadas (como Claude 3.5 Sonnet) para análises profundas.</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ color: 'var(--green-400)', flexShrink: 0 }}><MessageCircle size={20} /></div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)' }}>Tivo no WhatsApp</div>
                  <div style={{ fontSize: 13, color: 'var(--text-2)' }}>Registre gastos e tire dúvidas conversando pelo WhatsApp a qualquer hora.</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ color: 'var(--green-400)', flexShrink: 0 }}><TrendingUp size={20} /></div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)' }}>Relatórios Proativos</div>
                  <div style={{ fontSize: 13, color: 'var(--text-2)' }}>Receba insights semanais automáticos sobre onde economizar.</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ color: 'var(--green-400)', flexShrink: 0 }}><Shield size={20} /></div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)' }}>Suporte Prioritário</div>
                  <div style={{ fontSize: 13, color: 'var(--text-2)' }}>Fila expressa de atendimento.</div>
                </div>
              </div>
            </div>

            <button className="btn-primary" onClick={handleUpgrade} disabled={upgradando} style={{ width: '100%', padding: '14px', fontSize: 15 }}>
              {upgradando ? 'Gerando link...' : 'Assinar Premium por R$18,90'}
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
`

code = code.replace(/\n\s*<\/div>\n\s*\)\n}\n*$/, modalJSX)

fs.writeFileSync('/Users/thye/Dev/tivo/app/app/configuracoes/page.tsx', code)
console.log('Config page patched')
