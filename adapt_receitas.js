const fs = require('fs')

let code = fs.readFileSync('/Users/thye/Dev/tivo/app/app/contas/page.tsx', 'utf8')

code = code.replace(/ContasPage/g, 'ReceitasPage')
code = code.replace(/contas/g, 'receitas')
code = code.replace(/Contas/g, 'Receitas')
code = code.replace(/conta/g, 'receita')
code = code.replace(/Conta/g, 'Receita')
code = code.replace(/vencimento/g, 'data_recebimento')
code = code.replace(/marcarPago/g, 'marcarRecebido')
code = code.replace(/pago/g, 'recebido')
code = code.replace(/Pagas/g, 'Recebidas')
code = code.replace(/pendentes/g, 'pendentes') // stay pendentes
code = code.replace(/Pendentes/g, 'Pendentes')
code = code.replace(/Marcar recebido/g, 'Marcar recebido')

// Update categorias array
code = code.replace(
  /const categorias = \[.*?\]/,
  `const categorias = ['Salário', 'Serviços', 'Vendas', 'Rendimentos', 'Outros']`
)

fs.writeFileSync('/Users/thye/Dev/tivo/app/app/receitas/page.tsx', code)
console.log('ReceitasPage updated from ContasPage')
