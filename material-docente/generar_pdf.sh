#!/bin/zsh
# Regenera los PDF desde la raíz del repositorio. Requiere Docker y Google Chrome.
set -e
TMP=$(mktemp -d)
docker run --rm -v "$PWD:/docs:ro" -v "$TMP:/salida" --entrypoint python jssdocente/mkdocs-daw material-docente/generar_html.py /salida
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless=new --disable-gpu --no-pdf-header-footer --user-data-dir="$TMP/perfil" --print-to-pdf="$PWD/material-docente/proyecto-investigacion-thd.pdf" "file://$TMP/tarea.html" 2>/dev/null
"$CHROME" --headless=new --disable-gpu --no-pdf-header-footer --user-data-dir="$TMP/perfil" --print-to-pdf="$PWD/material-docente/sorteo-thd.pdf" "file://$TMP/sorteo.html" 2>/dev/null
rm -rf "$TMP"
