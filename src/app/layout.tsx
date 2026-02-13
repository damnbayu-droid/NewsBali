import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { BreakingNews } from '@/components/layout/breaking-news'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'NewsBali Online - Investigative Journalism Platform',
    template: '%s | NewsBali Online',
  },
  description: 'Platform jurnalisme investigasi independen untuk Bali. Menyajikan berita berbasis bukti dengan standar etika jurnalisme tinggi.',
  keywords: ['Bali news', 'jurnalisme investigasi', 'berita Bali', 'pariwisata Bali', 'investasi Bali'],
  authors: [{ name: 'NewsBali Team' }],
  icons: {
    icon: '/logo.svg',
  },
  openGraph: {
    title: 'NewsBali Online',
    description: 'Investigative Journalism Platform for Bali',
    url: 'https://newsbali.online',
    siteName: 'NewsBali Online',
    type: 'website',
    locale: 'id_ID',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NewsBali Online',
    description: 'Investigative Journalism Platform for Bali',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased bg-background text-foreground font-sans`} suppressHydrationWarning>
        <div className="min-h-screen flex flex-col">
          <Header />
          <BreakingNews />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
        <Toaster />
      </body>
    </html>
  )
}
