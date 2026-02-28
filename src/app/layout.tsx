import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from '@/components/Sidebar';
import { ClientInitializer } from '@/components/ClientInitializer';
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lyfe Dashboard",
  description: "Personal Lyfe Dashboard and Workspace",
  manifest: "/manifest.json",
  themeColor: "#000000",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Lyfe",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false, // critical for PWA "app feel"
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white h-[100dvh] overflow-hidden selection:bg-blue-500/30`}
      >
        <ClientInitializer>
          <div className="flex flex-col md:flex-row h-full">
            <Sidebar />
            <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
              {children}
            </main>
          </div>
        </ClientInitializer>
      </body>
    </html>
  );
}
