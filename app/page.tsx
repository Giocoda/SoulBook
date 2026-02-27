'use client';

import Link from 'next/link';
import { useRef } from 'react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans selection:bg-slate-200">
      
      {/* --- NAV BAR --- */}
      <nav className="flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
        <div className="text-xl font-black uppercase tracking-[0.3em] italic text-slate-800">
          Soul<span className="opacity-30">Book</span>
        </div>
        <Link 
          href="/login" 
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
          <Link 
            href="/registrati" 
            className="w-full sm:w-auto bg-slate-900 text-white px-12 py-5 rounded-full font-black uppercase text-[10px] tracking-[0.2em] hover:scale-105 transition-transform shadow-2xl"
          >
            Crea Profilo
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
      <section className="bg-white py-32 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {[
              { t: '01', title: 'Crea', desc: 'Scegli un URL personalizzato e inserisci le informazioni base.' },
              { t: '02', title: 'Personalizza', desc: 'Carica foto, video e scegli i colori che meglio raccontano la sua anima.' },
              { t: '03', title: 'Condividi', desc: 'Ricevi un QR Code unico da apporre in luoghi fisici o condividere privatamente.' }
            ].map((step, i) => (
              <div key={i} className="space-y-4">
                <span className="text-4xl font-serif italic text-slate-200">{step.t}</span>
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-900">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-light">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- MINI DEMO VISIVA --- */}
      <section className="py-32 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-2">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Experience</h2>
            <p className="text-3xl font-serif italic">L'estetica del ricordo</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Immagine Stock Galleria */}
            <div className="relative p-4 bg-white shadow-2xl rotate-[-2deg] border border-slate-100 group hover:rotate-0 transition-transform duration-500">
              <img 
                src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1000&auto=format&fit=crop" 
                alt="Demo Galleria" 
                className="w-full h-80 object-cover grayscale group-hover:grayscale-0 transition-all"
              />
              <div className="mt-4 flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-400">
                <span>Album Ricordi</span>
                <span>2026</span>
              </div>
            </div>

            {/* Preview Messaggi */}
            <div className="space-y-6 md:pl-12">
              {[
                { author: "Elena", text: "Un'anima gentile che ha lasciato il segno in ognuno di noi." },
                { author: "Marco", text: "Grazie per ogni momento passato insieme. Non ti dimenticheremo." }
              ].map((msg, i) => (
                <div key={i} className="p-6 border-l-2 border-slate-100 bg-white/50 backdrop-blur-sm space-y-2">
                  <p className="italic text-slate-600 font-light">"{msg.text}"</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">— {msg.author}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-20 border-t border-slate-100 text-center space-y-8">
        <div className="text-sm font-serif italic text-slate-400">SoulBook &mdash; Forever in our hearts.</div>
        <div className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-300">
          &copy; 2026 SoulBook Digital Services
        </div>
      </footer>
    </div>
  );
}