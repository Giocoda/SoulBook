'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminPanel() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  async function checkAdminStatus() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/registrati?mode=login'); return; }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('owner_id', user.id)
      .single();

    if (!profile?.is_admin) {
      router.push('/dashboard');
    } else {
      setIsAdmin(true);
      fetchProfiles();
    }
  }

  async function fetchProfiles() {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, owner_id, full_name, slug, user_email, is_published, is_admin, created_at')
      .order('created_at', { ascending: false });

    if (!error) setProfiles(data || []);
    setLoading(false);
  }

  async function deleteUserComplete(profile: any) {
    const confirmDelete = confirm(`⚠️ AZIONE DEFINITIVA GDPR\n\nStai per eliminare definitivamente ${profile.full_name}.\n\nIl database cancellerà automaticamente:\n- Profilo\n- Messaggi\n- Link Gallery\n\nProcedere?`);
    
    if (!confirmDelete) return;

    try {
      setLoading(true);

      // 1. CANCELLAZIONE FILE FISICI (STORAGE)
      // Questo va fatto sempre via codice perché l'SQL non vede i file.
     const buckets = ['gallery', 'videos', 'avatars', 'header_covers'];
for (const bucket of buckets) {
  const { data: files } = await supabase.storage.from(bucket).list(profile.owner_id);
  if (files && files.length > 0) {
    const filesToRemove = files.map(x => `${profile.owner_id}/${x.name}`);
    await supabase.storage.from(bucket).remove(filesToRemove);
  }
}

      // 2. CANCELLAZIONE PROFILO (IL "DOMINO")
      // Grazie al CASCADE che abbiamo messo in SQL, cancellando questo rigo
      // spariranno istantaneamente anche messaggi e gallery_items nel DB.
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profile.id);

      if (profileError) throw profileError;

      // Aggiorniamo l'interfaccia eliminando il profilo dalla lista
      setProfiles(prev => prev.filter(p => p.id !== profile.id));
      alert("Cancellazione completata: Storage svuotato e Database pulito.");

    } catch (error: any) {
      console.error("Errore:", error);
      alert("Errore durante la cancellazione: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/registrati?mode=login');
  }

  async function toggleVisibility(id: string, currentStatus: boolean) {
    const { error } = await supabase
      .from('profiles')
      .update({ is_published: !currentStatus })
      .eq('id', id);

    if (!error) {
      setProfiles(prev => prev.map(p => p.id === id ? { ...p, is_published: !currentStatus } : p));
    }
  }

  const filteredProfiles = profiles.filter(p => 
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin || loading) return <div className="h-screen flex items-center justify-center text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Loading Console...</div>;

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 md:p-10 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">
        
        {/* Header con Conteggio Record */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 bg-slate-900 rounded-full"></span>
            SoulBook / Control Panel
          </h1>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-[10px] font-bold text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200">
              {filteredProfiles.length} di {profiles.length} profili
            </div>
            <button 
              onClick={handleLogout}
              className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl border border-red-100 transition-all"
            >
              Esci 
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative group">
            <input 
              type="text"
              placeholder="Cerca per nome, email o slug..."
              className="w-full bg-white border-2 border-slate-200 px-6 py-5 rounded-2xl text-sm font-medium outline-none focus:border-slate-900 transition-all shadow-sm group-hover:border-slate-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tabella Operativa */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-left">Profilo</th>
                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500 hidden md:table-cell text-left">Contatto</th>
                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Stato</th>
                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProfiles.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-slate-900 text-sm tracking-tight">{p.full_name}</div>
                      {p.is_admin && (
                        <span className="bg-slate-900 text-white text-[7px] px-1.5 py-0.5 rounded font-black tracking-tighter">ADMIN</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono italic">/{p.slug}</div>
                  </td>
                  <td className="py-4 px-6 hidden md:table-cell">
                    <div className="text-xs text-slate-600">{p.user_email || '—'}</div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter border ${
                      p.is_published ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {p.is_published ? 'LIVE' : 'OFFLINE'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    {!p.is_admin && (
                      <>
                        <Link 
                          href={`/${p.slug}`} 
                          target="_blank"
                          className="inline-block p-2 text-slate-400 hover:text-slate-900 transition-colors"
                        >
                          👁️
                        </Link>
                        {/* Tasto GDPR Cestino */}
                        <button 
                          onClick={() => deleteUserComplete(p)}
                          className="p-2 text-slate-300 hover:text-red-600 transition-colors"
                          title="Elimina definitivamente (GDPR)"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                    <button 
                      onClick={() => toggleVisibility(p.id, p.is_published)}
                      disabled={p.is_admin}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${
                        p.is_admin 
                          ? 'opacity-20 cursor-not-allowed border-slate-100'
                          : p.is_published 
                            ? 'bg-white text-red-500 border-red-100 hover:bg-red-500 hover:text-white' 
                            : 'bg-slate-900 text-white border-slate-900 hover:bg-slate-700'
                      }`}
                    >
                      {p.is_admin ? 'ADMIN' : p.is_published ? 'Sospendi' : 'Attiva'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredProfiles.length === 0 && (
             <div className="p-20 text-center text-slate-300 italic text-sm">
               Nessun profilo trovato.
             </div>
          )}
        </div>
      </div>
    </div>
  );
}