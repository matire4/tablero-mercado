import type { Metadata } from 'next';
import { Inter_Tight, Sora } from 'next/font/google';
import './globals.css';

const sora = Sora({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-sora' });
const interTight = Inter_Tight({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-inter-tight' });

export const metadata: Metadata = {
  title: 'Tablero de mercado',
  description: 'Cotizaciones del dólar, riesgo país y noticias económicas, con la hora de cada dato.',
};

// Aplica el tema elegido por el usuario antes del primer pintado, para que no parpadee.
// Si no eligió ninguno, el CSS sigue la preferencia del sistema.
const themeScript = `try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={`${sora.variable} ${interTight.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <div className="blobs" aria-hidden="true">
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
        </div>
        {children}
      </body>
    </html>
  );
}
