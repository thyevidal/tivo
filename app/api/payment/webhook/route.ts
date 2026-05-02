import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// Duração do plano Premium em dias (altere conforme necessário)
const PREMIUM_DURATION_DAYS = 30

export async function POST(req: NextRequest) {
  // Valida o token secreto do webhook para evitar chamadas externas não autorizadas
  const authHeader = req.headers.get('asaas-access-token')
  if (authHeader !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const supabase = createServerSupabaseClient()

  try {
    const body = await req.json()
    const { event, payment } = body

    // Só processa confirmações de pagamento
    if (event !== 'PAYMENT_RECEIVED' && event !== 'PAYMENT_CONFIRMED') {
      return NextResponse.json({ ok: true })
    }

    const asaasPaymentId = payment?.id
    const userId = payment?.externalReference

    if (!asaasPaymentId || !userId) {
      console.error('[Asaas Webhook] Dados insuficientes:', body)
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    // Atualiza o status do pagamento no banco
    await supabase
      .from('pagamentos')
      .update({ status: 'aprovado', valor_final: payment.value })
      .eq('asaas_payment_id', asaasPaymentId)

    // Ativa o plano Premium no usuário
    const expira = new Date()
    expira.setDate(expira.getDate() + PREMIUM_DURATION_DAYS)

    const { data: planoPremium } = await supabase
      .from('planos')
      .select('id')
      .eq('nome', 'Premium')
      .single()

    if (planoPremium) {
      await supabase
        .from('usuarios')
        .update({
          plano_id: planoPremium.id,
          plano_expira_em: expira.toISOString(),
        })
        .eq('id', userId)
    }

    console.log(`[Asaas Webhook] Plano Premium ativado para ${userId} até ${expira.toISOString()}`)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[Asaas Webhook] Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
