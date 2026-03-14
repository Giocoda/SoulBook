// components/Footer.tsx
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full bg-white py-20 px-8 border-t border-slate-50">
      <div className="max-w-7xl mx-auto text-center space-y-12">
        
        {/* Slogan Istituzionale */}
        <div className="text-sm font-serif italic text-slate-400">
          SoulBook &mdash; Custodisci la tua storia.
        </div>
        
        {/* Crediti Legali */}
        <div className="space-y-4">
          <div className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-300 leading-relaxed">
            &copy; 2026 SOULBOOK DIGITAL SERVICES — PROPRIETÀ DI GIOVANNI CODA MER
          </div>
          
          <div className="flex justify-center gap-8 text-[8px] font-black uppercase tracking-[0.5em] text-slate-300">
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">
              PRIVACY & COOKIE POLICY
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}