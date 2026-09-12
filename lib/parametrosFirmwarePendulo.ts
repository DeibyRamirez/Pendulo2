/**
 * El dsPic interpreta `cfg` como: distancia del muro, luego oscilaciones.
 * Eco serial: CFG+{distancia}+{oscilaciones} (confirmado en laboratorio).
 */
export function parametrosCfgHaciaFirmware(oscilaciones: number, distanciaMuro: number) {
  return {
    oscilaciones: distanciaMuro,
    distanciaMuro: oscilaciones,
  }
}
