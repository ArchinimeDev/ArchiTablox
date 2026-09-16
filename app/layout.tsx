import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { PWARegister } from './components/PWARegister';
import { ThemeProvider } from './components/ThemeProvider';
import { ToastProvider } from './components/Toast';

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
// Lee el tema equipado desde el perfil persistido y lo aplica al <html>
// para evitar el "flash" de tema incorrecto en el primer render.
const themeInitScript = `
(function() {
  try {
    var themeMap = {
      th_light: 'light',
      th_dark: 'dark',
      th_midnight: 'midnight',
      th_forest: 'forest',
      th_sunset: 'sunset',
      th_rose: 'rose',
      th_cyber: 'cyber',
      th_ocean: 'ocean',
      th_sakura: 'sakura',
      th_paper: 'paper',
      th_vaporwave: 'vaporwave'
    };

    var t = 'light';

    // 1) Intenta leer el tema equipado desde el perfil
    try {
      var raw = localStorage.getItem('architablox-profile');
      if (raw) {
        var parsed = JSON.parse(raw);
        var st = parsed && parsed.state;
        var prof = st && st.profile;
        var eq = prof && prof.equipped;
        var id = eq && eq.theme;
        if (id && themeMap[id]) t = themeMap[id];
      }
    } catch (e) {}

    // 2) Fallback: clave legacy (por si el usuario venía de una versión antigua)
    if (t === 'light') {
      try {
        var legacy = localStorage.getItem('architablox-theme');
        if (legacy) t = legacy;
      } catch (e) {}
    }

    // 3) Aplica
    document.documentElement.setAttribute('data-theme', t);
    var dark = ['dark','midnight','forest','cyber','ocean','vaporwave'];
    document.documentElement.style.colorScheme =
      dark.indexOf(t) !== -1 ? 'dark' : 'light';
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
        <ToastProvider>{children}</ToastProvider>
        <PWARegister />
      </body>
    </html>
  );
}