import type { Metadata, ReactNode } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Presupuesto Mensual',
  description: 'App para manejar presupuestos de casa',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
