# Flujos de descarga de Excel

Cómo se genera cada `.xlsx` en la web. La fuente de verdad es
[`app/services/lecturasExportService.js`](../app/services/lecturasExportService.js).
Cada clic **regenera** el archivo desde Firestore; no hay un Excel guardado
en el servidor.

## Vista general

```mermaid
flowchart TB
  subgraph siempre [Siempre visible]
    EstPractica["Estudiante: Excel de esta práctica"]
    EstGeneral["Estudiante: Excel general"]
    DocMuestras["Docente: Excel de muestras 2 hojas"]
    AdminExcel["Admin: Excel general del péndulo"]
  end
  subgraph plus [Solo si modulo_evaluacion está encendido]
    DocEntregas["Docente: Excel de entregas"]
    DocTrabajo["Docente: Excel de un trabajo"]
    EstCuest["Estudiante: envía cuestionario"]
  end
  EstCuest --> DocEntregas
  EstCuest --> DocTrabajo
```

| Quién | Dónde se pulsa | Función | Archivo | Qué incluye |
|---|---|---|---|---|
| Estudiante | Tiempo real / Historial | `exportarLecturasUsuario` | `practica_{pendulo}_{id}.xlsx` | Muestras de **una** práctica |
| Estudiante | Tiempo real | `exportarExcelGeneral` | `practicas_general_{pendulo}.xlsx` | Todas **sus** prácticas de **ese** péndulo |
| Estudiante | Historial | `exportarExcelGeneralUsuario` | `practicas_general.xlsx` | Todas **sus** prácticas en los péndulos usados |
| Docente | `/docente` — Excel de muestras | `exportarExcelMuestrasDocente` | `excel_muestras_UAC-01_{fecha}.xlsx` | 2 hojas: propias + todas con nombre |
| Docente | `/docente` — solo plus | `exportarExcelGeneralDocente` | `reporte_docente_{fecha}.xlsx` | Entregas de sus grupos + cuestionario |
| Docente | Un trabajo — solo plus | `exportarExcelAsignacion` | `reporte_trabajo_{id}.xlsx` | Entregas de **ese** trabajo + cuestionario |
| Admin | Tiempo real | `exportarLecturasAdmin` | `practicas_general_{pendulo}.xlsx` | Todas las prácticas del péndulo + `usuario_uid` |

El plus de evaluación es el flag Firestore `configuracion/app.modulo_evaluacion`.
Apagado: se ocultan grupos, trabajos y Excel de entregas. El Excel de muestras
sigue visible.

---

## 1. Estudiante — Excel de esta práctica

Tiempo real e Historial llaman la misma función.

- **Dónde:** Tiempo real (`Excel de esta práctica`) o Historial (icono de
  descarga en una fila).
- **Lee:** `pendulo_data/{penduloId}/practicas/{uid}/lecturas` filtrado por
  `practicaId`.
- **Columnas:** muestra, fecha, periodo, gravedad, frecuencia, temperatura.
- **Archivo:** `practica_{penduloId}_{idCorto}.xlsx`.
- Si no hay lecturas, no descarga y muestra error.

```mermaid
flowchart TD
  clic["Clic Excel de esta práctica"]
  fn["exportarLecturasUsuario"]
  fs["Firestore lecturas de esa practicaId"]
  vacio{"Hay filas?"}
  xlsx["Descarga practica_pendulo_id.xlsx"]
  error["Error: no hay lecturas"]
  clic --> fn --> fs --> vacio
  vacio -->|sí| xlsx
  vacio -->|no| error
```

---

## 2. Estudiante — Excel general

Junta **solo las prácticas del usuario que descarga**, no las de otros.

- **Tiempo real:** `exportarExcelGeneral` — un péndulo (`UAC-01` en turno).
- **Historial:** `exportarExcelGeneralUsuario` — todos los `penduloId` de sus
  reservas/prácticas.
- **Columnas:** las de una práctica más `practica_id` y `pendulo_id`.
- Cada fila es una muestra. Se regenera entero en cada clic.

```mermaid
flowchart TD
  subgraph tiempoReal [Tiempo real]
    clicTR["Clic Excel general"]
    fnTR["exportarExcelGeneral"]
    unPendulo["Todas sus prácticas de ese péndulo"]
  end
  subgraph historial [Historial]
    clicH["Clic Excel general"]
    fnH["exportarExcelGeneralUsuario"]
    varios["Sus prácticas en todos los péndulos"]
  end
  archivo["practicas_general.xlsx"]
  clicTR --> fnTR --> unPendulo --> archivo
  clicH --> fnH --> varios --> archivo
```

---

## 3. Docente — Excel de muestras (siempre visible)

Botón **Descargar Excel de muestras** en [`app/docente/page.tsx`](../app/docente/page.tsx).
No usa grupos ni entregas. No depende del plus.

- **Hoja Mis prácticas:** lecturas del docente (mismas columnas que el Excel
  general del estudiante).
- **Hoja Todas las muestras:** todos los usuarios de `UAC-01`, sin filtro,
  con `nombre_estudiante` y `correo` (el nombre sale de `usuarios/{uid}`).
- Si una hoja no tiene filas, se exporta solo con encabezados.
- Si **ambas** están vacías, error y no hay archivo.

```mermaid
flowchart TD
  clic["Clic Descargar Excel de muestras"]
  fn["exportarExcelMuestrasDocente"]
  propias["Hoja Mis prácticas"]
  todas["Hoja Todas las muestras"]
  nombres["Mapa uid a nombre y correo"]
  vacias{"Ambas vacías?"}
  xlsx["excel_muestras_UAC-01_fecha.xlsx"]
  error["Error: no hay lecturas"]
  clic --> fn
  fn --> propias
  fn --> nombres --> todas
  propias --> vacias
  todas --> vacias
  vacias -->|no| xlsx
  vacias -->|sí| error
```

---

## 4. Cuestionario y plus de evaluación

Solo si el admin enciende `modulo_evaluacion`.

### Estudiante: enviar cuestionario

1. Completa una práctica **con muestras**.
2. Abre `/dashboard/trabajos/{asignacionId}`.
3. `enviarEntrega` guarda respuestas ligadas a su `practica_id`.
4. Pasada la **fecha límite** no puede enviar ni editar (solo leer).
5. Si el docente ya calificó, tampoco edita.

```mermaid
flowchart TD
  practica["Práctica con muestras"]
  form["Cuestionario del trabajo"]
  limite{"Fecha límite vigente?"}
  envio["enviarEntrega"]
  fs["asignaciones/id/entregas/uid"]
  bloqueo["Solo lectura"]
  practica --> form --> limite
  limite -->|sí| envio --> fs
  limite -->|no| bloqueo
```

### Docente: Excel de entregas

- **Home `/docente`:** `exportarExcelGeneralDocente` — todas las entregas de
  sus grupos.
- **Un trabajo** `/docente/asignaciones/{id}`:** `exportarExcelAsignacion` —
  solo ese trabajo.
- **Solo** alumnos que **entregaron** (tienen `practica_id`). No es el Excel
  de todas las muestras.
- **Columnas:** Fecha, Grupo, Estudiante (correo), Muestras, Gravedad,
  Frecuencia, Periodo, Temperatura, Respuestas Cuestionario.

```mermaid
flowchart TD
  plus{"modulo_evaluacion encendido?"}
  oculto["Botones de entregas ocultos"]
  home["Clic Excel de entregas"]
  trabajo["Clic Excel en un trabajo"]
  fnG["exportarExcelGeneralDocente"]
  fnA["exportarExcelAsignacion"]
  entregas["Solo entregas con practica_id"]
  lecturas["Lecturas de esa práctica"]
  xlsxG["reporte_docente_fecha.xlsx"]
  xlsxA["reporte_trabajo_id.xlsx"]
  plus -->|no| oculto
  plus -->|sí| home
  plus -->|sí| trabajo
  home --> fnG --> entregas --> lecturas --> xlsxG
  trabajo --> fnA --> entregas
```

---

## 5. Admin — Excel general del péndulo

En Tiempo real, si el rol es Admin, el botón **Excel general** llama
`exportarLecturasAdmin` en lugar del general del estudiante.

- Recorre todos los `uid` en `pendulo_data/{penduloId}/practicas`.
- Columnas del general más `usuario_uid`.
- Archivo: `practicas_general_{penduloId}.xlsx`.

```mermaid
flowchart TD
  clic["Admin: Excel general"]
  fn["exportarLecturasAdmin"]
  uids["listarUsuariosConPracticas"]
  lecturas["Lecturas de cada uid"]
  xlsx["practicas_general_pendulo.xlsx"]
  clic --> fn --> uids --> lecturas --> xlsx
```

---

## Dónde está el código

| Función | Archivo |
|---|---|
| Exportes | [`app/services/lecturasExportService.js`](../app/services/lecturasExportService.js) |
| Lecturas Firestore | [`app/services/penduloDataService.js`](../app/services/penduloDataService.js) |
| Nombres de usuario | [`app/services/usuarioService.js`](../app/services/usuarioService.js) `obtenerMapaNombresUsuarios` |
| Entregas / grupos | [`app/services/grupoService.js`](../app/services/grupoService.js) |
| Flag plus | [`lib/moduloEvaluacion.ts`](../lib/moduloEvaluacion.ts) |
