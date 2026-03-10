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
    // AGGIORNAMENTO SELECT: aggiunti partner_name, used_code e is_published (per il bug del tasto)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, owner_id, full_name, slug, user_email, is_published, is_admin, created_at, partner_name, used_code')
      .order('created_at', { ascending: false });

    if (!error) setProfiles(data || []);
    setLoading(false);
  }

  async function deleteUserComplete(profile: any) {
    const confirmDelete = confirm(`⚠️ AZIONE DEFINITIVA GDPR\n\nStai per eliminare definitivamente ${profile.full_name}.\n\nIl database cancellerà automaticamente:\n- Profilo\n- Messaggi\n- Link Gallery\n\nProcedere?`);
    
    if (!confirmDelete) return;

    try {
      setLoading(true);

      const buckets = ['gallery', 'videos', 'avatars', 'header_covers'];
      for (const bucket of buckets) {
        const { data: files } = await supabase.storage.from(bucket).list(profile.owner_id);
        if (files && files.length > 0) {
          const filesToRemove = files.map(x => `${profile.owner_id}/${x.name}`);
          await supabase.storage.from(bucket).remove(filesToRemove);
        }
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profile.id);

      if (profileError) throw profileError;

      setProfiles(prev => prev.filter(p => p.id !== profile.id));
      alert("Cancellazione completata.");

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
    // Il bug era qui: se currentStatus era undefined, l'update non funzionava bene
    const newStatus = !currentStatus;
    const { error } = await supabase
      .from('profiles')
      .update({ is_published: newStatus })
      .eq('id', id);

    if (!error) {
      setProfiles(prev => prev.map(p => p.id === id ? { ...p, is_published: newStatus } : p));
    } else {
      alert("Errore durante l'aggiornamento visibilità: " + error.message);
    }
  }

  const filteredProfiles = profiles.filter(p => 
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.partner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.used_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin || loading) return <div className="h-screen flex items-center justify-center text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Loading Console...</div>;

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 md:p-10 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2">
              <span className="w-2 h-2 bg-slate-900 rounded-full animate-pulse"></span>
              SoulBook / Control Panel
            </h1>
            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest ml-4">Moderazione Pagine Pubbliche</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-[10px] font-bold text-slate-400 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
              {filteredProfiles.length} <span className="opacity-40">/</span> {profiles.length} <span className="ml-1 opacity-60">PROFILI</span>
            </div>

            <a href="/super-admin" className="text-[10px] font-black uppercase tracking-widest text-slate-900 bg-white hover:bg-slate-50 px-5 py-2.5 rounded-xl border border-slate-200 shadow-sm transition-all flex items-center gap-2">
              💼 <span className="border-l border-slate-200 pl-2">Gestione Partner</span>
            </a>

            <button onClick={handleLogout} className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 px-5 py-2.5 rounded-xl border border-red-100 transition-all">
              Esci 
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input 
            type="text"
            placeholder="Cerca per nome, partner o codice attivazione..."
            className="w-full bg-white border-2 border-slate-200 px-6 py-5 rounded-2xl text-sm font-medium outline-none focus:border-slate-900 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Tabella Operativa */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-left">Profilo</th>
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-left">Partner / Key</th>
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-left">Attivazione</th>
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
                        {p.is_admin && <span className="bg-slate-900 text-white text-[7px] px-1.5 py-0.5 rounded font-black tracking-tighter">ADMIN</span>}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono italic">/{p.slug}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{p.user_email}</div>
                    </td>
                    
                    {/* Nuova Colonna: Partner e Codice */}
                    <td className="py-4 px-6">
                      <div className="text-xs font-bold text-slate-700">{p.partner_name || '—'}</div>
                      <div className="text-[9px] font-black uppercase text-blue-500 tracking-wider bg-blue-50 px-1.5 py-0.5 rounded inline-block mt-1">
                        {p.used_code || 'N/A'}
                      </div>
                    </td>

                    {/* Nuova Colonna: Data di Attivazione */}
                    <td className="py-4 px-6">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                        {p.created_at ? new Date(p.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </div>
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
                          <Link href={`/${p.slug}`} target="_blank" className="inline-block p-2 text-slate-400 hover:text-slate-900 transition-colors">👁️</Link>
                          <button onClick={() => deleteUserComplete(p)} className="p-2 text-slate-300 hover:text-red-600 transition-colors">🗑️</button>
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
          </div>
          
          {filteredProfiles.length === 0 && (
             <div className="p-20 text-center text-slate-300 italic text-sm">Nessun profilo trovato.</div>
          )}
        </div>
      </div>
    </div>
  );
}