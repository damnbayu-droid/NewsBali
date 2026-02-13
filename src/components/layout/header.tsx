'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, Search, User, X, Globe } from 'lucide-react'
import { Input } from '@/components/ui/input'

const categories = {
  en: [
    { href: '/category/tourism', label: 'Tourism' },
    { href: '/category/investment', label: 'Investment' },
    { href: '/category/incidents', label: 'Incidents' },
    { href: '/category/local', label: 'Local' },
    { href: '/category/jobs', label: 'Jobs' },
    { href: '/category/opinion', label: 'Opinion' },
  ],
  id: [
    { href: '/category/tourism', label: 'Pariwisata' },
    { href: '/category/investment', label: 'Investasi' },
    { href: '/category/incidents', label: 'Insiden' },
    { href: '/category/local', label: 'Lokal' },
    { href: '/category/jobs', label: 'Pekerjaan' },
    { href: '/category/opinion', label: 'Opini' },
  ],
}

const translations = {
  en: {
    search: 'Search articles...',
    submitReport: 'Submit Report',
    transparency: 'Transparency',
    about: 'About',
    login: 'Login',
    register: 'Register',
    categories: 'Categories',
    tagline: 'Investigative Journalism',
  },
  id: {
    search: 'Cari artikel...',
    submitReport: 'Kirim Laporan',
    transparency: 'Transparansi',
    about: 'Tentang',
    login: 'Masuk',
    register: 'Daftar',
    categories: 'Kategori',
    tagline: 'Jurnalisme Investigasi',
  },
}

// Helper to get initial language - default to English
function getSavedLang(): 'en' | 'id' {
  if (typeof window === 'undefined') return 'en'
  return (localStorage.getItem('lang') as 'en' | 'id') || 'en'
}

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [lang, setLang] = useState<'en' | 'id'>('en')
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setLang(getSavedLang())
    setHydrated(true)
  }, [])

  const toggleLang = () => {
    const newLang = lang === 'en' ? 'id' : 'en'
    setLang(newLang)
    localStorage.setItem('lang', newLang)
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'lang',
      newValue: newLang,
    }))
  }

  const t = translations[lang]
  const cats = categories[lang]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-foreground">
              News<span className="text-primary">Bali</span>
            </span>
            <span className="text-[10px] text-muted-foreground -mt-1">
              {t.tagline}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-1">
          {cats.map((category) => (
            <Link
              key={category.href}
              href={category.href}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {category.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {searchOpen ? (
            <div className="flex items-center space-x-2">
              <Input
                type="search"
                placeholder={t.search}
                className="w-48 md:w-64"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              {/* Language Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLang}
                className="gap-1"
              >
                <Globe className="h-4 w-4" />
                <span className="text-xs font-semibold">{lang === 'en' ? 'EN' : 'ID'}</span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(true)}
                className="hidden sm:flex"
              >
                <Search className="h-4 w-4" />
              </Button>

              <Link href="/login">
                <Button variant="ghost" size="icon">
                  <User className="h-4 w-4" />
                </Button>
              </Link>

              {/* Mobile Menu */}
              {hydrated && (
                <Sheet key={`sheet-${lang}`}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="lg:hidden">
                      <Menu className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80">
                    <nav className="flex flex-col space-y-4 mt-8">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-muted-foreground">
                          {t.categories}
                        </span>
                      </div>
                      {cats.map((category) => (
                        <Link
                          key={category.href}
                          href={category.href}
                          className="px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors"
                        >
                          {category.label}
                        </Link>
                      ))}
                      <hr className="my-2" />
                      <Link
                        href="/submit-report"
                        className="px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors"
                      >
                        {t.submitReport}
                      </Link>
                      <Link
                        href="/transparency"
                        className="px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors"
                      >
                        {t.transparency}
                      </Link>
                      <Link
                        href="/about"
                        className="px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors"
                      >
                        {t.about}
                      </Link>
                      <hr className="my-2" />
                      <Link href="/login">
                        <Button className="w-full">{t.login}</Button>
                      </Link>
                      <Link href="/register">
                        <Button variant="outline" className="w-full">
                          {t.register}
                        </Button>
                      </Link>
                    </nav>
                  </SheetContent>
                </Sheet>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  )
}
