# Guía de Estilo Pedagógico

Convenciones para redactar los apuntes de DASP. El modelo de referencia son las páginas 1.1 a 1.5, ya reescritas con este enfoque.

---

## 1. Audiencia y Tono

- **Audiencia:** alumnado de 2.º de Grado Superior, grupos DAW2A y DAM2B. Tiene base de programación, pero no des por supuesta experiencia en planta industrial ni en gestión de empresas.
- **Finalidad:** desarrollar criterio para decidir, no memorizar vocabulario.
- **Tono:** directo y didáctico. Explica el porqué antes que el cómo y dirígete al alumnado cuando ayude.
- **Lenguaje inclusivo:** usa formas como "técnico o técnica" o "alumnado".
- **Mirada crítica:** muestra también costes, riesgos y fracasos, no solo las ventajas de cada tecnología.

---

## 2. Recursos que Definen el Estilo

1. **Pregunta o problema de partida:** títulos como "¿Qué es...?" o "¿Qué intenta solucionar...?".
2. **Analogía cotidiana:** cuerpo humano, castillo medieval, batidora frente a ayudante de cocina.
3. **"Situación Real en la Industria":** un caso concreto, con empresas y tecnologías identificables.
4. **Cuadros comparativos:** antes y después, o tecnología A frente a B.
5. **Diagrama Mermaid:** para flujos, capas y arquitecturas, no como adorno.
6. **Cajas de aviso:** casos y advertencias (`!!! warning`, `!!! danger`, `!!! note`).
7. **Lección para el técnico:** cierre con la decisión o el criterio que debe quedar claro.

### Ejemplos reales

Es la seña de identidad de estos apuntes frente a otros materiales:

- Usa empresas, incidentes y proyectos reales, con fecha y fuente enlazada. Incluye también fracasos y casos disputados.
- Explica qué problema había, qué se decidió, cómo funciona y qué resultado tuvo, en lugar de limitarte a enumerar ventajas.
- No inventes empresas ni datos. Un caso ficticio solo es válido como ejercicio y debe identificarse como tal.
- Prefiere ejemplos cercanos (España, Extremadura, pymes) y situaciones que el alumnado pueda encontrar en su empresa de formación.
- Evita frases grandilocuentes («sin precedentes», «revolucionario»). Si algo es importante, demuéstralo con un dato o un caso.

---

## 3. Estructura de las Unidades

Cada unidad vive en `docs/temas/NN-nombre/`:

- `index.md`: visión general, mapa conceptual Mermaid, objetivos, glosario y enlaces a sus secciones visibles.
- `01-...md` a `0N-...md`: una sección por tema. Empieza con `# N.M Título` y una introducción de 1 o 2 párrafos; separa las secciones con `---`.
- Página de actividades: misiones de investigación en parejas con caso guiado (`??? example`), debates Oxford, reflexión individual y rúbrica. Sigue el modelo de `01-digitalizacion/05-Actividades.md`, que está oculta (ver `mkdocs_stack.md`).

---

## 4. Vinculación con el Currículo

- Cada sección nueva debe responder a una unidad de trabajo y a criterios de evaluación concretos (`dasp_curriculum.md`).
- Ajusta la profundidad a las horas de la unidad, a razón de 1 hora semanal: prioriza lo que exige el currículo y marca como ampliación lo demás.
- Evaluación: las tareas puntuables determinan la nota, así que cada unidad debe ofrecer tareas alineadas con sus criterios.
- Conecta los ejemplos con el trabajo de una persona de DAM o DAW: qué software se construye, se integra o se mantiene en cada sector. Cuando ayude, propón variantes web (DAW) y multiplataforma (DAM).
- El código, si aparece, debe ser breve e ilustrativo. No es un módulo de programación.

---

## 5. Fuentes y Actualización

- Comprueba la vigencia de la normativa (NIS2, RGPD, Reglamento de IA) y de las cifras antes de publicarlas.
- Prefiere fuentes primarias: BOE, EUR-Lex, organismos oficiales, documentación del fabricante.
- Si un caso está disputado, preséntalo como tal.
