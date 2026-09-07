import Link from 'next/link';
import { ChevronDown, Layers, Menu } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DesktopNavLinks, MobileNavLinks } from '@/components/NavLinks';
import { SearchBox } from '@/components/SearchBox';

const COLLECTIONS = [
  { href: '/jav', label: 'JAV' },
  { href: '/2d', label: '2D' },
  { href: '/genre', label: 'Genre' },
  { href: '/studio', label: 'Studio' },
  { href: '/producer', label: 'Producer' },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container relative mx-auto flex h-14 max-w-screen-2xl items-center justify-between gap-4 px-4">
        {/* Logo — visible on all screen sizes now */}
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
            H
          </span>
          <span className="hidden font-bold sm:inline-block">Henkana</span>
        </Link>

        {/* Desktop nav — absolutely centered on the header, independent of
            logo/search width so it sits at true page-center */}
        <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-6 text-sm font-medium md:flex">
          <DesktopNavLinks />

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-primary transition-colors hover:bg-primary/20 focus:outline-none">
              <Layers className="h-3.5 w-3.5" />
              <span>Kumpulan</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="mt-4 w-48 rounded-xl border-border/50 bg-background shadow-xl">
              {COLLECTIONS.map((c) => (
                <DropdownMenuItem key={c.href} className="cursor-pointer rounded-lg p-0 focus:bg-muted/50">
                  <Link href={c.href} className="block w-full px-3 py-2 font-medium">
                    {c.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Right side: search + mobile menu */}
        <div className="flex items-center justify-end gap-2">
          <div className="min-w-0 flex-1 md:flex-none">
            <SearchBox />
          </div>

          {/* Mobile menu — reuses the same DropdownMenu primitives as Kumpulan */}
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Open menu"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border/60 text-foreground/70 transition-colors hover:bg-muted focus:outline-none md:hidden"
            >
              <Menu className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="mt-4 w-56 rounded-xl border-border/50 bg-background shadow-xl">
              <MobileNavLinks />
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="px-3 text-xs font-semibold text-muted-foreground">
                Kumpulan
              </DropdownMenuLabel>
              {COLLECTIONS.map((c) => (
                <DropdownMenuItem key={c.href} className="cursor-pointer rounded-lg p-0 focus:bg-muted/50">
                  <Link href={c.href} className="block w-full px-3 py-2 font-medium">
                    {c.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}