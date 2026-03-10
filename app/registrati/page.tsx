'use client';

import { useState, useEffect, Suspense } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const mode = searchParams.get('mode');
  const [isLogin, setIsLogin] = useState(mode !== 'signup');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'signup') setIsLogin(false);
    if (mode === 'login') setIsLogin(true);
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (isLogin) {
        // 1. Eseguiamo il login
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error("Email o password errati.");
        
        if (data.session) {
          // 2. Registriamo la sessione nei cookie (lato client)
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });

          // 3. MODIFICA CRUCIALE PER SAFARI: Hard Redirect
          // Usiamo window.location invece di router.push per forzare il Proxy a leggere i nuovi cookie
          window.location.href = '/dashboard?verified=true';
        }
        
      } else {
        // --- LOGICA DI REGISTRAZIONE ---
        const { data: authData, error: authError } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { data: { full_name: fullName } }
        });

        if (authError) throw authError;

        if (authData.user) {
          // Aggiorniamo il profilo appena creato
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ 
              full_name: fullName,
              slug: slug.toLowerCase().trim().replace(/\s+/g, '-'),
              bio: "Benvenuti nel mio spazio dei ricordi.",
              updated_at: new Date().toISOString(),
            })
            .eq('owner_id', authData.user.id);

          if (profileError) throw profileError;
          
          // Anche qui, hard redirect dopo la registrazione
          window.location.href = '/dashboard?verified=true';
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Si è verificato un errore imprevisto.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="w-full px-8 py-6 max-w-7xl mx-auto flex justify-start">
        <Link 
          href="/" 
          className="text-xl font-black uppercase tracking-[0.3em] italic text-slate-800 hover:opacity-70 transition-opacity"
        >
          Soul<span className="opacity-30">Book</span>
        </Link>
      </header>

      <div className="flex-grow flex flex-col justify-center pb-20 px-4">
        <div className="max-w-md w-full mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 p-10">
          
          <div className="text-center mb-10">
            <div className="inline-block px-3 py-1 bg-slate-100 rounded-full mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">SoulBook</span>
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">
              {isLogin ? 'Bentornato' : 'Crea Account'}
            </h2>
            <p className="text-gray-400 mt-2 text-sm font-medium">
              {isLogin ? 'Gestisci il tuo SoulBook' : 'Inizia a custodire i tuoi ricordi'}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-100">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Nome Completo</label>
                  <input 
                    type="text" placeholder="Mario Rossi" required
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none text-gray-900 font-medium transition-all"
                    value={fullName} onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Slug (URL personalizzato)</label>
                  <input 
                    type="text" placeholder="es: alessandro-riva" required
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none text-gray-900 font-medium transition-all"
                    value={slug} onChange={(e) => setSlug(e.target.value)}
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Email</label>
              <input 
                type="email" placeholder="nome@esempio.it" required
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none text-gray-900 font-medium transition-all"
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Password</label>
              <input 
                type="password" placeholder="••••••••" required
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none text-gray-900 font-medium transition-all"
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <button 
              disabled={loading}
              className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-black transition-all shadow-lg shadow-slate-200 disabled:bg-gray-300 mt-6"
            >
              {loading ? 'Elaborazione...' : (isLogin ? 'Accedi' : 'Registrati')}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-gray-50 text-center">
            <button 
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
            >
              {isLogin ? "Nuovo utente? Registrati qui" : "Hai già un account? Accedi"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-stone-300 uppercase tracking-widest animate-pulse">SoulBook...</div>}>
      <AuthContent />
    </Suspense>
  );
}