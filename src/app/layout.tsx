import type { Metadata } from "next";
import "./globals.css";
import { ProveedorDatos } from "@/lib/store";

export const metadata: Metadata = {
  title: "SGOA · Sistema de Gestión de Operaciones Aduaneras",
  description: "Portal del cliente y aplicación interna de una agencia aduanera (versión con datos de ejemplo)",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full">
        <ProveedorDatos>{children}</ProveedorDatos>
      </body>
    </html>
  );
}
