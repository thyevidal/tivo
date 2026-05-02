# 💰 Tivo — Assistente Financeiro Inteligente

Assistente financeiro pessoal com IA, construído com Next.js, Supabase e Gemini/Claude.

## Stack
- **Frontend:** Next.js 14 (App Router)
- **Banco de dados:** Supabase (PostgreSQL)
- **IA Gratuita:** Google Gemini 2.0 Flash
- **IA Premium:** Claude Haiku (Anthropic)
- **Hospedagem:** Vercel (gratuito)

## Configuração

### 1. Clone e instale
```bash
npm install
```

### 2. Variáveis de ambiente
Copie `.env.local.example` para `.env.local` e preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=https://glnjrxojuttcihifezum.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Supabase > Settings > API > anon key
GEMINI_API_KEY=                    # aistudio.google.com > Get API key (gratuito)
ANTHROPIC_API_KEY=                 # console.anthropic.com (para usuários premium)
ADMIN_EMAIL=                       # Seu email de admin
```

### 3. Configure o Supabase Auth
No painel do Supabase (glnjrxojuttcihifezum):
- **Authentication > Providers > Google** — ative e configure OAuth
- **Authentication > URL Configuration** — adicione `http://localhost:3000` em Redirect URLs

### 4. Rode localmente
```bash
npm run dev
# Acesse http://localhost:3000
```

### 5. Deploy na Vercel
1. Suba o código no GitHub
2. Acesse vercel.com > New Project > importe o repositório
3. Adicione as variáveis de ambiente no painel da Vercel
4. Deploy! 🚀

## Páginas

| Rota | Descrição |
|------|-----------|
| `/auth/login` | Login com Google ou link mágico |
| `/app/chat` | Chat com IA (tela principal) |
| `/app/painel` | Mini BI — resumo financeiro do mês |
| `/app/contas` | Gerenciar contas a pagar |
| `/app/metas` | Metas financeiras com progresso |
| `/app/configuracoes` | Plano, alertas e conta |
| `/admin` | Super admin — usuários, cupons e planos |

## Planos

| Plano | IA | Preço |
|-------|----|-------|
| Gratuito | Gemini 2.0 Flash | R$ 0 |
| Premium | Claude Haiku | R$ 18,90/30 dias |

## Próximos passos
- [ ] Integração com Asaas para pagamentos (Pix + Cartão)
- [ ] Alertas por email (Resend)
- [ ] PWA para instalar no celular
- [ ] Relatório PDF mensal
