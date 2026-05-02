const fs = require('fs')

let code = fs.readFileSync('/Users/thye/Dev/tivo/app/app/layout.tsx', 'utf8')

// 1. Add imports
code = code.replace(
  `import { MessageCircle, BarChart2, FileText, Target, Settings, TrendingUp } from 'lucide-react'`,
  `import { MessageCircle, BarChart2, FileText, Target, Settings, TrendingUp, Shield } from 'lucide-react'\nimport { useEffect, useState } from 'react'\nimport { createClient } from '@/lib/supabase'`
)

// 2. Add state and effect
code = code.replace(
  `  const pathname = usePathname()`,
  `  const pathname = usePathname()\n  const [isAdmin, setIsAdmin] = useState(false)\n\n  useEffect(() => {\n    const supabase = createClient()\n    supabase.auth.getSession().then(({ data }) => {\n      if (data.session?.user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {\n        setIsAdmin(true)\n      }\n    })\n  }, [])`
)

// 3. Add Admin button UI
const adminUI = `
      {/* Botões do Canto Superior Direito */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '16px',
        zIndex: 100,
        display: 'flex',
        gap: '8px',
      }}>
        {isAdmin && (
          <Link href="/app/admin" style={{
            background: pathname.startsWith('/app/admin') ? 'var(--green-400)' : 'rgba(30,41,59,0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--border)',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: pathname.startsWith('/app/admin') ? '#fff' : 'var(--text-2)',
            transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}>
            <Shield size={20} />
          </Link>
        )}
        
        <Link href="/app/configuracoes" style={{
          background: pathname.startsWith('/app/configuracoes') ? 'var(--green-400)' : 'rgba(30,41,59,0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid var(--border)',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: pathname.startsWith('/app/configuracoes') ? '#fff' : 'var(--text-2)',
          transition: 'all 0.2s',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
        }}>
          <Settings size={20} />
        </Link>
      </div>`

const oldConfigUI = `      {/* Botão de Configurações Flutuante (Topo Direito) */}
      <Link href="/app/configuracoes" style={{
        position: 'absolute',
        top: '20px',
        right: '16px',
        zIndex: 100,
        background: 'rgba(30,41,59,0.8)',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--border)',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-2)',
        transition: 'all 0.2s',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
      }}>
        <Settings size={20} />
      </Link>`

code = code.replace(oldConfigUI, adminUI)

fs.writeFileSync('/Users/thye/Dev/tivo/app/app/layout.tsx', code)
console.log('Layout updated with admin button')
