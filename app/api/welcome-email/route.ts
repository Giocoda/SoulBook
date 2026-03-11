import { NextResponse } from 'next/server';
import { transporter } from '@/lib/mailer';

export async function POST(req: Request) {
  try {
    const { email, fullName, slug } = await req.json();

    // Determina il protocollo e l'host dinamicamente
    const host = req.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    
    // Costruisce l'URL dinamico (es: http://localhost:3000/mario-rossi o https://soulbook.it/mario-rossi)
    const publicUrl = `${protocol}://${host}/${slug}`;
    const loginUrl = `${protocol}://${host}/registrati?mode=login`;

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

          <p style="font-size: 14px; color: #64748b; margin-bottom: 30px;">Accedi ora alla tua dashboard per personalizzare il profilo e caricare contenuti.</p>
          
          <div style="text-align: center;">
            <a href="${loginUrl}" style="display: inline-block; background: #0f172a; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Accedi alla Dashboard</a>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 40px 0;" />
          <p style="font-size: 11px; color: #cbd5e1; text-align: center;">SoulBook Italia - Custodiamo il valore della memoria.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("ERRORE SMTP DINAMICO:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}