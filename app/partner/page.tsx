'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function PartnerDashboard() {
  const [agency, setAgency] = useState<any>(null)
  const [codes, setCodes] = useState<any[]>([])
  const [selectedBatch, setSelectedBatch] = useState<string>('TUTTI')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    fetchPartnerData()
  }, [])

  const fetchPartnerData = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        window.location.href = '/registrati?mode=login'
        return
      }

      const { data: agData, error: agError } = await supabase
        .from('agencies')
        .select(`*, activation_codes (*)`)
        .eq('owner_id', user.id)
        .maybeSingle()

      if (agError) throw agError

      if (agData) {
        setAgency(agData)
        const sortedCodes = agData.activation_codes?.sort((a: any, b: any) => 
          a.code.localeCompare(b.code)
        ) || []
        setCodes(sortedCodes)
      } else {
        setErrorMsg("Nessuna agenzia associata.")
      }
    } catch (err: any) {
      setErrorMsg("Errore di sincronizzazione.")
    } finally {
      setLoading(false)
    }
  }

  // Estrae i nomi dei batch univoci per creare i tag
  const batches = ['TUTTI', ...Array.from(new Set(codes.map(c => c.batch_name).filter(Boolean)))] as string[]

  const updateFamilyName = async (id: string, name: string) => {
    await supabase.from('activation_codes').update({ family_name: name }).eq('id', id)
  }

  const toggleDelivered = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('activation_codes')
      .update({ is_delivered: !currentStatus })
      .eq('id', id)

    if (!error) {
      setCodes(prev => prev.map(c => 
        c.id === id ? { ...c, is_delivered: !currentStatus } : c
      ))
    }
  }

  const getFormattedDate = (dateString: string | null) => {
    if (!dateString) return { full: '-', filter: '' }
    const d = new Date(dateString)
    const day = d.getDate().toString().padStart(2, '0')
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const year = d.getFullYear()
    return {
      full: `${day}/${month}/${year}`,
      filter: `${month}/${year}`
    }
  }

  // Filtro combinato: Search + Tag Batch
  const filteredCodes = codes.filter(c => {
    const dateData = getFormattedDate(c.activated_at)
    const search = searchTerm.toLowerCase()
    const matchesSearch = c.code.toLowerCase().includes(search) || 
                         (c.family_name && c.family_name.toLowerCase().includes(search)) ||
                         (c.is_used && dateData.filter.includes(search))
    
    const matchesBatch = selectedBatch === 'TUTTI' || c.batch_name === selectedBatch

    return matchesSearch && matchesBatch
  })

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/registrati?mode=login'
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen font-mono text-[10px] tracking-[0.4em] uppercase opacity-40 animate-pulse text-slate-900">Inizializzazione...</div>

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 text-slate-900 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Partner Portal</span>
            </div>
            <h1 className="text-5xl font-black uppercase tracking-tighter text-slate-900 leading-none">
              {agency?.name || 'Dashboard'}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <input 
              type="text"
              placeholder="CERCA CODICE, FAMIGLIA O MM/AAAA..."
              className="bg-white border-2 border-slate-100 px-6 py-4 rounded-[1.5rem] text-[10px] font-black outline-none focus:border-slate-900 w-full md:w-80 shadow-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button 
              onClick={handleLogout} 
              className="px-8 py-4 bg-white border border-slate-200 rounded-[1.5rem] hover:bg-slate-900 hover:text-white transition-all shadow-sm text-[10px] font-black uppercase tracking-widest"
            >
              Esci
            </button>
          </div>
        </header>

        {/* Batch Selection Tags */}
        <div className="flex flex-wrap gap-2 mb-8 items-center">
            <span className="text-[9px] font-black uppercase text-slate-400 mr-2 tracking-widest">Filtra per Lotto:</span>
            {batches.map((b) => (
                <button
                    key={b}
                    onClick={() => setSelectedBatch(b)}
                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-tight transition-all border ${
                        selectedBatch === b 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100' 
                        : 'bg-white text-slate-400 border-slate-200 hover:border-slate-400'
                    }`}
                >
                    {b}
                </button>
            ))}
        </div>

        {/* Tabella Codici */}
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">1. Codice / Lotto</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">2. Consegna</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">3. Assegnato a</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">4. Data Attiv.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredCodes.map((c) => {
                  const dateInfo = getFormattedDate(c.activated_at)
                  return (
                    <tr key={c.id} className="group hover:bg-blue-50/10 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-2">
                            <code className="text-sm font-black text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 font-mono w-fit">
                            {c.code}
                            </code>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                Pacchetto: {c.batch_name || 'Generico'}
                            </span>
                        </div>
                      </td>

                      <td className="px-8 py-6 text-center">
                        <button
                          onClick={() => toggleDelivered(c.id, c.is_delivered)}
                          className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-tight transition-all shadow-sm ${
                            c.is_delivered 
                              ? 'bg-slate-900 text-white' 
                              : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-900 hover:text-slate-900'
                          }`}
                        >
                          {c.is_delivered ? '📦 Consegnato' : 'Da Consegnare'}
                        </button>
                      </td>
                      
                      <td className="px-8 py-6">
                        <input 
                          type="text"
                          placeholder="Nota famiglia..."
                          defaultValue={c.family_name || ''}
                          onBlur={(e) => updateFamilyName(c.id, e.target.value)}
                          className="text-xs font-bold text-slate-700 bg-slate-50/50 border border-slate-100 px-4 py-3 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all w-full max-w-[200px]"
                        />
                      </td>

                      <td className="px-8 py-6">
                        {c.is_used ? (
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black text-slate-900 uppercase">
                              {dateInfo.full}
                            </span>
                            <span className="text-[8px] font-bold text-green-500 uppercase tracking-tighter">Attivo ✓</span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-300 uppercase italic tracking-widest">Disponibile</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <footer className="mt-12 text-center pb-12">
            <p className="text-slate-300 text-[9px] uppercase font-black tracking-[0.5em]">
                Soulbook Italia &copy; 2026 Management Portal
            </p>
        </footer>
      </div>
    </div>
  )
}