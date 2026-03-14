'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:max-w-md z-[100] animate-in slide-in-from-bottom-10 duration-700">
      <div className="bg-white border border-stone-100 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-3xl p-6 md:p-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-lg">🍪</span>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-800">Informativa Cookie</h4>
          </div>
          
          <p className="text-xs text-stone-500 leading-relaxed font-medium">
            Utilizziamo solo <strong>cookie tecnici</strong> necessari per il funzionamento del sito e per garantirti l'accesso alla tua area riservata. Nessun dato viene usato per profilazione.
          </p>

          <div className="flex flex-col gap-3 pt-2">
            <button 
              onClick={acceptCookies}
              className="w-full bg-stone-900 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
            >
              Ho capito
            </button>
            <Link 
              href="/privacy" 
              className="text-center text-[9px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-600 transition-colors"
            >
              Leggi la Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}