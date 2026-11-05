# Pila de Documentación (MkDocs Material y Docker)

---

## 1. Servidor Local

La imagen `jssdocente/mkdocs-daw` (`.docker/dockerfile`) incluye MkDocs, Material y glightbox.

```bash
docker compose up -d
docker compose logs -f mkdocs
docker compose down
```

- **URL:** <http://localhost:8006/dasp2627d/>. El prefijo `/dasp2627d/` viene de `site_url`; sin él se obtiene un error 404.
- **Convivencia:** PMDM usa el puerto 8005, así que ambos sitios pueden servirse a la vez.

---

## 2. Comprobar Cambios

Compilación estricta, sin escribir en el repositorio ni tocar el servidor en marcha:

```bash
docker run --rm -v "$PWD:/docs:ro" jssdocente/mkdocs-daw build --strict -d /tmp/site
```

La instalación local de `mkdocs` no sirve porque no tiene glightbox.

La compilación **no detecta** dos fallos habituales, así que revísalos en la página renderizada:

- Diagramas Mermaid con errores de sintaxis.
- Listas fundidas en un párrafo.

---

## 3. Sintaxis Disponible

Extensiones activas en `mkdocs.yml`: admonition, details, tabbed, superfences con Mermaid, highlight, tasklist, snippets, emoji, footnotes, `attr_list`, `md_in_html`, `sane_lists` y `toc`. Las imágenes tienen zoom automático con glightbox.

```markdown
!!! warning "Título"
    Contenido indentado con 4 espacios.

??? example "Desplegable"
    Cerrado por defecto; `???+` lo muestra abierto.

=== "Opción A"
    Contenido de la pestaña.
```

Clases CSS propias (`docs/extra/css/extra.css`): `text-center`, `text-small`, `grid-75-25`, `grid3` y `grid-66-33`.

---

## 4. Reglas de Formato Críticas

### Listas (Python-Markdown)

1. **Deja siempre una línea en blanco antes de una lista.** Si sigue a un párrafo sin ella, los elementos se funden en ese párrafo.
2. **Indenta las sublistas con 4 espacios** (8 dentro de una pestaña) y deja una línea en blanco antes.
3. **Separa con una línea en blanco** los pasos numerados que tengan explicaciones, sublistas o código.
4. **Indenta 4 espacios** los bloques de código dentro de una lista.
5. **Usa `-` para las viñetas,** nunca `*`.

```markdown
Instala lo siguiente:

- Elemento A

    - Subelemento A1
```

### Mermaid

- **Pon comillas en cualquier texto con paréntesis u otros símbolos,** tanto en nodos como en títulos de `subgraph`: `subgraph Id ["Título (detalle)"]`. Sin ellas, el diagrama entero falla.
- Para los saltos de línea dentro de un nodo, usa `<br/>`.
- Reutiliza `classDef` con la paleta pastel de los diagramas existentes.

---

## 5. Páginas Ocultas

Una página oculta se publica y es accesible por su URL directa, pero no aparece en la navegación del sitio:

- Debe estar fuera de `nav` en `mkdocs.yml` y no recibir enlaces de otras páginas.
- Debe llevar este encabezado para quedar fuera del buscador:

```yaml
---
search:
  exclude: true
---
```

Sigue siendo pública: figura en `sitemap.xml` y en el repositorio.

---

## 6. Despliegue

`.github/workflows/build-push-mkdocs.yml` compila y publica en GitHub Pages en cada `push` a `main`, o de forma manual. `help-build.md` describe un flujo anterior; la referencia es el workflow.
