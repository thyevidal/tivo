'use server'

import { createClient } from '@supabase/supabase-js'

// Cria um cliente supabase com a Service Role para bypassar RLS e acessar auth.users
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// -- USUÁRIOS --
export async function getAdminUsers() {
  const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers()
  if (authError) throw new Error(authError.message)

  // Buscar assinaturas e planos
  const { data: assinaturas } = await supabaseAdmin.from('assinaturas').select('*, planos(*)')
  // Buscar uso de API do mês atual
  const mesAtual = new Date().toISOString().slice(0, 7) // YYYY-MM
  const { data: usoApi } = await supabaseAdmin.from('uso_api').select('*').eq('mes', mesAtual)

  const usersWithData = users.map(u => {
    const assinatura = assinaturas?.find(a => a.usuario_id === u.id)
    const uso = usoApi?.find(api => api.usuario_id === u.id)
    return {
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      assinatura: assinatura || null,
      usoApi: uso || { tokens_usados: 0, reqs_usadas: 0 }
    }
  })

  return usersWithData
}

// -- PLANOS --
export async function getPlanos() {
  const { data, error } = await supabaseAdmin.from('planos').select('*').order('valor', { ascending: true })
  if (error) throw new Error(error.message)
  return data
}

export async function salvarPlano(plano: any) {
  if (plano.id) {
    const { error } = await supabaseAdmin.from('planos').update(plano).eq('id', plano.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabaseAdmin.from('planos').insert(plano)
    if (error) throw new Error(error.message)
  }
}

// -- CUPONS --
export async function getCupons() {
  const { data, error } = await supabaseAdmin.from('cupons').select('*').order('id', { ascending: false })
  if (error) throw new Error(error.message)
  return data
}

export async function salvarCupom(cupom: any) {
  if (cupom.id) {
    const { error } = await supabaseAdmin.from('cupons').update(cupom).eq('id', cupom.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabaseAdmin.from('cupons').insert(cupom)
    if (error) throw new Error(error.message)
  }
}

export async function getFeedbacks() {
  const { data, error } = await supabaseAdmin.from('feedbacks').select('*').order('id', { ascending: false })
  if (error) throw new Error(error.message)
  
  // Buscar os emails para exibir junto aos feedbacks
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
  
  return data.map(f => ({
    ...f,
    email: users.find(u => u.id === f.usuario_id)?.email || 'Desconhecido'
  }))
}

export async function marcarFeedbackLido(id: string) {
  await supabaseAdmin.from('feedbacks').update({ lido: true }).eq('id', id)
}
