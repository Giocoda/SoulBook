'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans selection:bg-slate-200">
      
      {/* --- NAV BAR --- */}
      <nav className="flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
        <div className="text-xl font-black uppercase tracking-[0.3em] italic text-slate-800">
          Soul<span className="opacity-30">Book</span>
        </div>
        
        {/* LINK ACCEDI: Ora punta a /registrati con parametro login */}
        <Link 
          href="/registrati?mode=login" 
          className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
        >
          Accedi
        </Link>
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="pt-20 pb-32 px-6 text-center max-w-4xl mx-auto space-y-8">
        <div className="space-y-4">
          <h1 className="text-6xl md:text-8xl font-light tracking-tighter leading-none italic">
            Custodisci la <br /> 
            <span className="font-serif text-slate-400">tua storia.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 font-light max-w-xl mx-auto leading-relaxed">
            SoulBook dove i ricordi diventano eterni. Crea uno spazio elegante per chi ami.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          {/* BOTTONE CREA PROFILO: Punta a /registrati con parametro signup */}
          <Link 
            href="/registrati?mode=signup" 
            className="w-full sm:w-auto bg-slate-900 text-white px-12 py-5 rounded-full font-black uppercase text-[10px] tracking-[0.2em] hover:scale-105 transition-transform shadow-2xl shadow-slate-200"
          >
            Attiva Profilo
          </Link>
          
          <p className="text-[9px] uppercase tracking-widest text-slate-300 font-bold px-4">Oppure</p>
          
          <Link 
            href="/demo" 
            className="w-full sm:w-auto bg-white text-slate-900 border border-slate-200 px-12 py-5 rounded-full font-black uppercase text-[10px] tracking-[0.2em] hover:bg-slate-50 transition-all"
          >
            Guarda Demo
          </Link>
        </div>
      </header>

      {/* --- IL PROCESSO (3 STEP) --- */}
<section className="bg-white py-32 border-y border-slate-100 overflow-hidden">
  <div className="max-w-6xl mx-auto px-8">
    
    {/* Titolo Sezione */}
    <div className="mb-24">
      <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 mb-4 flex items-center gap-3">
        <span className="w-8 h-[1px] bg-slate-200"></span>
        Soulbook - 
      </h2>
      <p className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
        Tre passi per l'eternità.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-20">
      {[
        { 
          num: '01', 
          title: 'Ottieni la Key', 
          desc: 'Richiedi la tua card di attivazione fisica da un nostro partner autorizzato o direttamente a Soulbook.',
          // Icona Card / Key
          svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><rect x="3" y="5" width="18" height="14" rx="3"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="7" y1="15" x2="12" y2="15"/></svg>
        },
        { 
          num: '02', 
          title: 'Attiva il Profilo', 
          desc: 'Inserisci il codice unico per sbloccare il tuo spazio digitale e scegliere il tuo URL personalizzato.',
          // Icona Check/Shield
          svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"/><polyline points="9 12 11 14 15 10"/></svg>
        },
        { 
          num: '03', 
          title: 'Crea & Condividi', 
          desc: 'Personalizza la storia con foto e video. Ottieni il QR Code unico da apporre nel luogo del ricordo. Raccogli dediche e pensieri.',
          // Icona Share/QR
          svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M7 7h.01M17 7h.01M17 17h.01M7 17h.01"/></svg>
        }
      ].map((step, i) => (
        <div key={i} className="group relative">
          {/* Numero Sfondo Decorativo - Sfumato e minimale */}
          <div className="absolute -top-10 -left-4 text-8xl font-black text-slate-100 opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none italic">
            {step.num}
          </div>

          <div className="relative space-y-8">
            {/* Icona Tecnica */}
            <div className="w-14 h-14 bg-white border border-slate-200 text-slate-900 rounded-2xl flex items-center justify-center shadow-sm group-hover:border-slate-900 transition-all duration-300">
              {step.svg}
            </div>

            {/* Testo */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">
                  Passo {step.num}
                </span>
              </div>
              <h3 className="text-xl font-black uppercase italic tracking-tight text-slate-900">
                {step.title}
              </h3>
              <div className="w-6 h-[2px] bg-slate-900 group-hover:w-12 transition-all duration-500"></div>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                {step.desc}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* CTA Finale */}
    <div className="mt-24 pt-12 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-8">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 italic">
        La memoria è un tesoro che va custodito con cura.
      </p>
      <Link 
        href="/attiva" 
        className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-100"
      >
        Inizia ora &rarr;
      </Link>
    </div>
  </div>
</section>

  
    </div>
  );
}