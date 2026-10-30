export type Rol = "cliente" | "operador_despacho";

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  clave: string; // solo datos de demostración
  rol: Rol;
  clienteId?: string;
}

export interface Cliente {
  id: string;
  razonSocial: string;
  ruc: string;
}

export type Regimen = "10" | "40";
export type Via = "Marítima" | "Aérea" | "Terrestre";

export interface Servicio {
  id: string;
  nombre: string;
  regimen: Regimen;
  prefijo: "IM" | "EX";
}

export interface Concepto {
  nombre: string;
  monto: number;
}

export interface Cotizacion {
  id: string;
  conceptos: Concepto[];
  total: number;
  moneda: "USD";
  emitida: string; // ISO
  vigenteHasta: string; // ISO
  estado: "emitida" | "aceptada" | "rechazada";
}

export interface Solicitud {
  id: string;
  clienteId: string;
  servicioId: string;
  via: Via;
  aduana: string;
  fechaEstimada: string; // yyyy-mm-dd
  descripcion: string;
  cotizacion: Cotizacion;
  ordenId?: string;
}

export type EstadoDocumento = "faltante" | "pendiente" | "conforme" | "no_conforme" | "no_requerido";

export interface VersionArchivo {
  version: number;
  archivo: string;
  tamanoBytes: number;
  fecha: string; // ISO, hora del servidor
}

export interface Documento {
  tipo: string;
  numero?: string;
  exigencia: "Obligatorio" | "Condicional";
  condicion?: string;
  estado: EstadoDocumento;
  versiones: VersionArchivo[];
  observacion?: { texto: string; validadoPor: string; fecha: string };
}

export interface Hito {
  fecha: string; // ISO
  texto: string;
}

export type Etapa = "Solicitud" | "Cotización" | "Documentos" | "Declaración" | "Canal" | "Levante" | "Cierre";

export interface Orden {
  id: string;
  clienteId: string;
  servicioId: string;
  via: Via;
  aduana: string;
  descripcion: string;
  referencia?: string;
  solicitudId?: string;
  cotizacionId?: string;
  etapa: Etapa;
  abierta: string; // ISO
  documentos: Documento[];
  hitos: Hito[];
  sunat?: { dam: string; canal?: "Verde" | "Naranja" | "Rojo"; levante?: string; ultimaConsulta: string };
  plazos: { nombre: string; fechaLimite: string }[];
}

export interface Verificacion {
  texto: string;
  ok: boolean;
  detalle: string;
}

export interface Validacion {
  operador: string;
  fecha: string;
  decision: "aceptada" | "corregida" | "rechazada";
  texto?: string;
}

export interface ResultadoAsistido {
  id: string;
  ordenId: string;
  actividad: "Revisión documental" | "Clasificación" | "Respuesta a requerimiento";
  documento?: string; // tipo de documento revisado
  vence: string; // ISO: plazo legal comprometido
  certeza: number;
  verificaciones: Verificacion[];
  propuesta: string; // observación propuesta para el cliente, o resultado propuesto
  sustento: string;
  origen: { titulo: string; lineas: { t: string; resaltar?: boolean }[] };
  creado: string;
  estado: "pendiente" | "validado" | "derivado";
  validacion?: Validacion;
}

export interface Datos {
  clientes: Cliente[];
  usuarios: Usuario[];
  servicios: Servicio[];
  solicitudes: Solicitud[];
  ordenes: Orden[];
  resultados: ResultadoAsistido[];
  correlativos: Record<string, number>; // por régimen y vía (RN-02)
  cotizaciones: number;
}
