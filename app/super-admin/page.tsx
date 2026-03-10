'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { toPng } from 'html-to-image'
import { QRCodeSVG } from 'qrcode.react'

interface ActivationCode {
  code: string;
  is_used: boolean;
  batch_name: string;
}

interface Agency {
  id: string;
  name: string;
  email: string;
  type: string;
  notes?: string;
  activation_codes: ActivationCode[];
}

export default function SuperAdmin() {
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedAgencyCodes, setSelectedAgencyCodes] = useState<Agency | null>(null)
  const [printingCode, setPrintingCode] = useState<{code: string, agency: string} | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  const cardRef = useRef<HTMLDivElement>(null)

  // Form States
  const [agencyName, setAgencyName] = useState('')
  const [agencyEmail, setAgencyEmail] = useState('')
  const [agencyType, setAgencyType] = useState('')
  const [agencyNotes, setAgencyNotes] = useState('')
  const [batchName, setBatchName] = useState('Standard Pack')

  const fetchAgencies = useCallback(async () => {
    const { data, error } = await supabase
      .from('agencies')
      .select('*, activation_codes(code, is_used, batch_name)')
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    else setAgencies(data || []);
  }, []);

  useEffect(() => { fetchAgencies().finally(() => setLoading(false)); }, [fetchAgencies]);

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
        .insert([{ name: agencyName, email: agencyEmail, type: agencyType || 'Partner', notes: agencyNotes }])
        .select().single();
      if (agError) throw agError;

      const codes = Array.from({ length: 10 }, () => ({ code: generateCode(), agency_id: newAgency.id, batch_name: batchName }));
      await supabase.from('activation_codes').insert(codes);
      
      setAgencyName(''); setAgencyEmail(''); setAgencyType(''); setAgencyNotes('');
      fetchAgencies();
    } catch (err: any) { alert(err.message); }
    finally { setIsSaving(false); }
  };

  const handleRefillCodes = async (agencyId: string, agencyName: string) => {
    const amount = parseInt(prompt("Quanti codici vuoi aggiungere a questo partner?", "10") || "0");
    if (amount <= 0) return;
    const batch = prompt("Causale/Nome del pacchetto (es. Ricarica Marzo):", "Ricarica Standard");
    if (!batch) return;

    try {
      const newCodes = Array.from({ length: amount }, () => ({
        code: generateCode(),
        agency_id: agencyId,
        batch_name: batch
      }));
      const { error } = await supabase.from('activation_codes').insert(newCodes);
      if (error) throw error;
      alert(`Generati ${amount} nuovi codici per ${agencyName}.`);
      fetchAgencies();
    } catch (err: any) { alert("Errore ricarica: " + err.message); }
  };

  const handleDeleteAgency = async (id: string, name: string) => {
    if (!confirm(`ATTENZIONE: Sei sicuro di voler eliminare ${name}? L'azione è irreversibile.`)) return;
    if (!confirm(`Tutti i codici di ${name} verranno cancellati. Confermi?`)) return;

    const { error } = await supabase.from('agencies').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchAgencies();
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
      <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400 mt-2 italic">Gestione Collaborazioni</p>
    </div>
    
    {/* TASTO PER ANDARE ALL'ADMIN CONTENUTI */}
    <a 
      href="/admin" 
      className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg flex items-center gap-2"
    >
      🛡️ Moderazione Contenuti
    </a>
</header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
          {/* PANEL: NUOVA REGISTRAZIONE */}
          <div className="xl:col-span-4 bg-white border border-[#E2E8F0] p-10 rounded-3xl shadow-lg shadow-[#0F172A]/5 h-fit">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-[#64748B] mb-8 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#2563EB] rounded-full animate-pulse"></span>
              Onboarding Partner
            </h2>
            <form onSubmit={handleCreateAgency} className="space-y-4">
              <input className="w-full p-4 bg-[#F8FAFC] rounded-xl text-sm outline-none border border-transparent focus:border-[#2563EB]/20 font-medium" placeholder="Nome Business" value={agencyName} onChange={e => setAgencyName(e.target.value)} required />
              <input className="w-full p-4 bg-[#F8FAFC] rounded-xl text-sm outline-none border border-transparent focus:border-[#2563EB]/20" placeholder="Email Contatto" value={agencyEmail} onChange={e => setAgencyEmail(e.target.value)} required />
              <div className="grid grid-cols-2 gap-3">
                <input className="p-4 bg-[#F8FAFC] rounded-xl text-[10px] font-black outline-none border border-transparent focus:border-[#2563EB]/20 uppercase" placeholder="Tipo (es. Agenzia)" value={agencyType} onChange={e => setAgencyType(e.target.value)} />
                <input className="p-4 bg-[#F8FAFC] rounded-xl text-[10px] font-black outline-none border border-transparent focus:border-[#2563EB]/20 uppercase" placeholder="Batch Pacchetto" value={batchName} onChange={e => setBatchName(e.target.value)} />
              </div>
              <textarea className="w-full p-4 bg-[#F8FAFC] rounded-xl text-[10px] outline-none h-20 resize-none border border-transparent focus:border-[#2563EB]/20" placeholder="Note Contatti (Opzionali)" value={agencyNotes} onChange={e => setAgencyNotes(e.target.value)} />
              <button disabled={isSaving} className="w-full py-5 bg-[#0F172A] text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-[#2563EB] transition-all">
                {isSaving ? 'Salvataggio...' : 'Crea Partner & 10 Codici'}
              </button>
            </form>
          </div>

          {/* PANEL: TABELLA PARTNER */}
          <div className="xl:col-span-8 bg-white border border-[#E2E8F0] rounded-3xl shadow-sm overflow-hidden h-fit">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="p-6 text-[9px] font-black uppercase tracking-widest text-[#64748B]">Partner Info</th>
                  <th className="p-6 text-[9px] font-black uppercase tracking-widest text-[#64748B] text-center">Codici Generati</th>
                  <th className="p-6 text-[9px] font-black uppercase tracking-widest text-[#64748B] text-right">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {agencies.map(agency => (
                  <tr key={agency.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]/50 transition-colors group">
                    <td className="p-6">
                      <p className="font-bold text-base tracking-tight text-[#0F172A]">{agency.name}</p>
                      <p className="text-[10px] font-medium text-[#64748B] italic uppercase">{agency.type} — {agency.email}</p>
                    </td>
                    <td className="p-6 text-center font-black text-2xl tracking-tighter text-[#0F172A]">{agency.activation_codes?.length || 0}</td>
                    <td className="p-6 text-right space-x-2">
                       <button onClick={() => handleRefillCodes(agency.id, agency.name)} className="p-3 bg-[#F8FAFC] text-[#0F172A] rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:bg-slate-100 shadow-sm">Ricarica Codici</button>
                      <button onClick={() => setSelectedAgencyCodes(agency)} className="p-3 bg-[#0F172A] text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:bg-[#2563EB]">Vedi Database</button>
                      <button onClick={() => handleDeleteAgency(agency.id, agency.name)} className="p-3 bg-red-50 text-red-400 rounded-xl text-[9px] font-black uppercase transition-all hover:bg-red-500 hover:text-white">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL DATABASE CODICI */}
        {selectedAgencyCodes && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-[48px] p-10 md:p-14 max-w-4xl w-full shadow-2xl relative border border-[#E2E8F0]">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h2 className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.4em] mb-2 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#2563EB] rounded-full"></span>Inventory Key Database</h2>
                  <p className="text-3xl font-black tracking-tighter text-[#0F172A] leading-tight">{selectedAgencyCodes.name}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex bg-[#F8FAFC] p-1 rounded-xl border border-[#E2E8F0]">
                    <button onClick={() => setViewMode('grid')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-[#0F172A]' : 'text-[#64748B]/40'}`}>Griglia</button>
                    <button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-[#0F172A]' : 'text-[#64748B]/40'}`}>Lista</button>
                  </div>
                  <button onClick={() => setSelectedAgencyCodes(null)} className="w-12 h-12 bg-[#F8FAFC] border border-[#E2E8F0] rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors">✕</button>
                </div>
              </div>

              <div className={`grid gap-4 max-h-[450px] overflow-y-auto pr-4 custom-scrollbar ${viewMode === 'grid' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {selectedAgencyCodes.activation_codes.map((c, i) => (
                  <div key={i} className={`flex items-center justify-between p-6 bg-[#F8FAFC] rounded-3xl border border-[#E2E8F0] group hover:border-[#0F172A]/10 transition-all`}>
                    <div className="flex flex-col">
                      <span className="font-mono font-bold text-sm text-[#0F172A]">{c.code}</span>
                      <span className="text-[8px] font-black text-[#64748B] uppercase italic tracking-widest">{c.batch_name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <span className={`text-[8px] font-black px-3 py-1.5 rounded-full border ${c.is_used ? 'text-red-300 border-red-100' : 'text-green-600 border-green-100 bg-white'}`}>{c.is_used ? 'USATO' : 'LIBERO'}</span>
                       {!c.is_used && (
                         <button onClick={() => setPrintingCode({ code: c.code, agency: selectedAgencyCodes.name })} className="p-3 bg-white text-[#0F172A] border border-[#E2E8F0] rounded-xl text-[9px] font-black uppercase shadow-sm hover:bg-[#0F172A] hover:text-white hover:border-[#0F172A] transition-all">Stampa Card 🖨️</button>
                       )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MODAL PRINT PREVIEW (CARD DESIGN) */}
        {printingCode && (
          <div className="fixed inset-0 bg-[#FDFDFD] z-[100] flex flex-col items-center justify-center no-print">
            <div className="absolute top-10 flex gap-4">
              <button onClick={() => setPrintingCode(null)} className="px-8 py-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-full text-[10px] font-black uppercase tracking-widest">Torna Indietro</button>
              <button onClick={downloadCard} className="px-8 py-4 bg-[#0F172A] text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[#0F172A]/10">Download PNG</button>
            </div>

            {/* THE CARD (DESIGN LUXURY) */}
            <div ref={cardRef} className="w-[600px] h-[360px] bg-[#0F172A] rounded-[50px] p-12 flex flex-col justify-between relative shadow-2xl overflow-hidden border-8 border-white">
               {/* Decorazione Sfondo */}
               <div className="absolute -right-10 -top-10 w-56 h-56 bg-slate-900 rounded-full" />
               <div className="absolute left-[-20px] bottom-[-20px] w-32 h-32 bg-slate-900 rounded-full" />
               
               <div className="relative text-white/90">
                  <h3 className="text-4xl font-black italic tracking-tighter leading-none text-white">
                     SOULBOOK
                  </h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50 mt-3 flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-[#2563EB] rounded-full animate-pulse"></span>Card di attivazione profilo</p>
               </div>

               <div className="relative flex items-center gap-10">
                  <div className="bg-white p-3.5 rounded-2xl">
                     <QRCodeSVG value={`https://soulbookitalia.it/attiva?code=${printingCode.code}`} size={70} bgColor="#ffffff" fgColor="#0F172A" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 mb-1.5 italic">Inquadra il Qr e inserisci il codice</p>
                    <div className="text-4xl font-mono font-black text-white tracking-widest border-b-2 border-white/10 pb-1.5">{printingCode.code}</div>
                  </div>
               </div>

               <div className="relative flex justify-between items-end">
                  <div className="max-w-[70%]">
                    <p className="text-[8px] font-black uppercase text-white/30 italic mb-1.5 tracking-widest underline decoration-white/5 underline-offset-4">Partner Ufficiale</p>
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