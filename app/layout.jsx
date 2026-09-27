import './globals.css';

export const metadata = {
  title: 'Presupuesto Mensual',
  description: 'App para manejar presupuestos de casa',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
