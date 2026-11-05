"""Genera el HTML de impresión de la tarea y de las papeletas. Se ejecuta dentro de la imagen de MkDocs."""
import re
import sys
from pathlib import Path

import markdown

ORIGEN = Path("docs/temas/02-tecnologias-habilitadoras/proyecto-investigacion-thd.md")
SALIDA = Path(sys.argv[1])

# Reparto de papeletas: 11 en DAW2A y 9 en DAM2B.
THD = ["IA/ML", "IoT", "Blockchain", "Big Data/Analytics", "Cloud", "Ciberseguridad"]
REPARTO = {
    "DAW2A": {"IA/ML": 2, "IoT": 2, "Blockchain": 1, "Big Data/Analytics": 2, "Cloud": 2, "Ciberseguridad": 2},
    "DAM2B": {"IA/ML": 2, "IoT": 2, "Blockchain": 1, "Big Data/Analytics": 1, "Cloud": 1, "Ciberseguridad": 2},
}

CSS_BASE = """
@page { size: A4; margin: 18mm 17mm 16mm;
  @bottom-left { content: "DASP · IES Albarregas · Curso 2026/2027"; font: 8pt Helvetica, Arial, sans-serif; color: #667; }
  @bottom-right { content: counter(page) " / " counter(pages); font: 8pt Helvetica, Arial, sans-serif; color: #667; } }
* { box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { font: 10.5pt/1.4 Helvetica, Arial, sans-serif; color: #1c2733; margin: 0; }
h1 { font-size: 21pt; line-height: 1.15; margin: 0 0 8pt; color: #0b5a7d; }
h2 { font-size: 13.5pt; margin: 15pt 0 5pt; padding-bottom: 2pt; border-bottom: 1.2pt solid #0b7fab; color: #0b5a7d; break-after: avoid; }
h3 { font-size: 11pt; margin: 10pt 0 2pt; color: #0b5a7d; break-after: avoid; }
p { margin: 0 0 6pt; } h2 + p { break-after: avoid; } ul, ol { margin: 3pt 0 6pt; padding-left: 16pt; } li { margin-bottom: 2pt; } li p { margin: 0; }
hr { display: none; }
table { width: 100%; border-collapse: collapse; margin: 4pt 0 8pt; font-size: 9.5pt; break-inside: avoid; }
th { background: #e3f2f8; text-align: left; } th, td { border: .6pt solid #9fb4c0; padding: 3pt 5pt; vertical-align: top; }
td a, p a, blockquote { overflow-wrap: anywhere; }
blockquote { margin: 3pt 0 7pt; padding: 3pt 8pt; border-left: 2.5pt solid #9fb4c0; background: #f4f7f9; }
.admonition { margin: 7pt 0; padding: 6pt 9pt; border-left: 3pt solid #0b7fab; background: #eef7fb; break-inside: avoid; }
.admonition.danger { border-color: #c62828; background: #fdeeee; }
.admonition-title { font-weight: bold; margin-bottom: 3pt; }
.task-list-item { list-style: none; margin-left: -14pt; } .task-list-control input { margin-right: 4pt; }
.cabecera { font-size: 9pt; color: #556; margin-bottom: 3pt; }
.thd { break-inside: avoid; }
"""


def tarea():
    texto = ORIGEN.read_text(encoding="utf-8")

    # Las pestañas no existen en papel: cada THD pasa a ser un apartado.
    lineas, dentro = [], False
    for linea in texto.splitlines():
        pestana = re.match(r'=== "(.+)"', linea)
        if pestana:
            lineas += [f"### {pestana.group(1)}", ""]
            dentro = True
        elif dentro and linea.startswith("    "):
            lineas.append(linea[4:])
        else:
            if dentro and linea.strip() and not linea.startswith("    "):
                dentro = False
            lineas.append(linea)

    cuerpo = markdown.markdown(
        "\n".join(lineas),
        extensions=["tables", "admonition", "sane_lists", "attr_list", "pymdownx.tasklist"],
    )
    cuerpo = re.sub(r"(<h3.*?</h3>.*?)(?=<h3|<hr|<h2)", r'<div class="thd">\1</div>', cuerpo, flags=re.S)
    return f"""<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>Proyecto de Investigación THD - DASP</title><style>{CSS_BASE}</style></head><body>
<div class="cabecera">Digitalización Aplicada a los Sectores Productivos · UT2</div>
{cuerpo}</body></html>"""


def sorteo():
    paginas = []
    for grupo, reparto in REPARTO.items():
        papeletas = [t for t in THD for _ in range(reparto[t])]
        celdas = "".join(f'<div class="papeleta">{t}<small>{grupo}</small></div>' for t in papeletas)
        filas = "".join(f"<tr><td><b>{t}</b></td><td>{n}</td><td></td></tr>" for t, n in reparto.items())
        paginas.append(f"""<section><h1>Sorteo de THD · {grupo}</h1>
<p>{len(papeletas)} papeletas para {len(papeletas)} estudiantes. Recorta por las líneas discontinuas.</p>
<div class="rejilla">{celdas}</div>
<h2>Resultado</h2>
<table><tr><th style="width:27%">THD</th><th style="width:9%">Plazas</th><th>Alumnado</th></tr>{filas}</table></section>""")
    css = CSS_BASE + """
section { break-after: page; } section:last-child { break-after: auto; }
.rejilla { display: grid; grid-template-columns: repeat(3, 1fr); border-top: 1pt dashed #667; border-left: 1pt dashed #667; margin: 8pt 0 12pt; }
.papeleta { height: 25mm; border-right: 1pt dashed #667; border-bottom: 1pt dashed #667; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 13pt; font-weight: bold; text-align: center; }
.papeleta small { font-size: 8pt; font-weight: normal; color: #667; margin-top: 2pt; }
td { height: 11mm; }
table { border-bottom: .6pt solid #9fb4c0; }
"""
    return f"""<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>Sorteo de THD - DASP</title><style>{css}</style></head><body>{"".join(paginas)}</body></html>"""


SALIDA.mkdir(parents=True, exist_ok=True)
(SALIDA / "tarea.html").write_text(tarea(), encoding="utf-8")
(SALIDA / "sorteo.html").write_text(sorteo(), encoding="utf-8")
