"use client";
/* Estado de la demostración. Reemplaza al servidor mientras no exista el backend:
   los datos viven en el navegador (localStorage) y la sesión en la pestaña (sessionStorage),
   de modo que el cliente y el operador pueden abrirse en dos pestañas a la vez.
   Se expone como almacén externo con useSyncExternalStore. */
import { useCallback, useSyncExternalStore } from "react";
import type { Datos, Orden, ResultadoAsistido, Solicitud, Usuario, Via } from "./tipos";
import { semilla } from "./datos";
import { ahora, cotizar, documentosExigibles, revisarDocumento, siguienteNumeroOrden, sumarDias } from "./reglas";

const CLAVE_DATOS = "sgoa-demo-datos-v1";
const CLAVE_SESION = "sgoa-demo-sesion";

function leer<T>(store: Storage | undefined, clave: string): T | null {
  try { const v = store?.getItem(clave); return v ? (JSON.parse(v) as T) : null; } catch { return null; }
}
function escribir(store: Storage | undefined, clave: string, valor: unknown) {
  try { if (valor === null) store?.removeItem(clave); else store?.setItem(clave, JSON.stringify(valor)); } catch { /* sin almacenamiento */ }
}

/* ---------------- almacén externo ---------------- */
let cache: Datos | null = null;
let sesion: string | null | undefined; // undefined = aún no leída
const oyentes = new Set<() => void>();
const avisar = () => oyentes.forEach(f => f());

function datosActuales(): Datos {
  if (cache === null) {
    cache = leer<Datos>(window.localStorage, CLAVE_DATOS) ?? semilla();
    escribir(window.localStorage, CLAVE_DATOS, cache);
  }
  return cache;
}
function sesionActual(): string | null {
  if (sesion === undefined) sesion = leer<string>(window.sessionStorage, CLAVE_SESION);
  return sesion;
}
function suscribir(f: () => void) {
  oyentes.add(f);
  const alCambiar = (e: StorageEvent) => {
    if (e.key === CLAVE_DATOS && e.newValue) { try { cache = JSON.parse(e.newValue); avisar(); } catch { /* ignorar */ } }
  };
  window.addEventListener("storage", alCambiar);
  return () => { oyentes.delete(f); window.removeEventListener("storage", alCambiar); };
}
function actualizar(f: (d: Datos) => Datos) {
  cache = f(structuredClone(datosActuales()));
  escribir(window.localStorage, CLAVE_DATOS, cache);
  avisar();
}
function fijarSesion(id: string | null) {
  sesion = id;
  escribir(window.sessionStorage, CLAVE_SESION, id);
  avisar();
}

/* ---------------- acciones ---------------- */
export interface NuevaSolicitud { servicioId: string; via: Via; aduana: string; fechaEstimada: string; descripcion: string }

function solicitar(s: NuevaSolicitud, clienteId: string): Solicitud {
  let creada!: Solicitud;
  actualizar(d => {
    d.cotizaciones += 1;
    const { conceptos, total } = cotizar(s.servicioId);
    const t = ahora();
    creada = {
      id: `SOL-${Date.now()}`, clienteId, ...s,
      cotizacion: { id: `COT-2026-${String(d.cotizaciones).padStart(5, "0")}`, conceptos, total, moneda: "USD",
                    emitida: t, vigenteHasta: sumarDias(t, 7), estado: "emitida" },
    };
    d.solicitudes.push(creada);
    return d;
  });
  return creada;
}

function rechazarCotizacion(solicitudId: string) {
  actualizar(d => { const s = d.solicitudes.find(x => x.id === solicitudId); if (s) s.cotizacion.estado = "rechazada"; return d; });
}

function aceptarCotizacion(solicitudId: string): string {
  let ordenId = "";
  actualizar(d => {
    const s = d.solicitudes.find(x => x.id === solicitudId)!;
    const servicio = d.servicios.find(x => x.id === s.servicioId)!;
    const { clave, n, id } = siguienteNumeroOrden(d, servicio, s.via);
    d.correlativos[clave] = n;                                   // el número queda consumido (RN-02)
    const t = ahora();
    s.cotizacion.estado = "aceptada";
    s.ordenId = id;
    const orden: Orden = {
      id, clienteId: s.clienteId, servicioId: s.servicioId, via: s.via, aduana: s.aduana, descripcion: s.descripcion,
      solicitudId: s.id, cotizacionId: s.cotizacion.id, etapa: "Documentos", abierta: t,
      documentos: documentosExigibles(servicio, s.via),
      hitos: [{ fecha: t, texto: `Orden abierta · cotización ${s.cotizacion.id} aceptada` }],
      plazos: servicio.regimen === "10"
        ? [{ nombre: "Transmisión anticipada de documentos", fechaLimite: sumarDias(new Date(s.fechaEstimada).toISOString(), -5) }]
        : [{ nombre: "Embarque dentro de los 30 días de numerada", fechaLimite: sumarDias(t, 30) }],
    };
    d.ordenes.unshift(orden);
    ordenId = id;
    return d;
  });
  return ordenId;
}

function cargarDocumento(ordenId: string, tipo: string, archivo: string, tamano: number) {
  actualizar(d => {
    const o = d.ordenes.find(x => x.id === ordenId)!;
    const doc = o.documentos.find(x => x.tipo === tipo)!;
    const t = ahora();
    doc.versiones.push({ version: doc.versiones.length + 1, archivo, tamanoBytes: tamano, fecha: t }); // la anterior se conserva
    doc.estado = "pendiente";
    doc.observacion = undefined;
    o.hitos.unshift({ fecha: t, texto: `${tipo} recibido (versión ${doc.versiones.length}); en revisión` });
    return d;
  });
  // el agente IA revisa en segundo plano y deja el resultado en la bandeja (CUS-17)
  window.setTimeout(() => actualizar(d => {
    const o = d.ordenes.find(x => x.id === ordenId)!;
    d.resultados.push(revisarDocumento(o, tipo, `RA-${Date.now() % 100000}`));
    return d;
  }), 2500);
}

function validar(resultadoId: string, decision: "aceptada" | "corregida" | "rechazada", texto: string, operador: string) {
  actualizar(d => {
    const r = d.resultados.find(x => x.id === resultadoId)!;
    const t = ahora();
    r.validacion = { operador, fecha: t, decision, texto };
    r.estado = decision === "rechazada" ? "derivado" : "validado";
    const o = d.ordenes.find(x => x.id === r.ordenId);
    if (!o) return d;
    if (decision === "rechazada") {
      o.hitos.unshift({ fecha: t, texto: `${r.actividad}: derivada a resolución directa del operador` });
    } else if (r.actividad === "Revisión documental" && r.documento) {
      const doc = o.documentos.find(x => x.tipo === r.documento);
      const observado = r.verificaciones.some(v => !v.ok);
      if (doc) {
        doc.estado = observado ? "no_conforme" : "conforme";
        doc.observacion = observado ? { texto, validadoPor: `${operador} · operador de despacho`, fecha: t } : undefined;
      }
      o.hitos.unshift({ fecha: t, texto: observado ? `Observación en ${r.documento.toLowerCase()}` : `${r.documento} conforme` });
      if (o.documentos.every(x => x.estado === "conforme" || x.estado === "no_requerido"))
        o.hitos.unshift({ fecha: t, texto: "Documentación conforme" });
    } else {
      o.hitos.unshift({ fecha: t, texto: `${r.actividad} validada` });
    }
    return d;
  });
}

/* ---------------- hook ---------------- */
const VACIO: Datos = { clientes: [], usuarios: [], servicios: [], solicitudes: [], ordenes: [], resultados: [], correlativos: {}, cotizaciones: 0 };

export function useDatos() {
  const datos = useSyncExternalStore(suscribir, datosActuales, () => null);
  const idSesion = useSyncExternalStore(suscribir, sesionActual, () => null);
  const listo = datos !== null;
  const d = datos ?? VACIO;
  const usuario: Usuario | null = d.usuarios.find(u => u.id === idSesion) ?? null;

  const ingresar = useCallback((email: string, clave: string) => {
    const u = datosActuales().usuarios.find(x => x.email.toLowerCase() === email.trim().toLowerCase() && x.clave === clave) ?? null;
    if (u) fijarSesion(u.id);
    return u;
  }, []);
  const salir = useCallback(() => fijarSesion(null), []);
  const restablecer = useCallback(() => actualizar(() => semilla()), []);

  return {
    listo, datos: d, usuario, ingresar, salir, restablecer, rechazarCotizacion, aceptarCotizacion, cargarDocumento,
    solicitar: (s: NuevaSolicitud) => solicitar(s, usuario?.clienteId ?? "c1"),
    validar: (id: string, dec: "aceptada" | "corregida" | "rechazada", t: string) => validar(id, dec, t, usuario?.nombre ?? "Operador"),
  };
}

/* Las pantallas se dibujan solo en el navegador: sus datos viven allí y no en el servidor. */
const sinSuscripcion = () => () => {};
export function ProveedorDatos({ children }: { children: React.ReactNode }) {
  const enNavegador = useSyncExternalStore(sinSuscripcion, () => true, () => false);
  return enNavegador ? <>{children}</> : null;
}

/* pendientes de la bandeja: los más urgentes primero */
export const pendientes = (rs: ResultadoAsistido[]) =>
  rs.filter(r => r.estado === "pendiente").sort((a, b) => a.vence.localeCompare(b.vence));
