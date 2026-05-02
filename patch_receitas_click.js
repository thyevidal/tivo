const fs = require('fs')

let code = fs.readFileSync('/Users/thye/Dev/tivo/app/app/receitas/page.tsx', 'utf8')

// Make card clickable
code = code.replace(
  `<div key={c.id} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>`,
  `<div key={c.id} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'background 0.2s' }} onClick={() => abrirEdicao(c)}>`
)

// Add stopPropagation to buttons
code = code.replace(
  `button onClick={() => marcarRecebido(c.id)}`,
  `button onClick={(e) => { e.stopPropagation(); marcarRecebido(c.id) }}`
)

code = code.replace(
  `button onClick={() => abrirEdicao(c)}`,
  `button onClick={(e) => { e.stopPropagation(); abrirEdicao(c) }}`
)

code = code.replace(
  `button onClick={() => setConfirmDeleteId(c.id)}`,
  `button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(c.id) }}`
)

fs.writeFileSync('/Users/thye/Dev/tivo/app/app/receitas/page.tsx', code)
console.log('Receitas patched')
