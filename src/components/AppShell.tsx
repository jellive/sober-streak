'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/', label: '메인' },
  { href: '/calendar', label: '캘린더' },
  { href: '/settings', label: '설정' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>{children}</main>
      <nav aria-label="주 메뉴" style={{ display: 'flex', justifyContent: 'space-around', padding: '10px 0 calc(10px + env(safe-area-inset-bottom))', borderTop: '1px solid var(--line)' }}>
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} aria-current={path === t.href ? 'page' : undefined}
            style={{
              color: path === t.href ? 'var(--ink)' : 'var(--muted)',
              textDecoration: 'none',
              fontWeight: path === t.href ? 700 : 500,
              fontSize: 14,
              minWidth: 'var(--tap)',
              minHeight: 'var(--tap)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            {t.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
