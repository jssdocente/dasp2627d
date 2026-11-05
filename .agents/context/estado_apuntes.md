# Estado de los Apuntes

Revisión inicial del 5 de noviembre de 2026. Los puntos pendientes se refieren a la Unidad 1 y a la infraestructura. Elimina cada uno al resolverlo.

La cobertura curricular está en `dasp_curriculum.md`.

---

## 0. Unidad 2 Reescrita

La UT2 se reescribió el 5 de noviembre de 2026 en `thd-*.md`. Las antiguas páginas `0N-*.md` se eliminaron a petición del docente y siguen en el historial de git (`df33e41`). Pueden servir como punto de partida para la UT4, pero contienen errores ya detectados: fecha de Platero, «cero alucinaciones» en RAG, prohibición literal de la «caja negra» en el Reglamento de IA y cifras sin fuente.

---

## 1. Errores de Renderizado (comprobados)

### Listas fundidas en un párrafo

Dos bloques se ven como texto continuo en el sitio renderizado, porque la lista sigue a un párrafo sin línea en blanco o porque sus sublistas usan 3 espacios:

- `01-digitalizacion/02-sistemas-ciberfisicos-tecnologias.md`: 134, 139.

Otras listas pegadas a un título o dentro de una caja sí se ven bien, pero conviene separarlas para seguir la norma.

---

## 2. Datos que Corregir (contrastados)

- **Oldsmar** (`05-Actividades.md:85` y `:96`): se narra como ataque probado. En 2023 el exgerente municipal lo atribuyó a un error de un empleado, y según lo publicado el FBI no halló indicios de acceso externo. Tampoco hay informe oficial público que lo cierre ([Industrial Cyber](https://industrialcyber.co/news/oldsmar-water-treatment-plant-incident-allegedly-caused-by-human-error-not-remote-access-cybersecurity-breach/)). Conviene presentarlo como caso disputado o sustituirlo.

---

## 3. Afirmaciones que Revisar (sin contrastar aún)

Detectadas al leer; hay que comprobarlas en la fuente primaria antes de cambiarlas.

- **NIS2 y Purdue** (`03-organizacion-convergencia-ot-it.md:223` y `:231`): presenta el Modelo Purdue como obligación legal; la directiva no parece imponer una arquitectura concreta.
- **NIS2, ámbito** (misma página, `:229`): revisar la mención a pymes, por los umbrales de tamaño. Revisar también el estado de la transposición en España.
- **Purdue e ISA-95** (misma página, `:109`): se presentan como equivalentes. La segmentación de seguridad suele vincularse a ISA/IEC 62443.
- **Cifras sin fuente:**
    - Sucursales y 1,4 millones de personas (`05-Actividades.md:241`).
    - Reparto 50/30/20 de competencias (`01-revoluciones-industriales.md:237`), que parece ilustrativo.
- **Arco reflejo en 5 ms** (`04-edge-cloud-sostenibilidad.md:47`): parece demasiado rápido para un reflejo humano.
- **Tesla** (`02-sistemas-ciberfisicos-tecnologias.md:239`): dice que en 2018 "construyó una fábrica"; revisar la redacción.

---

## 4. Erratas y Coherencia

- `02-sistemas-ciberfisicos-tecnologias.md:54`: "Un sensor clavan".
- `03-organizacion-convergencia-ot-it.md:203`: anuncia tres incidentes y solo desarrolla dos.
- **Plan de la portada:** `docs/index.md` anuncia unidades de Dato, Ciberseguridad y Personas, distintas de la programación (Nube, IA, y Datos y Proyecto). Las carpetas actuales tampoco coinciden con sus unidades (`dasp_curriculum.md`, sección 3).

---

## 5. Infraestructura

- **`.docker/dockerfile:4`:** un punto de más en `"click<8.2.2".` hace que pip rechace el requisito. La imagen actual funciona porque ya está construida, pero reconstruirla fallará.
- **CI sin versiones fijadas:** el workflow instala la última versión de cada paquete, y MkDocs Material avisa de que MkDocs 2.0 eliminará los plugins. La imagen local usa mkdocs 1.6.1, material 9.7.6 y glightbox 0.5.2.
- **`help-build.md`:** describe un flujo anterior (rama `master`, `gh-pages`, AWS S3) que no coincide con el workflow actual.
