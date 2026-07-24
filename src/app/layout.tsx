import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Blaze Double Pro',
  description: 'Análise preditiva em tempo real para Blaze Double',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
