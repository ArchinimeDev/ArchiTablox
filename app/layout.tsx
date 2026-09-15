import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { PWARegister } from './components/PWARegister';
import { ThemeProvider } from './components/ThemeProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ArchiTablox',
  description:
    'Tablero Kanban colaborativo en tiempo real. Organiza proyectos con tu equipo.',
  applicationName: 'ArchiTablox',
  appleWebApp: {
    capable: true,
    title: 'ArchiTablox',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icon.svg', type: 'image/svg+xml' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#f8fafc',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

// Script que se ejecuta ANTES de que React hidrate.
// Lee el tema guardado y lo aplica al <html> para evitar flash.
const themeInitScript = `
(function() {
  try {
    var t = localStorage.getItem('architablox-theme') || 'light';
    var valid = ['light','dark','midnight','forest','sunset','rose'];
    if (valid.indexOf(t) === -1) t = 'light';
    document.documentElement.setAttribute('data-theme', t);
    var isDark = t === 'dark' || t === 'midnight' || t === 'forest';
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider />
        {children}
        <PWARegister />
      </body>
    </html>
  );
}