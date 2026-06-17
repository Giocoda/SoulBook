import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CookieBanner from '@/components/CookieBanner'; 
import Footer from '../components/Footer'; 

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// CONFIGURAZIONE METADATI CON ICONA SB HD (DARK & SILVER)
export const metadata: Metadata = {
  title: "SoulBook | Custodisci la tua storia",
  description: "Un luogo elegante per preservare i ricordi di chi ami.",
  icons: {
    icon: [
      {
        url: "/favicon-sb.svg?v=2", // Nome aggiornato e versione v=2
        type: "image/svg+xml",
      },
    ],
    apple: [
      {
        url: "/favicon-sb.svg?v=2",
        type: "image/svg+xml",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className="scroll-smooth">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen bg-white text-slate-900`}>
        
        {/* Main content che spinge il footer in basso */}
        <main className="flex-grow">
          {children}
        </main>

        {/* Footer Globale */}
        <Footer />

        {/* Banner Cookie */}
        <CookieBanner />
      </body>
    </html>
  );
}