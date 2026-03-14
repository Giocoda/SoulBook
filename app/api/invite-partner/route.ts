import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { transporter } from '@/lib/mailer' // Usiamo il tuo mailer esistente

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { email, name, codes } = await request.json()

    // 1. Salviamo l'agenzia nel DB
    const { data: agency, error: agError } = await supabaseAdmin
      .from('agencies')
      .insert([{ name, email }])
      .select().single()

    if (agError) throw agError

    // 2. Salviamo i codici
    if (codes?.length > 0) {
      await supabaseAdmin.from('activation_codes').insert(
        codes.map((c: string) => ({ code: c, agency_id: agency.id }))
      )
    }

    // 3. Prepariamo il link (dinamico come nella tua welcome mail)
    const host = request.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const registrationLink = `${protocol}://${host}/registrati-partner?email=${encodeURIComponent(email)}`

    // 4. Invio Mail tramite il tuo mailer.ts
    await transporter.sendMail({
      from: `"SoulBook Italia" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Attivazione Portale Partner - SoulBook",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #f1f5f9; border-radius: 24px; color: #0f172a;">
          <h1 style="color: #0f172a; text-transform: uppercase; font-style: italic; font-weight: 900; letter-spacing: -1px; margin-bottom: 20px;">SoulBook Partner</h1>
          <p style="font-size: 16px; line-height: 1.5;">Ciao <strong>${name}</strong>,</p>
          <p style="font-size: 14px; color: #64748b; line-height: 1.6;">Benvenuto nel programma partner di SoulBook. Abbiamo predisposto il tuo pannello di gestione codici.</p>
          <div style="background: #f8fafc; padding: 24px; border-radius: 16px; margin: 30px 0; text-align: center; border: 1px solid #e2e8f0;">
             <p style="margin-bottom: 12px; font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Clicca sotto per impostare la tua password:</p>
             <a href="${registrationLink}" style="display: inline-block; background: #3b82f6; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Attiva Account Partner</a>
          </div>
          <p style="font-size: 11px; color: #94a3b8; text-align: center;">Se il pulsante non funziona copia questo link: ${registrationLink}</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("ERRORE INVIO INVITO PARTNER:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}