const fs = require('fs')

let route = fs.readFileSync('/Users/thye/Dev/tivo/app/api/chat/route.ts', 'utf8')

// 1. Update Tools Array (Contas)
route = route.replace(
  `        recorrente: { type: 'boolean', description: 'Se é uma conta recorrente mensal' },`,
  `        tipo: { type: 'string', description: 'unica, parcelada ou recorrente' },\n        parcelas: { type: 'number', description: 'Número total de parcelas (apenas se for parcelada)' },`
)

// 2. Add Receita Tools
const receitaTools = `
  {
    name: 'criar_receita',
    description: 'Cria uma nova receita/entrada financeira para o usuário',
    input_schema: {
      type: 'object',
      properties: {
        descricao: { type: 'string', description: 'Origem da receita (ex: Salário, Freelance)' },
        valor: { type: 'number', description: 'Valor em reais' },
        data_recebimento: { type: 'string', description: 'Data no formato YYYY-MM-DD' },
        categoria: { type: 'string', description: 'Salário, Serviços, Vendas, Rendimentos, Outros' },
        tipo: { type: 'string', description: 'unica, parcelada ou recorrente' },
        parcelas: { type: 'number', description: 'Número total de parcelas' },
        observacao: { type: 'string' },
      },
      required: ['descricao', 'valor'],
    },
  },
  {
    name: 'atualizar_receita',
    description: 'Atualiza uma receita existente. Use listar_receitas primeiro.',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        descricao: { type: 'string' },
        valor: { type: 'number' },
        data_recebimento: { type: 'string' },
        status: { type: 'string', description: 'pendente, recebido, cancelado' },
      },
      required: ['id'],
    },
  },
  {
    name: 'deletar_receita',
    description: 'Remove uma receita.',
    input_schema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },
  {
    name: 'listar_receitas',
    description: 'Lista as receitas do usuário',
    input_schema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        mes: { type: 'number' },
        ano: { type: 'number' },
      },
    },
  },`

route = route.replace(
  `  {
    name: 'criar_meta',`,
  receitaTools + `\n  {
    name: 'criar_meta',`
)

// 3. Update Executar Ferramenta Helper function
const logicCriarConta = `
      case 'criar_conta': {
        const { descricao, valor, vencimento, categoria, tipo = 'unica', parcelas = 1, observacao } = input
        
        let inserts = []
        const grupo_id = crypto.randomUUID()
        const qtd = tipo === 'parcelada' ? parcelas : (tipo === 'recorrente' ? 12 : 1) // Recorrente gera 12 meses inicialmente
        
        let baseDate = vencimento ? new Date(vencimento + 'T12:00:00Z') : new Date()
        
        for (let i = 0; i < qtd; i++) {
          const currentVencimento = new Date(baseDate)
          currentVencimento.setMonth(baseDate.getMonth() + i)
          
          inserts.push({
            usuario_id: userId,
            descricao: descricao,
            valor: valor,
            vencimento: currentVencimento.toISOString().split('T')[0],
            categoria: categoria || 'Outros',
            tipo: tipo,
            grupo_id: tipo !== 'unica' ? grupo_id : null,
            parcela_atual: tipo !== 'unica' ? (i + 1) : null,
            parcela_total: tipo === 'parcelada' ? parcelas : null,
            observacao: observacao || null,
            status: 'pendente',
          })
        }

        const { data, error } = await supabase.from('contas').insert(inserts).select()
        if (error) return \`Erro ao criar conta: \${error.message}\`
        return JSON.stringify({ sucesso: true, quantidade: inserts.length, mensagem: \`Conta "\${descricao}" de R$ \${valor} (\${tipo}) criada com sucesso\` })
      }
`

route = route.replace(
  /case 'criar_conta': \{[\s\S]*?case 'atualizar_conta': \{/,
  logicCriarConta.trim() + '\n\n      case \'atualizar_conta\': {'
)

const logicReceitas = `
      case 'criar_receita': {
        const { descricao, valor, data_recebimento, categoria, tipo = 'unica', parcelas = 1, observacao } = input
        
        let inserts = []
        const grupo_id = crypto.randomUUID()
        const qtd = tipo === 'parcelada' ? parcelas : (tipo === 'recorrente' ? 12 : 1)
        
        let baseDate = data_recebimento ? new Date(data_recebimento + 'T12:00:00Z') : new Date()
        
        for (let i = 0; i < qtd; i++) {
          const currentData = new Date(baseDate)
          currentData.setMonth(baseDate.getMonth() + i)
          
          inserts.push({
            usuario_id: userId,
            descricao: descricao,
            valor: valor,
            data_recebimento: currentData.toISOString().split('T')[0],
            categoria: categoria || 'Outros',
            tipo: tipo,
            grupo_id: tipo !== 'unica' ? grupo_id : null,
            parcela_atual: tipo !== 'unica' ? (i + 1) : null,
            parcela_total: tipo === 'parcelada' ? parcelas : null,
            observacao: observacao || null,
            status: 'pendente',
          })
        }

        const { data, error } = await supabase.from('receitas').insert(inserts).select()
        if (error) return \`Erro ao criar receita: \${error.message}\`
        return JSON.stringify({ sucesso: true, quantidade: inserts.length, mensagem: \`Receita "\${descricao}" de R$ \${valor} (\${tipo}) criada com sucesso\` })
      }

      case 'atualizar_receita': {
        const { id, ...updates } = input
        const { data, error } = await supabase.from('receitas')
          .update({ ...updates })
          .eq('id', id).eq('usuario_id', userId).select().single()
        if (error) return \`Erro ao atualizar receita: \${error.message}\`
        return JSON.stringify({ sucesso: true, receita: data })
      }

      case 'deletar_receita': {
        const { error } = await supabase.from('receitas').delete().eq('id', input.id).eq('usuario_id', userId)
        if (error) return \`Erro ao deletar receita: \${error.message}\`
        return JSON.stringify({ sucesso: true, mensagem: 'Receita removida' })
      }

      case 'listar_receitas': {
        let query = supabase.from('receitas').select('*').eq('usuario_id', userId)
        if (input.status) query = query.eq('status', input.status)
        const mes = input.mes || new Date().getMonth() + 1
        const ano = input.ano || new Date().getFullYear()
        const inicio = \`\${ano}-\${String(mes).padStart(2, '0')}-01\`
        const fim = new Date(ano, mes, 0).toISOString().split('T')[0]
        query = query.gte('data_recebimento', inicio).lte('data_recebimento', fim)
        const { data, error } = await query.order('data_recebimento', { ascending: true })
        if (error) return \`Erro ao listar receitas: \${error.message}\`
        return JSON.stringify({ receitas: data, total: data?.length || 0 })
      }
`

route = route.replace(
  /case 'criar_meta': \{/,
  logicReceitas.trim() + '\n\n      case \'criar_meta\': {'
)

const contextOld = `DADOS ATUAIS DO USUÁRIO:
Contas cadastradas: \${JSON.stringify(contas || [])}
Metas ativas: \${JSON.stringify(metas || [])}`

const contextNew = `DADOS ATUAIS DO USUÁRIO:
Contas cadastradas (mês atual): \${JSON.stringify(contas || [])}
Receitas cadastradas (mês atual): \${JSON.stringify(receitas || [])}
Metas ativas: \${JSON.stringify(metas || [])}`

route = route.replace(contextOld, contextNew)

const dbQueryOld = `      const { data: contas } = await supabase.from('contas').select('*').eq('usuario_id', session.user.id).order('vencimento')
      const { data: metas } = await supabase.from('metas').select('*').eq('usuario_id', session.user.id).eq('status', 'ativa')`

const dbQueryNew = `      const hoje = new Date()
      const mesInit = \`\${hoje.getFullYear()}-\${String(hoje.getMonth() + 1).padStart(2, '0')}-01\`
      const mesFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0]
      const { data: contas } = await supabase.from('contas').select('*').eq('usuario_id', session.user.id).gte('vencimento', mesInit).lte('vencimento', mesFim).order('vencimento')
      const { data: receitas } = await supabase.from('receitas').select('*').eq('usuario_id', session.user.id).gte('data_recebimento', mesInit).lte('data_recebimento', mesFim).order('data_recebimento')
      const { data: metas } = await supabase.from('metas').select('*').eq('usuario_id', session.user.id).eq('status', 'ativa')`

route = route.replace(dbQueryOld, dbQueryNew)

const acoesOld = `[CRIAR_CONTA]: {"descricao": "Luz", "valor": 150, "vencimento": "2026-05-10", "categoria": "Moradia"}
[ATUALIZAR_CONTA]: {"id": "xxx", "valor": 200}
[DELETAR_CONTA]: {"id": "xxx"}
[CRIAR_META]: {"descricao": "Viagem", "valor_alvo": 3000, "prazo": "2026-12-01"}`

const acoesNew = `[CRIAR_CONTA]: {"descricao": "Luz", "valor": 150, "vencimento": "2026-05-10", "categoria": "Moradia", "tipo": "unica"}
[CRIAR_CONTA]: {"descricao": "Celular", "valor": 200, "tipo": "parcelada", "parcelas": 12}
[ATUALIZAR_CONTA]: {"id": "xxx", "valor": 200}
[DELETAR_CONTA]: {"id": "xxx"}
[CRIAR_RECEITA]: {"descricao": "Salário", "valor": 5000, "tipo": "recorrente"}
[ATUALIZAR_RECEITA]: {"id": "xxx", "valor": 6000}
[DELETAR_RECEITA]: {"id": "xxx"}
[CRIAR_META]: {"descricao": "Viagem", "valor_alvo": 3000, "prazo": "2026-12-01"}`

route = route.replace(acoesOld, acoesNew)

const mapOld = `        CRIAR_CONTA: 'criar_conta', ATUALIZAR_CONTA: 'atualizar_conta', DELETAR_CONTA: 'deletar_conta',
        CRIAR_META: 'criar_meta', ATUALIZAR_META: 'atualizar_meta', DELETAR_META: 'deletar_meta',`

const mapNew = `        CRIAR_CONTA: 'criar_conta', ATUALIZAR_CONTA: 'atualizar_conta', DELETAR_CONTA: 'deletar_conta',
        CRIAR_RECEITA: 'criar_receita', ATUALIZAR_RECEITA: 'atualizar_receita', DELETAR_RECEITA: 'deletar_receita',
        CRIAR_META: 'criar_meta', ATUALIZAR_META: 'atualizar_meta', DELETAR_META: 'deletar_meta',`

route = route.replace(mapOld, mapNew)

const schemaOld = `        criar_conta: ['descricao', 'valor'],
        atualizar_conta: ['id'],
        deletar_conta: ['id'],
        criar_meta: ['descricao', 'valor_alvo'],`

const schemaNew = `        criar_conta: ['descricao', 'valor'],
        atualizar_conta: ['id'],
        deletar_conta: ['id'],
        criar_receita: ['descricao', 'valor'],
        atualizar_receita: ['id'],
        deletar_receita: ['id'],
        criar_meta: ['descricao', 'valor_alvo'],`

route = route.replace(schemaOld, schemaNew)

fs.writeFileSync('/Users/thye/Dev/tivo/app/api/chat/route.ts', route)
console.log("DONE")
