'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <div className="space-y-6 max-w-2xl">
        <span className="text-5xl">💎</span>
        <h1 className="text-6xl font-black uppercase italic tracking-tighter text-slate-900">
          Memorial <br /> Digital
        </h1>
        <p className="text-xl text-slate-500 font-medium">
          Preserva la memoria, condividi la storia, mantieni vivo il ricordo per sempre.
        </p>
        
        <div className="flex flex-col md:flex-row gap-4 justify-center pt-8">
          <Link 
            href="/registrati" 
            className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl"
          >
            Crea un Memoriale
          </Link>
          <Link 
            href="/dashboard" 
            className="bg-white text-slate-900 border-2 border-slate-100 px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
          >
            Accedi Admin
          </Link>
        </div>
      </div>

      <footer className="absolute bottom-10 text-[10px] font-black uppercase text-slate-300 tracking-[0.3em]">
        &copy; 2026 Memorial Digital - Onora ogni vita
      </footer>
    </div>
  );
}