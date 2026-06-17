'use client'
import React from 'react';

interface GlobalLogTableProps {
  data: any[];
}

export default function GlobalLogTable({ data }: GlobalLogTableProps) {
  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden mt-10">
      {/* HEADER */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 italic">Esploso Globale Key & Partner</h3>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Monitoraggio riga per riga dell'ecosistema</p>
        </div>
        <div className="text-[10px] font-black bg-slate-900 text-white px-3 py-1 rounded-full uppercase italic">
          Total: {data.length}
        </div>
      </div>
      
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto border-b border-slate-100">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-900 text-[9px] font-black uppercase tracking-[0.2em] text-white">
              <th className="py-4 px-6 text-left">Partner / Agenzia</th>
              <th className="py-4 px-6 text-left">Pacchetto</th>
              <th className="py-4 px-6 text-left">Activation Key</th>
              <th className="py-4 px-6 text-center">Consegna</th>
              <th className="py-4 px-6 text-left">Utente Finale</th>
              <th className="py-4 px-6 text-center">Data Attivazione</th>
              <th className="py-4 px-6 text-center">Status Profilo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.length > 0 ? (
              data.map((log, index) => {
                const packName = log.batch_name ? String(log.batch_name).toUpperCase() : "STOCK SOULBOOK";
                
                // PRELIEVO DATA DA ACTIVATED_AT (Tabella activation_codes)
                const registrationDate = log.activated_at 
                  ? new Date(log.activated_at).toLocaleDateString('it-IT', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })
                  : null;

                return (
                  <tr key={index} className={`hover:bg-blue-50/30 transition-colors ${log.agencies?.is_banned ? 'bg-red-50/20' : ''}`}>
                    <td className="py-4 px-6 text-xs font-black text-slate-900 uppercase italic whitespace-nowrap">
                      {log.agencies?.name || 'Diretta Soulbook'}
                    </td>

                    <td className="py-4 px-6">
                      <span className="text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest border bg-slate-50 text-slate-500 border-slate-100">
                        {packName}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <div className="text-xs font-mono font-bold bg-slate-100 px-2 py-1 rounded inline-block text-slate-600">
                        {log.code}
                      </div>
                    </td>

                    <td className="py-4 px-6 text-center">
                      <span className={`text-[10px] font-black uppercase ${log.is_delivered ? 'text-green-500' : 'text-slate-300'}`}>
                        {log.is_delivered ? '✓ Consegnata' : '○ In Sede'}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      {log.profiles ? (
                        <div>
                          <div className="text-xs font-bold text-slate-900 leading-none">{log.profiles.full_name}</div>
                          <div className="text-[9px] text-blue-500 font-mono italic mt-1">/{log.profiles.slug}</div>
                        </div>
                      ) : (
                        <span className="text-[9px] font-bold text-slate-300 uppercase italic">Libera / Non Attiva</span>
                      )}
                    </td>

                    {/* CELLA DATA ATTIVAZIONE */}
                    <td className="py-4 px-6 text-center">
                      {registrationDate ? (
                        <div className="flex flex-col items-center">
                          <span className="text-[11px] font-black text-slate-900 uppercase italic leading-tight">
                            {registrationDate}
                          </span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                            Attivata
                          </span>
                        </div>
                      ) : (
                        <span className="text-[9px] font-bold text-slate-200 uppercase italic tracking-widest">---</span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-center">
                      {log.profiles ? (
                        <div className="flex items-center justify-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                            <span className="text-[8px] font-black uppercase text-slate-400">Attivo</span>
                        </div>
                      ) : (
                        <div className="w-2 h-2 rounded-full mx-auto bg-slate-200" />
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-20 text-center text-[10px] font-black uppercase text-slate-300 italic tracking-widest">
                  Nessun risultato trovato
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}