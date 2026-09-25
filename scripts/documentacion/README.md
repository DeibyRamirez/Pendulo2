# Generador de manuales WPA

Script aislado (no modifica el `package.json` de la aplicación web) que
produce los dos documentos Word de `docs/`:

- `docs/Manual_de_Usuario_WPA.docx`
- `docs/Manual_Tecnico_WPA.docx`

```bash
cd scripts/documentacion
npm install
npm run generar
```

Tras generar, abra cada archivo en Microsoft Word y actualice la tabla de
contenido. Complete los campos de portada entre corchetes antes de entregar.
