'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface GuestMessageFormProps {
  profileId: string;
}

export default function GuestMessageForm({ profileId }: GuestMessageFormProps) {
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');

    const { error } = await supabase
      .from('messages')
      .insert([
        { 
          profile_id: profileId, 
          author_name: author || 'Anonimo', 
          content: content,
          is_public: isPublic 
        },
      ]);

    if (error) {
      console.error(error);
      setStatus('error');
    } else {
      setStatus('success');
      setAuthor('');
      setContent('');
      // Reset del messaggio di successo dopo 3 secondi
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-100">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Lascia un pensiero</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <input 
          type="text" 
          placeholder="Tuo nome (opzionale)"
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
        
        <textarea 
          required
          placeholder="Scrivi qui il tuo messaggio..."
          className="w-full p-2 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-700">Rendi pubblico</span>
            <span className="text-xs text-gray-500">Chiunque visiti la pagina potrà leggerlo</span>
          </div>
          <button 
            type="button"
            onClick={() => setIsPublic(!isPublic)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isPublic ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        <button 
          type="submit" 
          disabled={status === 'sending'}
          className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all disabled:bg-blue-300"
        >
          {status === 'sending' ? 'Invio in corso...' : 'Invia Ricordo'}
        </button>

        {status === 'success' && (
          <p className="text-green-600 text-center text-sm font-medium animate-pulse">
            Messaggio inviato con successo!
          </p>
        )}
        {status === 'error' && (
          <p className="text-red-600 text-center text-sm font-medium">
            Si è verificato un errore. Riprova.
          </p>
        )}
      </form>
    </div>
  );
}