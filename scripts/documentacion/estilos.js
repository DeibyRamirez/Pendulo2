/**
 * Estilos y bloques reutilizables para los manuales universitarios WPA.
 * El generador es independiente de la aplicación web (no altera package.json raíz).
 */

const {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  LevelFormat,
  LineRuleType,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableOfContents,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
  convertInchesToTwip,
} = require("docx");
const fs = require("fs");
const path = require("path");

const COLORES = {
  azul: "0F2C59",
  azulMedio: "1E4D8C",
  azulSuave: "E8EEF6",
  grisTexto: "2C2C2C",
  grisSecundario: "5A5A5A",
  grisFila: "F4F6F9",
  blanco: "FFFFFF",
  placeholder: "8B1E3F",
  linea: "C5CDD8",
};

const ANCHO_UTIL = 9360; // twips aprox. A4 menos márgenes 2.5 / 2 cm
const MARGENES = {
  top: convertInchesToTwip(0.9),
  bottom: convertInchesToTwip(0.9),
  left: convertInchesToTwip(1.0),
  right: convertInchesToTwip(0.85),
};

const BORDES_TABLA = {
  top: { style: BorderStyle.SINGLE, size: 4, color: COLORES.linea },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORES.linea },
  left: { style: BorderStyle.SINGLE, size: 4, color: COLORES.linea },
  right: { style: BorderStyle.SINGLE, size: 4, color: COLORES.linea },
};

function run(texto, extras = {}) {
  return new TextRun({
    text: String(texto ?? ""),
    font: extras.font || "Calibri",
    size: extras.size ?? 22,
    bold: extras.bold || false,
    italics: extras.italics || false,
    underline: extras.underline ? {} : undefined,
    color: extras.color || COLORES.grisTexto,
  });
}

function parrafo(texto, extras = {}) {
  return new Paragraph({
    spacing: {
      after: extras.after ?? 160,
      before: extras.before ?? 0,
      line: extras.line ?? 276,
      lineRule: LineRuleType.AUTO,
    },
    alignment: extras.alignment || AlignmentType.JUSTIFIED,
    indent: extras.indent,
    children: extras.children || [run(texto, extras.run || {})],
  });
}

function titulo1(texto) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160 },
    children: [run(texto, { bold: true, size: 32, color: COLORES.azul })],
  });
}

function titulo2(texto) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    children: [run(texto, { bold: true, size: 26, color: COLORES.azulMedio })],
  });
}

function titulo3(texto) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 80 },
    children: [run(texto, { bold: true, size: 24, color: COLORES.azul })],
  });
}

function vineta(texto, referencia = "vinetas") {
  return new Paragraph({
    numbering: { reference: referencia, level: 0 },
    spacing: { after: 80, line: 276 },
    children: [run(texto)],
  });
}

function paso(texto) {
  return new Paragraph({
    numbering: { reference: "pasos", level: 0 },
    spacing: { after: 80, line: 276 },
    children: [run(texto)],
  });
}

function nota(texto) {
  return new Paragraph({
    shading: { type: ShadingType.CLEAR, fill: COLORES.azulSuave },
    spacing: { before: 120, after: 200 },
    indent: { left: 120, right: 120 },
    border: {
      left: { style: BorderStyle.SINGLE, size: 18, color: COLORES.azulMedio },
    },
    children: [
      run("Nota. ", { bold: true, color: COLORES.azul, size: 20 }),
      run(texto, { size: 20, italics: true }),
    ],
  });
}

function advertencia(texto) {
  return new Paragraph({
    shading: { type: ShadingType.CLEAR, fill: "F8EDED" },
    spacing: { before: 120, after: 200 },
    indent: { left: 120, right: 120 },
    border: {
      left: { style: BorderStyle.SINGLE, size: 18, color: COLORES.placeholder },
    },
    children: [
      run("Importante. ", { bold: true, color: COLORES.placeholder, size: 20 }),
      run(texto, { size: 20 }),
    ],
  });
}

function pieFigura(texto) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 240 },
    children: [run(texto, { italics: true, size: 18, color: COLORES.grisSecundario })],
  });
}

function saltoPagina() {
  return new Paragraph({
    children: [new PageBreak()],
  });
}

function lineaSeparadora() {
  return new Paragraph({
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 12, color: COLORES.azul, space: 1 },
    },
    spacing: { after: 240 },
    children: [],
  });
}

function celda(texto, opciones = {}) {
  const esEncabezado = Boolean(opciones.encabezado);
  const relleno = esEncabezado
    ? COLORES.azul
    : opciones.alterna
      ? COLORES.grisFila
      : COLORES.blanco;
  return new TableCell({
    width: { size: opciones.ancho || 2340, type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, fill: relleno },
    margins: { top: 50, bottom: 50, left: 70, right: 70 },
    verticalAlign: VerticalAlign.CENTER,
    columnSpan: opciones.colspan,
    children: [
      new Paragraph({
        alignment: opciones.centrado || esEncabezado ? AlignmentType.CENTER : AlignmentType.LEFT,
        children: [
          run(texto, {
            bold: esEncabezado || opciones.negrita,
            color: esEncabezado ? COLORES.blanco : COLORES.grisTexto,
            size: opciones.tamano || 19,
            italics: opciones.italica,
          }),
        ],
      }),
    ],
  });
}

function tabla(encabezados, filas, anchos) {
  const columnas = anchos || encabezados.map(() => Math.floor(ANCHO_UTIL / encabezados.length));
  const filasTabla = [
    new TableRow({
      tableHeader: true,
      children: encabezados.map((titulo, indice) =>
        celda(titulo, { encabezado: true, ancho: columnas[indice] })
      ),
    }),
    ...filas.map(
      (fila, indiceFila) =>
        new TableRow({
          children: fila.map((valor, indiceColumna) =>
            celda(valor, {
              ancho: columnas[indiceColumna],
              alterna: indiceFila % 2 === 1,
            })
          ),
        })
    ),
  ];

  return new Table({
    width: { size: ANCHO_UTIL, type: WidthType.DXA },
    columnWidths: columnas,
    rows: filasTabla,
  });
}

function espacioDespuesTabla() {
  return new Paragraph({ spacing: { after: 200 }, children: [] });
}

function campoEditable(etiqueta, valor) {
  return [
    run(`${etiqueta}: `, { bold: true, size: 22, color: COLORES.azul }),
    run(valor, {
      size: 22,
      color: COLORES.placeholder,
      bold: true,
      underline: true,
    }),
  ];
}

function bloqueMonospace(lineas) {
  const lista = Array.isArray(lineas) ? lineas : String(lineas).split("\n");
  const hijos = [];
  lista.forEach((linea, indice) => {
    hijos.push(run(linea, { font: "Consolas", size: 16, color: COLORES.azul }));
    if (indice < lista.length - 1) {
      hijos.push(new TextRun({ break: 1 }));
    }
  });
  return new Paragraph({
    shading: { type: ShadingType.CLEAR, fill: COLORES.grisFila },
    spacing: { before: 80, after: 160 },
    indent: { left: 120, right: 120 },
    children: hijos,
  });
}

function crearPortada({ tituloDocumento, tipoDocumento, descripcionCorta }) {
  return [
    parrafo("CORPORACIÓN UNIVERSITARIA AUTÓNOMA DEL CAUCA", {
      alignment: AlignmentType.CENTER,
      after: 40,
      run: { bold: true, size: 28, color: COLORES.azul },
    }),
    parrafo("Facultad de Ingeniería", {
      alignment: AlignmentType.CENTER,
      after: 40,
      run: { size: 24, color: COLORES.azulMedio },
    }),
    parrafo("Programa de Ingeniería de Sistemas", {
      alignment: AlignmentType.CENTER,
      after: 280,
      run: { size: 22, color: COLORES.grisSecundario, italics: true },
    }),
    lineaSeparadora(),
    parrafo("WORLD PENDULUM ALLIANCE (WPA)", {
      alignment: AlignmentType.CENTER,
      after: 40,
      run: { bold: true, size: 36, color: COLORES.azul },
    }),
    parrafo("Laboratorio remoto de péndulo físico", {
      alignment: AlignmentType.CENTER,
      after: 280,
      run: { size: 24, italics: true, color: COLORES.azulMedio },
    }),
    parrafo(tipoDocumento, {
      alignment: AlignmentType.CENTER,
      after: 80,
      run: { bold: true, size: 40, color: COLORES.azul },
    }),
    parrafo(tituloDocumento, {
      alignment: AlignmentType.CENTER,
      after: 200,
      run: { size: 24, color: COLORES.grisSecundario },
    }),
    parrafo(descripcionCorta, {
      alignment: AlignmentType.CENTER,
      after: 280,
      run: { size: 22, italics: true },
    }),
    parrafo("Proyecto institucional UAC – UNIANDES  |  Red Erasmus+", {
      alignment: AlignmentType.CENTER,
      after: 320,
      run: { size: 20, color: COLORES.azulMedio },
    }),
    tabla(
      ["Campo", "Dato (editable en Word)"],
      [
        ["Autor / Autores", "[NOMBRE DEL AUTOR]"],
        ["Director / Tutor", "[DIRECTOR / TUTOR]"],
        ["Asignatura", "[ASIGNATURA]"],
        ["Código", "[CÓDIGO]"],
        ["Semestre / Periodo", "[SEMESTRE / PERIODO]"],
        ["Versión del documento", "1.0"],
        ["Fecha", "Septiembre de 2026"],
        ["Clasificación", "Documento académico de la plataforma WPA"],
      ],
      [3200, 6160]
    ),
    espacioDespuesTabla(),
    advertencia(
      "Reemplace los campos entre corchetes ([NOMBRE DEL AUTOR], [DIRECTOR / TUTOR], [ASIGNATURA], [CÓDIGO] y [SEMESTRE / PERIODO]) antes de entregar el documento. Están resaltados en color para facilitar su localización."
    ),
    parrafo("Popayán, Cauca — República de Colombia", {
      alignment: AlignmentType.CENTER,
      before: 200,
      after: 0,
      run: { size: 20, color: COLORES.grisSecundario },
    }),
  ];
}

function crearFichaControl(nombreDocumento) {
  return [
    titulo1("Control de versiones y ficha técnica"),
    parrafo(
      "Este apartado registra la trazabilidad del documento. Cada actualización sustancial debe incrementar la versión e indicar el motivo del cambio."
    ),
    tabla(
      ["Versión", "Fecha", "Descripción", "Responsable"],
      [
        [
          "1.0",
          "Septiembre 2026",
          `Primera edición formal del ${nombreDocumento}, elaborada a partir del sistema en producción (web Next.js, Firebase y bridge en Raspberry Pi).`,
          "[NOMBRE DEL AUTOR]",
        ],
      ],
      [1200, 1800, 4360, 2000]
    ),
    espacioDespuesTabla(),
    parrafo(
      "El contenido describe el comportamiento real de la plataforma World Pendulum Alliance tal como está implementado en el repositorio del proyecto. Las pantallas de prototipo no conectadas a datos reales se declaran explícitamente fuera de alcance operativo."
    ),
  ];
}

function crearTablaContenido() {
  return [
    titulo1("Tabla de contenido"),
    parrafo(
      "Al abrir el archivo en Microsoft Word, haga clic derecho sobre el índice y elija «Actualizar campos» para numerar las páginas definitivas.",
      { run: { italics: true, size: 20, color: COLORES.grisSecundario } }
    ),
    new TableOfContents("Índice", {
      hyperlink: true,
      headingStyleRange: "1-3",
    }),
  ];
}

function estilosDocumento() {
  return {
    default: {
      document: {
        run: {
          font: "Calibri",
          size: 22,
          color: COLORES.grisTexto,
        },
      },
    },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickStyle: true,
        paragraph: {
          spacing: { before: 360, after: 160 },
          outlineLevel: 0,
        },
        run: { size: 32, bold: true, font: "Calibri", color: COLORES.azul },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickStyle: true,
        paragraph: {
          spacing: { before: 280, after: 120 },
          outlineLevel: 1,
        },
        run: { size: 26, bold: true, font: "Calibri", color: COLORES.azulMedio },
      },
      {
        id: "Heading3",
        name: "Heading 3",
        basedOn: "Normal",
        next: "Normal",
        quickStyle: true,
        paragraph: {
          spacing: { before: 200, after: 80 },
          outlineLevel: 2,
        },
        run: { size: 24, bold: true, font: "Calibri", color: COLORES.azul },
      },
    ],
  };
}

function numeracionDocumento() {
  return {
    config: [
      {
        reference: "vinetas",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "•",
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: { indent: { left: 720, hanging: 360 } },
            },
          },
        ],
      },
      {
        reference: "pasos",
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: "%1.",
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: { indent: { left: 720, hanging: 360 } },
            },
          },
        ],
      },
    ],
  };
}

function encabezado(tituloCorto) {
  return new Header({
    children: [
      new Paragraph({
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 8, color: COLORES.azul, space: 4 },
        },
        spacing: { after: 120 },
        children: [
          run("WPA  ·  Corporación Universitaria Autónoma del Cauca", {
            size: 16,
            color: COLORES.azul,
            bold: true,
          }),
          run("    |    ", { size: 16, color: COLORES.linea }),
          run(tituloCorto, { size: 16, color: COLORES.grisSecundario, italics: true }),
        ],
      }),
    ],
  });
}

function pieDePagina() {
  return new Footer({
    children: [
      new Paragraph({
        border: {
          top: { style: BorderStyle.SINGLE, size: 8, color: COLORES.azul, space: 6 },
        },
        alignment: AlignmentType.RIGHT,
        children: [
          run("Documento confidencial de uso académico  ·  Página ", {
            size: 16,
            color: COLORES.grisSecundario,
          }),
          new TextRun({
            children: [PageNumber.CURRENT],
            font: "Calibri",
            size: 16,
            color: COLORES.azul,
            bold: true,
          }),
        ],
      }),
    ],
  });
}

function construirDocumento({ titulo, tituloCorto, tipoDocumento, descripcionCorta, cuerpo }) {
  return new Document({
    creator: "Plataforma WPA — Corporación Universitaria Autónoma del Cauca",
    title: titulo,
    description: tipoDocumento,
    styles: estilosDocumento(),
    numbering: numeracionDocumento(),
    sections: [
      {
        properties: {
          page: {
            margin: MARGENES,
            size: {
              width: convertInchesToTwip(8.27),
              height: convertInchesToTwip(11.69),
            },
          },
        },
        children: crearPortada({
          tituloDocumento: titulo,
          tipoDocumento,
          descripcionCorta,
        }),
      },
      {
        properties: {
          page: {
            margin: MARGENES,
            pageNumbers: { start: 1 },
            size: {
              width: convertInchesToTwip(8.27),
              height: convertInchesToTwip(11.69),
            },
          },
        },
        headers: { default: encabezado(tituloCorto) },
        footers: { default: pieDePagina() },
        children: cuerpo,
      },
    ],
  });
}

async function guardarDocumento(documento, nombreArchivo) {
  const carpetaDocs = path.resolve(__dirname, "..", "..", "docs");
  if (!fs.existsSync(carpetaDocs)) {
    fs.mkdirSync(carpetaDocs, { recursive: true });
  }
  const destino = path.join(carpetaDocs, nombreArchivo);
  const buffer = await Packer.toBuffer(documento);
  fs.writeFileSync(destino, buffer);
  return destino;
}

module.exports = {
  COLORES,
  AlignmentType,
  advertencia,
  bloqueMonospace,
  construirDocumento,
  crearFichaControl,
  crearTablaContenido,
  guardarDocumento,
  nota,
  parrafo,
  paso,
  pieFigura,
  run,
  saltoPagina,
  tabla,
  espacioDespuesTabla,
  titulo1,
  titulo2,
  titulo3,
  vineta,
};
