'use client';

import { useEffect, useState, use, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';

// --- COMPONENTE GUEST FORM ---
function GuestMessageForm({ profile, onMessageSent }: { profile: any, onMessageSent: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');

    // 1. Inserimento del messaggio nel database
    const { error } = await supabase.from('messages').insert([{ 
      profile_id: profile.id, 
      author_name: author || 'Anonimo', 
      content: content, 
      is_public: isPublic 
    }]);

    if (!error) {
      // 2. Invio notifica email se l'email dell'utente esiste (user_email)
      if (profile.user_email) {
        try {
          await fetch('/api/notify-dedication', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ownerEmail: profile.user_email,
              ownerName: profile.full_name,
              visitorName: author || 'Anonimo',
              dedicationText: content,
              slug: profile.slug,
              isPublic: isPublic
            })
          });
        } catch (err) {
          console.error("Errore invio notifica email:", err);
        }
      }

      setStatus('success'); 
      setAuthor(''); 
      setContent(''); 
      onMessageSent();
      setTimeout(() => { setStatus('idle'); setIsOpen(false); }, 2000);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto mb-12 px-2 text-center relative z-20">
  {!isOpen ? (
    <button 
      onClick={() => setIsOpen(true)}
      style={{ backgroundColor: `${profile.accent_color}10`, color: profile.accent_color }}
      className="w-full py-5 rounded-[2.5rem] font-sans text-[10px] font-black uppercase tracking-[0.2em] border border-slate-200/50 hover:border-current transition-all shadow-sm bg-white/50 backdrop-blur-sm"
    >
      ✨ Lascia un pensiero o una dedica
    </button>
  ) : (
    <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 animate-in slide-in-from-top-4 duration-300 text-left">
      {status === 'success' ? (
        /* SCHERMATA DI CONFERMA DOPO L'INVIO */
        <div className="py-8 text-center space-y-4 animate-in fade-in zoom-in duration-300">
          <div className="text-3xl">✨</div>
          <h3 className="font-black uppercase text-[10px] tracking-[0.2em]" style={{ color: profile.accent_color }}>
            Grazie per il tuo pensiero
          </h3>
          <p className="text-sm text-slate-500 font-light italic">
            {isPublic 
              ? "La tua dedica è stata pubblicata sulla pagina." 
              : "Il tuo messaggio privato è stato inviato alla famiglia."}
          </p>
        </div>
      ) : (
        /* IL FORM ORIGINALE */
        <form onSubmit={handleSubmit} className="space-y-6">
          <textarea 
            required placeholder="Il tuo ricordo..."
            className="w-full h-32 p-4 bg-slate-50 rounded-2xl outline-none text-sm border border-transparent focus:border-slate-100 transition-all text-slate-800"
            value={content} onChange={(e) => setContent(e.target.value)}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              type="text" placeholder="Firma"
              className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-sm border border-transparent focus:border-slate-100 transition-all text-slate-800"
              value={author} onChange={(e) => setAuthor(e.target.value)}
            />
            <div className="flex p-1 bg-slate-100 rounded-2xl">
              <button type="button" onClick={() => setIsPublic(true)} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${isPublic ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>Pubblico</button>
              <button type="button" onClick={() => setIsPublic(false)} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${!isPublic ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>Privato</button>
            </div>
          </div>
          <button 
            type="submit" disabled={status === 'sending'}
            style={{ backgroundColor: profile.accent_color }}
            className="w-full py-5 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {status === 'sending' ? (
              <>
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Invio in corso...
              </>
            ) : 'Pubblica'}
          </button>
          <button type="button" onClick={() => setIsOpen(false)} className="w-full text-[9px] font-black uppercase text-slate-300 tracking-widest">Annulla</button>
        </form>
      )}
    </div>
  )}
</div>
  );
}

// --- PAGINA PRINCIPALE ---
export default function PublicProfile({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [profile, setProfile] = useState<any>(null);
  const [gallery, setGallery] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'media'>('home');
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchPublicData = async () => {
    const { data: profileData } = await supabase.from('profiles').select('*').eq('slug', slug).single();
    if (profileData) {
      setProfile(profileData);
      
      // Carichiamo gallery e messaggi solo se il profilo è pubblicato
      if (profileData.is_published !== false) {
        const { data: items } = await supabase.from('gallery_items').select('*').eq('owner_id', profileData.owner_id).order('position', { ascending: true });
        if (items) setGallery(items);
        const { data: msgData } = await supabase.from('messages').select('*').eq('profile_id', profileData.id).eq('is_public', true).order('created_at', { ascending: false });
        if (msgData) setMessages(msgData);
      }
    }
    setLoading(false);
  };

  useEffect(() => { if (slug) fetchPublicData(); }, [slug]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // --- LOGICA VIDEO ---
  const VideoPlayer = ({ url }: { url: string }) => {
    if (!url) return null;
    const cleanUrl = url.trim();
    if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
      const id = cleanUrl.includes('v=') ? cleanUrl.split('v=')[1].split('&')[0] : cleanUrl.includes('shorts/') ? cleanUrl.split('shorts/')[1].split('?')[0] : cleanUrl.split('/').pop()?.split('?')[0];
      return <iframe className="w-full h-full aspect-video" src={`https://www.youtube.com/embed/${id}`} allowFullScreen />;
    }
    if (cleanUrl.includes('vimeo.com')) {
      const id = cleanUrl.split('/').pop()?.split('?')[0];
      return <iframe className="w-full h-full aspect-video" src={`https://player.vimeo.com/video/${id}`} allowFullScreen />;
    }
    if (cleanUrl.includes('tiktok.com')) {
      const id = cleanUrl.split('/video/')[1]?.split('?')[0];
      return <iframe className="w-full h-full aspect-video" src={`https://www.tiktok.com/embed/v2/${id}`} allowFullScreen />;
    }
    return <video src={cleanUrl} controls className="w-full h-full aspect-video object-cover" />;
  };

  // --- LOADING STATE ---
  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-[10px] uppercase tracking-[0.5em] text-slate-300">In Memoria...</div>;

  // --- PAGINA NON TROVATA ---
  if (!profile) return <div className="min-h-screen flex items-center justify-center font-serif italic text-slate-400">Profilo non trovato.</div>;

  // --- INTEGRAZIONE BLOCCO MODERAZIONE (PAGINA INTERA - LAYOUT BIANCO) ---
  if (profile.is_published === false) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex flex-col justify-between text-center animate-in fade-in duration-1000">
        
        {/* Header Istituzionale (Logo) */}
        <header className="w-full">
          <nav className="flex justify-between items-center px-8 py-10 max-w-7xl mx-auto">
            <div className="text-xl font-black uppercase tracking-[0.3em] italic text-slate-800">
              Soul<span className="opacity-30">Book</span>
            </div>
          </nav>
        </header>

        {/* Messaggio Centrale */}
        <div className="flex-grow flex flex-col justify-center items-center px-8">
          <div className="space-y-6">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 max-w-xs leading-relaxed mx-auto">
              Questa pagina è momentaneamente sospesa <br/> o in fase di revisione.
            </p>
          </div>
        </div>

        {/* Footer Bianco (dal tuo Layout.tsx) */}
        <footer className="w-full pb-12 px-6">
          <div className="max-w-4xl mx-auto space-y-12">
            
            {/* Prefooter personalizzato per l'utente */}
            <div className="space-y-6">
              <div className="w-12 h-[0.5px] bg-slate-200 mx-auto opacity-50"></div>
              <p className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.8em] leading-loose text-slate-400">
                SoulBook di <br className="md:hidden" /> {profile.full_name}
              </p>
              <div className="w-12 h-[0.5px] bg-slate-200 mx-auto opacity-50"></div>
            </div>

            {/* Crediti Istituzionali Bianchi */}
            <div className="space-y-6">
              <div className="text-sm font-serif italic text-slate-400">
                SoulBook &mdash; Custodisci la tua storia.
              </div>
              
              <div className="space-y-3">
                <div className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-300 leading-relaxed">
                  © 2026 SOULBOOK DIGITAL SERVICES — PROPRIETÀ DI GIOVANNI CODA MER
                </div>
                <div className="flex justify-center gap-6 text-[8px] font-black uppercase tracking-[0.5em] text-slate-300">
                  <Link href="/privacy" className="hover:text-slate-900 transition-colors">PRIVACY & COOKIE POLICY</Link>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );

  }

  // --- LOGICA RENDERING NORMALE ---
  const images = gallery.filter(i => i.type === 'image');
  const videos = gallery.filter(i => i.type !== 'image');
  const fontClass = profile.font_family === 'serif' ? 'font-serif' : profile.font_family === 'mono' ? 'font-mono' : 'font-sans';

  return (
    <div className={`min-h-screen ${fontClass} text-slate-800 relative`} style={{ backgroundColor: profile.page_bg_color }}>
      <div className="relative z-10">
        
        {/* HEADER SFUMATO */}
        <header className="relative pt-32 pb-12 px-6 text-center">
          {profile.header_bg_url && (
            <div className="absolute inset-0 z-0 h-80 md:h-96">
              <img src={profile.header_bg_url} className="w-full h-full object-cover" alt="" />
              <div className="absolute inset-0 bg-gradient-to-b" style={{ backgroundImage: `linear-gradient(to bottom, transparent, ${profile.page_bg_color})` }}></div>
              <div className="absolute inset-0" style={{ backgroundColor: `${profile.page_bg_color}66` }}></div>
            </div>
          )}
          <div className="relative z-10">
            <div className="inline-block relative">
                <img src={profile.profile_image_url || ''} className="w-32 h-32 md:w-40 md:h-40 rounded-full mx-auto object-cover shadow-2xl border-4 border-white" style={{ borderColor: profile.accent_color }} alt={profile.full_name} />
            </div>
            <h1 className="text-4xl md:text-6xl font-light mt-8 tracking-tight" style={{ color: profile.accent_color }}>{profile.full_name}</h1>
            <p className="text-[10px] tracking-[0.4em] uppercase text-slate-400 font-sans font-black mt-4">
              {formatDate(profile.birth_date) || '...'} — {formatDate(profile.death_date) || 'Sempre'}
            </p>
          </div>
        </header>

        <nav className="flex justify-center border-b border-slate-900/5 mb-16 relative">
          <div className="flex gap-12">
            {['home', 'media'].map((t) => (
              <button key={t} onClick={() => setActiveTab(t as any)} className={`pb-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative ${activeTab === t ? 'opacity-100' : 'opacity-20'}`} style={{ color: profile.accent_color }}>
                {t === 'home' ? 'Memorie' : 'Album Foto'}
                {activeTab === t && <div className="absolute bottom-0 left-0 right-0 h-[1px]" style={{ backgroundColor: profile.accent_color }}></div>}
              </button>
            ))}
          </div>
        </nav>

        <main className="max-w-4xl mx-auto px-6">
          {activeTab === 'home' && (
            <div className="animate-in fade-in duration-700 space-y-24 text-center">
              <section className="space-y-8">
                <div className="space-y-3">
                  <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">La sua storia</h2>
                  <h3 className="text-2xl md:text-3xl font-light tracking-tight italic" style={{ color: profile.accent_color }}>{profile.bio_title || "Un racconto di vita"}</h3>
                </div>
                <div className="max-w-2xl mx-auto text-xl md:text-2xl leading-[1.8] text-slate-600 font-light italic opacity-80">"{profile.bio_content}"</div>
              </section>
              
              <section className="space-y-0 relative">
                <div className="mb-12">
                  <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Pensieri e Dediche</h2>
                  <GuestMessageForm profile={profile} onMessageSent={fetchPublicData} />
                </div>
                <div className="relative max-w-2xl mx-auto mt-12">
                  <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[var(--bg-color)] to-transparent z-10 pointer-events-none" style={{ '--bg-color': profile.page_bg_color } as any}></div>
                  <div className="max-h-[600px] overflow-y-auto no-scrollbar px-4 py-16 space-y-10 relative scroll-smooth">
                    {messages.map((msg, i) => (
                        <div key={i} className="animate-in fade-in duration-500 p-6 md:p-10 border border-slate-100 bg-white/30 backdrop-blur-sm relative group transition-all text-left">
                          <div className="absolute inset-2 border-[0.5px] border-slate-200 opacity-40"></div>
                          <p className="text-lg md:text-xl italic text-slate-700 font-light leading-relaxed relative z-10">
                            "{msg.content}"
                            <span className="block md:inline-block md:ml-4 mt-6 md:mt-0 whitespace-nowrap">
                              <span className="inline-block w-4 h-[1px] bg-slate-200 align-middle mr-3"></span>
                              <span className="text-[10px] font-black uppercase tracking-widest align-middle" style={{ color: profile.accent_color }}>{msg.author_name}</span>
                              <span className="mx-2 text-slate-200 text-[8px] align-middle">•</span>
                              <span className="text-[8px] font-sans text-slate-20 uppercase align-middle">{new Date(msg.created_at).toLocaleDateString()}</span>
                            </span>
                          </p>
                        </div>
                    ))}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[var(--bg-color)] to-transparent z-10 pointer-events-none" style={{ '--bg-color': profile.page_bg_color } as any}></div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'media' && (
            <div className="animate-in fade-in duration-700 space-y-24">
              
              {/* --- SLIDER FOTO E SEPARATORI --- */}
              <div className="relative group/slider">
                <div className="flex items-center justify-between mb-8 px-4 md:px-0">
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600 italic">Memory Book</span>
                  <div className="h-[0.5px] flex-grow mx-8 bg-slate-200/50"></div>
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Immagini</span>
                </div>

                <div className="relative">
                  {/* Frecce Laterali (Solo Desktop) */}
                  <button 
                    onClick={() => scrollRef.current?.scrollBy({ left: -500, behavior: 'smooth' })} 
                    className="hidden md:flex absolute left-[-70px] top-1/2 -translate-y-1/2 w-12 h-24 items-center justify-center text-4xl font-thin text-slate-300 hover:text-slate-900 transition-all opacity-0 group-hover/slider:opacity-100 z-30"
                  >
                    ‹
                  </button>
                  
                  <button 
                    onClick={() => scrollRef.current?.scrollBy({ left: 500, behavior: 'smooth' })} 
                    className="hidden md:flex absolute right-[-70px] top-1/2 -translate-y-1/2 w-12 h-24 items-center justify-center text-4xl font-thin text-slate-300 hover:text-slate-900 transition-all opacity-0 group-hover/slider:opacity-100 z-30"
                  >
                    ›
                  </button>

                  {/* Contenitore Scrollabile */}
                  <div 
                    ref={scrollRef} 
                    className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-6 md:gap-12 pb-10 cursor-grab active:cursor-grabbing"
                  >
            

{gallery
  .filter(i => i.type === 'image' || i.type === 'separator')
  .map((item, idx) => (
    /* Cambiato: w-auto invece di w-[500px] per permettere 
       al contenitore di adattarsi alla larghezza dell'immagine 
    */
    <div key={idx} className="snap-center shrink-0 w-auto min-w-[300px] max-w-[95vw]">
      {item.type === 'separator' ? (
        /* RENDERING SEPARATORE - Rimane fisso per coerenza */
        <div className="bg-white p-6 md:p-10 shadow-sm border border-slate-100 h-full flex flex-col justify-center items-center text-center w-[85vw] md:w-[500px]">
          <div className="aspect-[4/5] w-full flex flex-col justify-center items-center border-[0.5px] border-slate-100 p-8 space-y-6">
            <div className="w-8 h-[1px]" style={{ backgroundColor: profile.accent_color }}></div>
            <h3 className="text-2xl md:text-3xl font-serif italic tracking-tight leading-relaxed" style={{ color: profile.accent_color }}>
              {item.url}
            </h3>
            <div className="w-8 h-[1px]" style={{ backgroundColor: profile.accent_color }}></div>
          </div>
        </div>
      ) : (
        /* RENDERING FOTO (Stile Polaroid Dinamica) */
        <div className="bg-white p-4 md:p-6 shadow-sm border border-slate-100 relative group transition-transform duration-500 hover:scale-[1.01]">
          {/* MODIFICA CHIAVE: 
              - Tolto aspect-[4/5]
              - Impostata altezza fissa h-[400px] o h-[500px]
              - Larghezza w-auto
          */}
          <div className="h-[350px] md:h-[500px] w-auto relative border border-slate-200 p-2 md:p-3 flex items-center justify-center">
            <div className="absolute inset-1 border-[0.5px] opacity-10 pointer-events-none" style={{ borderColor: profile.accent_color }}></div>
            <div className="h-full w-auto overflow-hidden bg-slate-50">
              <img 
                src={item.url} 
                className="h-full w-auto object-contain" // object-contain non taglia mai
                alt="" 
              />
            </div>
          </div>
          <div className="mt-6 flex justify-between items-baseline px-1 opacity-30">
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-600">Memory Book</span>
            <span className="text-[9px] font-mono text-slate-400" style={{ color: profile.accent_color }}>{idx + 1}</span>
          </div>
        </div>
      )}
    </div>
  ))}

                  </div>
                </div>
              </div>

              {/* --- SEZIONE VIDEO (GRIGLIA A PARTE) --- */}
              {gallery.filter(i => i.type === 'video' || i.type === 'video_file').length > 0 && (
                <div className="space-y-12 pb-24 border-t border-slate-100 pt-20">
                  <div className="flex items-center justify-between mb-8 px-4 md:px-0">
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600 italic">Memory Book</span>
                    <div className="h-[0.5px] flex-grow mx-8 bg-slate-200/50"></div>
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Le Pellicole</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
                    {gallery
                      .filter(i => i.type === 'video' || i.type === 'video_file')
                      .map((vid, i) => (
                        <div key={i} className="group">
                          <div className="bg-white p-4 md:p-6 shadow-sm border border-slate-100 transition-all duration-700 hover:shadow-xl">
                            <div className="aspect-video relative border border-slate-200 p-2 bg-black overflow-hidden rounded-sm">
                              <VideoPlayer url={vid.url} />
                            </div>
                            <div className="mt-6 flex justify-between items-center px-1">
                              <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 italic">Video Memory</span>
                              <span className="text-[9px] font-mono text-slate-400" style={{ color: profile.accent_color }}>Clip #0{i + 1}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        <footer className="relative mt-20">
          <div className="w-full h-[0.5px] opacity-30 z-20 relative" style={{ backgroundColor: profile.accent_color }}></div>
          <div className="py-24 px-6 text-center z-10 relative" style={{ backgroundColor: `${profile.accent_color}10` }}>
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="w-12 h-[1px] bg-current mx-auto opacity-10" style={{ color: profile.accent_color }}></div>
              <p className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.8em] leading-loose opacity-70" style={{ color: profile.accent_color }}>
                SoulBook di <br className="md:hidden" /> {profile.full_name}
              </p>
              <div className="w-12 h-[1px] bg-current mx-auto opacity-10" style={{ color: profile.accent_color }}></div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}