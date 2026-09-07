'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

const LINKS = [
  { href: '/daftar-series', label: 'Daftar Series' },
  { href: '/hentai', label: 'Hentai' },
  { href: '/manga', label: 'Komik' },
  { href: '/uncensored', label: 'Uncensored' },
];

function isActive(pathname: string | null, href: string) {
  return pathname === href || !!pathname?.startsWith(`${href}/`);
}

export function DesktopNavLinks() {
  const pathname = usePathname();
  return (
    <>
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            'transition-colors hover:text-foreground',
            isActive(pathname, link.href) ? 'font-semibold text-foreground' : 'text-foreground/60'
          )}
        >
          {link.label}
        </Link>
      ))}
    </>
  );
}

export function MobileNavLinks() {
  const pathname = usePathname();
  return (
    <>
      {LINKS.map((link) => (
        <DropdownMenuItem key={link.href} className="cursor-pointer rounded-lg p-0 focus:bg-muted/50">
          <Link
            href={link.href}
            className={cn(
              'block w-full px-3 py-2 font-medium',
              isActive(pathname, link.href) && 'text-primary'
            )}
          >
            {link.label}
          </Link>
        </DropdownMenuItem>
      ))}
    </>
  );
}
