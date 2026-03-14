'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminPanel() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMsg, setSearchMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
const [filterMonth, setFilterMonth] = useState('');
const [filterYear, setFilterYear] = useState('');

  // Paginazione Profili
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

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
      fetchMessages();
    }
  }

  async function fetchProfiles() {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, owner_id, full_name, slug, user_email, is_published, is_admin, is_partner, created_at, partner_name, used_code')
      .order('created_at', { ascending: false });

    if (!error) {
      // FIX AUTOMATICO PARTNER (TUA LOGICA)
      const partnersToFix = data?.filter(p => p.is_partner && p.is_published) || [];
      for (const p of partnersToFix) {
        await supabase.from('profiles').update({ is_published: false }).eq('id', p.id);
        p.is_published = false; 
      }
      setProfiles(data || []);
    }
    setLoading(false);
  }

  async function fetchMessages() {
    const { data, error } = await supabase
      .from('contact_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setMessages(data || []);
  }

  async function toggleMessageHandled(id: string, currentStatus: boolean) {
    const { error } = await supabase
      .from('contact_requests')
      .update({ is_handled: !currentStatus })
      .eq('id', id);
    if (!error) {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, is_handled: !currentStatus } : m));
    }
  }

  async function deleteUserComplete(profile: any) {
    const confirmDelete = confirm(`⚠️ AZIONE DEFINITIVA GDPR\n\nStai per eliminare definitivamente ${profile.full_name}.\n\nProcedere?`);
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
      const { error: profileError } = await supabase.from('profiles').delete().eq('id', profile.id);
      if (profileError) throw profileError;
      setProfiles(prev => prev.filter(p => p.id !== profile.id));
    } catch (error: any) {
      alert("Errore: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleVisibility(id: string, currentStatus: boolean) {
    const { error } = await supabase.from('profiles').update({ is_published: !currentStatus }).eq('id', id);
    if (!error) setProfiles(prev => prev.map(p => p.id === id ? { ...p, is_published: !currentStatus } : p));
  }

  // Filtri
  const filteredProfiles = profiles.filter(p => 
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage);
  const paginatedProfiles = filteredProfiles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const filteredMessages = messages.filter(m => 
    m.name?.toLowerCase().includes(searchMsg.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchMsg.toLowerCase())
  );

  if (!isAdmin || loading) return <div className="h-screen flex items-center justify-center text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 italic">Loading Console...</div>;

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 md:p-10 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2">
              <span className="w-2 h-2 bg-slate-900 rounded-full animate-pulse"></span>
              SoulBook / Control Panel
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <a href="/super-admin" className="text-[10px] font-black uppercase tracking-widest text-slate-900 bg-white px-5 py-2.5 rounded-xl border border-slate-200 shadow-sm transition-all flex items-center gap-2 italic">
              💼 Gestione Partner
            </a>
            <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 px-5 py-2.5 rounded-xl border border-red-100 transition-all italic">Esci</button>
          </div>
        </div>

        {/* TABELLA PROFILI */}
        <div className="space-y-4">
          <input 
            type="text"
            placeholder="Cerca per nome, email o slug..."
            className="w-full bg-white border-2 border-slate-200 px-6 py-4 rounded-2xl text-sm font-medium outline-none focus:border-slate-900 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
          />

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-left">Profilo</th>
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-left">Partner / Key</th>
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Stato</th>
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedProfiles.map((p) => {
                  const isRestricted = p.is_admin || p.is_partner;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="font-bold text-slate-900 text-sm">{p.full_name}</div>
                          {p.is_admin && <span className="bg-slate-900 text-white text-[7px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">Admin</span>}
                          {p.is_partner && <span className="bg-blue-600 text-white text-[7px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">Partner</span>}
                        </div>
                        {!isRestricted ? (
                          <div className="text-[10px] text-slate-400 font-mono italic">/{p.slug}</div>
                        ) : (
                          <div className="text-[9px] text-red-400 font-black uppercase tracking-widest mt-1">Account Riservato</div>
                        )}
                        <div className="text-[10px] text-slate-400">{p.user_email}</div>
                      </td>

                      <td className="py-4 px-6">
                        {!isRestricted ? (
                          <>
                            <div className="text-xs font-bold text-slate-700">{p.partner_name || '—'}</div>
                            <div className="text-[9px] font-black uppercase text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded inline-block mt-1 italic">
                              {p.used_code || 'N/A'}
                            </div>
                          </>
                        ) : <span className="text-slate-300">—</span>}
                      </td>

                      <td className="py-4 px-6 text-center">
                        <span className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter border ${p.is_published ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                          {p.is_published ? 'LIVE' : 'OFFLINE'}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right space-x-2">
                        {!isRestricted && (
                          <>
                            <Link href={`/${p.slug}`} target="_blank" className="inline-block p-2 text-slate-400 hover:text-slate-900">👁️</Link>
                            <button onClick={() => deleteUserComplete(p)} className="p-2 text-slate-300 hover:text-red-600">🗑️</button>
                          </>
                        )}
                        <button 
                          onClick={() => toggleVisibility(p.id, p.is_published)}
                          disabled={isRestricted}
                          className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
                            isRestricted ? 'opacity-20 cursor-not-allowed' : 'hover:bg-slate-900 hover:text-white border-slate-200'
                          }`}
                        >
                          {p.is_admin ? 'ADMIN' : p.is_partner ? 'PARTNER' : p.is_published ? 'Sospendi' : 'Attiva'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* Paginazione */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center px-6">
               <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Pagina {currentPage} di {totalPages || 1}</span>
               <div className="flex gap-2">
                  <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black disabled:opacity-30 italic">Indietro</button>
                  <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black disabled:opacity-30 italic">Avanti</button>
               </div>
            </div>
          </div>
        </div>

        <hr className="border-slate-200 my-10" />

      {/* TABELLA MESSAGGI / FAQ */}
        <div className="space-y-6 pb-20">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">Messaggi Ricevuti</h2>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Archivio richieste assistenza e FAQ</p>
            </div>
            <div className="text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-100 uppercase tracking-widest">
              {filteredMessages.length} Risultati
            </div>
          </div>
          
          {/* BARRA FILTRI MESSAGGI */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input 
              type="text"
              placeholder="Cerca nome, email o contenuto..."
              className="md:col-span-2 bg-white border-2 border-slate-200 px-6 py-4 rounded-2xl text-sm font-medium outline-none focus:border-slate-900 shadow-sm transition-all"
              value={searchMsg}
              onChange={(e) => setSearchMsg(e.target.value)}
            />
            
            <select 
              className="bg-white border-2 border-slate-200 px-4 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest outline-none focus:border-slate-900 cursor-pointer"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
            >
              <option value="">Tutti i Mesi</option>
              {["01","02","03","04","05","06","07","08","09","10","11","12"].map(m => (
                <option key={m} value={m}>{new Date(2024, parseInt(m)-1).toLocaleString('it-IT', {month: 'long'})}</option>
              ))}
            </select>

            <select 
              className="bg-white border-2 border-slate-200 px-4 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest outline-none focus:border-slate-900 cursor-pointer"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
            >
              <option value="">Tutti gli Anni</option>
              {[2024, 2025, 2026].map(y => (
                <option key={y} value={y.toString()}>{y}</option>
              ))}
            </select>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-900 text-white/50 text-[10px] font-black uppercase tracking-widest">
                  <th className="py-4 px-6">Data</th>
                  <th className="py-4 px-6">Utente</th>
                  <th className="py-4 px-6">Messaggio</th>
                  <th className="py-4 px-6 text-center">Stato / Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {messages
                  .filter(m => {
                    const date = new Date(m.created_at);
                    const matchSearch = m.name?.toLowerCase().includes(searchMsg.toLowerCase()) || 
                                      m.email?.toLowerCase().includes(searchMsg.toLowerCase()) ||
                                      m.message?.toLowerCase().includes(searchMsg.toLowerCase());
                    const matchMonth = filterMonth === '' || (date.getMonth() + 1).toString().padStart(2, '0') === filterMonth;
                    const matchYear = filterYear === '' || date.getFullYear().toString() === filterYear;
                    return matchSearch && matchMonth && matchYear;
                  })
                  .map((m) => {
                    const dateObj = new Date(m.created_at);
                    const dateStr = dateObj.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    const timeStr = dateObj.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

                    return (
                      <tr key={m.id} className={`${m.is_handled ? 'bg-slate-50/50 opacity-80' : 'bg-white font-medium'} hover:bg-slate-50 transition-colors`}>
                        <td className="py-4 px-6">
                          <div className="text-[10px] font-black text-slate-900 whitespace-nowrap">{dateStr}</div>
                          <div className="text-[9px] text-slate-400 font-bold">{timeStr}</div>
                        </td>

                        <td className="py-4 px-6">
                          <div className="font-bold text-sm text-slate-900">{m.name}</div>
                          <div className="text-[10px] text-blue-600 font-bold italic underline decoration-blue-100 underline-offset-2">{m.email}</div>
                          <div className="text-[8px] font-black uppercase bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded mt-2 inline-block italic">Ref: {m.source}</div>
                        </td>

                        <td className="py-4 px-6">
                          <p className="text-xs text-slate-600 leading-relaxed italic line-clamp-2 hover:line-clamp-none transition-all duration-300">
                            "{m.message}"
                          </p>
                        </td>

                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-3">
                            <button 
                              onClick={() => toggleMessageHandled(m.id, m.is_handled)}
                              className={`text-[8px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-xl border transition-all duration-300 ${
                                m.is_handled 
                                  ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                                  : 'bg-red-50 text-red-600 border-red-200 animate-pulse hover:bg-red-600 hover:text-white'
                              }`}
                            >
                              {m.is_handled ? 'Gestito ✓' : 'Da Gestire'}
                            </button>
                            
                            {/* TASTO ELIMINA MESSAGGIO */}
                            <button 
                              onClick={async () => {
                                if(confirm('Eliminare questo messaggio permanentemente?')) {
                                  const { error } = await supabase.from('contact_requests').delete().eq('id', m.id);
                                  if(!error) setMessages(prev => prev.filter(x => x.id !== m.id));
                                }
                              }}
                              className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                              title="Elimina messaggio"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                })}
              </tbody>
            </table>
            {filteredMessages.length === 0 && (
              <div className="p-20 text-center text-slate-300 italic text-sm font-bold uppercase tracking-widest">
                Nessun messaggio trovato
              </div>
            )}
          </div>
        </div>     </div>
    </div>
  );
}