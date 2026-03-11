import { NextResponse } from 'next/server';
import { transporter } from '@/lib/mailer';

export async function POST(req: Request) {
  try {
    const { email, fullName, slug } = await req.json();

    // Determina il protocollo e l'host dinamicamente
    const host = req.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    
    const publicUrl = `${protocol}://${host}/${slug}`;
    const loginUrl = `${protocol}://${host}/registrati?mode=login`;
    const adminUrl = `${protocol}://${host}/admin`;

    // 1. EMAIL PER L'UTENTE (Benvenuto)
    await transporter.sendMail({
      from: `"SoulBook" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Benvenuto su SoulBook, ${fullName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #f1f5f9; border-radius: 24px; color: #0f172a;">
          <h1 style="color: #0f172a; text-transform: uppercase; font-style: italic; font-weight: 900; letter-spacing: -1px; margin-bottom: 20px;">SoulBook</h1>
          <p style="font-size: 16px; line-height: 1.5;">Ciao <strong>${fullName}</strong>,</p>
          <p style="font-size: 14px; color: #64748b; line-height: 1.6;">Il tuo profilo è ora attivo. Abbiamo creato uno spazio dedicato per custodire e condividere i ricordi più preziosi.</p>
          <div style="background: #f8fafc; padding: 24px; border-radius: 16px; margin: 30px 0; text-align: center; border: 1px solid #e2e8f0;">
            <p style="margin-bottom: 8px; font-size: 10px; color: #94a3b8; text-transform: uppercase; tracking: 2px; font-weight: bold;">La tua pagina pubblica:</p>
            <a href="${publicUrl}" style="font-size: 16px; font-weight: bold; color: #3b82f6; text-decoration: none; word-break: break-all;">${publicUrl}</a>
          </div>
          <div style="text-align: center;">
            <a href="${loginUrl}" style="display: inline-block; background: #0f172a; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Accedi alla Dashboard</a>
          </div>
        </div>
      `,
    });

    // 2. EMAIL PER L'ADMIN (Notifica nuova iscrizione)
    // Inviamo la notifica alla mail configurata in SMTP_USER (admin@soulbookitalia.it)
    await transporter.sendMail({
      from: `"Sistema SoulBook" <${process.env.SMTP_USER}>`,
      to: "admin@soulbookitalia.it", 
      subject: `✨ Nuova registrazione: ${fullName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 2px solid #0f172a; border-radius: 16px;">
          <h2 style="color: #0f172a; text-transform: uppercase; font-weight: 900;">Notifica Registrazione</h2>
          <p style="font-size: 14px; color: #334155;">Un nuovo utente ha completato la procedura di attivazione.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <ul style="list-style: none; padding: 0; font-size: 14px; color: #0f172a;">
            <li style="margin-bottom: 10px;"><strong>Nome:</strong> ${fullName}</li>
            <li style="margin-bottom: 10px;"><strong>Email:</strong> ${email}</li>
            <li style="margin-bottom: 10px;"><strong>Slug scelto:</strong> ${slug}</li>
          </ul>
          <div style="margin-top: 30px; text-align: center;">
            <a href="${adminUrl}" style="background: #f1f5f9; color: #0f172a; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-size: 11px; font-weight: bold; uppercase;">Visualizza nel Pannello Admin</a>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("ERRORE INVIO DOPPIA MAIL:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}