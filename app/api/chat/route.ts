import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// ─── Rate limiting ────────────────────────────────────────────────────────────
const RATE_LIMIT_FREE_HOURLY = 20
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60 * 60 * 1000 })
    return { allowed: true, remaining: RATE_LIMIT_FREE_HOURLY - 1 }
  }
  if (entry.count >= RATE_LIMIT_FREE_HOURLY) return { allowed: false, remaining: 0 }
  entry.count++
  return { allowed: true, remaining: RATE_LIMIT_FREE_HOURLY - entry.count }
}

const SYSTEM_PROMPT = `Você é o Tivo, um assistente financeiro pessoal inteligente, empático e proativo.
Você tem acesso direto ao banco de dados do usuário e deve gerir contas, receitas e metas usando as ferramentas fornecidas.

REGRAS CRÍTICAS:
1. NUNCA invente que realizou uma ação. Você só pode confirmar que algo foi feito APÓS chamar a ferramenta e receber sucesso.
2. Se precisar de um ID para atualizar algo, use 'listar_contas' ou 'listar_receitas' primeiro se o ID não estiver no contexto.
3. Se uma ferramenta falhar, explique o erro ao usuário em vez de fingir que deu certo.
4. Quando o usuário pedir para mudar algo, use 'atualizar_conta' ou 'atualizar_receita'.

COMPORTAMENTO:
- Use os dados reais do banco (fornecidos via contexto) para dar conselhos.
- Formate valores como R$ X.XXX,XX.
- Responda em Português Brasileiro.

Hoje é ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`

// Ferramentas que a IA pode usar (Formato Genérico)
const tools = [
  {
    name: 'criar_conta',
    description: 'Cria uma nova conta a pagar (despesa)',
    parameters: {
      type: 'object',
      properties: {
        descricao: { type: 'string', description: 'Nome da conta (ex: Aluguel)' },
        valor: { type: 'number', description: 'Valor em reais' },
        vencimento: { type: 'string', description: 'Data de vencimento YYYY-MM-DD' },
        categoria: { type: 'string', description: 'Moradia, Alimentação, Transporte, Saúde, Educação, Lazer, Serviços, Outros' },
        tipo: { type: 'string', enum: ['unica', 'parcelada', 'recorrente'] },
        parcelas: { type: 'number', description: 'Total de parcelas (se parcelada)' },
        status: { type: 'string', enum: ['pendente', 'pago'], description: 'Status inicial da conta' },
        observacao: { type: 'string' },
      },
      required: ['descricao', 'valor'],
    },
  },
  {
    name: 'listar_contas',
    description: 'Lista as contas do usuário',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['pendente', 'pago', 'vencido'] },
        mes: { type: 'number' },
        ano: { type: 'number' },
      },
    },
  },
  {
    name: 'atualizar_conta',
    description: 'Atualiza uma conta ou todas as futuras de uma recorrência',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID da conta específica' },
        grupo_id: { type: 'string', description: 'ID do grupo para atualizar toda a recorrência' },
        descricao: { type: 'string' },
        valor: { type: 'number' },
        vencimento: { type: 'string', description: 'YYYY-MM-DD' },
        categoria: { type: 'string' },
        status: { type: 'string', enum: ['pendente', 'pago', 'vencido', 'cancelado'] },
      },
    },
  },
  {
    name: 'excluir_conta',
    description: 'Move uma conta para a lixeira (exclusão lógica)',
    parameters: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },
  {
    name: 'atualizar_receita',
    description: 'Atualiza uma receita ou toda a recorrência',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        grupo_id: { type: 'string' },
        descricao: { type: 'string' },
        valor: { type: 'number' },
        data_recebimento: { type: 'string', description: 'YYYY-MM-DD' },
        novo_dia: { type: 'number', description: 'Muda o dia de todos os lançamentos futuros (1-31)' },
      },
    },
  },
  {
    name: 'excluir_receita',
    description: 'Move uma receita para a lixeira (exclusão lógica)',
    parameters: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },
  {
    name: 'excluir_meta',
    description: 'Move uma meta para a lixeira (exclusão lógica)',
    parameters: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },
  {
    name: 'criar_receita',
    description: 'Cria uma nova receita/entrada financeira',
    parameters: {
      type: 'object',
      properties: {
        descricao: { type: 'string' },
        valor: { type: 'number' },
        data_recebimento: { type: 'string', description: 'YYYY-MM-DD' },
        categoria: { type: 'string', description: 'Salário, Serviços, Vendas, Rendimentos, Outros' },
        tipo: { type: 'string', enum: ['unica', 'parcelada', 'recorrente'] },
        parcelas: { type: 'number' },
      },
      required: ['descricao', 'valor'],
    },
  },
  {
    name: 'listar_receitas',
    description: 'Lista as receitas do usuário',
    parameters: {
      type: 'object',
      properties: { mes: { type: 'number' }, ano: { type: 'number' } },
    },
  },
  {
    name: 'criar_meta',
    description: 'Cria uma nova meta financeira',
    parameters: {
      type: 'object',
      properties: {
        descricao: { type: 'string' },
        valor_alvo: { type: 'number' },
        prazo: { type: 'string', description: 'YYYY-MM-DD' },
      },
      required: ['descricao', 'valor_alvo'],
    },
  },
  {
    name: 'listar_metas',
    description: 'Lista as metas do usuário',
    parameters: {
      type: 'object',
      properties: { status: { type: 'string', enum: ['ativa', 'concluida'] } },
    },
  },
  {
    name: 'atualizar_meta',
    description: 'Adiciona valor ou atualiza uma meta',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        valor_atual: { type: 'number' },
        status: { type: 'string', enum: ['ativa', 'concluida'] },
      },
      required: ['id'],
    },
  },
]

// Ferramentas que a IA pode usar (Formato Genérico)
const geminiTools = [{ function_declarations: tools }]

// Adaptação para Anthropic (Claude)
const claudeTools = tools.map(t => ({
  name: t.name,
  description: t.description,
  input_schema: t.parameters,
}))

async function executarFerramenta(nome: string, input: any, userId: string, supabase: any): Promise<any> {
  try {
    switch (nome) {
      case 'criar_conta': {
        const { descricao, valor, vencimento, categoria, tipo = 'unica', parcelas = 1, observacao } = input
        const grupo_id = crypto.randomUUID()
        const qtd = tipo === 'parcelada' ? parcelas : (tipo === 'recorrente' ? 12 : 1)
        let baseDate = vencimento ? new Date(vencimento + 'T12:00:00Z') : new Date()
        let inserts = []
        for (let i = 0; i < qtd; i++) {
          const d = new Date(baseDate); d.setMonth(baseDate.getMonth() + i)
          inserts.push({
            usuario_id: userId, descricao, valor, categoria: categoria || 'Outros', tipo,
            vencimento: d.toISOString().split('T')[0], 
            status: input.status || 'pendente',
            grupo_id: tipo !== 'unica' ? grupo_id : null,
            parcela_atual: tipo !== 'unica' ? (i + 1) : null,
            parcela_total: tipo === 'parcelada' ? parcelas : null,
          })
        }
        const { error } = await supabase.from('contas').insert(inserts)
        if (error) throw error
        return { sucesso: true, mensagem: `Conta "${descricao}" registrada.` }
      }
      case 'listar_contas': {
        const mes = input.mes || new Date().getMonth() + 1
        const ano = input.ano || new Date().getFullYear()
        const ini = `${ano}-${String(mes).padStart(2, '0')}-01`
        const fim = new Date(ano, mes, 0).toISOString().split('T')[0]
        let q = supabase.from('contas').select('*').eq('usuario_id', userId).is('excluido_em', null)
        if (input.status) q = q.eq('status', input.status)
        else q = q.gte('vencimento', ini).lte('vencimento', fim)
        const { data, error } = await q.order('vencimento')
        if (error) throw error
        return { contas: data }
      }
      case 'atualizar_conta': {
        const { id, grupo_id, ...upd } = input
        let q = supabase.from('contas').update(upd).eq('usuario_id', userId).is('excluido_em', null)
        if (id) q = q.eq('id', id)
        else if (grupo_id) q = q.eq('grupo_id', grupo_id).gte('vencimento', new Date().toISOString().split('T')[0])
        else return { erro: 'ID ou Grupo ID necessário.' }
        
        const { data, error } = await q.select()
        if (error) throw error
        return { sucesso: true, mensagem: `${data?.length || 0} conta(s) atualizada(s).` }
      }
      case 'excluir_conta': {
        const { error } = await supabase.from('contas').update({ excluido_em: new Date().toISOString() }).eq('id', input.id).eq('usuario_id', userId)
        if (error) throw error
        return { sucesso: true, mensagem: 'Conta movida para a lixeira.' }
      }
      case 'atualizar_receita': {
        const { id, grupo_id, novo_dia, ...upd } = input
        if (id) {
          const { error } = await supabase.from('receitas').update(upd).eq('id', id).eq('usuario_id', userId).is('excluido_em', null)
          if (error) throw error
          return { sucesso: true, mensagem: 'Receita atualizada.' }
        } else if (grupo_id && novo_dia) {
          const { data: records } = await supabase.from('receitas').select('*').eq('grupo_id', grupo_id).is('excluido_em', null).gte('data_recebimento', new Date().toISOString().split('T')[0])
          for (const rec of (records || [])) {
            const d = new Date(rec.data_recebimento + 'T12:00:00Z')
            d.setDate(novo_dia)
            await supabase.from('receitas').update({ data_recebimento: d.toISOString().split('T')[0] }).eq('id', rec.id)
          }
          return { sucesso: true, mensagem: `Dia de recebimento alterado para ${novo_dia} em todos os meses futuros.` }
        }
        return { erro: 'ID ou (Grupo ID + Novo Dia) necessário.' }
      }
      case 'excluir_receita': {
        const { error } = await supabase.from('receitas').update({ excluido_em: new Date().toISOString() }).eq('id', input.id).eq('usuario_id', userId)
        if (error) throw error
        return { sucesso: true, mensagem: 'Receita movida para a lixeira.' }
      }
      case 'excluir_meta': {
        const { error } = await supabase.from('metas').update({ excluido_em: new Date().toISOString() }).eq('id', input.id).eq('usuario_id', userId)
        if (error) throw error
        return { sucesso: true, mensagem: 'Meta movida para a lixeira.' }
      }
      case 'criar_receita': {
        const { descricao, valor, data_recebimento, categoria, tipo = 'unica', parcelas = 1 } = input
        const grupo_id = crypto.randomUUID()
        const qtd = tipo === 'parcelada' ? parcelas : (tipo === 'recorrente' ? 12 : 1)
        let baseDate = data_recebimento ? new Date(data_recebimento + 'T12:00:00Z') : new Date()
        let inserts = []
        for (let i = 0; i < qtd; i++) {
          const d = new Date(baseDate); d.setMonth(baseDate.getMonth() + i)
          inserts.push({
            usuario_id: userId, descricao, valor, categoria: categoria || 'Outros', tipo,
            data_recebimento: d.toISOString().split('T')[0], status: 'recebido',
            grupo_id: tipo !== 'unica' ? grupo_id : null,
            parcela_atual: tipo !== 'unica' ? (i + 1) : null,
            parcela_total: tipo === 'parcelada' ? parcelas : null,
          })
        }
        const { error } = await supabase.from('receitas').insert(inserts)
        if (error) throw error
        return { sucesso: true, mensagem: `Receita "${descricao}" registrada.` }
      }
      case 'listar_receitas': {
        const mes = input.mes || new Date().getMonth() + 1
        const ano = input.ano || new Date().getFullYear()
        const ini = `${ano}-${String(mes).padStart(2, '0')}-01`
        const fim = new Date(ano, mes, 0).toISOString().split('T')[0]
        const { data, error } = await supabase.from('receitas').select('*').eq('usuario_id', userId).is('excluido_em', null).gte('data_recebimento', ini).lte('data_recebimento', fim).order('data_recebimento')
        if (error) throw error
        return { receitas: data }
      }
      case 'criar_meta': {
        const { error } = await supabase.from('metas').insert({ usuario_id: userId, ...input, status: 'ativa' })
        if (error) throw error
        return { sucesso: true }
      }
      case 'listar_metas': {
        const { data, error } = await supabase.from('metas').select('*').eq('usuario_id', userId).is('excluido_em', null).eq('status', input.status || 'ativa')
        if (error) throw error
        return { metas: data }
      }
      case 'atualizar_meta': {
        const { id, ...upd } = input
        const { error } = await supabase.from('metas').update(upd).eq('id', id).eq('usuario_id', userId).is('excluido_em', null)
        if (error) throw error
        return { sucesso: true }
      }
      default: return { erro: 'Ferramenta não encontrada' }
    }
  } catch (e: any) { return { erro: e.message } }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { messages } = await req.json()
    const userId = user.id

    // Verificar plano
    const { data: userDb } = await supabase.from('usuarios').select('planos(nome)').eq('id', userId).single()
    const isPremium = (userDb?.planos as any)?.nome === 'Premium'

    if (!isPremium) {
      const { allowed } = checkRateLimit(userId)
      if (!allowed) return NextResponse.json({ error: 'Limite atingido. Tente em 1h ou faça Upgrade.' }, { status: 429 })
    }

    // Contexto dinâmico para a IA
    const hoje = new Date()
    const mesIni = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`
    const mesFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0]
    const { data: c } = await supabase.from('contas').select('*').eq('usuario_id', userId).gte('vencimento', mesIni).lte('vencimento', mesFim)
    const { data: r } = await supabase.from('receitas').select('*').eq('usuario_id', userId).gte('data_recebimento', mesIni).lte('data_recebimento', mesFim)
    const { data: m } = await supabase.from('metas').select('*').eq('usuario_id', userId).eq('status', 'ativa')

    const contexto = `\nCONTEXTO DO USUÁRIO (${new Date().toLocaleDateString('pt-BR')}):
Contas do mês: ${JSON.stringify(c || [])}
Receitas do mês: ${JSON.stringify(r || [])}
Metas: ${JSON.stringify(m || [])}`

    let finalResponse = ''

    if (isPremium) {
      // LOGICA CLAUDE (Nativa)
      let currentMessages = messages.map((m: any) => ({ role: m.role, content: m.content }))
      while (true) {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model: 'claude-3-5-sonnet-20240620', max_tokens: 1024, system: SYSTEM_PROMPT + contexto, tools: claudeTools, messages: currentMessages }),
        })
        const data = await res.json()
        if (data.stop_reason === 'tool_use') {
          currentMessages.push({ role: 'assistant', content: data.content })
          const results = []
          for (const b of data.content) {
            if (b.type === 'tool_use') {
              const res = await executarFerramenta(b.name, b.input, userId, supabase)
              results.push({ type: 'tool_result', tool_use_id: b.id, content: JSON.stringify(res) })
            }
          }
          currentMessages.push({ role: 'user', content: results })
        } else {
          finalResponse = data.content.find((b: any) => b.type === 'text')?.text || ''
          break
        }
      }
    } else {
      // LOGICA GEMINI (Agora Nativa!)
      let currentMessages = messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content || '' }]
      }))

      // Ajuste Gemini: Começar com user e alternar
      if (currentMessages[0].role !== 'user') currentMessages.shift()
      
      while (true) {
        console.log('📡 Chamando Gemini API (v1beta) - Modelo: gemini-2.5-flash')
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_PROMPT + contexto }] },
            contents: currentMessages,
            tools: geminiTools,
          }),
        })
        
        const data = await res.json()
        
        if (data.error) {
          console.error('❌ Erro detalhado da API:', JSON.stringify(data.error, null, 2))
          finalResponse = 'Desculpe, tive um probleminha técnico ao processar sua solicitação. Pode tentar novamente?'
          break
        }

        const candidate = data.candidates?.[0]
        if (!candidate) {
          console.error('❌ Nenhuma resposta da IA (Safety filter?):', JSON.stringify(data, null, 2))
          finalResponse = 'Não consegui gerar uma resposta para isso por motivos de segurança ou política. Pode tentar perguntar de outra forma?'
          break
        }

        const parts = candidate.content?.parts || []
        const calls = parts.filter((p: any) => p.functionCall)

        if (calls.length > 0) {
          console.log('🤖 IA solicitou ferramentas:', calls.map((c: any) => c.functionCall.name))
          currentMessages.push(candidate.content)
          
          for (const call of calls) {
            const { name, args } = call.functionCall
            const result = await executarFerramenta(name, args, userId, supabase)
            console.log(`✅ Resultado de ${name}:`, result)
            
            // Em Gemini REST, o resultado da função deve ser enviado em um bloco com role 'function'
            currentMessages.push({
              role: 'function',
              parts: [{ functionResponse: { name, response: result } }]
            })
          }
        } else {
          finalResponse = parts.find((p: any) => p.text)?.text || 'Não consegui processar.'
          console.log('✅ Resposta final da IA gerada.')
          break
        }
      }
    }

    // Salvar no histórico
    await supabase.from('conversas').insert([
      { usuario_id: userId, role: 'user', conteudo: messages[messages.length - 1].content },
      { usuario_id: userId, role: 'assistant', conteudo: finalResponse },
    ])

    return NextResponse.json({ content: finalResponse })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro no servidor' }, { status: 500 })
  }
}