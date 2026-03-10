// lib/supabaseClient.ts
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// createBrowserClient sincronizza i cookie con il Proxy/Middleware.
// Aggiungiamo una configurazione per ottimizzare lo Storage e la sessione.
export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
    },
    // Ottimizzazione per il caricamento di file grandi nello Storage
    global: {
      headers: { 'x-application-name': 'soulbook' },
    },
  }
)