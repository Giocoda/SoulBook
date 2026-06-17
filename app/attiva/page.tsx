'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import ContactForm from '@/components/contactForm';

export default function AttivaCodice() {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<{ type: 'idle' | 'error' | 'success', msg: string }>({ type: 'idle', msg: '' });
  const [loading, setLoading] = useState(false);
  
  // STATO PER IL POP-UP CONTATTI
  const [showContact, setShowContact] = useState(false);

  const handleVerify = async () => {
    if (!code) return;
    setLoading(true);
    setStatus({ type: 'idle', msg: '' });

    try {
      const { data: codeData, error: codeError } = await supabase
        .from('activation_codes')
        .select('code, is_used, agency_id, is_banned')
        .eq('code', code.toUpperCase().trim())
        .single();

      if (codeError || !codeData) {
        setStatus({ type: 'error', msg: 'Codice non trovato o errato.' });
        setLoading(false);
        return;
      }

      if (codeData.is_banned === true || String(codeData.is_banned) === 'true') {
        setStatus({ type: 'error', msg: 'QUESTA KEY È STATA DISATTIVATA DEFINITIVAMENTE. CONTATTA ASSISTENZA' });
        setLoading(false);
        return;
      }

      if (codeData.is_used) {
        setStatus({ type: 'error', msg: 'Questo codice è già stato attivato.' });
        setLoading(false);
        return;
      }

      let agencyName = 'Partner Autorizzato';
      if (codeData.agency_id) {
        const { data: agencyData } = await supabase
          .from('agencies')
          .select('name')
          .eq('id', codeData.agency_id)
          .single();
        
        if (agencyData) agencyName = agencyData.name;
      }

      localStorage.setItem('soulbook_activation_code', code.toUpperCase().trim());
      
      setStatus({ 
        type: 'success', 
        msg: `Codice Valido! Rilasciato da: ${agencyName}.` 
      });

      setTimeout(() => {
        window.location.replace('/registrati?mode=signup');
      }, 1000);

    } catch (err) {
      console.error("Errore:", err);
      setStatus({ type: 'error', msg: 'Errore tecnico di sistema.' });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900 relative">
      
      {/* Header con Logo */}
      <header className="w-full px-8 py-8 max-w-7xl mx-auto flex justify-start">
        <Link href="/" className="text-2xl font-black uppercase tracking-tighter italic text-slate-900">
          Soul<span className="text-slate-300">Book</span>
        </Link>
      </header>

      <div className="flex-grow flex flex-col items-center justify-center px-4 pb-20">
        <div className="w-full max-w-md">
          
          <div className="text-center mb-10">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
              Attiva Profilo
            </h2>
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400 mt-4">
              Inserisci il codice della card
            </p>
          </div>

          {/* Card Simulata */}
          <div className="bg-slate-100 border border-slate-200 p-8 md:p-10 rounded-[40px] shadow-sm">
            <p className="text-[11px] font-black mb-6 text-slate-500 uppercase tracking-widest italic text-center">
              Codice di Verifica
            </p>
            
            <input 
              type="text" 
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={status.type === 'success' || loading}
              placeholder="SB-XXXX-XXXX"
              className="w-full p-6 bg-white border-2 border-slate-200 rounded-3xl text-center font-mono text-2xl font-bold tracking-[0.2em] outline-none focus:border-slate-900 transition-all uppercase placeholder:text-slate-200 text-slate-900 shadow-inner"
            />

            {status.msg && (
              <div className={`mt-6 p-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest leading-relaxed text-center ${
                status.type === 'error' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {status.msg}
              </div>
            )}

            <button 
              onClick={handleVerify}
              disabled={loading || status.type === 'success' || !code}
              className="w-full mt-8 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] hover:bg-blue-600 disabled:bg-slate-300 transition-all active:scale-95 shadow-xl shadow-slate-200"
            >
              {loading ? 'Verificando...' : status.type === 'success' ? 'Reindirizzamento...' : 'Attiva SoulBook'}
            </button>
          </div>

          {/* Sezione Informativa */}
          <div className="mt-12 text-center px-6">
            <div className="w-12 h-[1px] bg-slate-300 mx-auto mb-8"></div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-3">
              Non hai ancora la tua card?
            </h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Vuoi attivare un profilo SoulBook? <br />
              <span className="text-slate-700 font-bold">Contattaci per richiedere il tuo codice di attivazione.</span> 
            </p>
            
            {/* IL BOTTONE CHE APRE IL POP-UP (Niente Link href) */}
           <button 
  onClick={() => setShowContact(true)}
  className="inline-block mt-8 px-8 py-4 border-2 border-slate-900 bg-slate-900 rounded-full text-[11px] font-black uppercase tracking-[0.2em] text-white hover:bg-white hover:text-slate-900 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-none"
>
  Richiedi Informazioni &rarr;
</button>
          </div>

        </div>
      </div>

      {/* OVERLAY CONTATTO (Z-index alto) */}
      {showContact && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          {/* Sfondo con Blur */}
          <div 
            className="absolute inset-0 bg-[#0F172A]/80 backdrop-blur-md animate-in fade-in duration-300" 
            onClick={() => setShowContact(false)}
          />
          
          {/* Box Form */}
          <div className="relative w-full max-w-[480px] z-10 animate-in slide-in-from-bottom-10 duration-500">
            {/* Tasto Chiudi */}
            <button 
              onClick={() => setShowContact(false)}
              className="absolute -top-12 right-0 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:text-blue-400 transition-colors"
            >
              Chiudi [X]
            </button>
            
            <ContactForm source="Pagina_Attiva" />
          </div>
        </div>
      )}
    </div>
  );
}