'use client';

import { useState, useEffect, Suspense } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const isLoginFromUrl = searchParams.get('mode') === 'login';
  
  const [mode, setMode] = useState<'login' | 'signup'>(isLoginFromUrl ? 'login' : 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeCode, setActiveCode] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'signup') {
      const savedCode = localStorage.getItem('soulbook_activation_code');
      if (savedCode) {
        setActiveCode(savedCode);
      } else {
        router.push('/attiva');
      }
    }
  }, [mode, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (mode === 'signup') {
        // --- 1. REGISTRAZIONE AUTH ---
        const { data: authData, error: authError } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { data: { full_name: fullName } }
        });

        if (authError) throw authError;
        if (!authData.user || !authData.session) {
          setErrorMsg("Controlla la mail per confermare l'account.");
          setLoading(false);
          return;
        }

        await supabase.auth.setSession(authData.session);

        let agencyIdToLink = null;
        let partnerNameToLink = null;
        const cleanCode = activeCode?.toUpperCase().trim();

        if (cleanCode) {
          const { data: codeData } = await supabase
            .from('activation_codes')
            .select('agency_id, agencies(name)')
            .eq('code', cleanCode)
            .single();
          
          if (codeData) {
            agencyIdToLink = codeData.agency_id;
            partnerNameToLink = (codeData.agencies as any)?.name || 'Partner';

            await supabase
              .from('activation_codes')
              .update({ 
                is_used: true, 
                activated_at: new Date().toISOString(), 
                profile_id: authData.user.id 
              })
              .eq('code', cleanCode);
          }
        }

        const finalSlug = slug ? slug.toLowerCase().trim().replace(/\s+/g, '-') : authData.user.id;
        
        // --- 2. CREAZIONE PROFILO ---
        const { error: insertError } = await supabase.from('profiles').insert({
          owner_id: authData.user.id,
          full_name: fullName,
          slug: finalSlug,
          agency_id: agencyIdToLink,
          partner_name: partnerNameToLink,
          used_code: cleanCode,
          updated_at: new Date().toISOString(),
        });

        if (insertError) {
          await supabase.from('profiles').update({
            full_name: fullName,
            slug: finalSlug,
            agency_id: agencyIdToLink,
            partner_name: partnerNameToLink,
            used_code: cleanCode
          }).eq('owner_id', authData.user.id);
        }

        // --- 3. INVIO EMAIL DI BENVENUTO (NUOVO) ---
        try {
          await fetch('/api/welcome-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: email,
              fullName: fullName,
              slug: finalSlug
            })
          });
          console.log("Email di benvenuto inviata correttamente");
        } catch (emailErr) {
          console.error("Errore non bloccante nell'invio email:", emailErr);
          // Non fermiamo l'utente se l'email fallisce, il profilo è comunque creato
        }
        
        localStorage.removeItem('soulbook_activation_code');
        window.location.href = '/dashboard?verified=true';

      } else {
        // --- 4. LOGIN ---
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (loginError) throw loginError;
        router.push('/dashboard');
      }

    } catch (err: any) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900">
      <header className="w-full px-8 py-8 max-w-7xl mx-auto flex justify-center">
        <Link href="/" className="text-2xl font-black uppercase tracking-tighter italic text-slate-900">
          Soul<span className="text-slate-300">Book</span>
        </Link>
      </header>
      <div className="flex-grow flex flex-col justify-center pb-20 px-4">
        <div className="max-w-md w-full mx-auto">
          <div className="text-center mb-10">
            {mode === 'signup' && activeCode && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full mb-6 shadow-xl shadow-slate-200">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-black uppercase tracking-widest italic">Key Attiva: {activeCode}</span>
              </div>
            )}
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
              {mode === 'signup' ? 'Crea Account' : 'Accedi'}
            </h2>
          </div>

          {errorMsg && <div className="mb-6 p-4 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-red-100">{errorMsg}</div>}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <input type="text" placeholder="Nome e Cognome" required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-slate-900 outline-none font-bold text-slate-900" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                <input type="text" placeholder="Slug URL (mario-rossi)" required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-slate-900 outline-none font-bold text-slate-900" value={slug} onChange={(e) => setSlug(e.target.value)} />
              </>
            )}
            <input type="email" placeholder="Email" required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-slate-900 outline-none font-bold text-slate-900" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-slate-900 outline-none font-bold text-slate-900" value={password} onChange={(e) => setPassword(e.target.value)} />
            
            <button disabled={loading} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] hover:bg-slate-800 transition-all shadow-xl shadow-slate-100 disabled:bg-slate-100 mt-6">
              {loading ? 'Elaborazione...' : mode === 'signup' ? 'Registrati e Attiva' : 'Entra nella Dashboard'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={() => {
                setMode(mode === 'signup' ? 'login' : 'signup');
                setErrorMsg(null);
              }}
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all"
            >
              {mode === 'signup' ? 'Hai già un account? Accedi' : 'Nuovo utente? Registrati'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-black text-slate-200 uppercase tracking-[0.5em] animate-pulse italic">SoulBook</div>}>
      <AuthContent />
    </Suspense>
  );
}