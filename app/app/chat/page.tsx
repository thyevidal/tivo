'use client'
import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface Message {
  role: 'user' | 'assistant'
  content: string
  time: string
}

const getTime = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

const suggestions = [
  'Quais contas vencem essa semana?',
  'Como está meu orçamento esse mês?',
  'Me ajuda a criar uma meta de economia',
  'Analisa minha situação financeira',
]

// Mensagem de boas-vindas exibida quando não há histórico recente
const WELCOME_MSG: Message = {
  role: 'assistant',
  content: 'Olá! Sou o Tivo, seu assistente financeiro. 👋\n\nPosso te ajudar a organizar contas, acompanhar gastos e planejar suas metas. O que você precisa hoje?',
  time: '',
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()

  // Carrega histórico das últimas 24h ao iniciar
  useEffect(() => {
    async function loadHistory() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setLoadingHistory(false); return }

      // Janela de 24h para a UI
      const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

      const { data: historico } = await supabase
        .from('conversas')
        .select('role, conteudo, criado_em')
        .eq('usuario_id', session.user.id)
        .gte('criado_em', since24h)
        .order('criado_em', { ascending: true })

      if (historico && historico.length > 0) {
        const msgs: Message[] = historico.map(h => ({
          role: h.role as 'user' | 'assistant',
          content: h.conteudo,
          time: new Date(h.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        }))
        setMessages(msgs)
      } else {
        // Sem histórico recente — mostra boas-vindas
        setMessages([{ ...WELCOME_MSG, time: getTime() }])
      }

      setLoadingHistory(false)
    }
    loadHistory()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (text?: string) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    setLoading(true)

    const userMsg: Message = { role: 'user', content: msg, time: getTime() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages.map(m => ({ role: m.role, content: m.content })) }),
      })

      // Trata rate limit (429) com mensagem amigável
      if (res.status === 429) {
        const data = await res.json()
        setMessages(prev => [...prev, { role: 'assistant', content: data.error || 'Limite de mensagens atingido. Tente mais tarde. ⏱️', time: getTime() }])
        return
      }

      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.content, time: getTime() }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Tive um problema ao responder. Tente novamente.', time: getTime() }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  // Determina se deve mostrar as sugestões:
  // sem histórico real (apenas welcome) ou histórico completamente vazio
  const isFirstMessage = messages.length === 0 || (messages.length === 1 && messages[0].role === 'assistant')

  if (loadingHistory) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', color: 'var(--text-3)', fontSize: 14 }}>
        Carregando conversa...
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', paddingBottom: '72px' }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px 12px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'var(--bg-base)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, #166534, #4ade80)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>💰</div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, color: 'var(--text-1)' }}>Tivo</div>
          <div style={{ fontSize: 11, color: 'var(--green-400)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green-400)' }} />
            online
          </div>
        </div>
        <Sparkles size={16} style={{ marginLeft: 'auto', color: 'var(--text-3)' }} />
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px' }}>
        {messages.map((msg, i) => (
          <div key={i} className="anim-up" style={{
            display: 'flex',
            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            gap: 8, marginBottom: 14, alignItems: 'flex-end',
          }}>
            {msg.role === 'assistant' && (
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: 'linear-gradient(135deg, #166534, #4ade80)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
              }}>💰</div>
            )}
            <div style={{ maxWidth: '78%' }}>
              <div style={{
                background: msg.role === 'user' ? 'var(--green-600)' : 'var(--bg-card)',
                border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                padding: '10px 14px',
                fontSize: 14, lineHeight: 1.65, color: 'var(--text-1)',
                fontWeight: 300, whiteSpace: 'pre-wrap',
              }}>
                {msg.content}
              </div>
              <div style={{
                fontSize: 10, color: 'var(--text-3)', marginTop: 3,
                textAlign: msg.role === 'user' ? 'right' : 'left',
              }}>{msg.time}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 14 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'linear-gradient(135deg, #166534, #4ade80)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
            }}>💰</div>
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '16px 16px 16px 4px', padding: '12px 16px',
              display: 'flex', gap: 4, alignItems: 'center',
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: '50%', background: 'var(--green-400)',
                  animation: `pulse-dot 1.2s ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        {/* Sugestões — apenas na primeira mensagem / sem histórico */}
        {isFirstMessage && !loading && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => send(s)} style={{
                background: 'var(--green-dim)', border: '1px solid var(--border-em)',
                borderRadius: 20, color: 'var(--green-400)', fontSize: 12,
                padding: '6px 12px', cursor: 'pointer', fontFamily: 'var(--font-body)',
                transition: 'all 0.2s',
              }}>{s}</button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '10px 16px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-base)',
        display: 'flex', gap: 10, alignItems: 'flex-end',
      }}>
        <textarea
          ref={inputRef}
          className="input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Pergunte sobre suas finanças..."
          rows={1}
          style={{ resize: 'none', maxHeight: 100, lineHeight: 1.5 }}
        />
        <button onClick={() => send()} disabled={loading || !input.trim()} className="btn-primary" style={{
          width: 44, height: 44, padding: 0, flexShrink: 0, borderRadius: 12,
        }}>
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}