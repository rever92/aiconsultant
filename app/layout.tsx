import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "AI Consultant - Herramienta de Consultoría",
  description: "Aplicación de soporte para proyectos de consultoría con transcripción de audio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
        {children}
        </AuthProvider>
      </body>
    </html>
  );
} 