'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import QRCode from 'react-qr-code';

/**
 * FUNZIONE DI SUPPORTO: Comprime e ridimensiona l'immagine lato client.
 */
const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 1200;
        if (width > height) {
          if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
        } else {
          if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else { resolve(file); }
        }, 'image/jpeg', 0.7);
      };
    };
  });
};

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'content' | 'messages'>('content');
  
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [bioTitle, setBioTitle] = useState('');
  const [bioContent, setBioContent] = useState('');
  
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const [accentColor, setAccentColor] = useState('#4A4440');
  const [fontFamily, setFontFamily] = useState('sans');
  const [pageBgColor, setPageBgColor] = useState('#ffffff');

  const qrValue = useMemo(() => {
    if (typeof window !== 'undefined' && profile?.slug) {
      return `${window.location.origin}/${profile.slug}`;
    }
    return '';
  }, [profile?.slug]);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/registrati'); return; }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('owner_id', user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
      setFullName(profileData.full_name || '');
      setBirthDate(profileData.birth_date || '');
      setDeathDate(profileData.death_date || '');
      setBioTitle(profileData.bio_title || '');
      setBioContent(profileData.bio_content || '');
      setAccentColor(profileData.accent_color || '#4A4440');
      setFontFamily(profileData.font_family || 'sans');
      setPageBgColor(profileData.page_bg_color || '#ffffff');

      const { data: msgData } = await supabase
        .from('messages')
        .select('*')
        .eq('profile_id', profileData.id)
        .order('created_at', { ascending: false });
      if (msgData) setMessages(msgData);
    }

    const { data: items } = await supabase
      .from('gallery_items')
      .select('*')
      .eq('owner_id', user.id)
      .order('position', { ascending: true }); 

    if (items) setGalleryItems(items);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []); 

  const saveProfileData = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ 
        full_name: fullName, birth_date: birthDate || null, death_date: deathDate || null,
        bio_title: bioTitle, bio_content: bioContent, accent_color: accentColor,
        font_family: fontFamily, page_bg_color: pageBgColor
      })
      .eq('owner_id', profile.owner_id);
    if (!error) alert("Modifiche salvate!");
    setIsSaving(false);
  };

  const downloadQRCode = () => {
    const svg = document.querySelector("#qr-code-download svg") as SVGGraphicsElement;
    if (!svg) return;
    const canvas = document.createElement("canvas");
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      canvas.width = 1000; canvas.height = 1000;
      const ctx = canvas.getContext("2d");
      ctx!.fillStyle = "white"; ctx!.fillRect(0, 0, canvas.width, canvas.height);
      ctx!.drawImage(img, 50, 50, 900, 900);
      URL.revokeObjectURL(url);
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `qrcode-${profile?.slug || 'soulbook'}.png`;
      downloadLink.click();
    };
    img.src = url;
  };

  const addSeparator = async () => {
    const title = prompt("Inserisci il titolo della sezione (es: Gli anni della gioventù):");
    if (!title) return;
    const { error } = await supabase.from('gallery_items').insert({
      owner_id: profile.owner_id,
      url: title, 
      type: 'separator',
      position: galleryItems.length
    });
    if (!error) fetchData();
  };
  
  const handleFileUpload = async (e: any, bucket: string) => {
    const rawFiles = e.target?.files || e.dataTransfer?.files;
    if (!rawFiles || rawFiles.length === 0 || !profile) return;
    setIsSaving(true); 
    const fileList = Array.from(rawFiles as FileList);
    for (const file of fileList) {
      let fileToUpload = file;
      if (file.type.startsWith('image/') && bucket !== 'videos') {
        fileToUpload = await compressImage(file);
      }
      const filePath = `${profile.owner_id}/${Date.now()}_${fileToUpload.name}`;
      const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, fileToUpload);
      if (!uploadError) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        const publicUrl = data.publicUrl;
        if (bucket === 'avatars') {
          await supabase.from('profiles').update({ profile_image_url: publicUrl }).eq('owner_id', profile.owner_id);
        } else if (bucket === 'header_covers') {
          await supabase.from('profiles').update({ header_bg_url: publicUrl }).eq('owner_id', profile.owner_id);
        } else {
          await supabase.from('gallery_items').insert({ 
            owner_id: profile.owner_id, url: publicUrl, 
            type: bucket === 'gallery' ? 'image' : 'video_file',
            position: galleryItems.length 
          });
        }
      }
    }
    fetchData();
    setIsSaving(false);
  };

  const deleteItem = async (item: any) => {
    if (!confirm("Eliminare definitivamente?")) return;
    try {
      if (item.type === 'image' || item.type === 'video_file') {
        const bucket = item.type === 'image' ? 'gallery' : 'videos';
        const fileName = item.url.split(`${bucket}/`)[1];
        if (fileName) await supabase.storage.from(bucket).remove([fileName]);
      }
      await supabase.from('gallery_items').delete().eq('id', item.id);
      fetchData();
    } catch (e) { alert("Errore"); }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm("Vuoi eliminare questo messaggio?")) return;
    const { error } = await supabase.from('messages').delete().eq('id', id);
    if (!error) fetchData();
  };

  const VideoPlayer = ({ url }: { url: string }) => {
    if (!url) return null;
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const id = url.includes('v=') ? url.split('v=')[1].split('&')[0] : url.split('/').pop()?.split('?')[0];
      return <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${id}`} allowFullScreen />;
    }
    if (url.includes('vimeo.com')) {
      const id = url.split('/').pop()?.split('?')[0];
      return <iframe className="w-full h-full" src={`https://player.vimeo.com/video/${id}`} allowFullScreen />;
    }
    if (url.includes('tiktok.com')) {
      const id = url.split('/video/')[1]?.split('?')[0];
      return <iframe className="w-full h-full" src={`https://www.tiktok.com/embed/v2/${id}`} allowFullScreen />;
    }
    return <video src={url} controls className="w-full h-full object-cover" />;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-stone-400 uppercase tracking-widest animate-pulse">Soulbook...</div>;

  return (
    <div className="min-h-screen bg-[#F6F5F2] pb-20 font-sans text-stone-900">
      <nav className="bg-white border-b border-stone-200 px-4 md:px-8 py-4 md:py-5 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center justify-between w-full md:w-auto">
            <h1 className="font-bold uppercase text-lg tracking-wider text-stone-800">
              Soulbook <span className="font-light text-stone-400">Admin</span>
            </h1>
            <button onClick={() => supabase.auth.signOut().then(() => router.push('/registrati'))} className="md:hidden px-4 py-2 bg-red-50 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-red-100">Esci</button>
          </div>
          <div className="flex bg-stone-100 p-1 rounded-xl gap-1 w-full md:w-auto">
            <button onClick={() => setActiveTab('content')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'content' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-400'}`}>Contenuti</button>
            <button onClick={() => setActiveTab('messages')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'messages' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-400'}`}>Messaggi ({messages.length})</button>
          </div>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/registrati'))} className="hidden md:block px-5 py-2.5 bg-stone-50 text-stone-400 hover:text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest">Esci</button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-6 space-y-8 mt-4">
        {activeTab === 'content' ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* INTESTAZIONE: PROFILO + QR CODE */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-stone-100 flex flex-col md:flex-row items-center gap-10">
                <div className="relative group">
                  <img src={profile?.profile_image_url || 'https://via.placeholder.com/150'} className="w-36 h-36 rounded-xl object-cover border border-stone-50 shadow-md" alt="Profile" />
                  <label className="absolute -bottom-2 -right-2 bg-stone-800 text-white p-2.5 rounded-lg cursor-pointer hover:bg-stone-600 shadow-lg">
                    <input type="file" hidden accept="image/*" onChange={(e) => handleFileUpload(e, 'avatars')} />
                    <span className="text-[10px] font-bold uppercase">Foto</span>
                  </label>
                </div>
                <div className="flex-1 space-y-4 text-center md:text-left">
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="text-3xl font-bold bg-transparent border-b border-stone-100 focus:border-stone-400 outline-none w-full" placeholder="Nome e Cognome" />
                  <div className="flex flex-wrap justify-center md:justify-start gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold uppercase text-stone-400 ml-1">Nascita</label>
                      <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="bg-stone-50 p-2 rounded-lg text-xs font-bold outline-none border border-stone-100 h-[38px]" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold uppercase text-stone-400 ml-1">Morte</label>
                      <div className="flex gap-2">
                        <input type="date" value={deathDate} onChange={(e) => setDeathDate(e.target.value)} className="bg-stone-50 p-2 rounded-lg text-xs font-bold outline-none border border-stone-100 h-[38px]" />
                        <button type="button" onClick={() => setDeathDate('')} style={{ backgroundColor: `${profile.accent_color}15`, color: profile.accent_color, borderColor: `${profile.accent_color}40` }} className="px-3 h-[38px] rounded-lg text-[8px] font-black uppercase border tracking-widest hover:opacity-70 transition-all">∞ Sempre</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 flex flex-col items-center justify-center">
                <div id="qr-code-download" className="p-4 bg-white rounded-xl border border-stone-100 mb-4 shadow-inner">
                  {qrValue && <QRCode value={qrValue} size={110} fgColor="#44403c" />}
                </div>
                <div className="flex flex-col items-center gap-2">
                  <p className="text-[9px] font-bold uppercase text-stone-300 tracking-widest">QR Code</p>
                  <button onClick={downloadQRCode} className="px-3 py-1.5 bg-stone-50 hover:bg-stone-100 text-stone-500 text-[9px] font-black uppercase tracking-tighter rounded-lg border border-stone-100 transition-all flex items-center gap-2">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Scarica PNG
                  </button>
                </div>
              </div>
            </div>

            {/* ESTETICA E STORIA */}
            <div className="bg-white p-10 rounded-2xl shadow-sm border border-stone-100 space-y-8">
              <h3 className="text-xl font-bold uppercase tracking-wide text-stone-700">Impostazioni Estetiche</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase text-stone-400 ml-1">Immagine Copertina</label>
                  <div className="relative h-44 rounded-xl bg-stone-50 border border-dashed border-stone-200 overflow-hidden group">
                    {profile?.header_bg_url ? <img src={profile.header_bg_url} className="w-full h-full object-cover" alt="Cover" /> : <div className="flex items-center justify-center h-full text-stone-300 text-xs italic">Nessuna immagine</div>}
                    <label className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-all cursor-pointer text-white text-[10px] font-bold uppercase">
                      Cambia Copertina <input type="file" hidden accept="image/*" onChange={(e) => handleFileUpload(e, 'header_covers')} />
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase text-stone-400 ml-1">Colore Contrasto </label>
                    <div className="flex items-center gap-3 bg-stone-50 p-3 rounded-xl border border-stone-100">
                      <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-none bg-transparent" />
                      <input type="text" value={accentColor.toUpperCase()} onChange={(e) => setAccentColor(e.target.value)} className="bg-transparent text-[10px] font-mono font-bold w-full outline-none text-stone-500 uppercase" />
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-3">
                    <label className="text-[10px] font-bold uppercase text-stone-400 ml-1">Font</label>
                    <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} className="w-full h-[54px] bg-stone-50 border border-stone-100 rounded-xl px-4 text-xs font-bold outline-none cursor-pointer">
                      <option value="sans">Moderno Pulito (Sans)</option>
                      <option value="serif">Elegante Classico (Serif)</option>
                      <option value="mono">Minimale (Mono)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-10 rounded-2xl shadow-sm border border-stone-100 space-y-6">
              <h3 className="text-xl font-bold uppercase tracking-wide text-stone-700">Storia e Ricordo</h3>
              <input type="text" placeholder="Un titolo significativo..." className="w-full p-4 bg-stone-50 border border-stone-100 rounded-xl font-bold text-lg outline-none" value={bioTitle} onChange={(e) => setBioTitle(e.target.value)} />
              <textarea className="w-full h-40 p-6 bg-stone-50 border border-stone-100 rounded-xl text-stone-600 font-medium outline-none resize-none" placeholder="Scrivi qui i momenti più belli..." value={bioContent} onChange={(e) => setBioContent(e.target.value)} />
            </div>

            {/* GALLERIA CON SPOSTA, DROP E SEPARATORI */}
            <div 
              className="bg-white p-10 rounded-2xl shadow-sm border border-stone-100 transition-all"
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-stone-400', 'bg-stone-50'); }}
              onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-stone-400', 'bg-stone-50'); }}
              onDrop={(e) => { 
                e.preventDefault(); 
                e.currentTarget.classList.remove('border-stone-400', 'bg-stone-50');
                if (e.dataTransfer.files.length > 0) handleFileUpload(e, 'gallery'); 
              }}
            >
              <div className="flex justify-between items-center mb-10">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold uppercase tracking-wide text-stone-700">Galleria</h3>
                  <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Racconta la storia con Titoli e fotografie. Trascina foto e titoli per ordinarli.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={addSeparator} className="px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase border border-stone-200 text-stone-500 hover:bg-stone-50 transition-all">+ Titolo Sezione</button>
                  <label className="bg-stone-800 text-white px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase hover:bg-stone-600 cursor-pointer shadow-md transition-all">
                    + Aggiungi Foto <input type="file" hidden multiple accept="image/*" onChange={(e) => handleFileUpload(e, 'gallery')} />
                  </label>
                </div>
              </div>

              {/* GRIGLIA PIÙ COMPATTA: 3 colonne su mobile, 6 su desktop */}
<div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
  {galleryItems
    .filter(i => i.type === 'image' || i.type === 'separator') // Filtro stretto qui
    .sort((a, b) => (a.position || 0) - (b.position || 0))
    .map((item) => (
      item.type === 'separator' ? (
        /* IL SEPARATORE ORA OCCUPA TUTTA LA RIGA (6 colonne) */
        <div key={item.id} draggable
          className="col-span-3 md:col-span-6 py-4 flex items-center gap-4 group cursor-move"
          /* ... (mantieni gli eventi onDrag/onDrop del separatore) ... */
        >
          <div className="h-[1px] flex-1 bg-stone-100"></div>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400 bg-stone-50 px-4 py-1.5 rounded-full border border-stone-100 italic">
            {item.url}
          </span>
          <div className="h-[1px] flex-1 bg-stone-100"></div>
          <button onClick={() => deleteItem(item)} className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-500 transition-all text-xs">✕</button>
        </div>
      ) : (
        /* ANTEPRIMA FOTO: Più piccola e con padding ridotto */
        <div key={item.id} draggable
          onDragStart={(e) => { e.dataTransfer.setData('text/plain', item.id); e.currentTarget.classList.add('opacity-40'); }}
          onDragEnd={(e) => e.currentTarget.classList.remove('opacity-40')}
          onDragOver={(e) => e.preventDefault()}
          onDrop={async (e) => {
              e.preventDefault(); e.stopPropagation();
              const draggedId = e.dataTransfer.getData('text/plain');
              if (!draggedId || draggedId === item.id) return;
              const items = [...galleryItems];
              const draggedIdx = items.findIndex(i => i.id === draggedId);
              const targetIdx = items.findIndex(i => i.id === item.id);
              const [reorderedItem] = items.splice(draggedIdx, 1);
              items.splice(targetIdx, 0, reorderedItem);
              const updatedItems = items.map((img, index) => ({ ...img, position: index }));
              setGalleryItems(updatedItems);
              await supabase.from('gallery_items').upsert(updatedItems.map(img => ({ id: img.id, position: img.position, owner_id: img.owner_id, url: img.url, type: img.type })));
          }}
          className="group relative aspect-square rounded-lg overflow-hidden border border-stone-100 shadow-sm cursor-move bg-stone-50 transition-all active:scale-95"
        >
          <img src={item.url} className="w-full h-full object-cover pointer-events-none select-none" alt="" />
          <div className="absolute inset-0 bg-stone-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <span className="bg-white/90 px-2 py-0.5 rounded-full text-[7px] font-bold uppercase text-stone-700 shadow-sm border border-stone-100">Sposta</span>
          </div>
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteItem(item); }} className="absolute top-1 right-1 bg-white/90 text-stone-400 w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:text-red-600 text-[10px] transition-all z-30">✕</button>
        </div>
      )
    ))}
</div>
            </div>

            {/* VIDEO */}
            <div className="bg-white p-10 rounded-2xl shadow-sm border border-stone-100">
              <h3 className="text-xl font-bold uppercase tracking-wide text-stone-700 mb-10">Video</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {galleryItems.filter(i => i.type === 'video' || i.type === 'video_file').map((item, i) => (
                  <div key={i} className="group relative aspect-video rounded-xl overflow-hidden bg-stone-900 shadow-xl">
                    <VideoPlayer url={item.url} />
                    <button onClick={() => deleteItem(item)} className="absolute top-4 right-4 bg-white/90 text-stone-400 w-8 h-8 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:text-red-600 font-bold z-20 transition-all">✕</button>
                  </div>
                ))}
                <div className="aspect-video rounded-xl border-2 border-dashed border-stone-100 bg-stone-50 flex flex-col items-center justify-center p-8 space-y-4">
                  <input type="text" placeholder="YouTube, Vimeo o TikTok Link..." value={newVideoUrl} onChange={(e) => setNewVideoUrl(e.target.value)} className="w-full p-3 bg-white rounded-lg border border-stone-200 text-xs outline-none" />
                  <div className="flex gap-2 w-full">
                    <button onClick={async () => {
                        if (!newVideoUrl.trim()) return;
                        await supabase.from('gallery_items').insert({ owner_id: profile.owner_id, url: newVideoUrl.trim(), type: 'video', position: galleryItems.length });
                        setNewVideoUrl(''); fetchData();
                    }} className="flex-1 bg-stone-800 text-white py-3 rounded-lg text-[10px] font-bold uppercase">Salva Link</button>
                    <label className="flex-1 bg-stone-200 text-stone-600 py-3 rounded-lg text-[10px] font-bold uppercase cursor-pointer text-center">Carica File <input type="file" hidden accept="video/*" onChange={(e) => handleFileUpload(e, 'videos')} /></label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* MESSAGGI */
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 text-stone-800">
            <h3 className="text-xl font-bold uppercase tracking-wide text-stone-700 mb-8">Pensieri Dedicati</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-center gap-2 px-2 text-stone-400">
                  <span className="w-2 h-2 bg-stone-200 rounded-full"></span>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest">Privati</h4>
                </div>
                <div className="space-y-4">
                  {messages.filter(m => !m.is_public).map((msg, i) => (
                    <div key={i} className="bg-stone-50 border border-stone-100 p-6 rounded-xl relative">
                      <button onClick={() => deleteMessage(msg.id)} className="absolute top-4 right-4 text-stone-300 hover:text-red-500 transition-colors">✕</button>
                      <p className="text-stone-600 italic mb-3">"{msg.content}"</p>
                      <div className="flex justify-between text-[10px] font-bold uppercase text-stone-400 border-t border-stone-100 pt-3">
                        <span>{msg.author_name}</span>
                        <span>{new Date(msg.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex items-center gap-2 px-2 text-stone-400">
                  <span className="w-2 h-2 bg-green-200 rounded-full"></span>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest">Online</h4>
                </div>
                <div className="space-y-4">
                  {messages.filter(m => m.is_public).map((msg, i) => (
                    <div key={i} className="bg-white border border-stone-100 p-6 rounded-xl relative shadow-sm">
                      <button onClick={() => deleteMessage(msg.id)} className="absolute top-4 right-4 text-stone-300 hover:text-red-500 transition-colors">✕</button>
                      <p className="text-stone-600 italic mb-3">"{msg.content}"</p>
                      <div className="flex justify-between text-[10px] font-bold uppercase text-stone-500 border-t border-stone-50 pt-3">
                        <span>{msg.author_name}</span>
                        <span>{new Date(msg.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER FIXED ACTION */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-stone-200 p-4 z-[100] shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="hidden md:flex items-center gap-2 text-stone-400">
            <span className="text-[10px] font-bold uppercase tracking-widest italic">Personalizza il tuo spazio</span>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <a href={`/${profile?.slug}`} target="_blank" className="flex-1 md:flex-none px-6 py-4 bg-stone-100 text-stone-600 rounded-xl text-[10px] font-bold uppercase hover:bg-stone-200 transition-all text-center">Anteprima</a>
            <button onClick={saveProfileData} disabled={isSaving} className="flex-[2] md:flex-none px-12 py-4 bg-stone-800 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-stone-900 shadow-md transition-all disabled:opacity-50">
              {isSaving ? 'Salvataggio...' : 'Conferma e Pubblica'}
            </button>
          </div>
        </div>
      </div>
      <div className="h-32"></div>
    </div>
  );
}