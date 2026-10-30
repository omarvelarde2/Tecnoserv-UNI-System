# SGOA · Sistema de Gestión de Operaciones Aduaneras

Interfaces programadas del proyecto del curso Ingeniería de Software (SI 707-U, UNI) para una agencia
aduanera como Tecnoserv S.A. Es el frontend del sistema (Next.js), con **datos de ejemplo** y sin
backend: lo que hará la API se simula en el navegador.

## Pantallas incluidas

| Pantalla | Ruta | Casos de uso |
|---|---|---|
| IU-01 Iniciar sesión | `/login` | CUS-01 |
| IU-02 Mis órdenes | `/portal` | CUS-15 |
| IU-03 Solicitar servicio y cotización | `/portal/solicitudes/nueva` | CUS-09 a CUS-12 |
| IU-04 Orden de servicio y seguimiento | `/portal/ordenes/[id]` | CUS-12, CUS-15 |
| IU-05 Documentos de la orden | `/portal/ordenes/[id]/documentos` | CUS-13, CUS-14 |
| IU-09 Bandeja de validación | `/app/bandeja` | CUS-26, CUS-27 |

Las demás opciones del menú aparecen deshabilitadas («No incluida en esta versión»).

## Cómo ejecutarla

Requiere Node.js 20 o superior.

```bash
npm install
npm run build
npm run start      # http://localhost:3000
```

Para desarrollo: `npm run dev`.

## Usuarios de demostración

| Usuario | Correo | Contraseña | Entra a |
|---|---|---|---|
| Ana Torres (cliente, ACME Importaciones S.A.C.) | `ana.torres@acme.test` | `demo1234` | Portal del cliente |
| Luis Rojas (operador de despacho) | `luis.rojas@agencia.test` | `demo1234` | Bandeja de validación |

En la pantalla de inicio de sesión, un clic en el usuario de ejemplo rellena el formulario.

## Recorrido sugerido

1. Abra dos pestañas. En una ingrese como cliente y en la otra como operador (la sesión es por pestaña).
2. Cliente: **Solicitar servicio** → complete el formulario → **Solicitar cotización** → **Aceptar cotización** → **Confirmar**. Se abre la orden con el número siguiente (IM-M-000124).
3. Operador: en la bandeja, la revisión de la lista de empaque de IM-M-000123 detecta que el peso difiere 680 kg. **Aceptar**.
4. Cliente: en IM-M-000123 aparece la observación. **Ir a documentos** → elija un PDF → **Cargar**.
5. A los pocos segundos la revisión de la versión 2 llega a la bandeja del operador; al aceptarla, la orden queda con la documentación conforme.

**Restablecer datos de demostración** (al pie del menú) vuelve al estado inicial.

## Qué está simulado

- **Datos y sesión**: los datos viven en el `localStorage` del navegador y la sesión en `sessionStorage`; no hay servidor ni base de datos. Las pestañas se sincronizan con el evento `storage`.
- **Revisión documental por IA**: `revisarDocumento` (`src/lib/reglas.ts`) devuelve un resultado fijo a los 2,5 s. En el sistema real la hace el agente IA en el backend.
- **Archivos**: solo se registran nombre y tamaño; el archivo no se guarda.
- **SUNAT**: los estados ante la autoridad son datos de ejemplo.
- **Fechas**: las pone el navegador; en el sistema real las pone el servidor (RN-17).

Todos los datos son ficticios (RUC `20100000001`, clientes de ejemplo, números de declaración inventados).

## Estructura

```
src/
  app/            páginas (App Router)
  components/     Marco (barra y menú) y componentes de interfaz
  lib/
    tipos.ts      modelo de datos
    reglas.ts     reglas de negocio usadas por las pantallas (tarifario, numeración, documentos exigibles…)
    datos.ts      datos de ejemplo
    store.tsx     estado de la demostración (reemplaza a la API)
```
