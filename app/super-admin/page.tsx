'use client'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { toPng } from 'html-to-image'
import { QRCodeSVG } from 'qrcode.react'
import { Fragment } from 'react'

// --- INTERFACCE ---
interface ActivationCode {
  code: string;
  is_used: boolean;
  batch_name: string;
  user_name?: string; 
}

interface Order {
  id: string;
  amount: number;
  batch_name: string;
  created_at: string;
}

interface Agency {
  id: string;
  name: string;
  email: string;
  type: string;
  notes?: string;
  is_active: boolean;
  is_banned: boolean;
  package_price: number;      
  last_batch_date: string;    
  activation_codes: ActivationCode[];
  orders: Order[]; 
}

export default function SuperAdmin() {
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [expandedAgencyId, setExpandedAgencyId] = useState<string | null>(null)
  const [printingCode, setPrintingCode] = useState<{code: string, agency: string} | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [searchTerm, setSearchTerm] = useState('') 
  const [filterMonth, setFilterMonth] = useState('') 
  
  const cardRef = useRef<HTMLDivElement>(null)

  const [agencyName, setAgencyName] = useState('')
  const [agencyEmail, setAgencyEmail] = useState('')
  const [agencyType, setAgencyType] = useState('')
  const [agencyNotes, setAgencyNotes] = useState('')
  const [batchName, setBatchName] = useState('Standard Pack')
  const [packagePrice, setPackagePrice] = useState('0') 

  const fetchAgencies = useCallback(async () => {
    const { data: agData, error: agError } = await supabase
      .from('agencies')
      .select('*, activation_codes(code, is_used, batch_name), orders(*)')
      .order('created_at', { ascending: false });

    if (agError) return console.error(agError);

    const { data: profData } = await supabase
      .from('profiles')
      .select('full_name, used_code')
      .not('used_code', 'is', null);

    const enriched = agData.map((agency: any) => ({
      ...agency,
      activation_codes: (agency.activation_codes || []).map((c: any) => ({
        ...c,
        user_name: profData?.find(p => p.used_code === c.code)?.full_name
      }))
    }));

    setAgencies(enriched);
  }, []);

  useEffect(() => { fetchAgencies().finally(() => setLoading(false)); }, [fetchAgencies]);

  // --- LOGICA ACCOUNTING ---
  const stats = useMemo(() => {
    const allEntries = agencies.flatMap(agency => {
      const orders = agency.orders?.length > 0 
        ? agency.orders 
        : [{ id: `legacy-${agency.id}`, amount: agency.package_price, batch_name: 'Iniziale/Precedente', created_at: agency.last_batch_date }];
      
      return orders.map(order => {
        const packageKeys = agency.activation_codes?.filter(c => c.batch_name === order.batch_name) || [];
        return {
          ...order,
          agencyName: agency.name,
          isAgencyBanned: agency.is_banned,
          isAgencyActive: agency.is_active,
          usedKeys: packageKeys.filter(c => c.is_used).length,
          totalKeys: packageKeys.length
        };
      });
    });

    const filtered = allEntries.filter(item => {
      const matchesSearch = item.agencyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.batch_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesDate = true;
      if (filterMonth && filterMonth.length === 7) {
        const [fMonth, fYear] = filterMonth.split('/');
        const d = new Date(item.created_at);
        const itemYear = d.getFullYear().toString();
        const itemMonth = (d.getMonth() + 1).toString().padStart(2, '0');
        matchesDate = (itemYear === fYear && itemMonth === fMonth);
      }
      return matchesSearch && matchesDate;
    });

    // Calcolo Key Periodo: escludiamo i pacchetti dei partner bannati
    const nonBannedEntries = filtered.filter(f => !f.isAgencyBanned);
    const periodUsedKeys = nonBannedEntries.reduce((acc, curr) => acc + curr.usedKeys, 0);
    const periodTotalKeys = nonBannedEntries.reduce((acc, curr) => acc + curr.totalKeys, 0);

    const totalRevenue = filtered.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    return { 
      totalRevenue, 
      periodUsedKeys,
      periodTotalKeys,
      filteredOrders: filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) 
    };
  }, [agencies, searchTerm, filterMonth]);

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const segment = () => Array.from({length: 4}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `SB-${segment()}-${segment()}`;
  };

  const handleCreateAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { data: newAgency, error: agError } = await supabase.from('agencies')
        .insert([{ 
            name: agencyName, 
            email: agencyEmail, 
            type: agencyType || 'Partner', 
            notes: agencyNotes, 
            is_active: true,
            package_price: parseFloat(packagePrice),
            last_batch_date: new Date().toISOString()
        }])
        .select().single();
      if (agError) throw agError;

      await supabase.from('orders').insert([{
        agency_id: newAgency.id,
        amount: parseFloat(packagePrice),
        batch_name: batchName
      }]);

      const codes = Array.from({ length: 5 }, () => ({ 
        code: generateCode(), 
        agency_id: newAgency.id, 
        batch_name: batchName 
      }));
      await supabase.from('activation_codes').insert(codes);
      
      setAgencyName(''); setAgencyEmail(''); setAgencyType(''); setAgencyNotes(''); setPackagePrice('0');
      fetchAgencies();
    } catch (err: any) { alert(err.message); }
    finally { setIsSaving(false); }
  };

  const handleRefillCodes = async (agencyId: string, agencyName: string) => {
    const amount = parseInt(prompt(`Quanti codici per ${agencyName}?`, "10") || "0");
    if (amount <= 0) return;
    const batch = prompt("Nome pacchetto ricarica:", "Ricarica Standard");
    if (!batch) return;
    const price = prompt("Valore economico (€):", "0");

    try {
      const newCodes = Array.from({ length: amount }, () => ({ code: generateCode(), agency_id: agencyId, batch_name: batch }));
      await supabase.from('activation_codes').insert(newCodes);
      
      await supabase.from('orders').insert([{
          agency_id: agencyId,
          amount: parseFloat(price || "0"),
          batch_name: batch
      }]);

      await supabase.from('agencies').update({ last_batch_date: new Date().toISOString() }).eq('id', agencyId);
      fetchAgencies();
    } catch (err: any) { alert(err.message); }
  };

  const toggleAgencyStatus = async (id: string, name: string, currentStatus: boolean) => {
    const action = currentStatus ? 'archiviare' : 'riattivare';
    if (!confirm(`Vuoi ${action} il partner ${name}?`)) return;
    const { error } = await supabase.from('agencies').update({ is_active: !currentStatus }).eq('id', id);
    if (error) alert(error.message); else fetchAgencies();
  };

  const toggleAgencyBan = async (id: string, name: string, currentBanStatus: boolean) => {
    if (!confirm(currentBanStatus ? `Sbloccare ${name}?` : `BANNARE ${name}?`)) return;
    const { error } = await supabase.from('agencies').update({ is_banned: !currentBanStatus, is_active: currentBanStatus }).eq('id', id);
    if (error) alert(error.message); else fetchAgencies();
  };

  const downloadCard = async () => {
    if (!cardRef.current) return;
    const dataUrl = await toPng(cardRef.current, { pixelRatio: 3, backgroundColor: '#0F172A' });
    const link = document.createElement('a');
    link.download = `SoulBook-Card-${printingCode?.code}.png`;
    link.href = dataUrl;
    link.click();
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-mono text-[10px] tracking-[0.5em] text-[#0F172A] opacity-40 italic">SOULBOOK HQ</div>;

  return (
    <div className="min-h-screen bg-[#FDFDFD] p-6 md:p-12 font-sans text-[#0F172A]">
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-12 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase">SOULBOOK <span className="text-slate-300">HQ</span></h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400 mt-2 italic">Contabilità & Key Management</p>
          </div>
          <a href="/admin" className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg flex items-center gap-2">
            🛡️ Moderazione
          </a>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
          {/* PANEL: NUOVA REGISTRAZIONE */}
          <div className="xl:col-span-4 bg-white border border-[#E2E8F0] p-10 rounded-3xl shadow-lg shadow-[#0F172A]/5 h-fit sticky top-12">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-[#64748B] mb-8 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#2563EB] rounded-full animate-pulse"></span>
              Onboarding Partner
            </h2>
            <form onSubmit={handleCreateAgency} className="space-y-4">
              <input className="w-full p-4 bg-[#F8FAFC] rounded-xl text-sm outline-none border border-transparent focus:border-[#2563EB]/20 font-bold" placeholder="Nome Business" value={agencyName} onChange={e => setAgencyName(e.target.value)} required />
              <input className="w-full p-4 bg-[#F8FAFC] rounded-xl text-sm outline-none border border-transparent focus:border-[#2563EB]/20" placeholder="Email Contatto" value={agencyEmail} onChange={e => setAgencyEmail(e.target.value)} required />
              <div className="grid grid-cols-2 gap-3">
                <input className="p-4 bg-[#F8FAFC] rounded-xl text-[10px] font-black outline-none border border-transparent focus:border-[#2563EB]/20 uppercase" placeholder="Tipo" value={agencyType} onChange={e => setAgencyType(e.target.value)} />
                <input className="p-4 bg-[#F8FAFC] rounded-xl text-[10px] font-black outline-none border border-transparent focus:border-[#2563EB]/20 uppercase" placeholder="Nome Pacchetto" value={batchName} onChange={e => setBatchName(e.target.value)} />
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 uppercase">Valore €</span>
                <input type="number" className="w-full p-4 pl-24 bg-[#F8FAFC] rounded-xl text-sm font-black outline-none border border-transparent focus:border-[#2563EB]/20" value={packagePrice} onChange={e => setPackagePrice(e.target.value)} />
              </div>
              <textarea className="w-full p-4 bg-[#F8FAFC] rounded-xl text-[10px] outline-none h-20 resize-none" placeholder="Note" value={agencyNotes} onChange={e => setAgencyNotes(e.target.value)} />
              <button disabled={isSaving} className="w-full py-5 bg-[#0F172A] text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-[#2563EB] transition-all">
                {isSaving ? 'Salvataggio...' : 'Crea Partner & Codici'}
              </button>
            </form>
          </div>

          {/* PANEL: TABELLA PARTNER */}
          <div className="xl:col-span-8 bg-white border border-[#E2E8F0] rounded-3xl shadow-sm overflow-hidden h-fit">
            <div className="p-6 bg-[#F8FAFC] border-b border-[#E2E8F0] flex justify-between items-center">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[#64748B] italic">Gestione Operativa</h3>
              <button onClick={() => setShowArchived(!showArchived)} className="text-[9px] font-black uppercase px-4 py-2 bg-white border border-slate-200 rounded-xl">
                {showArchived ? 'Vedi Attivi' : 'Vedi Archivio'}
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    <th className="p-6 text-[9px] font-black uppercase text-[#64748B]">Partner & Valore</th>
                    <th className="p-6 text-[9px] font-black uppercase text-center text-[#64748B]">Key</th>
                    <th className="p-6 text-[9px] font-black uppercase text-right text-[#64748B]">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {agencies.filter(a => a.is_active === !showArchived).map(agency => {
                    const activeCount = agency.activation_codes?.filter(c => c.is_used).length || 0;
                    const totalCount = agency.activation_codes?.length || 0;
                    const isExpanded = expandedAgencyId === agency.id;
                    const totalInvested = agency.orders?.reduce((sum, o) => sum + (Number(o.amount) || 0), 0) || Number(agency.package_price) || 0;

                    return (
                      <Fragment key={agency.id}>
                        <tr className={`border-b border-[#E2E8F0] hover:bg-[#F8FAFC]/50 transition-colors ${isExpanded ? 'bg-[#F8FAFC]' : ''}`}>
                          <td className="p-6">
                            <p className="font-bold text-base text-[#0F172A]">{agency.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[8px] font-black px-2 py-0.5 rounded bg-green-100 text-green-700 uppercase tracking-tighter">€ {totalInvested.toLocaleString()}</span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase italic">Ultima: {new Date(agency.last_batch_date).toLocaleDateString()}</span>
                                {agency.is_banned && <span className="text-[8px] font-black px-2 py-0.5 rounded bg-red-600 text-white uppercase">BANNED</span>}
                            </div>
                          </td>
                          <td className="p-6 text-center">
                            <span className="text-xl font-black tracking-tighter">{activeCount} / {totalCount}</span>
                          </td>
                          <td className="p-6 text-right space-x-2">
                             {agency.is_active ? (
                               <>
                                <button onClick={() => handleRefillCodes(agency.id, agency.name)} className="p-3 bg-white border border-slate-200 text-[#0F172A] rounded-xl text-[9px] font-black uppercase shadow-sm">Ricarica</button>
                                <button onClick={() => setExpandedAgencyId(isExpanded ? null : agency.id)} className={`p-3 rounded-xl text-[9px] font-black uppercase ${isExpanded ? 'bg-blue-600 text-white' : 'bg-[#0F172A] text-white'}`}>
                                  {isExpanded ? 'Chiudi' : 'Key'}
                                </button>
                                <button onClick={() => toggleAgencyStatus(agency.id, agency.name, true)} className="p-3 bg-red-50 text-red-400 rounded-xl text-[9px] font-black uppercase">✕</button>
                               </>
                             ) : (
                               <div className="flex items-center justify-end gap-2">
                                <button onClick={() => toggleAgencyBan(agency.id, agency.name, agency.is_banned)} className={`p-3 rounded-xl text-[9px] font-black uppercase ${agency.is_banned ? 'bg-amber-500 text-white' : 'bg-slate-100'}`}>
                                  {agency.is_banned ? '🚫 Sblocca' : 'Banna'}
                                </button>
                                <button onClick={() => toggleAgencyStatus(agency.id, agency.name, false)} className="p-3 bg-green-50 text-green-600 rounded-xl text-[9px] font-black uppercase">↻</button>
                              </div>
                             )}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={3} className="p-0 bg-[#F8FAFC]">
                              <div className="p-8 border-x border-[#E2E8F0] space-y-8">
                                {Object.entries(
                                  agency.activation_codes.reduce((acc, code) => {
                                    const bName = code.batch_name || 'Standard';
                                    if (!acc[bName]) acc[bName] = [];
                                    acc[bName].push(code);
                                    return acc;
                                  }, {} as Record<string, ActivationCode[]>)
                                ).map(([batchTitle, codes]) => (
                                  <div key={batchTitle} className="space-y-4">
                                    <div className="flex items-center gap-4">
                                      <div className="h-[1px] flex-1 bg-slate-200"></div>
                                      <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100">
                                        PACCHETTO: <span className="text-blue-600">{batchTitle}</span> ({codes.length})
                                      </h4>
                                      <div className="h-[1px] flex-1 bg-slate-200"></div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                      {codes.map((c, i) => (
                                        <div key={i} className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col justify-between group hover:border-blue-200 transition-all">
                                          <div className="flex justify-between items-start mb-2">
                                            <span className="font-mono font-bold text-[11px] tracking-tighter">{c.code}</span>
                                            <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full ${c.is_used ? 'bg-red-50 text-red-400' : 'bg-green-50 text-green-600'}`}>
                                              {c.is_used ? 'OFF' : 'ON'}
                                            </span>
                                          </div>
                                          {c.is_used && c.user_name ? (
                                              <div className="text-[9px] font-black text-blue-600 bg-blue-50/50 p-2 rounded-lg truncate">
                                                👤 {c.user_name}
                                              </div>
                                            ) : (
                                              <button 
                                                onClick={() => setPrintingCode({ code: c.code, agency: agency.name })} 
                                                className="w-full py-2 bg-[#0F172A] text-white text-[8px] font-black uppercase rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-1"
                                              >
                                                Stampa <span className="text-[10px]">🖨️</span>
                                              </button>
                                            )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* REGISTRO STORICO */}
        <div className="xl:col-span-12 mt-12 bg-white border border-[#E2E8F0] rounded-[30px] shadow-sm overflow-hidden">
          <div className="p-8 border-b border-[#E2E8F0] bg-[#F8FAFC] flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-1">Accounting Ledger</h3>
              <h2 className="text-2xl font-black tracking-tighter text-[#0F172A]">REGISTRO STORICO TRANSAZIONI</h2>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Cerca partner..."
                  className="pl-10 pr-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-[10px] font-bold uppercase outline-none focus:border-blue-500 w-56 shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 text-xs">🔍</span>
              </div>

              {/* FILTRO DATA MM/AAAA */}
              <div className="flex items-center gap-3 bg-white border border-[#E2E8F0] rounded-xl px-4 py-2 shadow-sm focus-within:border-blue-500 transition-all">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Filtra Mese:</span>
                <input 
                  type="text"
                  placeholder="MM/AAAA"
                  className="bg-transparent text-[11px] font-black uppercase outline-none w-20"
                  maxLength={7}
                  value={filterMonth}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, '');
                    if (val.length > 2) val = val.substring(0, 2) + '/' + val.substring(2, 6);
                    setFilterMonth(val);
                  }}
                />
                {filterMonth && (
                    <button onClick={() => setFilterMonth('')} className="text-red-500 text-[9px] font-black">RESET</button>
                )}
              </div>

              <div className="flex gap-6 border-l border-[#E2E8F0] pl-8">
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Key Periodo (Att/Tot)</p>
                  <p className="text-xl font-black text-[#0F172A]">{stats.periodUsedKeys} / {stats.periodTotalKeys}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Incasso Periodo</p>
                  <p className="text-xl font-black text-green-600">€ {stats.totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="p-6 text-[9px] font-black uppercase tracking-widest text-slate-500">Data</th>
                  <th className="p-6 text-[9px] font-black uppercase tracking-widest text-slate-500">Partner</th>
                  <th className="p-6 text-[9px] font-black uppercase tracking-widest text-slate-500">Nome Pacchetto</th>
                  <th className="p-6 text-[9px] font-black uppercase tracking-widest text-slate-500 text-center">Utilizzo Key</th>
                  <th className="p-6 text-[9px] font-black uppercase tracking-widest text-slate-500 text-right">Importo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.filteredOrders.length > 0 ? (
                  stats.filteredOrders.map((order: any, idx) => (
                    <tr key={idx} className={`hover:bg-[#F8FAFC]/80 transition-colors group ${order.isAgencyBanned ? 'bg-red-50/20' : ''}`}>
                      <td className="p-6">
                        <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                          {new Date(order.created_at).toLocaleDateString('it-IT')}
                        </span>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <span className={`text-[11px] font-black uppercase tracking-tight ${order.isAgencyBanned ? 'text-red-600 opacity-60' : 'text-[#0F172A]'}`}>
                            {order.agencyName}
                          </span>
                          {order.isAgencyBanned && <span className="text-[7px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded">BANNED</span>}
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-600 uppercase">{order.batch_name}</span>
                          <span className="text-[8px] font-medium text-slate-400 italic">TX: {order.id.split('-')[0]}</span>
                        </div>
                      </td>
                      <td className="p-6 text-center">
                        <div className="inline-flex flex-col items-center">
                            <span className="text-[10px] font-black text-[#0F172A]">{order.usedKeys} / {order.totalKeys}</span>
                            <div className="w-16 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                              <div 
                                className={`h-full transition-all ${order.usedKeys === order.totalKeys ? 'bg-green-500' : 'bg-blue-500'}`} 
                                style={{ width: `${order.totalKeys > 0 ? (order.usedKeys / order.totalKeys) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                      </td>
                      <td className="p-6 text-right">
                        <span className="text-sm font-black font-mono text-green-600">
                          € {Number(order.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 italic">
                      Nessun ordine trovato per i filtri selezionati
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PRINT PREVIEW */}
        {printingCode && (
          <div className="fixed inset-0 bg-[#FDFDFD] z-[100] flex flex-col items-center justify-center no-print">
            <div className="absolute top-10 flex gap-4">
              <button onClick={() => setPrintingCode(null)} className="px-8 py-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-full text-[10px] font-black uppercase tracking-widest">Esci</button>
              <button onClick={downloadCard} className="px-8 py-4 bg-[#0F172A] text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">Download PNG</button>
            </div>
            <div ref={cardRef} className="w-[600px] h-[360px] bg-[#0F172A] rounded-[50px] p-12 flex flex-col justify-between relative shadow-2xl overflow-hidden border-8 border-white">
               <div className="absolute -right-10 -top-10 w-56 h-56 bg-slate-900 rounded-full" />
               <div className="relative text-white/90">
                  <h3 className="text-4xl font-black italic tracking-tighter leading-none text-white font-sans uppercase">SOULBOOK</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50 mt-3 flex items-center gap-1.5 italic underline underline-offset-4 decoration-blue-500">Card Attivazione</p>
               </div>
               <div className="relative flex items-center gap-10">
                  <div className="bg-white p-3.5 rounded-2xl">
                     <QRCodeSVG value={`https://soulbookitalia.it/attiva?code=${printingCode.code}`} size={70} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 mb-1.5 italic font-mono">Secret Key</p>
                    <div className="text-4xl font-mono font-black text-white tracking-widest border-b-2 border-white/10 pb-1.5">{printingCode.code}</div>
                  </div>
               </div>
               <div className="relative flex justify-between items-end">
                  <div className="max-w-[70%]">
                    <p className="text-[8px] font-black uppercase text-white/30 italic mb-1.5 tracking-widest">Partner Ufficiale</p>
                    <p className="text-lg font-black text-white uppercase italic tracking-tight truncate">{printingCode.agency}</p>
                  </div>
                  <p className="text-[10px] font-black text-white/30 tracking-widest font-mono uppercase italic">soulbookitalia.it</p>
               </div>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        @media print { .no-print { display: none !important; } }
      `}</style>
    </div>
  )
}