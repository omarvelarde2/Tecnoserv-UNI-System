/* Componentes de interfaz con el lenguaje visual de las maquetas */
import Link from "next/link";
import { Fragment, type ButtonHTMLAttributes, type ReactNode } from "react";
import type { EstadoDocumento, Etapa } from "@/lib/tipos";

export function Tarjeta({ titulo, extra, children, className = "" }: { titulo?: ReactNode; extra?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`mb-3.5 rounded-lg border border-linea bg-white px-[18px] py-4 ${className}`}>
      {(titulo || extra) && (
        <div className="mb-2.5 flex items-center justify-between gap-3">
          {titulo && <h2 className="text-[15px] font-semibold">{titulo}</h2>}
          {extra}
        </div>
      )}
      {children}
    </section>
  );
}

type Tono = "ok" | "alerta" | "error" | "info" | "neutro";
const TONOS: Record<Tono, string> = {
  ok: "bg-[#e3f4ec] text-ok", alerta: "bg-[#fdf1dc] text-alerta", error: "bg-[#fde8de] text-error",
  info: "bg-[#e6effb] text-accion", neutro: "bg-[#eef0f3] text-tenue",
};
export function Etiqueta({ tono = "neutro", children }: { tono?: Tono; children: ReactNode }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${TONOS[tono]}`}>{children}</span>;
}

const ESTADOS_DOC: Record<EstadoDocumento, [Tono, string]> = {
  faltante: ["alerta", "Faltante"], pendiente: ["info", "Pendiente de revisión"], conforme: ["ok", "Conforme"],
  no_conforme: ["error", "No conforme"], no_requerido: ["neutro", "No requerido"],
};
export function EstadoDoc({ estado }: { estado: EstadoDocumento }) {
  const [tono, texto] = ESTADOS_DOC[estado];
  return <Etiqueta tono={tono}>{texto}</Etiqueta>;
}

type Variante = "primario" | "ok" | "peligro" | "neutro";
const VARIANTES: Record<Variante, string> = {
  primario: "border-accion bg-accion text-white hover:brightness-110",
  ok: "border-ok bg-ok text-white hover:brightness-110",
  peligro: "border-[#f0c9b5] bg-white text-error hover:bg-[#fff6f1]",
  neutro: "border-linea bg-white text-tinta hover:bg-fondo",
};
export function Boton({ variante = "neutro", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }) {
  return <button {...props} className={`cursor-pointer rounded-md border px-4 py-2 text-[13.5px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${VARIANTES[variante]} ${className}`} />;
}

export function EnlaceBoton({ href, variante = "neutro", children }: { href: string; variante?: Variante; children: ReactNode }) {
  return <Link href={href} className={`inline-block rounded-md border px-4 py-2 text-[13.5px] font-semibold transition ${VARIANTES[variante]}`}>{children}</Link>;
}

export const claseCampo = "w-full rounded-md border border-linea bg-white px-2.5 py-2 text-[13.5px] outline-none focus:border-accion aria-[invalid=true]:border-error";

export function Campo({ etiqueta, error, children, id }: { etiqueta: string; error?: string; children: ReactNode; id?: string }) {
  return (
    <div className="mb-3 flex-1">
      <label htmlFor={id} className="mb-1 block text-xs text-tenue">{etiqueta}</label>
      {children}
      {error && <p className="mt-1 text-xs text-error" role="alert">{error}</p>}
    </div>
  );
}

export function Miga({ children }: { children: ReactNode }) {
  return <div className="mb-1 text-xs text-tenue">{children}</div>;
}
export function Titulo({ children }: { children: ReactNode }) {
  return <h1 className="mb-3.5 text-[21px] font-semibold">{children}</h1>;
}

export function Nota({ children }: { children: ReactNode }) {
  return <div className="rounded-md border border-[#f3e3a1] bg-[#fffbea] px-3 py-2.5 text-[12.5px]">{children}</div>;
}

export function Clave({ filas }: { filas: [ReactNode, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[150px_1fr] gap-x-3 gap-y-1.5 text-[13px]">
      {filas.map(([k, v], i) => (<Fragment key={i}><dt className="text-tenue">{k}</dt><dd>{v}</dd></Fragment>))}
    </dl>
  );
}

export function Pasos({ etapas, actual }: { etapas: Etapa[]; actual: Etapa }) {
  const i = etapas.indexOf(actual);
  return (
    <ol className="flex">
      {etapas.map((e, j) => (
        <li key={e} className={`relative flex-1 pt-5 text-center text-[11.5px] ${j <= i ? "text-tinta" : "text-tenue"}`}>
          <span className={`absolute left-1/2 top-1 -ml-1.5 h-3 w-3 rounded-full ${j < i ? "bg-ok" : j === i ? "bg-accion ring-4 ring-[#d6e5fa]" : "bg-[#cfd6e0]"}`} />
          {e}
        </li>
      ))}
    </ol>
  );
}

export function Tabla({ cabecera, children }: { cabecera: ReactNode[]; children: ReactNode }) {
  return (
    <table className="w-full border-collapse text-[13px]">
      <thead>
        <tr>{cabecera.map((c, i) => <th key={i} className="border-b border-linea bg-[#fafbfc] px-2 py-[7px] text-left font-semibold text-tenue">{c}</th>)}</tr>
      </thead>
      <tbody className="[&_td]:border-b [&_td]:border-[#eef0f3] [&_td]:p-2">{children}</tbody>
    </table>
  );
}
