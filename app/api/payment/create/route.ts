import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// Asaas sandbox: https://sandbox.asaas.com — produção: https://api.asaas.com
const ASAAS_BASE_URL = process.env.ASAAS_SANDBOX === 'true'
  ? 'https://sandbox.asaas.com/api/v3'
  : 'https://api.asaas.com/api/v3'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('nome, email, cpf_cnpj, asaas_customer_id')
      .eq('email', session.user.email!)
      .single()

    let customerId: string = usuario?.asaas_customer_id || ''

    // Cria o cliente no Asaas se ainda não existir
    if (!customerId) {
      const customerRes = await fetch(`${ASAAS_BASE_URL}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': process.env.ASAAS_API_KEY!,
        },
        body: JSON.stringify({
          name: usuario?.nome || session.user.email,
          email: session.user.email,
          cpfCnpj: usuario?.cpf_cnpj || undefined,
          externalReference: session.user.id,
        }),
      })
      const customer = await customerRes.json()
      if (!customer.id) {
        console.error('[Asaas] Erro ao criar cliente:', customer)
        return NextResponse.json({ error: 'Erro ao criar cliente no Asaas' }, { status: 500 })
      }
      customerId = customer.id

      // Salva o ID do cliente Asaas no banco
      await supabase.from('usuarios').update({ asaas_customer_id: customerId }).eq('email', session.user.email!)
    }

    // Busca o plano Premium
    const { data: plano } = await supabase
      .from('planos')
      .select('valor')
      .eq('nome', 'Premium')
      .single()

    // Cria o link de pagamento (PIX preferencial, mas Asaas aceita todos os meios)
    const paymentRes = await fetch(`${ASAAS_BASE_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': process.env.ASAAS_API_KEY!,
      },
      body: JSON.stringify({
        customer: customerId,
        billingType: 'UNDEFINED', // permite o usuário escolher: PIX, boleto ou cartão
        value: plano?.valor || 18.90,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // vence em 3 dias
        description: 'Tivo Premium — acesso por 30 dias',
        externalReference: session.user.id,
        postalService: false,
      }),
    })
    const payment = await paymentRes.json()

    if (!payment.id) {
      console.error('[Asaas] Erro ao criar pagamento:', payment)
      return NextResponse.json({ error: 'Erro ao gerar link de pagamento' }, { status: 500 })
    }

    // Salva o pagamento no banco para rastrear
    await supabase.from('pagamentos').insert({
      usuario_id: session.user.id,
      asaas_payment_id: payment.id,
      valor_final: payment.value,
      status: 'pendente',
    })

    return NextResponse.json({
      paymentId: payment.id,
      invoiceUrl: payment.invoiceUrl,  // link de pagamento completo (PIX/boleto/cartão)
    })
  } catch (error) {
    console.error('[Asaas] Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
