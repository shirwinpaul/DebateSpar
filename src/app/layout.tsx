import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Inter, Noto_Sans_Tamil, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const tamil = Noto_Sans_Tamil({ subsets: ["tamil"], variable: "--font-noto-tamil" });
const deva = Noto_Sans_Devanagari({ subsets: ["devanagari"], variable: "--font-noto-deva" });

export const metadata: Metadata = {
  title: "DebateDojo — AI Debate Sparring Partner",
  description: "Sharpen your arguments. Spar with AI. Get judged and coached.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0b1120" };

// Runs before paint so the saved theme doesn't flash.
const themeScript = `try{var t=localStorage.getItem("dd.theme");document.documentElement.classList.add(t==="light"?"light":"dark")}catch(e){document.documentElement.classList.add("dark")}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${bebas.variable} ${inter.variable} ${tamil.variable} ${deva.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-screen flex-col antialiased">
        <a href="#main" className="btn btn-gold sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50">
          Skip to content
        </a>
        <Header />
        <main id="main" className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
