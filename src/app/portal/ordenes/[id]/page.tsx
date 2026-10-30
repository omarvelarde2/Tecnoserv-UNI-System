"use client";
/* Orden de servicio y su seguimiento (CUS-12 resultado de la apertura · CUS-15 consultar seguimiento) */
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Marco } from "@/components/Marco";
import { Clave, EnlaceBoton, EstadoDoc, Etiqueta, Miga, Nota, Pasos, Tabla, Tarjeta, Titulo } from "@/components/ui";
import { useDatos } from "@/lib/store";
import { ETAPAS, diasRestantes, fmtFecha, fmtFechaHora, urgencia } from "@/lib/reglas";

export default function OrdenPagina() {
  const { id } = useParams<{ id: string }>();
  const { datos, usuario } = useDatos();
  const [actualizado, setActualizado] = useState(() => new Date().toISOString());
  useEffect(() => { // el seguimiento se refresca cada 30 s (RNF-24)
    const t = window.setInterval(() => setActualizado(new Date().toISOString()), 30000);
    return () => window.clearInterval(t);
  }, []);

  const o = datos.ordenes.find(x => x.id === id && x.clienteId === usuario?.clienteId); // aislamiento por cliente (RNF-23)
  if (!o) return <Marco area="portal"><Titulo>Orden no encontrada</Titulo><p className="text-tenue">La orden no existe o no pertenece a su empresa. <Link href="/portal" className="text-accion underline">Volver a mis órdenes</Link></p></Marco>;

  const servicio = datos.servicios.find(s => s.id === o.servicioId)!;
  const observados = o.documentos.filter(d => d.estado === "no_conforme");
  const faltantes = o.documentos.filter(d => d.estado === "faltante" && d.exigencia === "Obligatorio");
  const tonoCanal = o.sunat?.canal === "Verde" ? "ok" : o.sunat?.canal === "Rojo" ? "error" : "alerta";

  return (
    <Marco area="portal">
      <Miga><Link href="/portal" className="hover:underline">Portal › Mis órdenes</Link> › {o.id}</Miga>
      <Titulo>Orden {o.id} <Etiqueta tono="info">{o.etapa}</Etiqueta></Titulo>

      {(observados.length > 0 || faltantes.length > 0) && (
        <div className="mb-3.5"><Nota>
          {observados.length > 0
            ? <>Hay {observados.length === 1 ? "una observación" : `${observados.length} observaciones`} sobre su documentación ({observados.map(d => d.tipo.toLowerCase()).join(", ")}). </>
            : <>Faltan {faltantes.length} {faltantes.length === 1 ? "documento obligatorio" : "documentos obligatorios"}. </>}
          <Link href={`/portal/ordenes/${o.id}/documentos`} className="font-semibold text-accion underline">Ir a documentos</Link>
        </Nota></div>
      )}

      <Tarjeta>
        <div className="flex flex-wrap gap-6">
          <div className="min-w-[320px] flex-1">
            <Clave filas={[
              ["Servicio", `${servicio.nombre} · ${o.via}`], ["Aduana", o.aduana], ["Mercancía", o.descripcion],
              ["Referencia", o.referencia ?? "—"], ["Cotización", o.cotizacionId ? `${o.cotizacionId} · aceptada` : "—"], ["Abierta", fmtFechaHora(o.abierta)],
            ]} />
          </div>
          <div className="w-[560px] max-w-full"><Pasos etapas={ETAPAS} actual={o.etapa} /></div>
        </div>
      </Tarjeta>

      <div className="flex flex-wrap items-start gap-3.5">
        <div className="min-w-[440px] flex-1">
          <Tarjeta titulo="Estado ante SUNAT">
            {o.sunat ? (
              <Clave filas={[["N.° de declaración", o.sunat.dam], ["Canal asignado", o.sunat.canal ? <Etiqueta key="c" tono={tonoCanal}>{o.sunat.canal}{o.sunat.canal === "Naranja" ? " · revisión documentaria" : o.sunat.canal === "Rojo" ? " · reconocimiento físico" : ""}</Etiqueta> : "Pendiente"],
                ["Levante", o.sunat.levante ? fmtFechaHora(o.sunat.levante) : "Pendiente"], ["Última consulta", `${fmtFechaHora(o.sunat.ultimaConsulta)} (cada 2 horas)`]]} />
            ) : <p className="text-[13px] text-tenue">La declaración aún no se presenta. Se presentará cuando la documentación y la clasificación estén validadas.</p>}
          </Tarjeta>
          <Tarjeta titulo="Documentos" extra={<EnlaceBoton href={`/portal/ordenes/${o.id}/documentos`} variante="primario">Adjuntar documentos</EnlaceBoton>}>
            <Tabla cabecera={["Documento", "Exigencia", "Estado"]}>
              {o.documentos.map(d => (
                <tr key={d.tipo}><td>{d.tipo}{d.numero ? ` ${d.numero}` : ""}</td>
                  <td className="text-tenue">{d.exigencia}{d.condicion ? ` · ${d.condicion}` : ""}</td><td><EstadoDoc estado={d.estado} /></td></tr>
              ))}
            </Tabla>
            <p className="mt-2 text-xs text-tenue">La lista se completa cuando se conoce la subpartida de cada serie.</p>
          </Tarjeta>
          <Tarjeta titulo="Plazos">
            <Tabla cabecera={["Plazo", "Fecha límite", "Situación"]}>
              {o.plazos.map(p => {
                const u = urgencia(p.fechaLimite); const d = diasRestantes(p.fechaLimite);
                return <tr key={p.nombre}><td>{p.nombre}</td><td>{fmtFecha(p.fechaLimite)}</td>
                  <td><Etiqueta tono={d < 0 ? "error" : u === "bad" ? "error" : u === "warn" ? "alerta" : "ok"}>{d < 0 ? "Vencido" : `En plazo · ${d} ${d === 1 ? "día" : "días"}`}</Etiqueta></td></tr>;
              })}
            </Tabla>
          </Tarjeta>
        </div>
        <div className="w-[380px] shrink-0">
          <Tarjeta titulo="Historial">
            <table className="w-full text-[13px]"><tbody>
              {o.hitos.map((h, i) => <tr key={i}><td className="w-[92px] border-b border-[#eef0f3] py-2 align-top text-xs text-tenue">{fmtFechaHora(h.fecha)}</td><td className="border-b border-[#eef0f3] py-2">{h.texto}</td></tr>)}
            </tbody></table>
          </Tarjeta>
          <p className="text-right text-xs text-tenue">Actualizado {fmtFechaHora(actualizado)} · se refresca cada 30 s</p>
        </div>
      </div>
    </Marco>
  );
}
