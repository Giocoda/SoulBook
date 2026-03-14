import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  // Supabase invia questi due parametri nel link di invito
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as any // Per gli inviti il type è 'invite' o 'signup'
  
  // Recuperiamo dove andare dopo la conferma (nel nostro caso /partner)
  const next = searchParams.get('next') ?? '/partner'
  
  const redirectTo = request.nextUrl.clone()
  redirectTo.pathname = next

  if (token_hash && type) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({ name, value: '', ...options })
          },
        },
      }
    )

    // Convalida il token e crea la sessione
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    
    if (!error) {
      // Rimuoviamo i parametri del token dall'URL per pulizia prima del redirect
      redirectTo.searchParams.delete('token_hash')
      redirectTo.searchParams.delete('type')
      return NextResponse.redirect(redirectTo)
    }
  }

  // Se qualcosa va storto (token scaduto o errato), mandiamo alla pagina di login con l'errore
  return NextResponse.redirect(new URL('/registrati?mode=login&error=link-invalid', request.url))
}