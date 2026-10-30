/* Reglas del negocio que usan las pantallas. Con datos de ejemplo: en la fase de desarrollo
   estas decisiones las toma el servidor y estas funciones quedan como validación del navegador. */
import type { Concepto, Datos, Documento, Orden, ResultadoAsistido, Servicio, Via, Etapa } from "./tipos";

export const ADUANAS = ["118 · Marítima del Callao", "235 · Aérea y Postal del Callao"];
export const VIAS: Via[] = ["Marítima", "Aérea", "Terrestre"];
export const ETAPAS: Etapa[] = ["Solicitud", "Cotización", "Documentos", "Declaración", "Canal", "Levante", "Cierre"];

/* tarifario vigente por servicio (CUS-06); los tributos no forman parte de la cotización (RN-18) */
export const TARIFARIO: Record<string, Concepto[]> = {
  "imp-consumo": [
    { nombre: "Comisión de agenciamiento", monto: 180 },
    { nombre: "Gastos operativos", monto: 65 },
    { nombre: "Transmisión electrónica", monto: 25 },
  ],
  "exp-definitiva": [
    { nombre: "Comisión de agenciamiento", monto: 150 },
    { nombre: "Gastos operativos", monto: 50 },
    { nombre: "Transmisión electrónica", monto: 25 },
  ],
};

export const DIA = 24 * 3600 * 1000;
export const ahora = () => new Date().toISOString(); // en producción, la fecha la pone el servidor (RN-17)
export const sumarDias = (iso: string, dias: number) => new Date(new Date(iso).getTime() + dias * DIA).toISOString();

export function cotizar(servicioId: string) {
  const conceptos = TARIFARIO[servicioId] ?? [];
  return { conceptos, total: conceptos.reduce((s, c) => s + c.monto, 0) };
}

/* numeración segmentada por régimen y vía; un número asignado no se reutiliza (RN-02) */
export function siguienteNumeroOrden(datos: Datos, servicio: Servicio, via: Via) {
  const clave = `${servicio.prefijo}-${via[0]}`;
  const n = (datos.correlativos[clave] ?? 0) + 1;
  return { clave, n, id: `${clave}-${String(n).padStart(6, "0")}` };
}

export function documentoDeTransporte(via: Via) {
  return via === "Marítima" ? "Conocimiento de embarque (B/L)" : via === "Aérea" ? "Guía aérea (AWB)" : "Carta porte";
}

/* documentos exigibles iniciales según régimen y vía (RF-16); se completan al conocerse la subpartida */
export function documentosExigibles(servicio: Servicio, via: Via): Documento[] {
  const d = (tipo: string, exigencia: Documento["exigencia"], condicion?: string): Documento =>
    ({ tipo, exigencia, condicion, estado: "faltante", versiones: [] });
  if (servicio.regimen === "10")
    return [d("Factura comercial", "Obligatorio"), d(documentoDeTransporte(via), "Obligatorio"), d("Lista de empaque", "Obligatorio"),
            d("Póliza de seguro", "Condicional", "si el Incoterm no incluye seguro")];
  return [d("Factura comercial", "Obligatorio"), d("Lista de empaque", "Obligatorio"),
          d(documentoDeTransporte(via), "Condicional", "para la regularización, después del embarque")];
}

/* archivos admitidos: PDF o imagen, hasta 20 MB */
export const TAMANO_MAXIMO = 20 * 1024 * 1024;
export function validarArchivo(nombre: string, tamano: number): string | null {
  if (!/\.(pdf|jpe?g|png)$/i.test(nombre)) return "Formato no admitido: se aceptan PDF, JPG o PNG.";
  if (tamano > TAMANO_MAXIMO) return "El archivo supera el tamaño máximo de 20 MB.";
  if (tamano === 0) return "El archivo está vacío.";
  return null;
}

export function diasRestantes(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / DIA);
}
export function urgencia(iso: string): "bad" | "warn" | "neutral" {
  const d = diasRestantes(iso);
  return d <= 1 ? "bad" : d <= 3 ? "warn" : "neutral";
}

/* simulación del agente IA para la revisión documental (CUS-17): reglas fijas sobre datos de ejemplo */
export function revisarDocumento(orden: Orden, tipo: string, id: string): ResultadoAsistido {
  const doc = orden.documentos.find(x => x.tipo === tipo)!;
  const version = doc.versiones.at(-1)!;
  const obligatorios = orden.documentos.filter(x => x.exigencia === "Obligatorio");
  const cargados = obligatorios.filter(x => x.versiones.length > 0).length;
  const pesoDifiere = tipo === "Lista de empaque" && version.version === 1;
  const verificaciones = [
    { texto: "Legibilidad y vigencia", ok: true, detalle: "Conforme" },
    { texto: "Valor y moneda factura ↔ documento de transporte", ok: true, detalle: "Conforme" },
    { texto: "Peso bruto lista de empaque ↔ documento de transporte", ok: !pesoDifiere, detalle: pesoDifiere ? "Difiere 680 kg" : "Conforme" },
    { texto: "Completitud", ok: true, detalle: `${cargados} de ${obligatorios.length} obligatorios` },
  ];
  const propuesta = pesoDifiere
    ? "El peso bruto declarado en la lista de empaque (18 420 kg) no coincide con el del conocimiento de embarque (19 100 kg). Adjunte la lista corregida."
    : `${tipo}: conforme.`;
  return {
    id, ordenId: orden.id, actividad: "Revisión documental", documento: tipo,
    vence: orden.plazos[0]?.fechaLimite ?? sumarDias(ahora(), 5),
    certeza: pesoDifiere ? 0.93 : 0.97, verificaciones, propuesta,
    sustento: `Simulación del agente IA · instrucciones v1.4 · archivo ${version.archivo} (versión ${version.version})`,
    origen: {
      titulo: tipo.toUpperCase(),
      lineas: tipo === "Lista de empaque"
        ? [{ t: "PACKING LIST" }, { t: "Shipper: ACME Supplier Co." }, { t: `Gross weight: ${pesoDifiere ? "18 420" : "19 100"} KG`, resaltar: true },
           { t: "Net weight: 17 980 KG" }, { t: "Packages: 640" }]
        : [{ t: tipo.toUpperCase() }, { t: `Archivo: ${version.archivo}` }, { t: "Datos extraídos y contrastados sin observaciones." }],
    },
    creado: ahora(), estado: "pendiente",
  };
}

export const fmtFecha = (iso: string) => new Date(iso).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
export const fmtFechaHora = (iso: string) =>
  new Date(iso).toLocaleString("es-PE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
export const fmtMonto = (n: number) => n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const fmtTamano = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
