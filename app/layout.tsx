import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CookieBanner from '@/components/CookieBanner'; 
import Link from 'next/link';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SoulBook | Custodisci la tua storia",
  description: "Un luogo elegante per preservare i ricordi di chi ami.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen bg-white text-slate-900`}>
        
        {/* Main content che spinge il footer in basso */}
        <main className="flex-grow">
          {children}
        </main>

        {/* --- FOOTER GLOBALE STILE SOULBOOK --- */}
        <footer className="py-20 border-t border-slate-100 text-center space-y-10 bg-white">
          
          {/* Tagline originale */}
          <div className="text-sm font-serif italic text-slate-400">
            SoulBook &mdash; Custodisci la tua storia.
          </div>

          {/* Dettagli proprietà e Privacy */}
          <div className="space-y-4">
            <div className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-300">
              &copy; 2026 SoulBook Digital Services — Proprietà di Giovanni Coda Mer
            </div>
            
            <div>
              <Link 
                href="/privacy" 
                className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-300 hover:text-slate-900 transition-colors border-b border-transparent hover:border-slate-200 pb-1"
              >
                Privacy & Cookie Policy
              </Link>
            </div>
          </div>

        </footer>

        {/* Banner Cookie */}
        <CookieBanner />
      </body>
    </html>
  );
}