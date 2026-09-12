/**
 * Flag global del plus de evaluación (grupos, cuestionarios, Excel de entregas).
 * Si el documento no existe, el módulo está apagado.
 */

import { doc, onSnapshot, setDoc } from "firebase/firestore"
import { db } from "@/app/services/firebase"

export const RUTA_CONFIG_APP = "configuracion/app"

export function escucharModuloEvaluacion(
  alCambiar: (activo: boolean) => void,
  alError?: (error: Error) => void
): () => void {
  const ref = doc(db, "configuracion", "app")
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        alCambiar(false)
        return
      }
      alCambiar(snap.data()?.modulo_evaluacion === true)
    },
    (error) => {
      alError?.(error)
      alCambiar(false)
    }
  )
}

export async function guardarModuloEvaluacion(activo: boolean): Promise<void> {
  const ref = doc(db, "configuracion", "app")
  await setDoc(ref, { modulo_evaluacion: activo }, { merge: true })
}
