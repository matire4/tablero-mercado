import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tablero de mercado',
  description: 'Cotizaciones del dólar, riesgo país y noticias económicas, con la hora de cada dato.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <body>{children}</body>
    </html>
  );
}
