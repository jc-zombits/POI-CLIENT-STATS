// src/app/layout.js
import "antd/dist/reset.css"; // ← Importa Ant Design aquí, si usas antd 5
import "./globals.css";

export const metadata = {
  title: "Tu app",
  description: "Descripción aquí",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
