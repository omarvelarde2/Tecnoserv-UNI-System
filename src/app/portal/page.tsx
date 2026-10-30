"use client";
/* CUS-15 Consultar seguimiento: lista de órdenes del cliente (solo las suyas, RNF-23) */
import Link from "next/link";
import { useMemo, useState } from "react";
import { Marco } from "@/components/Marco";
import { EnlaceBoton, EstadoDoc, Etiqueta, Miga, Tabla, Tarjeta, Titulo } from "@/components/ui";
import { useDatos } from "@/lib/store";
import { diasRestantes, fmtFecha, urgencia } from "@/lib/reglas";
import type { Orden } from "@/lib/tipos";

function pendienteDelCliente(o: Orden) {
  const obs = o.documentos.filter(d => d.estado === "no_conforme").length;
  const falt = o.documentos.filter(d => d.estado === "faltante" && d.exigencia === "Obligatorio").length;
  if (obs) return <EstadoDoc estado="no_conforme" />;
  if (falt) return <Etiqueta tono="alerta">{falt} por adjuntar</Etiqueta>;
  return <span className="text-tenue">—</span>;
}

export default function MisOrdenes() {
  const { datos, usuario } = useDatos();
  const [filtro, setFiltro] = useState("todas");
  const mias = useMemo(() => datos.ordenes.filter(o => o.clienteId === usuario?.clienteId), [datos, usuario]);
  const lista = mias.filter(o => filtro === "todas" || (filtro === "accion" ? o.documentos.some(d => d.estado === "no_conforme" || (d.estado === "faltante" && d.exigencia === "Obligatorio")) : o.servicioId === filtro));

  return (
    <Marco area="portal">
      <Miga>Portal › Mis órdenes</Miga>
      <div className="flex items-start justify-between">
        <Titulo>Mis órdenes</Titulo>
        <EnlaceBoton href="/portal/solicitudes/nueva" variante="primario">Solicitar servicio</EnlaceBoton>
      </div>
      <Tarjeta extra={
        <div className="flex gap-1.5 text-[12.5px]" role="tablist">
          {[["todas", "Todas"], ["accion", "Requieren mi acción"], ["imp-consumo", "Importación"], ["exp-definitiva", "Exportación"]].map(([v, t]) => (
            <button key={v} role="tab" aria-selected={filtro === v} onClick={() => setFiltro(v)}
              className={`cursor-pointer rounded-full border px-3 py-1 ${filtro === v ? "border-accion bg-suave font-semibold text-accion" : "border-linea text-tenue"}`}>{t}</button>
          ))}
        </div>} titulo={`${lista.length} ${lista.length === 1 ? "orden" : "órdenes"}`}>
        <Tabla cabecera={["N.° de orden", "Referencia", "Servicio", "Etapa", "Próximo plazo", "Pendiente de usted"]}>
          {lista.map(o => {
            const s = datos.servicios.find(x => x.id === o.servicioId)!;
            const p = o.plazos[0];
            return (
              <tr key={o.id} className="hover:bg-suave">
                <td><Link href={`/portal/ordenes/${o.id}`} className="font-semibold text-accion hover:underline">{o.id}</Link></td>
                <td>{o.referencia ?? "—"}</td>
                <td>{s.nombre} · {o.via}</td>
                <td><Etiqueta tono="info">{o.etapa}</Etiqueta></td>
                <td>{p ? <><Etiqueta tono={urgencia(p.fechaLimite) === "neutral" ? "neutro" : urgencia(p.fechaLimite) === "bad" ? "error" : "alerta"}>{fmtFecha(p.fechaLimite)}</Etiqueta> <span className="text-xs text-tenue">en {diasRestantes(p.fechaLimite)} d</span></> : "—"}</td>
                <td>{pendienteDelCliente(o)}</td>
              </tr>
            );
          })}
          {lista.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-tenue">No hay órdenes con ese filtro.</td></tr>}
        </Tabla>
      </Tarjeta>
    </Marco>
  );
}
