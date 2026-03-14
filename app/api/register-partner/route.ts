import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // 1. Trova l'agenzia
    const { data: agency } = await supabaseAdmin
      .from('agencies')
      .select('id, name')
      .eq('email', email)
      .maybeSingle()

    if (!agency) return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })

    // 2. Crea Utente Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'partner' }
    })

    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })
    const userId = authUser.user.id

    // 3. Aggiornamento Profilo con "ritardo controllato"
    // Aspettiamo 1 secondo per dare tempo al trigger di Supabase di creare il profilo base
    await new Promise(resolve => setTimeout(resolve, 1000));

    const { error: profError } = await supabaseAdmin
      .from('profiles')
      .update({ is_partner: true, full_name: agency.name })
      .eq('owner_id', userId)

    // Se l'update fallisce (riga non ancora esistente), allora facciamo insert
    if (profError) {
       await supabaseAdmin.from('profiles').insert({ 
         owner_id: userId, 
         is_partner: true, 
         full_name: agency.name 
       })
    }

    // 4. Collega Agenzia
    await supabaseAdmin.from('agencies').update({ owner_id: userId }).eq('id', agency.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: "Errore interno" }, { status: 500 })
  }
}