"use client";
/* CUS-01 Iniciar sesión */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDatos } from "@/lib/store";
import { USUARIOS_DEMO } from "@/lib/datos";
import { Boton, Campo, claseCampo } from "@/components/ui";

export default function Login() {
  const { listo, usuario, ingresar } = useDatos();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (listo && usuario) router.replace(usuario.rol === "cliente" ? "/portal" : "/app/bandeja");
  }, [listo, usuario, router]);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !clave) { setError("Ingrese su correo y su contraseña."); return; }
    const u = ingresar(email, clave);
    if (!u) { setError("Correo o contraseña incorrectos."); return; }
    router.replace(u.rol === "cliente" ? "/portal" : "/app/bandeja");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-fondo p-4">
      <div className="w-full max-w-[400px]">
        <div className="mb-5 text-center">
          <div className="text-2xl font-bold tracking-wide text-marca">SGOA</div>
          <div className="text-[13px] text-tenue">Sistema de Gestión de Operaciones Aduaneras</div>
        </div>
        <form onSubmit={enviar} noValidate className="rounded-lg border border-linea bg-white px-6 py-6">
          <h1 className="mb-4 text-lg font-semibold">Iniciar sesión</h1>
          <Campo etiqueta="Correo electrónico" id="email">
            <input id="email" type="email" autoComplete="username" className={claseCampo} value={email}
              onChange={e => { setEmail(e.target.value); setError(""); }} aria-invalid={!!error} />
          </Campo>
          <Campo etiqueta="Contraseña" id="clave" error={error}>
            <input id="clave" type="password" autoComplete="current-password" className={claseCampo} value={clave}
              onChange={e => { setClave(e.target.value); setError(""); }} aria-invalid={!!error} />
          </Campo>
          <Boton variante="primario" type="submit" className="mt-1 w-full">Ingresar</Boton>
          <p className="mt-3 text-center text-xs text-tenue">El portal es para clientes con representación vigente; el personal de la agencia entra con su usuario interno.</p>
        </form>
        <div className="mt-4 rounded-lg border border-dashed border-linea bg-white/60 px-4 py-3 text-xs text-tenue">
          <div className="mb-1.5 font-semibold">Versión de demostración · usuarios de ejemplo</div>
          {USUARIOS_DEMO.map(u => (
            <button key={u.id} type="button" onClick={() => { setEmail(u.email); setClave(u.clave); setError(""); }}
              className="mb-1 block w-full cursor-pointer rounded px-2 py-1 text-left hover:bg-suave">
              <b className="text-tinta">{u.nombre}</b> · {u.rol === "cliente" ? "cliente (ACME)" : "operador de despacho"} — {u.email}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
