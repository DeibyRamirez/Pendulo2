/**
 * El dsPic interpreta `cfg` como: distancia del muro, luego oscilaciones.
 * Eco serial: CFG+{distancia}+{oscilaciones} (confirmado en laboratorio).
 */
function parametrosCfgHaciaFirmware(oscilaciones, distanciaMuro) {
  return {
    oscilaciones: distanciaMuro,
    distanciaMuro: oscilaciones,
  };
}

module.exports = { parametrosCfgHaciaFirmware };
