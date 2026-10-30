"use client";
/* CUS-09 Solicitar servicio · CUS-10 Cotizar · CUS-11 Aceptar cotización (incluye CUS-12 Aperturar orden) */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Marco } from "@/components/Marco";
import { Boton, Campo, Clave, Miga, Nota, Tarjeta, Titulo, claseCampo } from "@/components/ui";
import { useDatos, type NuevaSolicitud } from "@/lib/store";
import { ADUANAS, VIAS, fmtFecha, fmtMonto } from "@/lib/reglas";
import type { Solicitud, Via } from "@/lib/tipos";

type Errores = Partial<Record<keyof NuevaSolicitud, string>>;
const hoy = () => new Date().toISOString().slice(0, 10);

export default function NuevaSolicitudPagina() {
  const { datos, solicitar, aceptarCotizacion, rechazarCotizacion } = useDatos();
  const router = useRouter();
  const [f, setF] = useState<NuevaSolicitud>({ servicioId: "", via: "Marítima", aduana: ADUANAS[0], fechaEstimada: "", descripcion: "" });
  const [err, setErr] = useState<Errores>({});
  const [sol, setSol] = useState<Solicitud | null>(null);
  const [confirmar, setConfirmar] = useState(false);
  const servicio = datos.servicios.find(s => s.id === f.servicioId);
  const actual = sol ? datos.solicitudes.find(s => s.id === sol.id) ?? sol : null;

  const cambiar = <K extends keyof NuevaSolicitud>(k: K, v: NuevaSolicitud[K]) => { setF({ ...f, [k]: v }); setErr({ ...err, [k]: undefined }); };

  function validar(): Errores {
    const e: Errores = {};
    if (!f.servicioId) e.servicioId = "Elija el servicio.";
    if (!f.fechaEstimada) e.fechaEstimada = "Indique la fecha estimada.";
    else if (f.fechaEstimada <= hoy()) e.fechaEstimada = "La fecha debe ser posterior a hoy.";
    if (f.descripcion.trim().length < 10) e.descripcion = "Describa la mercancía en al menos 10 caracteres.";
    return e;
  }

  function cotizar(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validar();
    setErr(e);
    if (Object.keys(e).length) return;
    setSol(solicitar(f));
  }

  const etiquetaFecha = servicio?.regimen === "40" ? "Fecha estimada de embarque" : "Fecha estimada de llegada";
  const bloqueado = !!actual;

  return (
    <Marco area="portal">
      <Miga>Portal › Solicitar servicio</Miga>
      <Titulo>Nueva solicitud de servicio</Titulo>
      <div className="flex flex-wrap items-start gap-3.5">
        <form onSubmit={cotizar} noValidate className="min-w-[420px] flex-1">
          <Tarjeta titulo="1. Servicio y operación">
            <div className="flex gap-3.5">
              <Campo etiqueta="Servicio" id="servicio" error={err.servicioId}>
                <select id="servicio" className={claseCampo} value={f.servicioId} disabled={bloqueado} aria-invalid={!!err.servicioId}
                  onChange={e => cambiar("servicioId", e.target.value)}>
                  <option value="">Elija un servicio…</option>
                  {datos.servicios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </Campo>
              <Campo etiqueta="Vía de transporte" id="via">
                <select id="via" className={claseCampo} value={f.via} disabled={bloqueado} onChange={e => cambiar("via", e.target.value as Via)}>
                  {VIAS.map(v => <option key={v}>{v}</option>)}
                </select>
              </Campo>
            </div>
            <div className="flex gap-3.5">
              <Campo etiqueta="Aduana" id="aduana">
                <select id="aduana" className={claseCampo} value={f.aduana} disabled={bloqueado} onChange={e => cambiar("aduana", e.target.value)}>
                  {ADUANAS.map(a => <option key={a}>{a}</option>)}
                </select>
              </Campo>
              <Campo etiqueta={etiquetaFecha} id="fecha" error={err.fechaEstimada}>
                <input id="fecha" type="date" min={hoy()} className={claseCampo} value={f.fechaEstimada} disabled={bloqueado}
                  aria-invalid={!!err.fechaEstimada} onChange={e => cambiar("fechaEstimada", e.target.value)} />
              </Campo>
            </div>
            <Campo etiqueta="Descripción general de la mercancía" id="desc" error={err.descripcion}>
              <textarea id="desc" rows={3} className={claseCampo} value={f.descripcion} disabled={bloqueado} aria-invalid={!!err.descripcion}
                placeholder="Qué es, cantidad aproximada y forma de embalaje" onChange={e => cambiar("descripcion", e.target.value)} />
            </Campo>
            {!bloqueado && (
              <div className="flex justify-end gap-2">
                <Boton type="button" onClick={() => router.push("/portal")}>Cancelar</Boton>
                <Boton type="submit" variante="primario">Solicitar cotización</Boton>
              </div>
            )}
          </Tarjeta>
        </form>

        <div className="w-[380px] shrink-0">
          <Tarjeta titulo="2. Cotización">
            {!actual ? (
              <p className="text-[13px] text-tenue">Complete los datos de la operación y pulse «Solicitar cotización». El monto se calcula con el tarifario vigente de la agencia.</p>
            ) : (
              <>
                <Clave filas={[["N.° de cotización", <b key="n">{actual.cotizacion.id}</b>], ["Vigente hasta", fmtFecha(actual.cotizacion.vigenteHasta)]]} />
                <table className="mt-3 w-full text-[13px]">
                  <thead><tr><th className="border-b border-linea py-1.5 text-left font-semibold text-tenue">Concepto</th><th className="border-b border-linea py-1.5 text-right font-semibold text-tenue">USD</th></tr></thead>
                  <tbody>
                    {actual.cotizacion.conceptos.map(c => <tr key={c.nombre}><td className="border-b border-[#eef0f3] py-1.5">{c.nombre}</td><td className="border-b border-[#eef0f3] py-1.5 text-right">{fmtMonto(c.monto)}</td></tr>)}
                    <tr><td className="py-1.5 font-bold">Total</td><td className="py-1.5 text-right font-bold">{fmtMonto(actual.cotizacion.total)}</td></tr>
                  </tbody>
                </table>
                {actual.cotizacion.estado === "emitida" && !confirmar && (
                  <div className="mt-3.5 flex justify-end gap-2">
                    <Boton onClick={() => rechazarCotizacion(actual.id)}>Rechazar</Boton>
                    <Boton variante="ok" onClick={() => setConfirmar(true)}>Aceptar cotización</Boton>
                  </div>
                )}
                {confirmar && actual.cotizacion.estado === "emitida" && (
                  <div className="mt-3.5 rounded-md border border-linea bg-suave p-3 text-[13px]" role="dialog" aria-label="Confirmar aceptación">
                    Al aceptar se abre la orden de servicio y se le pedirá la documentación de sustento. ¿Confirma?
                    <div className="mt-2.5 flex justify-end gap-2">
                      <Boton onClick={() => setConfirmar(false)}>Volver</Boton>
                      <Boton variante="ok" onClick={() => router.push(`/portal/ordenes/${aceptarCotizacion(actual.id)}`)}>Confirmar</Boton>
                    </div>
                  </div>
                )}
                {actual.cotizacion.estado === "rechazada" && (
                  <p className="mt-3 text-[13px] text-tenue">Cotización rechazada. Puede <button className="cursor-pointer text-accion underline" onClick={() => { setSol(null); setConfirmar(false); }}>hacer una nueva solicitud</button>.</p>
                )}
              </>
            )}
          </Tarjeta>
          <Nota>La cotización comprende el servicio de la agencia. Los tributos y los gastos por cuenta del cliente no forman parte del monto.</Nota>
        </div>
      </div>
    </Marco>
  );
}
