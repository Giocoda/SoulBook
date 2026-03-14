import { NextResponse } from 'next/server';
import { transporter } from '@/lib/mailer'; // <--- USA QUELLO CHE FUNZIONA GIÀ

export async function POST(req: Request) {
  try {
    const { name, email, message, source } = await req.json();

    // Costruzione del corpo mail in HTML stile SoulBook
    const mailHTML = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #f1f5f9; border-radius: 24px; color: #0f172a;">
        <h1 style="color: #0f172a; text-transform: uppercase; font-style: italic; font-weight: 900; letter-spacing: -1px; margin-bottom: 20px;">SoulBook</h1>
        <h2 style="font-size: 14px; color: #3b82f6; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 20px;">Nuova Richiesta Informazioni</h2>
        
        <div style="background: #f8fafc; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0;">
          <p style="margin: 0 0 10px 0; font-size: 13px;"><strong>Nome:</strong> ${name}</p>
          <p style="margin: 0 0 10px 0; font-size: 13px;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 0 0 10px 0; font-size: 13px;"><strong>Provenienza:</strong> <span style="color: #64748b;">${source || 'Sito Web'}</span></p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="margin-bottom: 8px; font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: bold;">Messaggio:</p>
          <p style="font-size: 14px; color: #334155; line-height: 1.6; white-space: pre-wrap;">${message}</p>
        </div>
        
        <p style="font-size: 10px; color: #94a3b8; margin-top: 30px; text-align: center; text-transform: uppercase; letter-spacing: 1px;">
          SoulBook Italia - Sistema Notifiche Automatiche
        </p>
      </div>
    `;

    await transporter.sendMail({
      // Usiamo lo stesso mittente della welcome email
      from: `"SoulBook Support" <${process.env.SMTP_USER}>`, 
      to: "info@soulbookitalia.it", // O l'indirizzo dove vuoi riceverle
      subject: `📩 Richiesta da ${name} [${source || 'Web'}]`,
      html: mailHTML,
      replyTo: email, // Comodo: se clicchi "Rispondi" sulla mail, scrivi direttamente al cliente
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Errore API Contatti:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}