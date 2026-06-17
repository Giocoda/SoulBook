'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

function RegisterContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) setEmail(emailParam)
  }, [searchParams])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError("La password deve contenere almeno 6 caratteri.")
      return
    }
    if (password !== confirmPassword) {
      setError("Le password non coincidono.")
      return
    }

    setLoading(true)

    try {
      // 1. Registrazione dell'utente tramite API (Auth)
      const res = await fetch('/api/register-partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Errore durante l'attivazione")

      // 2. SCRITTURA NEL DATABASE (Tabella Profiles)
      // Recuperiamo l'ID dell'utente appena creato
      const userId = data.user?.id

      if (userId) {
        // Inseriamo o aggiorniamo il profilo assicurandoci che sia segnato come PARTNER
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            owner_id: userId,
            user_email: email,
            full_name: 'Nuovo Partner', // Valore temporaneo
            is_partner: true,
            is_admin: false,
            is_published: false // I partner non sono pubblici come profili utente
          }, { onConflict: 'owner_id' })

        if (profileError) {
          console.error("Errore scrittura profilo:", profileError)
          // Non blocchiamo tutto, ma segnaliamo l'anomalia
        }
      }

      setIsSuccess(true)
      
      setTimeout(() => {
        router.push('/registrati?mode=login&activated=true')
      }, 2500)
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6 font-sans">
      <div className="max-w-md w-full">
        
        {/* Header Semplice */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black uppercase tracking-tighter italic text-slate-900 leading-none">SoulBook</h1>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mt-3">Attivazione Account Partner</p>
        </div>

        <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/40 border border-slate-100">
          {isSuccess ? (
            <div className="py-10 text-center">
              <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl border border-green-100">
                ✓
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-2 uppercase">Attivato!</h2>
              <p className="text-slate-400 text-xs font-bold leading-relaxed uppercase tracking-tight">
                Reindirizzamento al login...
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Benvenuto</h2>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Configura la tua chiave d'accesso</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-1 mb-2 block tracking-widest">Email Autorizzata</label>
                  <input 
                    type="email" 
                    value={email} 
                    readOnly 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 font-bold text-sm outline-none cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-1 mb-2 block tracking-widest">Scegli Password</label>
                  <input 
                    type="password" 
                    placeholder="Minimo 6 caratteri"
                    required
                    className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-sm text-slate-900 font-bold outline-none focus:border-slate-900 transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-1 mb-2 block tracking-widest">Conferma Password</label>
                  <input 
                    type="password" 
                    placeholder="Ripeti la password"
                    required
                    className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-sm text-slate-900 font-bold outline-none focus:border-slate-900 transition-all"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                {error && (
                  <div className="bg-red-50 text-red-500 text-[10px] font-black p-4 rounded-xl border border-red-100 uppercase tracking-tight">
                    ⚠️ {error}
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:bg-blue-600 transition-all disabled:opacity-30 mt-2"
                >
                  {loading ? 'Elaborazione...' : 'Conferma Attivazione'}
                </button>
              </form>
            </>
          )}
        </div>
<p className="mt-6 text-[9px] text-slate-400 font-bold uppercase tracking-tight text-center leading-relaxed">
  Cliccando su conferma, dichiari di aver preso visione della nostra <br/>
  <Link href="/privacy" className="text-slate-900 underline hover:text-blue-600 ml-1 transition-colors">
    Privacy & Cookie Policy
  </Link>
</p>
        
      </div>
    </div>
  )
}

export default function RegisterPartner() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-black text-[10px] uppercase tracking-widest text-slate-400">Loading Registration...</div>}>
      <RegisterContent />
    </Suspense>
  )
}