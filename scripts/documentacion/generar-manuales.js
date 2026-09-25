/**
 * Genera los dos manuales universitarios WPA en docs/.
 * Uso (desde esta carpeta): npm install && npm run generar
 */

const { generarManualUsuario } = require("./generar-manual-usuario");
const { generarManualTecnico } = require("./generar-manual-tecnico");

async function principal() {
  const usuario = await generarManualUsuario();
  const tecnico = await generarManualTecnico();
  console.log("Manual de Usuario:", usuario);
  console.log("Manual Técnico:", tecnico);
}

principal().catch((error) => {
  console.error("No se pudieron generar los manuales:", error);
  process.exit(1);
});
