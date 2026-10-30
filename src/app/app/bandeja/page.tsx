"use client";
/* CUS-26 Validar resultado asistido · CUS-27 Resolver actividad sin asistencia (derivación) */
import { useMemo, useState } from "react";
import { Marco } from "@/components/Marco";
import { Boton, Campo, Etiqueta, Miga, Nota, Tabla, Tarjeta, Titulo, claseCampo } from "@/components/ui";
import { pendientes, useDatos } from "@/lib/store";
import { diasRestantes, fmtFechaHora, urgencia } from "@/lib/reglas";
import type { ResultadoAsistido } from "@/lib/tipos";

const tonoPlazo = (iso: string) => ({ bad: "error", warn: "alerta", neutral: "neutro" } as const)[urgencia(iso)];

function Detalle({ r, onValidar }: { r: ResultadoAsistido; onValidar: (d: "aceptada" | "corregida" | "rechazada", t: string) => void }) {
  const [texto, setTexto] = useState(r.propuesta);
  const [rechazando, setRechazando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [errMotivo, setErrMotivo] = useState("");
  const editado = texto.trim() !== r.propuesta.trim();
  const etiquetaTexto = r.actividad === "Revisión documental" ? "Corrección u observación para el cliente" : "Resultado propuesto";

  return (
    <Tarjeta titulo={`${r.actividad} · ${r.ordenId}${r.documento ? ` · ${r.documento}` : ""}`}
      extra={<Etiqueta tono={r.certeza >= 0.9 ? "ok" : "alerta"}>Certeza {r.certeza.toFixed(2).replace(".", ",")}</Etiqueta>}>
      <div className="flex flex-wrap gap-4">
        <div className="min-w-[340px] flex-1">
          <Tabla cabecera={["Verificación", "Resultado"]}>
            {r.verificaciones.map(v => <tr key={v.texto}><td>{v.texto}</td><td><Etiqueta tono={v.ok ? "ok" : "error"}>{v.detalle}</Etiqueta></td></tr>)}
          </Tabla>
          <div className="mt-3">
            <Campo etiqueta={etiquetaTexto} id="texto">
              <textarea id="texto" rows={3} className={claseCampo} value={texto} onChange={e => setTexto(e.target.value)} />
            </Campo>
          </div>
          {!rechazando ? (
            <div className="flex flex-wrap gap-2">
              <Boton variante="ok" disabled={editado} onClick={() => onValidar("aceptada", texto)} title={editado ? "Modificó la propuesta: use «Corregir y aceptar»" : undefined}>Aceptar</Boton>
              <Boton variante="primario" disabled={!editado || !texto.trim()} onClick={() => onValidar("corregida", texto)}>Corregir y aceptar</Boton>
              <Boton variante="peligro" onClick={() => setRechazando(true)}>Rechazar</Boton>
            </div>
          ) : (
            <div className="rounded-md border border-[#f0c9b5] bg-[#fff8f4] p-3">
              <Campo etiqueta="Motivo del rechazo (obligatorio)" id="motivo" error={errMotivo}>
                <textarea id="motivo" rows={2} className={claseCampo} value={motivo} aria-invalid={!!errMotivo} onChange={e => { setMotivo(e.target.value); setErrMotivo(""); }} />
              </Campo>
              <p className="mb-2 text-xs text-tenue">La actividad pasa a resolución directa por un operador (CUS-27).</p>
              <div className="flex gap-2">
                <Boton onClick={() => setRechazando(false)}>Volver</Boton>
                <Boton variante="peligro" onClick={() => motivo.trim().length < 5 ? setErrMotivo("Indique el motivo.") : onValidar("rechazada", motivo)}>Confirmar rechazo</Boton>
              </div>
            </div>
          )}
          <div className="mt-2 text-xs text-tenue">Sustento · {r.sustento} · {fmtFechaHora(r.creado)}</div>
        </div>
        <div className="w-[300px] shrink-0">
          <div className="mb-1 text-xs text-tenue">Documento de origen</div>
          <div className="h-[300px] overflow-auto rounded-md border border-linea bg-white p-4 font-mono text-[11px] leading-relaxed text-[#555]">
            {r.origen.lineas.map((l, i) => <div key={i} className={l.resaltar ? "bg-[#fff3b0] text-tinta" : ""}>{l.t}</div>)}
          </div>
        </div>
      </div>
    </Tarjeta>
  );
}

export default function Bandeja() {
  const { datos, validar } = useDatos();
  const lista = useMemo(() => pendientes(datos.resultados), [datos.resultados]);
  const [selId, setSelId] = useState<string | null>(null);
  const [aviso, setAviso] = useState("");
  const sel = lista.find(r => r.id === selId) ?? lista[0];
  const validados = datos.resultados.filter(r => r.estado !== "pendiente").sort((a, b) => (b.validacion?.fecha ?? "").localeCompare(a.validacion?.fecha ?? "")).slice(0, 5);

  function registrar(r: ResultadoAsistido, d: "aceptada" | "corregida" | "rechazada", t: string) {
    validar(r.id, d, t);
    setAviso(`${r.actividad} de ${r.ordenId}: ${d}. Se registró su validación con la fecha y hora del servidor.`);
    setSelId(lista.find(x => x.id !== r.id)?.id ?? null);
  }

  return (
    <Marco area="app">
      <Miga>Bandeja de validación</Miga>
      <Titulo>Pendientes de validación <Etiqueta tono="info">{lista.length}</Etiqueta></Titulo>
      {aviso && <div className="mb-3.5" role="status"><Nota>{aviso}</Nota></div>}
      <div className="flex flex-wrap items-start gap-3.5">
        <div className="w-[360px] shrink-0">
          <Tarjeta className="!p-2">
            <Tabla cabecera={["Orden", "Actividad", "Plazo"]}>
              {lista.map(r => (
                <tr key={r.id} onClick={() => setSelId(r.id)} className={`cursor-pointer ${sel?.id === r.id ? "bg-suave" : "hover:bg-fondo"}`}>
                  <td className="font-semibold">{r.ordenId}</td><td>{r.actividad}</td>
                  <td><Etiqueta tono={tonoPlazo(r.vence)}>{Math.max(diasRestantes(r.vence), 0)} {diasRestantes(r.vence) === 1 ? "día" : "días"}</Etiqueta></td>
                </tr>
              ))}
              {lista.length === 0 && <tr><td colSpan={3} className="py-6 text-center text-tenue">No hay pendientes.</td></tr>}
            </Tabla>
          </Tarjeta>
          {validados.length > 0 && (
            <Tarjeta titulo="Validados recientemente">
              {validados.map(r => (
                <div key={r.id} className="border-b border-[#eef0f3] py-1.5 text-[12.5px] last:border-0">
                  <b>{r.ordenId}</b> · {r.actividad} · <Etiqueta tono={r.estado === "derivado" ? "alerta" : "ok"}>{r.validacion?.decision}</Etiqueta>
                  <div className="text-xs text-tenue">{r.validacion?.operador} · {r.validacion && fmtFechaHora(r.validacion.fecha)}</div>
                </div>
              ))}
            </Tarjeta>
          )}
        </div>
        <div className="min-w-[520px] flex-1">
          {sel ? <Detalle key={sel.id} r={sel} onValidar={(d, t) => registrar(sel, d, t)} />
               : <Tarjeta><p className="text-tenue">Seleccione un pendiente para ver la propuesta y su sustento.</p></Tarjeta>}
        </div>
      </div>
    </Marco>
  );
}
