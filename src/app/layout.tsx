import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider, themeScript } from '@/components/theme';
import { ToastProvider } from '@/components/ui';

export const metadata: Metadata = {
  title: {
    default: 'Julia Stille · Mäklarplattform',
    template: '%s · Julia Stille',
  },
  description:
    'Personlig arbetsyta för Julia Stille — objekt, kunder, visningar, budgivning, dokument och en AI-assistent driven av Claude.',
  applicationName: 'Julia Stille Mäkleri',
  authors: [{ name: 'Stilledev' }],
  creator: 'Stilledev',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
  },
  openGraph: {
    title: 'Julia Stille · Mäklarplattform',
    description:
      'Objekt, kunder, visningar, budgivning och AI-assistent — allt på ett ställe.',
    type: 'website',
    locale: 'sv_SE',
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f1e9' },
    { media: '(prefers-color-scheme: dark)', color: '#181614' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
