'use client';

import { useState, useRef } from 'react';
import Link from 'next/link'; // Importiamo Link per una navigazione fluida

export default function DemoProfile() {
  const [activeTab, setActiveTab] = useState<'home' | 'media'>('home');
  const [showToast, setShowToast] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const profile = {
    full_name: "Alessandro Riva",
    birth_date: "1945",
    death_date: "2023",
    bio_title: "L'ORIZZONTE NON È MAI LA FINE",
    bio_content: "Sognatore, marinaio e guida costante. Alessandro ha vissuto con la convinzione che la vita non si misuri in anni, ma in momenti che tolgono il respiro. Ha lasciato una scia di luce in ognuno di noi.",
    accent_color: "#0f172a",
    page_bg_color: "#FDFDFD",
    font_family: "sans", 
    profile_image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000",
    header_bg_url: "https://images.unsplash.com/photo-1439405326854-014607f694d7?q=80&w=2000"
  };

  const demoMessages = [
    { author_name: "Marco", content: "Un esempio di integrità e gioia. Mi mancherai.", created_at: "2024" },
    { author_name: "Elena", content: "Grazie per avermi insegnato a guardare sempre oltre.", created_at: "2024" },
    { author_name: "Giulia", content: "Il suo spirito vivrà per sempre nei nostri cuori.", created_at: "2024" }
  ];

  const demoImages = [
    "https://images.unsplash.com/photo-1544465544-1b71aee9dfa3?q=80&w=1000",
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1000",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1000"
  ];

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const handleDemoInteraction = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="min-h-screen font-sans text-slate-900 relative overflow-x-hidden bg-[#FDFDFD]">
      
      {/* TOAST FEEDBACK */}
      {showToast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] bg-white border border-slate-100 px-6 py-3 rounded-full shadow-2xl animate-in slide-in-from-top-10 duration-500">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Questa è una <span style={{ color: profile.accent_color }}>Demo interattiva</span>
          </p>
        </div>
      )}

      {/* HEADER */}
      <header className="relative pt-32 pb-12 px-6 text-center">
        <div className="absolute inset-0 z-0 h-80 md:h-96">
          <img src={profile.header_bg_url} className="w-full h-full object-cover opacity-60" alt="" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#FDFDFD]"></div>
        </div>
        <div className="relative z-10">
          <img src={profile.profile_image_url} className="w-32 h-32 md:w-40 md:h-40 rounded-full mx-auto object-cover shadow-2xl border-4 border-white" style={{ borderColor: profile.accent_color }} alt="" />
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mt-8 leading-none" style={{ color: profile.accent_color }}>{profile.full_name}</h1>
          <p className="text-[10px] tracking-[0.5em] uppercase text-slate-300 font-black mt-6">1945 — 2023</p>
        </div>
      </header>

      {/* NAV TAB */}
      <nav className="flex justify-center border-b border-slate-900/5 mb-16 relative z-10">
        <div className="flex gap-12">
          {['home', 'media'].map((t) => (
            <button key={t} onClick={() => setActiveTab(t as any)} className={`pb-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative ${activeTab === t ? 'opacity-100' : 'opacity-20'}`} style={{ color: profile.accent_color }}>
              {t === 'home' ? 'Memorie' : 'Album Foto'}
              {activeTab === t && <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ backgroundColor: profile.accent_color }}></div>}
            </button>
          ))}
        </div>
      </nav>

      {/* CONTENT */}
      <main className="max-w-4xl mx-auto px-6 relative z-10">
        {activeTab === 'home' && (
          <div className="animate-in fade-in duration-700 space-y-24 text-center">
            <section className="space-y-10">
              <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-tight" style={{ color: profile.accent_color }}>{profile.bio_title}</h3>
              <div className="max-w-2xl mx-auto text-xl md:text-2xl leading-relaxed text-slate-500 font-medium">"{profile.bio_content}"</div>
            </section>

            <section className="space-y-0">
              <div className="flex flex-col items-center gap-6 mb-12">
                <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-200">Pensieri e Dediche</h2>
                <button onClick={handleDemoInteraction} className="group relative flex items-center gap-4 px-10 py-5 rounded-full border border-slate-200 bg-white shadow-sm hover:shadow-xl transition-all duration-500">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] relative z-10" style={{ color: profile.accent_color }}>Lascia un ricordo</span>
                  <span className="text-lg relative z-10 opacity-60">✨</span>
                </button>
              </div>

              <div className="max-h-[500px] overflow-y-auto no-scrollbar px-4 py-10 space-y-8">
                {demoMessages.map((msg, i) => (
                  <div key={i} className="p-8 md:p-12 border border-slate-100 bg-white/50 backdrop-blur-sm relative text-left group">
                    <div className="absolute inset-2 border-[0.5px] border-slate-200 opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <p className="text-lg md:text-xl font-medium text-slate-700 leading-relaxed relative z-10">
                      "{msg.content}"
                      <span className="block mt-8 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: profile.accent_color }}>— {msg.author_name}</span>
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'media' && (
          <div className="animate-in fade-in duration-700 relative">
            <div className="flex items-center justify-between mb-10">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300 italic">Memory Book</span>
              <div className="h-[0.5px] flex-grow mx-8 bg-slate-200/30"></div>
              <div className="flex gap-4">
                <button onClick={() => scroll('left')} className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-white transition-all text-xl">‹</button>
                <button onClick={() => scroll('right')} className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-white transition-all text-xl">›</button>
              </div>
            </div>

            <div ref={scrollRef} className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-8 md:gap-14 pb-20">
              {demoImages.map((url, idx) => (
                <div key={idx} className="snap-center shrink-0 w-[85vw] md:w-[550px]">
                  <div className="bg-white p-5 md:p-8 shadow-2xl border border-slate-100 relative">
                    <div className="aspect-[4/5] relative border border-slate-100 p-2 md:p-4 bg-slate-50">
                      <div className="absolute inset-1 border-[0.5px] opacity-20 pointer-events-none" style={{ borderColor: profile.accent_color }}></div>
                      <img src={url} className="w-full h-full object-cover grayscale-[0.3] hover:grayscale-0 transition-all duration-700" alt="" />
                    </div>
                    <div className="mt-8 flex justify-between items-center px-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-300 italic">SoulBook Archives</span>
                      <span className="text-[10px] font-mono font-bold" style={{ color: profile.accent_color }}>0{idx + 1}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="py-32 mt-20 text-center opacity-10 text-[9px] font-black uppercase tracking-[1.5em]">SoulBook Preview</footer>

      {/* CTA BANNER - AGGIORNATO CON LOGICA /REGISTRATI */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md bg-white border border-slate-100 p-6 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex justify-between items-center animate-in slide-in-from-bottom-20 duration-1000">
        <div className="space-y-1">
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Crea adesso il tuo soulbook</p>
      
        </div>
        <Link 
          href="/registrati?mode=signup" 
          className="bg-slate-900 text-white px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-black hover:scale-105 transition-all"
        >
          Crea ora
        </Link>
      </div>
    </div>
  );
}