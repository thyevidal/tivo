import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return req.cookies.get(name)?.value },
        set(name: string, value: string, options: any) { res.cookies.set({ name, value, ...options }) },
        remove(name: string, options: any) { res.cookies.set({ name, value: '', ...options }) },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const { pathname } = req.nextUrl

  // Rotas protegidas: /app/* → redireciona para login se não autenticado
  if (pathname.startsWith('/app') && !session) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  // Proteção da rota Admin
  if (pathname.startsWith('/app/admin')) {
    if (session?.user?.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      return NextResponse.redirect(new URL('/app/painel', req.url))
    }
  }

  // Se já autenticado e tentar acessar login, redireciona para o app
  if (pathname.startsWith('/auth/login') && session) {
    return NextResponse.redirect(new URL('/app/chat', req.url))
  }

  return res
}

export const config = {
  // Executa o middleware apenas nas rotas relevantes (exclui assets estáticos)
  matcher: ['/app/:path*', '/auth/:path*'],
}
