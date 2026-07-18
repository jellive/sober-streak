import type { Metadata, Viewport } from 'next';
import 'pretendard/dist/web/variable/pretendardvariable.css';
import './globals.css';
import { AppShell } from '@/components/AppShell';

export const metadata: Metadata = { title: 'Sober Streak', description: '금주 스트릭 트래커' };
export const viewport: Viewport = { themeColor: '#071722', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body><AppShell>{children}</AppShell></body>
    </html>
  );
}
