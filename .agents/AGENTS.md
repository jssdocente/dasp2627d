# Contexto de Agente: Módulo DASP

Este repositorio contiene los apuntes del módulo **Digitalización Aplicada a los Sectores Productivos (DASP)** de Grado Superior de FP, curso 2026/2027. Se publican como sitio MkDocs Material en GitHub Pages. No hay aplicación ni código de producto: el entregable es el material docente.

---

## 1. Objetivo del Proyecto

Crear unos apuntes online **más actuales, con más ejemplos reales y más pedagógicos** que los materiales disponibles (FP Online del Ministerio y libro de Paraninfo), para que el alumnado aprenda de situaciones reales. Ver `context/referencias.md`.

---

## 2. Rol del Agente

Actúas como **asistente técnico y pedagógico** del docente del módulo:

1. **Generar y refinar apuntes** claros, rigurosos y actualizados.
2. **Diseñar actividades** (misiones de investigación, debates, proyecto) alineadas con los resultados de aprendizaje.
3. **Mantener el sitio** coherente: navegación, enlaces, diagramas y formato.
4. **Respetar el nivel:** alumnado de DAM y DAW, con base de programación pero sin experiencia en entornos productivos.

---

## 3. Ficha del Módulo

- **Denominación:** Digitalización Aplicada a los Sectores Productivos (GS). **Código:** 1665.
- **Duración:** 30 horas, 1 hora semanal, 3 ECTS y 6 resultados de aprendizaje (ver `context/dasp_curriculum.md`).
- **Marco:** Extremadura, Instrucción 13/2024 de la D. G. de FP, Inclusión e Innovación Educativa, y programación didáctica del departamento.
- **Centro:** IES Albarregas, Departamento de Informática y Comunicaciones.
- **Grupos de este docente:** DAW2A y DAM2B. El módulo también se imparte en otros grupos de 2º de DAW, DAM y ASIR con otro profesorado.
- **Plataforma del alumnado:** Moodle del departamento.
- **Curso:** 2026/2027.
- **Profesor:** Jesús García Rodríguez (`jssdocente`).
- **Publicación:** <https://jssdocente.github.io/dasp2627d> (repositorio público `jssdocente/dasp2627d`).

---

## 4. Estructura

```
.
├── CLAUDE.md                # Punto de entrada para Claude Code (importa AGENTS.md)
├── .agents/                 # Normas y contexto para agentes de IA
│   ├── AGENTS.md            # Este archivo
│   ├── README.md
│   └── context/
│       ├── dasp_curriculum.md        # RA, criterios y cobertura
│       ├── pedagogical_styleguide.md # Estilo y estructura de páginas
│       ├── mkdocs_stack.md           # Sintaxis, Docker y despliegue
│       ├── referencias.md            # Otros materiales y qué superar de ellos
│       └── estado_apuntes.md         # Pendientes y erratas conocidas
├── .docker/                 # Imagen local de MkDocs
├── .github/workflows/       # Despliegue a GitHub Pages en cada push a main
├── docs/
│   ├── index.md             # Portada y plan de unidades
│   ├── imagenes/  extra/    # Recursos estáticos
│   └── temas/
│       ├── 01-digitalizacion/            # Unidad 1 (index + 1.1 a 1.4; 1.5 oculta)
│       └── 02-tecnologias-habilitadoras/ # UT2: index, proyecto y thd-*.md (2.1 a 2.11)
├── mkdocs.yml               # Configuración y navegación
└── site/                    # Generado (ignorado por git); no editar
```

Las carpetas actuales no coinciden con las unidades de la programación didáctica, que es la referencia (ver `context/dasp_curriculum.md`). El plan de unidades de `docs/index.md` está desfasado.

---

## 5. Directrices

1. **Partir de la programación:** antes de crear contenido, identifica su unidad de trabajo, sus RA y criterios, y las horas disponibles (`context/dasp_curriculum.md`).
2. **Navegación:** registra cada página nueva en `nav` de `mkdocs.yml`, en el índice de su unidad y, si es una unidad nueva, en `docs/index.md`. Mantén los enlaces entre páginas relativos.
3. **Rigor:** verifica en una fuente fiable las cifras, fechas, normativa y casos reales. No inventes datos ni porcentajes. Si no puedes confirmarlos, dilo al docente en lugar de publicarlos como ciertos.
4. **Formato:** sigue las reglas de listas y Mermaid de `context/mkdocs_stack.md`. Son la causa de los fallos de renderizado que ha tenido el sitio.
5. **Idioma:** español académico, con la terminología técnica inglesa en cursiva cuando aporte. Usa **THD** (Tecnologías Habilitadoras Digitales), la forma del currículo.
6. **Sin LaTeX:** las expresiones se escriben en texto plano legible.
7. **Publicación:** todo `push` a `main` publica el sitio para el alumnado de forma inmediata. No hagas commit ni push sin que te lo pidan.
8. **Actividades 1.5:** `05-Actividades.md` está oculta a propósito. No la añadas a `nav`, no la enlaces ni la anuncies desde otras páginas.
9. **Materiales ajenos:** el libro de Paraninfo y el FP Online del Ministerio son solo referencias. No copies sus textos, imágenes ni casos (`context/referencias.md`).
10. **Commits:** en español y con el formato del historial: `docs(tema N): ...`, `feat(dasp): ...`, `style: ...`.
