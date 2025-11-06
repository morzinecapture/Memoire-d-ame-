import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Mémoire d'âme",
  description: 'Capturez et préservez les histoires de vie',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
