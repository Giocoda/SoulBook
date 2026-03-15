'use client';

import { useState } from 'react';
import Link from 'next/link';
import ContactForm from './contactForm'; 

export default function Footer() {
  const [showContact, setShowContact] = useState(false);

  return (
    <footer className="w-full bg-white py-20 px-8 border-t border-slate-50 mt-auto">
      <div className="max-w-7xl mx-auto text-center space-y-12">
        
        {/* Slogan e Trigger Pop-up */}
        <div className="flex flex-col items-center gap-4">
          <div className="text-sm font-serif italic text-slate-400">
            SoulBook &mdash; Custodisci la tua storia.
          </div>
          
          <button 
            onClick={() => setShowContact(true)}
            className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-900 hover:text-blue-600 transition-all border-b border-slate-200 hover:border-blue-600 pb-1 italic cursor-pointer bg-transparent"
          >
            Clicca qui per contattarci
          </button>
        </div>
        
        {/* Crediti Legali */}
        <div className="space-y-4">
          <div className="flex flex-col gap-2 text-center items-center">
            <div className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-300 leading-relaxed">
              &copy; {new Date().getFullYear()} SOULBOOK DIGITAL SERVICES — PROPRIETÀ DI GIOVANNI CODA MER
            </div>
            <div className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 leading-relaxed uppercase max-w-md">
              Via Bachelet, 2 - Roncolo - Quattro Castella (RE) - 42020 | P.IVA 02888590359
            </div>
          </div>
          
          <div className="flex justify-center gap-8 text-[8px] font-black uppercase tracking-[0.5em] text-slate-300">
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">
              PRIVACY & COOKIE POLICY
            </Link>
          </div>
        </div>
      </div>

      {/* POP-UP CON CHIUSURA ESTERNA E "X" INTERNA */}
      {showContact && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
          onClick={() => setShowContact(false)} // CHIUDE CLICCANDO FUORI
        >
          {/* stopPropagation impedisce che il click sul form chiuda la modale per errore */}
          <div 
            className="relative w-full max-w-xl shadow-2xl animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()} 
          >
            
            {/* LA "X" DI CHIUSURA INTERNA AL COMPONENTE */}
            <button 
              onClick={() => setShowContact(false)}
              className="absolute top-4 right-4 text-slate-300 hover:text-slate-900 z-[100] transition-colors"
              title="Chiudi"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            {/* Il tuo componente reale */}
            <ContactForm 
              source="Footer Popup" 
              onSuccess={() => setShowContact(false)} 
            />
            
          </div>
        </div>
      )}
    </footer>
  );
}