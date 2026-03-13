import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CookieBanner from '@/components/CookieBanner'; 
// 1. Importiamo il nuovo componente
import Footer from '../components/Footer'; 

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

        {/* --- 2. USIAMO IL COMPONENTE GLOBALE --- */}
        <Footer />

        {/* Banner Cookie */}
        <CookieBanner />
      </body>
    </html>
  );
}