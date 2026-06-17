'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-stone-800 selection:bg-stone-200">
      <nav className="p-8 max-w-4xl mx-auto">
        <Link href="/" className="text-xl font-black uppercase tracking-[0.3em] italic text-stone-800">
          Soul<span className="opacity-30">Book</span>
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-8 py-12 space-y-12">
        <header className="space-y-4">
          <h1 className="text-4xl font-serif italic">Privacy & Cookie Policy</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 text-left">
            Ultimo aggiornamento: Marzo 2026
          </p>
        </header>

        {/* CONTENUTO INTEGRALE */}
        <section className="space-y-6 text-sm leading-relaxed text-stone-600">
          <div className="space-y-4">
            <h3 className="text-stone-900 font-black uppercase text-[11px] tracking-widest">
              1. Trattamento dei Dati
            </h3>
            <p>
              SoulBook tratta i dati personali (Nome, Email, Contenuti multimediali) al solo scopo di fornire il servizio di memoriale digitale. 
              I dati sono memorizzati in modo sicuro tramite Supabase (Database) e non vengono ceduti a terzi.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-stone-900 font-black uppercase text-[11px] tracking-widest">
              2. Cookie Tecnici
            </h3>
            <p>
              Questo sito utilizza esclusivamente cookie tecnici necessari per l'autenticazione (login) e la sicurezza della sessione. 
              Non vengono utilizzati cookie di profilazione o di terze parti per finalità pubblicitarie.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-stone-900 font-black uppercase text-[11px] tracking-widest">
              3. Diritti dell'Utente
            </h3>
            <p>
              In conformità al GDPR, l'utente può richiedere in qualsiasi momento la cancellazione totale del proprio account 
              e di tutti i contenuti associati (foto e messaggi) direttamente dalla propria Dashboard o contattando il supporto.
            </p>
          </div>
        </section>

        {/* FOOTER DELLA PAGINA CON TASTO DINAMICO */}
        <footer className="pt-12 border-t border-stone-100">
          <button 
            onClick={() => router.back()}
            className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors cursor-pointer flex items-center gap-2 group"
          >
            <span className="transition-transform group-hover:-translate-x-1">&larr;</span> 
            Torna alla pagina precedente
          </button>
        </footer>
      </main>
    </div>
  );
}