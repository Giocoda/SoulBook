'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface ContactFormProps {
  source?: string; // Home, PopUp, Pagina Attiva
  onSuccess?: () => void; // Funzione per chiudere il pop-up dalla pagina padre
}

export default function ContactForm({ source = 'Sito Web', onSuccess }: ContactFormProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privacyAccepted) return;

    setStatus('loading');

    try {
      // 1. Salvataggio su DB (Logica Supabase)
      const { error: dbError } = await supabase.from('contact_requests').insert([
        { name: formData.name, email: formData.email, message: formData.message, source: source }
      ]);
      if (dbError) console.warn("Errore salvataggio DB, ma procedo con invio mail...");

      // 2. Invio Mail (Logica API Route)
      const res = await fetch('/api/send-contact-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, source }),
      });

      if (!res.ok) throw new Error('Errore invio mail');

      // --- SUCCESSO ---
      setStatus('success');
      setFormData({ name: '', email: '', message: '' });
      setPrivacyAccepted(false);

      // Se è presente la funzione onSuccess, la eseguiamo dopo 2.5 secondi
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2500);
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  // Se l'invio è avvenuto con successo, mostriamo un messaggio dedicato
  if (status === 'success') {
    return (
      <div className="bg-white p-12 rounded-[30px] border border-[#E2E8F0] shadow-2xl text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
          ✓
        </div>
        <h2 className="text-3xl font-black tracking-tighter text-[#0F172A] uppercase italic">Richiesta Inviata</h2>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-4 leading-relaxed">
          Grazie per averci contattato.<br />Ti risponderemo al più presto.
        </p>
        <div className="mt-8 flex justify-center">
           <div className="w-8 h-[2px] bg-blue-600 animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 md:p-12 rounded-[30px] border border-[#E2E8F0] shadow-2xl shadow-[#0F172A]/5">
      {/* Header Form */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">Contact Support</h3>
        </div>
        <h2 className="text-3xl font-black tracking-tighter text-[#0F172A] uppercase italic">Richiedi Informazioni</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nome */}
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Nome e Cognome</label>
          <input 
            type="text" 
            required
            placeholder="Mario Rossi"
            className="w-full p-4 bg-[#F8FAFC] border border-transparent focus:border-blue-500/20 rounded-2xl text-sm font-bold outline-none transition-all placeholder:text-slate-300 text-slate-900"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Email di contatto</label>
          <input 
            type="email" 
            required
            placeholder="mario@soulbook.it"
            className="w-full p-4 bg-[#F8FAFC] border border-transparent focus:border-blue-500/20 rounded-2xl text-sm font-bold outline-none transition-all placeholder:text-slate-300 text-slate-900"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
        </div>

        {/* Messaggio */}
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Messaggio</label>
          <textarea 
            required
            placeholder="Come possiamo aiutarti?"
            className="w-full p-4 bg-[#F8FAFC] border border-transparent focus:border-blue-500/20 rounded-2xl text-sm font-medium outline-none transition-all h-32 resize-none placeholder:text-slate-300 text-slate-900"
            value={formData.message}
            onChange={(e) => setFormData({...formData, message: e.target.value})}
          />
        </div>

        {/* Privacy Spunta */}
        <div className="flex items-start gap-4 px-2 py-2">
          <div className="flex items-center h-5">
            <input
              id="privacy"
              type="checkbox"
              required
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer transition-all"
            />
          </div>
          <label htmlFor="privacy" className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 leading-relaxed cursor-pointer select-none">
            Ho letto e accetto la <a href="/privacy-policy" target="_blank" className="text-blue-600 underline underline-offset-4 hover:text-[#0F172A]">Privacy Policy</a> e acconsento al trattamento dei miei dati.
          </label>
        </div>

        {/* Errore */}
        {status === 'error' && (
          <p className="text-[9px] font-black uppercase text-red-500 text-center animate-bounce italic">Si è verificato un errore. Riprova più tardi.</p>
        )}

        {/* Submit Button */}
        <button 
          disabled={status === 'loading' || !privacyAccepted}
          className={`w-full py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] transition-all shadow-xl ${
            privacyAccepted && status !== 'loading'
            ? 'bg-[#0F172A] text-white hover:bg-blue-600 hover:shadow-blue-500/30 active:scale-[0.98]' 
            : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          {status === 'loading' ? 'Verifica in corso...' : 'Invia Messaggio'}
        </button>
      </form>
    </div>
  );
}