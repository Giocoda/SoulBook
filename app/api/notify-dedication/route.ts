import { NextResponse } from 'next/server';
import { transporter } from '@/lib/mailer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ownerEmail, ownerName, visitorName, dedicationText } = body;

    // CONTROLLO MULTI-CHIAVE: 
    // Verifichiamo tutte le varianti possibili che potrebbero arrivare dal frontend o dal DB
    const isPublicValue = 
      body.isPublic === true || 
      body.isPublic === true || 
      body.is_public === true; // Variante del database

    const host = req.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const dashboardUrl = `${protocol}://${host}/dashboard`;

    // Configurazione visiva basata sul valore reale trovato
    const statusColor = isPublicValue ? '#616562' : '#911b1b';
    const statusText = isPublicValue ? 'PUBBLICO (Visibile sulla pagina)' : 'PRIVATO (Solo per te)';
    const emoji = isPublicValue ? '✨' : '🔏';

    await transporter.sendMail({
      from: `"SoulBook" <${process.env.SMTP_USER}>`,
      to: ownerEmail,
      subject: `${emoji} ${isPublicValue ? 'Nuova dedica' : 'Nuova dedica privata'} da ${visitorName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #f1f5f9; border-radius: 24px; color: #0f172a;">
          <p style="font-size: 16px;">Ciao <strong>${ownerName}</strong>,</p>
          <p style="font-size: 14px; color: #64748b;">
            Hai ricevuto un nuovo pensiero. Stato: <span style="color: ${statusColor}; font-weight: bold;">${statusText}</span>
          </p>
          
          <div style="background: #f8fafc; padding: 25px; border-radius: 16px; margin: 20px 0; border-left: 4px solid ${statusColor};">
            <p style="font-style: italic; color: #334155; margin: 0;">"${dedicationText}"</p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${dashboardUrl}" style="display: inline-block; background: #0f172a; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 12px; text-transform: uppercase;">Apri Dashboard</a>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Errore invio mail:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}