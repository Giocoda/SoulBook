import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // --- LOGICA DI PROTEZIONE ---
  if (path.startsWith('/admin') || path.startsWith('/super-admin') || path === '/dashboard') {
    
    // Se non è loggato, lo mandiamo a registrarsi (tranne se è già lì)
    if (!user) {
      return NextResponse.redirect(new URL('/registrati', request.url))
    }

    // Recuperiamo il profilo
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('owner_id', user.id)
      .single()

    // DEBUG: Questo apparirà nel tuo TERMINALE (non nel browser)
    console.log(`[PROXY] Path: ${path} | User: ${user.email} | isAdmin: ${profile?.is_admin}`)

    // BYPASS DI SICUREZZA: Se è la tua email, passa sempre (anche se il DB dà null)
    const isSuperAdminEmail = user.email === 'admin@soulbookitalia.it' // <--- CONTROLLA CHE SIA CORRETTA

    // 1. Gestione Dashboard -> Admin
    if (path === '/dashboard' && (profile?.is_admin || isSuperAdminEmail)) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }

    // 2. Protezione Aree Riservate
    if (path.startsWith('/admin') || path.startsWith('/super-admin')) {
      if (profile?.is_admin !== true && !isSuperAdminEmail) {
        console.log("!!! ACCESSO NEGATO: Redirect a /dashboard")
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/admin/:path*', 
    '/super-admin/:path*'
  ],
}