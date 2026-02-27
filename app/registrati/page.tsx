'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true); // Stato per scambiare tra Login e Registrazione
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    if (isLogin) {
      // --- LOGICA DI LOGIN ---
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setErrorMsg("Email o password errati.");
      } else {
        router.push('/dashboard'); // Se loggato, vai alla dashboard
      }
    } else {
      // --- LOGICA DI REGISTRAZIONE ---
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });

      if (authError) {
        setErrorMsg(authError.message);
      } else if (authData.user) {
        // Creazione del profilo collegando owner_id
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{ 
            owner_id: authData.user.id, 
            full_name: fullName,
            slug: slug.toLowerCase().trim().replace(/\s+/g, '-'),
            bio: "Benvenuti nel mio spazio dei ricordi."
          }]);

        if (profileError) {
          setErrorMsg("Errore profilo: " + profileError.message);
        } else {
          router.push(`/${slug}`);
        }
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4">
      <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">
            {isLogin ? 'Bentornato' : 'Crea un account'}
          </h2>
          <p className="text-gray-500 mt-2">
            {isLogin ? 'Accedi per gestire i tuoi ricordi' : 'Inizia a raccogliere i tuoi messaggi'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nome Completo</label>
                <input 
                  type="text" placeholder="Es. Mario Rossi" required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-medium placeholder:text-gray-400"
                  value={fullName} onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nome del link (slug)</label>
                <input 
                  type="text" placeholder="es: il-mio-nome" required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-medium placeholder:text-gray-400"
                  value={slug} onChange={(e) => setSlug(e.target.value)}
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input 
              type="email" placeholder="tuo@email.it" required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-medium placeholder:text-gray-400"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input 
              type="password" placeholder="••••••••" required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-medium placeholder:text-gray-400"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <button 
            disabled={loading}
            className="w-full py-4 bg-gray-900 text-white rounded-lg font-bold hover:bg-black transition-all shadow-lg disabled:bg-gray-400 mt-4"
          >
            {loading ? 'Elaborazione...' : (isLogin ? 'Accedi' : 'Registrati ora')}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            {isLogin ? "Non hai un account? Registrati" : "Hai già un account? Accedi"}
          </button>
        </div>

      </div>
    </div>
  );
}