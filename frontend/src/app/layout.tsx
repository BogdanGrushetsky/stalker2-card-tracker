import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'S.T.A.L.K.E.R. 2 — Колекція',
  description: 'Трекер колекційних карт S.T.A.L.K.E.R. 2 × ATB 2026',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}
