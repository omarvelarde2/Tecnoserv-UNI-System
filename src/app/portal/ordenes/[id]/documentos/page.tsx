"use client";
/* CUS-13 Cargar documentos · CUS-14 Atender observaciones documentales (la revisión es CUS-17) */
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRef, useState } from "react";
import { Marco } from "@/components/Marco";
import { Boton, Campo, EstadoDoc, Miga, Nota, Tabla, Tarjeta, Titulo, claseCampo } from "@/components/ui";
import { useDatos } from "@/lib/store";
import { fmtFechaHora, fmtTamano, validarArchivo } from "@/lib/reglas";

export default function DocumentosPagina() {
  const { id } = useParams<{ id: string }>();
  const { datos, usuario, cargarDocumento } = useDatos();
  const o = datos.ordenes.find(x => x.id === id && x.clienteId === usuario?.clienteId);
  const pendientesDeCarga = o?.documentos.filter(d => d.estado === "faltante" || d.estado === "no_conforme") ?? [];
  // sin elección del usuario, se proponen el primer documento por cargar y el observado
  const [tipoElegido, setTipo] = useState("");
  const [selElegido, setSel] = useState<string | null>(null);
  const tipo = tipoElegido || pendientesDeCarga[0]?.tipo || o?.documentos[0]?.tipo || "";
  const sel = selElegido ?? o?.documentos.find(d => d.estado === "no_conforme")?.tipo ?? null;
  const [archivo, setArchivo] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [progreso, setProgreso] = useState<number | null>(null);
  const [aviso, setAviso] = useState("");
  const [arrastrando, setArrastrando] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  if (!o) return <Marco area="portal"><Titulo>Orden no encontrada</Titulo><Link href="/portal" className="text-accion underline">Volver a mis órdenes</Link></Marco>;
  const numerada = !!o.sunat; // lo numerado no se modifica (RN-13)
  const elegible = o.documentos.filter(d => d.estado !== "no_requerido");
  const docSel = o.documentos.find(d => d.tipo === sel);

  function elegir(f: File | undefined) {
    if (!f) return;
    const e = validarArchivo(f.name, f.size);
    setError(e ?? ""); setArchivo(e ? null : f); setAviso("");
  }

  function cargar() {
    if (!archivo || !tipo) return;
    const f = archivo, t0 = tipo, ordenId = o!.id;
    let n = 0;
    setProgreso(0);
    const t = window.setInterval(() => {
      n += 20;
      setProgreso(n);
      if (n < 100) return;
      window.clearInterval(t);
      cargarDocumento(ordenId, t0, f.name, f.size);
      setAviso(`${t0}: recibido. La revisión toma unos segundos; el resultado lo valida un operador de la agencia.`);
      setArchivo(null); setProgreso(null); setSel(t0);
      if (input.current) input.current.value = "";
    }, 180);
  }

  return (
    <Marco area="portal">
      <Miga><Link href="/portal" className="hover:underline">Portal › Mis órdenes</Link> › <Link href={`/portal/ordenes/${o.id}`} className="hover:underline">{o.id}</Link> › Documentos</Miga>
      <Titulo>Documentos de la orden {o.id}</Titulo>
      <div className="flex flex-wrap items-start gap-3.5">
        <div className="min-w-[460px] flex-1">
          <Tarjeta>
            <Tabla cabecera={["Documento", "Versión", "Cargado", "Estado"]}>
              {o.documentos.map(d => {
                const v = d.versiones.at(-1);
                return (
                  <tr key={d.tipo} onClick={() => setSel(d.tipo)} className={`cursor-pointer ${sel === d.tipo ? "bg-suave" : "hover:bg-fondo"}`}>
                    <td>{d.tipo}{d.numero ? ` ${d.numero}` : ""}{d.exigencia === "Condicional" && <div className="text-xs text-tenue">Condicional · {d.condicion}</div>}</td>
                    <td>{v?.version ?? "—"}</td><td>{v ? fmtFechaHora(v.fecha) : "—"}</td><td><EstadoDoc estado={d.estado} /></td>
                  </tr>
                );
              })}
            </Tabla>
          </Tarjeta>
          {docSel?.observacion && (
            <Tarjeta titulo={`Observación sobre ${docSel.tipo.toLowerCase()}`}>
              <Nota>{docSel.observacion.texto}</Nota>
              <div className="mt-2 text-xs text-tenue">Validada por {docSel.observacion.validadoPor} · {fmtFechaHora(docSel.observacion.fecha)}</div>
            </Tarjeta>
          )}
          {docSel && docSel.versiones.length > 0 && (
            <Tarjeta titulo={`Versiones de ${docSel.tipo.toLowerCase()}`}>
              <Tabla cabecera={["Versión", "Archivo", "Tamaño", "Cargado"]}>
                {[...docSel.versiones].reverse().map(v => <tr key={v.version}><td>{v.version}</td><td>{v.archivo}</td><td>{fmtTamano(v.tamanoBytes)}</td><td>{fmtFechaHora(v.fecha)}</td></tr>)}
              </Tabla>
              <p className="mt-2 text-xs text-tenue">Cada carga crea una versión nueva; las anteriores se conservan.</p>
            </Tarjeta>
          )}
        </div>

        <div className="w-[380px] shrink-0">
          <Tarjeta titulo="Adjuntar documento">
            {numerada ? (
              <Nota>La declaración de esta orden ya fue numerada: los documentos que la sustentan no se modifican. Los documentos que pida la autoridad se le solicitarán por aquí.</Nota>
            ) : (
              <>
                <Campo etiqueta="Tipo de documento" id="tipo">
                  <select id="tipo" className={claseCampo} value={tipo} onChange={e => { setTipo(e.target.value); setAviso(""); }}>
                    {elegible.map(d => <option key={d.tipo} value={d.tipo}>{d.tipo}{d.estado === "no_conforme" ? " (observado)" : d.estado === "faltante" ? " (faltante)" : ""}</option>)}
                  </select>
                </Campo>
                <div role="button" tabIndex={0} aria-label="Zona para arrastrar o elegir el archivo"
                  onClick={() => input.current?.click()} onKeyDown={e => (e.key === "Enter" || e.key === " ") && input.current?.click()}
                  onDragOver={e => { e.preventDefault(); setArrastrando(true); }} onDragLeave={() => setArrastrando(false)}
                  onDrop={e => { e.preventDefault(); setArrastrando(false); elegir(e.dataTransfer.files[0]); }}
                  className={`cursor-pointer rounded-lg border-2 border-dashed p-5 text-center text-tenue ${arrastrando ? "border-accion bg-suave" : "border-[#b9c6d8] bg-[#fafcff]"}`}>
                  Arrastre el archivo aquí o haga clic para elegirlo
                  <div className="text-xs">PDF o imagen · máx. 20 MB</div>
                </div>
                <input ref={input} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => elegir(e.target.files?.[0])} />
                {error && <p className="mt-2 text-xs text-error" role="alert">{error}</p>}
                {archivo && (
                  <div className="mt-3">
                    <div className="text-xs text-tenue">{archivo.name} · {fmtTamano(archivo.size)}</div>
                    <div className="mt-1 h-2 overflow-hidden rounded bg-[#e9edf2]"><i className="block h-full bg-accion transition-all" style={{ width: `${progreso ?? 0}%` }} /></div>
                  </div>
                )}
                <div className="mt-3 text-right"><Boton variante="primario" disabled={!archivo || progreso !== null} onClick={cargar}>Cargar</Boton></div>
                {aviso && <p className="mt-3 text-[12.5px] text-ok" role="status">{aviso}</p>}
              </>
            )}
          </Tarjeta>
          <p className="text-xs text-tenue">Los documentos se revisan contra la casuística de su operación: completitud, legibilidad y coherencia entre ellos.</p>
        </div>
      </div>
    </Marco>
  );
}
