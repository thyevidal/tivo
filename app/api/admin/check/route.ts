import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ isAdmin: false }, { status: 401 })
  }

  const isAdmin = session.user.email === process.env.ADMIN_EMAIL

  return NextResponse.json({ isAdmin })
}
