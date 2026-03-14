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

  // IMPORTANTE: getUser() rinfresca la sessione, auth.getSession() no.
  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // 1. ESCLUSIONI
  if (path === '/registrati-partner' || path.startsWith('/auth')) {
    return response
  }

  const protectedRoutes = ['/admin', '/super-admin', '/partner', '/dashboard']
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))
  const isHome = path === '/'

  if (isProtectedRoute || (isHome && user)) {
    
    if (!user && isProtectedRoute) {
      return NextResponse.redirect(new URL('/registrati?mode=login', request.url))
    }

    // Recuperiamo il profilo
    // Aggiungiamo un filtro per assicurarci di non prendere dati vecchi
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, is_partner')
      .eq('owner_id', user?.id)
      .maybeSingle()

    // --- DEBUG LOG: Controlla il terminale di VS Code quando carichi la pagina ---
    console.log(`MIDDLEWARE: Path: ${path} | User: ${user?.email} | Partner: ${profile?.is_partner}`)

    const isSuperAdminEmail = user?.email === 'admin@soulbookitalia.it'
    const isAdmin = profile?.is_admin || isSuperAdminEmail
    const isPartner = profile?.is_partner

    // --- LOGICA REDIRECT ---

    // Se l'utente è un Partner e prova ad andare in Dashboard o Home
    if (isPartner && (path === '/dashboard' || isHome)) {
       return NextResponse.redirect(new URL('/partner', request.url))
    }

    // Se l'utente è un Admin e prova ad andare in Dashboard o Home
    if (isAdmin && (path === '/dashboard' || isHome)) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }

    // Protezione Area Admin
    if (path.startsWith('/admin') || path.startsWith('/super-admin')) {
      if (!isAdmin) {
        return NextResponse.redirect(new URL(isPartner ? '/partner' : '/dashboard', request.url))
      }
    }

    // Protezione Area Partner
    if (path.startsWith('/partner')) {
      if (!isPartner && !isAdmin) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*', 
    '/admin/:path*', 
    '/super-admin/:path*',
    '/partner/:path*', 
    '/auth/:path*'
  ],
}