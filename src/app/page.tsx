"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDatos } from "@/lib/store";

/* La raíz lleva a la pantalla que corresponde a la sesión. */
export default function Inicio() {
  const { listo, usuario } = useDatos();
  const router = useRouter();
  useEffect(() => {
    if (!listo) return;
    router.replace(!usuario ? "/login" : usuario.rol === "cliente" ? "/portal" : "/app/bandeja");
  }, [listo, usuario, router]);
  return null;
}
