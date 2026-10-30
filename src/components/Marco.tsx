"use client";
/* Marco común: barra superior, menú lateral y control de acceso por perfil */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useDatos } from "@/lib/store";

type Item = { texto: string; ruta?: string };
const PORTAL: Item[] = [
  { texto: "Mis órdenes", ruta: "/portal" },
  { texto: "Solicitar servicio", ruta: "/portal/solicitudes/nueva" },
  { texto: "Reportes" },
  { texto: "Notificaciones" },
];
const APP: Item[] = [
  { texto: "Tablero" },
  { texto: "Bandeja de validación", ruta: "/app/bandeja" },
  { texto: "Órdenes" },
  { texto: "Declaraciones" },
  { texto: "Requerimientos" },
  { texto: "Administración" },
];

export function Marco({ area, children }: { area: "portal" | "app"; children: ReactNode }) {
  const { listo, usuario, datos, salir, restablecer } = useDatos();
  const router = useRouter();
  const ruta = usePathname();
  const esCliente = usuario?.rol === "cliente";

  useEffect(() => {
    if (!listo) return;
    if (!usuario) router.replace("/login");
    else if (area === "portal" && !esCliente) router.replace("/app/bandeja");
    else if (area === "app" && esCliente) router.replace("/portal");
  }, [listo, usuario, area, esCliente, router]);

  if (!listo || !usuario || (area === "portal") !== esCliente) return null;

  const items = area === "portal" ? PORTAL : APP;
  const cliente = datos.clientes.find(c => c.id === usuario.clienteId);
  const activo = (r?: string) => !!r && (r === "/portal" ? ruta === "/portal" || ruta.startsWith("/portal/ordenes") : ruta.startsWith(r));

  return (
    <div className="min-h-screen">
      <header className="flex h-[52px] items-center gap-[18px] bg-marca px-5 text-white">
        <b className="text-base tracking-wide">SGOA</b>
        <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs">{area === "portal" ? "Portal del cliente" : "Aplicación interna"}</span>
        <span className="flex-1" />
        <span className="text-[13px] opacity-90">{usuario.nombre} · {cliente ? cliente.razonSocial : "Operador de despacho"}</span>
        <button onClick={() => { salir(); router.replace("/login"); }} className="cursor-pointer rounded border border-white/30 px-2.5 py-1 text-xs hover:bg-white/10">Salir</button>
      </header>
      <div className="flex min-h-[calc(100vh-52px)]">
        <nav className="flex w-[210px] shrink-0 flex-col border-r border-linea bg-white py-3.5" aria-label="Menú principal">
          {items.map(it => it.ruta ? (
            <Link key={it.texto} href={it.ruta}
              className={`block px-5 py-[9px] text-[13.5px] ${activo(it.ruta) ? "border-l-[3px] border-marca bg-suave font-semibold text-marca" : "text-tenue hover:bg-fondo"}`}>
              {it.texto}
            </Link>
          ) : (
            <span key={it.texto} title="No incluida en esta versión" className="block cursor-not-allowed px-5 py-[9px] text-[13.5px] text-[#a3abb6]">{it.texto}</span>
          ))}
          <span className="flex-1" />
          <button onClick={() => { if (confirm("¿Restablecer los datos de demostración?")) restablecer(); }}
            className="mx-5 cursor-pointer text-left text-[11.5px] text-tenue underline">Restablecer datos de demostración</button>
        </nav>
        <main className="min-w-0 flex-1 px-[26px] py-5">{children}</main>
      </div>
    </div>
  );
}
