/* Datos de ejemplo anonimizados para la demostración. Las fechas se calculan desde el momento
   en que se cargan, para que los plazos tengan sentido el día en que se presente. */
import type { Datos, Orden, ResultadoAsistido } from "./tipos";
import { DIA, documentosExigibles } from "./reglas";

/* usuarios de demostración: solo funcionan en esta versión con datos de ejemplo */
export const USUARIOS_DEMO = [
  { id: "u1", nombre: "Ana Torres", email: "ana.torres@acme.test", clave: "demo1234", rol: "cliente" as const, clienteId: "c1" },
  { id: "u2", nombre: "Luis Rojas", email: "luis.rojas@agencia.test", clave: "demo1234", rol: "operador_despacho" as const },
];

export function semilla(): Datos {
  const now = Date.now();
  const hace = (dias: number, horas = 0) => new Date(now - dias * DIA - horas * 3600e3).toISOString();
  const en = (dias: number) => new Date(now + dias * DIA).toISOString();
  const imp = { id: "imp-consumo", nombre: "Importación para el consumo (10)", regimen: "10" as const, prefijo: "IM" as const };
  const exp = { id: "exp-definitiva", nombre: "Exportación definitiva (40)", regimen: "40" as const, prefijo: "EX" as const };

  /* IM-M-000123: documentos cargados, la lista de empaque en revisión */
  const o123: Orden = {
    id: "IM-M-000123", clienteId: "c1", servicioId: imp.id, via: "Marítima", aduana: "118 · Marítima del Callao",
    descripcion: "Mesas plegables de acero y polipropileno para uso doméstico, 2 contenedores de 40'.",
    referencia: "PO-3476", cotizacionId: "COT-2026-00398", etapa: "Documentos", abierta: hace(2),
    documentos: documentosExigibles(imp, "Marítima").map(d => {
      if (d.tipo === "Factura comercial") return { ...d, numero: "INV-88412", estado: "conforme", versiones: [{ version: 1, archivo: "factura_INV-88412.pdf", tamanoBytes: 412000, fecha: hace(1, 5) }] };
      if (d.tipo.startsWith("Conocimiento")) return { ...d, numero: "MSCU-2291", estado: "conforme", versiones: [{ version: 1, archivo: "bl_MSCU-2291.pdf", tamanoBytes: 655000, fecha: hace(1, 5) }] };
      if (d.tipo === "Lista de empaque") return { ...d, estado: "pendiente", versiones: [{ version: 1, archivo: "packing_list.pdf", tamanoBytes: 1180000, fecha: hace(1, 1) }] };
      return { ...d, estado: "no_requerido", condicion: "CIF: el seguro está incluido" };
    }),
    hitos: [
      { fecha: hace(1, 1), texto: "Lista de empaque recibida; en revisión" },
      { fecha: hace(1, 5), texto: "Factura y conocimiento de embarque conformes" },
      { fecha: hace(2), texto: "Orden abierta" },
    ],
    plazos: [{ nombre: "Transmisión anticipada de documentos", fechaLimite: en(1) }],
  };

  /* IM-M-000119: declaración numerada, canal naranja */
  const o119: Orden = {
    id: "IM-M-000119", clienteId: "c1", servicioId: imp.id, via: "Marítima", aduana: "118 · Marítima del Callao",
    descripcion: "Repuestos de motor para maquinaria agrícola.", referencia: "PO-3401", etapa: "Canal", abierta: hace(12),
    documentos: documentosExigibles(imp, "Marítima").map((d, i) => d.exigencia === "Obligatorio"
      ? { ...d, estado: "conforme", versiones: [{ version: 1, archivo: `doc_${i + 1}.pdf`, tamanoBytes: 380000 + i * 51000, fecha: hace(9) }] }
      : { ...d, estado: "no_requerido", condicion: "CIF: el seguro está incluido" }),
    hitos: [
      { fecha: hace(0, 3), texto: "Canal naranja asignado: revisión documentaria" },
      { fecha: hace(1), texto: "Declaración numerada" },
      { fecha: hace(4), texto: "Clasificación arancelaria validada" },
      { fecha: hace(8), texto: "Documentación conforme" },
      { fecha: hace(12), texto: "Orden abierta" },
    ],
    sunat: { dam: "118-2026-10-045812", canal: "Naranja", ultimaConsulta: hace(0, 1) },
    plazos: [{ nombre: "Regularización del despacho anticipado", fechaLimite: en(14) }],
  };

  /* EX-M-000041: exportación con documentos por cargar */
  const o41: Orden = {
    id: "EX-M-000041", clienteId: "c1", servicioId: exp.id, via: "Marítima", aduana: "118 · Marítima del Callao",
    descripcion: "Uva fresca de mesa en cajas de 8,2 kg, 1 contenedor refrigerado.", referencia: "EXP-0219", etapa: "Documentos", abierta: hace(1),
    documentos: documentosExigibles(exp, "Marítima"),
    hitos: [{ fecha: hace(1), texto: "Orden abierta" }],
    plazos: [{ nombre: "Embarque dentro de los 30 días de numerada", fechaLimite: en(8) }],
  };

  /* órdenes de otro cliente: aparecen en la bandeja interna, nunca en el portal de ACME (RNF-23) */
  const o88: Orden = { ...o119, id: "IM-A-000088", clienteId: "c2", via: "Aérea", aduana: "235 · Aérea y Postal del Callao",
    descripcion: "Equipos de laboratorio clínico.", referencia: "AND-771", sunat: { dam: "235-2026-10-012003", canal: "Naranja", ultimaConsulta: hace(0, 2) } };
  const o121: Orden = { ...o41, id: "IM-M-000121", clienteId: "c2", servicioId: imp.id, documentos: documentosExigibles(imp, "Marítima"),
    descripcion: "Tejidos de algodón teñidos.", referencia: "AND-780", plazos: [{ nombre: "Transmisión anticipada de documentos", fechaLimite: en(3) }] };

  const r = (x: Partial<ResultadoAsistido> & Pick<ResultadoAsistido, "id" | "ordenId" | "actividad" | "vence">): ResultadoAsistido => ({
    certeza: 0.9, verificaciones: [], propuesta: "", sustento: "Simulación del agente IA · instrucciones v1.4",
    origen: { titulo: "", lineas: [] }, creado: hace(0, 2), estado: "pendiente", ...x,
  });
  const resultados: ResultadoAsistido[] = [
    r({ id: "RA-1001", ordenId: "IM-M-000123", actividad: "Revisión documental", documento: "Lista de empaque", vence: en(1), certeza: 0.93,
        verificaciones: [
          { texto: "Legibilidad y vigencia", ok: true, detalle: "Conforme" },
          { texto: "Valor y moneda factura ↔ documento de transporte", ok: true, detalle: "Conforme" },
          { texto: "Peso bruto lista de empaque ↔ documento de transporte", ok: false, detalle: "Difiere 680 kg" },
          { texto: "Completitud", ok: true, detalle: "3 de 3 obligatorios" }],
        propuesta: "El peso bruto declarado en la lista de empaque (18 420 kg) no coincide con el del conocimiento de embarque (19 100 kg). Adjunte la lista corregida.",
        sustento: "Simulación del agente IA · instrucciones v1.4 · archivo packing_list.pdf (versión 1)",
        origen: { titulo: "PACKING LIST", lineas: [{ t: "PACKING LIST" }, { t: "Shipper: ACME Supplier Co." }, { t: "Gross weight: 18 420 KG", resaltar: true }, { t: "Net weight: 17 980 KG" }, { t: "Packages: 640" }] } }),
    r({ id: "RA-1002", ordenId: "IM-M-000121", actividad: "Clasificación", vence: en(3), certeza: 0.88,
        verificaciones: [{ texto: "Subpartida propuesta 5208.52.00.00", ok: true, detalle: "Tejidos de algodón estampados" },
                         { texto: "Restricción sectorial", ok: true, detalle: "Ninguna" }],
        propuesta: "Subpartida nacional 5208.52.00.00 para la serie 1.",
        origen: { titulo: "FACTURA", lineas: [{ t: "COMMERCIAL INVOICE" }, { t: "Cotton fabric, dyed, 180 g/m2", resaltar: true }, { t: "Qty: 12 400 m" }] } }),
    r({ id: "RA-1003", ordenId: "IM-A-000088", actividad: "Respuesta a requerimiento", vence: en(3), certeza: 0.91,
        verificaciones: [{ texto: "Documentos de sustento ubicados", ok: true, detalle: "2 de 2" }],
        propuesta: "Se adjuntan la ficha técnica y el certificado de origen solicitados en la notificación.",
        origen: { titulo: "NOTIFICACIÓN", lineas: [{ t: "Se requiere sustentar la descripción", resaltar: true }, { t: "Plazo: 3 días hábiles" }] } }),
  ];

  return {
    clientes: [{ id: "c1", razonSocial: "ACME Importaciones S.A.C.", ruc: "20100000001" },
               { id: "c2", razonSocial: "Distribuidora Andina S.A.", ruc: "20100000002" }],
    usuarios: USUARIOS_DEMO,
    servicios: [imp, exp],
    solicitudes: [],
    ordenes: [o123, o119, o41, o88, o121],
    resultados,
    correlativos: { "IM-M": 123, "IM-A": 88, "EX-M": 41 },
    cotizaciones: 412,
  };
}

