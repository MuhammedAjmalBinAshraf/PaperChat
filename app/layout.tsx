import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Paperchat',
  description: 'Minimal, real-time group chat web app optimized for eReader browsers.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
  return (
    <html lang="en">
      <body>
        <main className="max-w-xl mx-auto px-4 py-6 min-h-screen flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
