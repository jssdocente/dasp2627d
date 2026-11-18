#!/usr/bin/env python3
"""Genera los diagramas SVG de la UT2 (docs/imagenes/ut2/).

Elaboración propia. Sustituyen a los antiguos diagramas Mermaid.
Uso, desde la raíz del repositorio:

    python3 material-docente/generar_svg_ut2.py

Los diagramas de procesos llevan una animación CSS (un punto que recorre el
flujo y resalta cada caja al pasar). Solo se anima si el sistema no pide
reducir el movimiento; si lo pide, se ve el diagrama estático completo.
"""
import math
import os
from xml.sax.saxutils import escape

SALIDA = os.path.join(os.path.dirname(__file__), "..", "docs", "imagenes", "ut2")

COLOR = {
    "azul": "#bbdefb", "naranja": "#ffe0b2", "verde": "#c8e6c9", "morado": "#e1bee7",
    "rojo": "#ffcdd2", "amarillo": "#fff9c4", "gris": "#eceff1",
}
TEXTO = "#263238"
SUAVE = "#546e7a"
RESALTE = "#e65100"


class Diagrama:
    def __init__(self, nombre, w, h, titulo, desc):
        self.nombre, self.w, self.h = nombre, w, h
        self.titulo, self.desc = titulo, desc
        self.fondo, self.cuerpo, self.css = [], [], []
        self.nodos = {}

    # ---------- piezas ----------

    def caja(self, id_, cx, cy, lineas, color="azul", w=150, h=70, borde=SUAVE):
        """Caja con un título en negrita y, opcionalmente, líneas de detalle."""
        self.nodos[id_] = (cx, cy, w / 2, h / 2)
        x, y = cx - w / 2, cy - h / 2
        partes = [f'<rect id="n-{id_}" class="nodo" x="{x:.1f}" y="{y:.1f}" width="{w}" height="{h}" rx="10" '
                  f'fill="{COLOR.get(color, color)}" stroke="{borde}" stroke-width="1.5"/>']
        titulo, resto = lineas[0], lineas[1:]
        alto = 19 + 16 * len(resto)
        ty = cy - alto / 2 + 14
        partes.append(f'<text x="{cx:.1f}" y="{ty:.1f}" class="t">{escape(titulo)}</text>')
        for i, l in enumerate(resto):
            partes.append(f'<text x="{cx:.1f}" y="{ty + 18 + 16 * i:.1f}" class="s">{escape(l)}</text>')
        self.cuerpo.append("\n    ".join(partes))

    def _borde(self, id_, hacia):
        cx, cy, hw, hh = self.nodos[id_]
        dx, dy = hacia[0] - cx, hacia[1] - cy
        if dx == 0 and dy == 0:
            return cx, cy
        t = min(hw / abs(dx) if dx else 1e9, hh / abs(dy) if dy else 1e9)
        return cx + dx * t, cy + dy * t

    def flecha(self, a, b, discontinua=False, doble=False, etiqueta=None, desp=(0, -10)):
        ca, cb = self.nodos[a][:2], self.nodos[b][:2]
        x1, y1 = self._borde(a, cb)
        x2, y2 = self._borde(b, ca)
        d = math.hypot(x2 - x1, y2 - y1)
        ux, uy = (x2 - x1) / d, (y2 - y1) / d
        x2, y2 = x2 - ux * 4, y2 - uy * 4
        if doble:
            x1, y1 = x1 + ux * 4, y1 + uy * 4
        self._linea(f"M{x1:.1f},{y1:.1f} L{x2:.1f},{y2:.1f}", discontinua, doble)
        if etiqueta:
            self.texto((x1 + x2) / 2 + desp[0], (y1 + y2) / 2 + desp[1], etiqueta, "e")

    def camino(self, puntos, discontinua=True, etiqueta=None, pos=None):
        d = "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in puntos)
        self._linea(d, discontinua, False)
        if etiqueta:
            self.texto(pos[0], pos[1], etiqueta, "e")

    def _linea(self, d, discontinua, doble):
        extra = ' stroke-dasharray="6 5"' if discontinua else ""
        inicio = ' marker-start="url(#fi)"' if doble else ""
        self.cuerpo.append(f'<path d="{d}" fill="none" stroke="{SUAVE}" stroke-width="2"{extra}{inicio} marker-end="url(#f)"/>')

    def texto(self, x, y, txt, clase="e", ancla="middle"):
        self.cuerpo.append(f'<text x="{x:.1f}" y="{y:.1f}" class="{clase}" text-anchor="{ancla}">{escape(txt)}</text>')

    def zona(self, x, y, w, h, titulo, color):
        self.fondo.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="12" fill="{color}" stroke="#b0bec5" stroke-dasharray="4 4"/>')
        self.fondo.append(f'<text x="{x + 14}" y="{y + 24}" class="z">{escape(titulo)}</text>')

    def recorrido(self, puntos, duracion=9, color="#1565c0", resaltar=(), colores=None, r=9):
        """Punto animado que recorre `puntos`; se dibuja detrás de las cajas.

        resaltar: lista de (id_de_caja, índice_de_punto) que se iluminan al llegar.
        colores: lista paralela a `puntos` con el color del punto en cada tramo.
        """
        tramos = [math.hypot(puntos[i + 1][0] - puntos[i][0], puntos[i + 1][1] - puntos[i][1])
                  for i in range(len(puntos) - 1)]
        pausa = 40  # equivalente en píxeles de la pausa en cada punto
        total = sum(tramos) + pausa * len(puntos)
        viaje = 85.0  # % del ciclo dedicado al recorrido; el resto, en blanco
        tiempos, acum = [], 0
        for i in range(len(puntos)):
            llegada = acum
            acum += pausa
            tiempos.append((llegada / total * viaje, acum / total * viaje))
            if i < len(tramos):
                acum += tramos[i]
        x0, y0 = puntos[0]
        fr = []
        for i, (p, (lleg, sal)) in enumerate(zip(puntos, tiempos)):
            tr = f"transform: translate({p[0] - x0:.1f}px, {p[1] - y0:.1f}px);"
            col = f" fill: {colores[i]};" if colores else ""
            op = " opacity: 0;" if i == 0 else " opacity: 1;"
            fr.append(f"{lleg:.2f}% {{ {tr}{col}{op if i == 0 else ' opacity: 1;'} }}")
            fr.append(f"{sal:.2f}% {{ {tr}{col} opacity: 1; }}")
        xf, yf = puntos[-1][0] - x0, puntos[-1][1] - y0
        fr.append(f"{min(viaje + 3, 99):.2f}% {{ transform: translate({xf:.1f}px, {yf:.1f}px); opacity: 0; }}")
        fr.append(f"100% {{ transform: translate({xf:.1f}px, {yf:.1f}px); opacity: 0; }}")
        self.css.append("@keyframes viaje { " + " ".join(fr) + " }")
        self.css.append(f".punto {{ opacity: 0; }}")
        self.css.append(f"@media (prefers-reduced-motion: no-preference) {{ .punto {{ animation: viaje {duracion}s linear infinite; }} }}")
        self.fondo.append(f'<circle class="punto" cx="{x0}" cy="{y0}" r="{r}" fill="{color}"/>')
        for n, (id_, idx) in enumerate(resaltar):
            a, b = tiempos[idx]
            ini, fin = max(a - 0.5, 0), min(b + 4, 99)
            self.css.append(
                f"@keyframes r{n} {{ 0%, {max(ini - 0.01, 0):.2f}% {{ stroke: {SUAVE}; stroke-width: 1.5; }} "
                f"{a:.2f}%, {fin:.2f}% {{ stroke: {RESALTE}; stroke-width: 4; }} "
                f"{min(fin + 3, 99.9):.2f}%, 100% {{ stroke: {SUAVE}; stroke-width: 1.5; }} }}")
            self.css.append(f"@media (prefers-reduced-motion: no-preference) {{ #n-{id_} {{ animation: r{n} {duracion}s linear infinite; }} }}")

    # ---------- salida ----------

    def guardar(self):
        estilos = "\n    ".join([
            f".t {{ font-size: 15px; font-weight: 700; fill: {TEXTO}; text-anchor: middle; }}",
            f".s {{ font-size: 12.5px; fill: #37474f; text-anchor: middle; }}",
            f".e {{ font-size: 13px; font-style: italic; fill: {SUAVE}; }}",
            f".z {{ font-size: 14px; font-weight: 700; fill: {SUAVE}; }}",
            f".h {{ font-size: 17px; font-weight: 700; fill: {TEXTO}; }}",
        ] + self.css)
        svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.w} {self.h}" role="img" aria-labelledby="t d" font-family="Roboto, Arial, sans-serif">
  <title id="t">{escape(self.titulo)}</title>
  <desc id="d">{escape(self.desc)}</desc>
  <style>
    {estilos}
  </style>
  <defs>
    <marker id="f" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="{SUAVE}"/></marker>
    <marker id="fi" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M10,0 L0,5 L10,10 z" fill="{SUAVE}"/></marker>
  </defs>
  <rect width="{self.w}" height="{self.h}" rx="12" fill="#ffffff"/>
  {chr(10).join("  " + f for f in self.fondo).strip()}
  {chr(10).join("  " + c for c in self.cuerpo).strip()}
</svg>
'''
        ruta = os.path.join(SALIDA, self.nombre + ".svg")
        with open(ruta, "w", encoding="utf-8") as f:
            f.write(svg)
        print("escrito", os.path.normpath(ruta))


def fila(n, x0=90, x1=810):
    if n == 1:
        return [(x0 + x1) / 2]
    paso = (x1 - x0) / (n - 1)
    return [x0 + paso * i for i in range(n)]


# =====================================================================
# Diagramas
# =====================================================================

def ruta_unidad():
    d = Diagrama("ut2-ruta", 900, 340, "Ruta de la Unidad 2",
                 "Cinco etapas en orden: entender (2.1), conocer las tecnologías (2.2 a 2.8), analizar su impacto (2.9), "
                 "investigar (2.10) y comunicar (2.11). Conocer, investigar y comunicar alimentan tu proyecto; "
                 "conocer y analizar se repasan en la Consultoría exprés (2.12).")
    xs = fila(5)
    etapas = [("a", ["Entender", "2.1 Qué son", "las THD"], "azul"),
              ("b", ["Conocer", "2.2 a 2.8", "Las tecnologías"], "azul"),
              ("c", ["Analizar", "2.9 Impacto", "en la empresa"], "azul"),
              ("d", ["Investigar", "2.10 Fuentes", "y casos"], "azul"),
              ("e", ["Comunicar", "2.11 Informe", "y exposición"], "azul")]
    for x, (i, l, c) in zip(xs, etapas):
        d.caja(i, x, 90, l, c, w=145, h=82)
    for a, b in zip("abcd", "bcde"):
        d.flecha(a, b)
    d.caja("p", 700, 255, ["Tu proyecto", "Investigación THD"], "naranja", w=180, h=60)
    d.caja("r", 380, 255, ["Repasar", "2.12 Consultoría exprés"], "verde", w=180, h=60)
    for o in "de":
        d.flecha(o, "p", discontinua=True)
    # Conocer → proyecto rodea la caja de repaso por debajo para no cruzar flechas.
    d.camino([(250, 131), (250, 312), (640, 312), (640, 289)])
    for o in "bc":
        d.flecha(o, "r", discontinua=True)
    d.guardar()


def blockchain_confianza():
    d = Diagrama("blockchain-confianza", 900, 360, "Dónde está la confianza: base de datos centralizada frente a blockchain",
                 "A la izquierda, las empresas A y B envían sus datos a un único administrador que controla el registro. "
                 "A la derecha, en una blockchain, las empresas A, B y C guardan cada una una copia completa y se "
                 "comprueban entre sí, sin un administrador central.")
    d.texto(225, 40, "Base de datos centralizada", "h")
    d.texto(675, 40, "Blockchain", "h")
    d.cuerpo.append('<line x1="450" y1="20" x2="450" y2="340" stroke="#cfd8dc" stroke-width="2"/>')
    d.caja("a1", 115, 110, ["Empresa A"], "azul", w=130, h=50)
    d.caja("b1", 335, 110, ["Empresa B"], "azul", w=130, h=50)
    d.caja("adm", 225, 245, ["Un administrador", "controla el único registro"], "naranja", w=210, h=66)
    d.flecha("a1", "adm")
    d.flecha("b1", "adm")
    d.texto(225, 325, "Si el administrador falla o hace trampa, todos dependen de él.", "e")
    d.caja("a2", 675, 110, ["Empresa A", "copia completa"], "verde", w=140, h=60)
    d.caja("b2", 555, 250, ["Empresa B", "copia completa"], "verde", w=140, h=60)
    d.caja("c2", 795, 250, ["Empresa C", "copia completa"], "verde", w=140, h=60)
    d.flecha("a2", "b2", doble=True)
    d.flecha("b2", "c2", doble=True)
    d.flecha("c2", "a2", doble=True)
    d.texto(675, 325, "Cada una guarda su copia y comprueba lo que añaden las demás.", "e")
    d.guardar()


def bigdata_flujo():
    d = Diagrama("bigdata-flujo", 900, 250, "Del dato a la decisión",
                 "Los datos de las fuentes (ventas, sensores, web) pasan por limpieza, análisis y un indicador clave "
                 "antes de llegar a una decisión. Después se vuelve al indicador para comprobar si la decisión ha funcionado. "
                 "Un punto gris que se vuelve azul al limpiarse recorre el proceso.")
    xs = fila(5)
    pasos = [("f", ["Fuentes", "ventas, sensores,", "web"], "gris"),
             ("l", ["Limpieza", "errores,", "duplicados"], "amarillo"),
             ("a", ["Análisis", "totales, grupos,", "tendencias"], "azul"),
             ("k", ["KPI", "indicador clave"], "morado"),
             ("d", ["Decisión"], "verde")]
    d.recorrido([(x, 100) for x in xs], duracion=8, resaltar=[(p[0], i) for i, p in enumerate(pasos)],
                colores=["#90a4ae", "#90a4ae", "#1565c0", "#1565c0", "#2e7d32"])
    for x, (i, l, c) in zip(xs, pasos):
        d.caja(i, x, 100, l, c, w=145, h=78)
    for a, b in zip("flak", "lakd"):
        d.flecha(a, b)
    d.camino([(xs[4], 139), (xs[4], 200), (xs[3], 200), (xs[3], 143)], etiqueta="¿Ha funcionado?", pos=(720, 225))
    d.guardar()


def ciber_ataque():
    d = Diagrama("ciber-ataque", 900, 330, "Cómo avanza un ataque y dónde cortarlo",
                 "Arriba, las etapas de un ataque típico: correo engañoso, robo o infección de una cuenta, movimiento por "
                 "la red, cifrado de datos (ransomware) y parada. Abajo, la defensa que corta cada etapa: formación, "
                 "doble factor, parches y red segmentada, mínimos permisos y copias probadas.")
    xs = fila(5)
    d.texto(20, 30, "El ataque avanza…", "z", "start")
    d.texto(20, 320, "…y cada capa de defensa puede cortarlo", "z", "start")
    ataque = [("a", ["Correo engañoso", "phishing"]), ("b", ["Roba o infecta", "una cuenta"]),
              ("c", ["Se mueve", "por la red"]), ("d", ["Cifra datos", "ransomware"]),
              ("e", ["Parada y", "recuperación"])]
    defensa = [("a1", ["Formación"]), ("b1", ["Doble factor"]), ("c1", ["Parches y", "red segmentada"]),
               ("d1", ["Mínimos", "permisos"]), ("e1", ["Copias", "probadas"])]
    d.recorrido([(x, 90) for x in xs], duracion=9, color="#c62828",
                resaltar=[(defensa[i][0], i) for i in range(5)])
    for x, (i, l) in zip(xs, ataque):
        d.caja(i, x, 90, l, "rojo", w=145, h=66)
    for x, (i, l) in zip(xs, defensa):
        d.caja(i, x, 265, l, "verde", w=145, h=62)
    for a, b in zip("abcd", "bcde"):
        d.flecha(a, b)
    for i, _ in ataque:
        d.flecha(i + "1", i, discontinua=True)
    d.guardar()


def ia_tradicional_ml():
    d = Diagrama("ia-tradicional-ml", 900, 290, "Programación tradicional frente a machine learning",
                 "En la programación tradicional, la persona escribe las reglas, el programa las aplica a los datos y da un "
                 "resultado. En machine learning se dan datos con sus resultados conocidos, y el entrenamiento produce un "
                 "modelo con reglas aprendidas: las reglas pasan de ser la entrada a ser la salida.")
    d.texto(20, 35, "Programación tradicional", "z", "start")
    d.texto(20, 165, "Machine learning", "z", "start")
    xs = [110, 310, 540, 770]
    d.caja("r1", xs[0], 90, ["Reglas", "las escribe la persona"], "naranja", w=180, h=62)
    d.caja("d1", xs[1], 90, ["Datos"], "azul", w=150, h=62)
    d.caja("p1", xs[2], 90, ["Programa"], "gris", w=150, h=62)
    d.caja("s1", xs[3], 90, ["Resultado"], "verde", w=150, h=62)
    d.caja("d2", xs[0], 220, ["Datos"], "azul", w=180, h=62)
    d.caja("s2", xs[1], 220, ["Resultados", "conocidos"], "verde", w=150, h=62)
    d.caja("p2", xs[2], 220, ["Entrenamiento"], "gris", w=150, h=62)
    d.caja("r2", xs[3], 220, ["Modelo", "reglas aprendidas"], "naranja", w=150, h=62)
    d.texto(210, 97, "+", "h")
    d.texto(210, 227, "+", "h")
    d.flecha("d1", "p1")
    d.flecha("p1", "s1")
    d.flecha("s2", "p2")
    d.flecha("p2", "r2")
    d.guardar()


def ia_ciclo():
    d = Diagrama("ia-ciclo", 900, 250, "El ciclo de un sistema de IA",
                 "Datos, entrenamiento, modelo, predicción, supervisión humana y decisión. Una flecha discontinua vuelve "
                 "de la decisión a los datos: los resultados generan datos nuevos, y con ellos se pueden heredar sesgos.")
    xs = fila(6, 80, 820)
    pasos = [("d", ["Datos"], "azul"), ("e", ["Entrenamiento"], "gris"), ("m", ["Modelo"], "naranja"),
             ("p", ["Predicción"], "morado"), ("h", ["¿Supervisión", "humana?"], "amarillo"), ("a", ["Decisión"], "verde")]
    puntos = [(x, 95) for x in xs] + [(xs[5], 195), (xs[0], 195), (xs[0], 95)]
    d.recorrido(puntos, duracion=10, resaltar=[(p[0], i) for i, p in enumerate(pasos)])
    for x, (i, l, c) in zip(xs, pasos):
        d.caja(i, x, 95, l, c, w=128, h=62)
    for a, b in zip("dempha"[:-1], "dempha"[1:]):
        d.flecha(a, b)
    d.camino([(xs[5], 126), (xs[5], 195), (xs[0], 195), (xs[0], 130)],
             etiqueta="Los resultados generan datos nuevos (y pueden arrastrar sesgos)", pos=(450, 225))
    d.guardar()


def informe_orden():
    d = Diagrama("informe-orden", 900, 230, "Orden recomendado para escribir el informe",
                 "Seis pasos: matriz de fuentes, casos y comparativa, riesgos, conclusiones, introducción y revisión final. "
                 "La introducción se escribe casi al final.")
    xs = fila(6, 80, 820)
    pasos = ["Matriz de fuentes", "Casos y comparativa", "Riesgos", "Conclusiones", "Introducción", "Revisión final"]
    for n, (x, p) in enumerate(zip(xs, pasos)):
        partes = p.split(" ", 1) if len(p) > 14 else [p]
        d.caja(str(n), x, 95, [f"{n + 1}"] + partes, "naranja" if n == 4 else "azul", w=128, h=82)
    for n in range(5):
        d.flecha(str(n), str(n + 1))
    d.camino([(xs[4], 195), (xs[4], 140)], discontinua=False)
    d.texto(xs[4], 215, "Se escribe casi al final", "e")
    d.guardar()


def consultoria_tiempos():
    d = Diagrama("consultoria-tiempos", 900, 210, "Tiempos de la Consultoría exprés",
                 "Veinticinco minutos en total: leer el encargo, 3 minutos; rellenar la ficha, 12; auditoría cruzada, 5; "
                 "y puesta en común, 5.")
    d.texto(450, 36, "25 minutos en total", "h")
    x0, ancho, total = 40, 820, 25
    tramos = [("Leer el encargo", 3, "azul"), ("Rellenar la ficha", 12, "naranja"),
              ("Auditoría cruzada", 5, "morado"), ("Puesta en común", 5, "verde")]
    x, minuto = x0, 0
    marcas = [0]
    for nombre, mins, color in tramos:
        w = ancho * mins / total
        d.cuerpo.append(f'<rect x="{x:.1f}" y="60" width="{w:.1f}" height="80" fill="{COLOR[color]}" stroke="#ffffff" stroke-width="3"/>')
        if mins >= 5:
            d.texto(x + w / 2, 96, nombre, "t")
            d.texto(x + w / 2, 118, f"{mins} min", "s")
        else:
            d.texto(x + w / 2, 104, f"{mins} min", "s")
            d.texto(x + w / 2, 52, nombre, "e")
        x += w
        minuto += mins
        marcas.append(minuto)
    for m in marcas:
        mx = x0 + ancho * m / total
        d.cuerpo.append(f'<line x1="{mx:.1f}" y1="145" x2="{mx:.1f}" y2="155" stroke="{SUAVE}" stroke-width="2"/>')
        d.texto(mx, 175, f"{m}′", "e")
    d.guardar()


def iot_recorrido():
    d = Diagrama("iot-recorrido", 900, 350, "El recorrido de un dato en IoT",
                 "El sensor mide, la pasarela reúne y envía, la plataforma guarda y analiza, y se decide si hay que actuar. "
                 "Si la respuesta es sí, un actuador o un aviso actúa y cambia lo que se mide; si es no, el dato pasa al "
                 "histórico. Como en el cuerpo: sentidos, nervios, cerebro y músculos.")
    xs = fila(5)
    analogia = ["como los sentidos", "como los nervios", "como el cerebro", "", "como los músculos"]
    for x, a in zip(xs, analogia):
        if a:
            d.texto(x, 42, a, "e")
    puntos = [(xs[0], 100), (xs[1], 100), (xs[2], 100), (xs[3], 100), (xs[4], 100),
              (xs[4], 300), (xs[0], 300), (xs[0], 100)]
    nodos = [("s", ["Sensor", "mide"], "azul"), ("g", ["Pasarela", "reúne y envía"], "gris"),
             ("p", ["Plataforma", "guarda y analiza"], "morado"), ("q", ["¿Hay que", "actuar?"], "amarillo"),
             ("a", ["Actuador", "o aviso"], "verde")]
    d.recorrido(puntos, duracion=10, color="#1565c0", resaltar=[(n[0], i) for i, n in enumerate(nodos)])
    for x, (i, l, c) in zip(xs, nodos):
        d.caja(i, x, 100, l, c, w=145, h=66)
    d.caja("h", xs[3], 215, ["Histórico"], "gris", w=145, h=50)
    for a, b in zip("sgp", "gpq"):
        d.flecha(a, b)
    d.flecha("q", "a", etiqueta="Sí")
    d.flecha("q", "h", etiqueta="No", desp=(16, 4))
    d.camino([(xs[4], 133), (xs[4], 300), (xs[0], 300), (xs[0], 137)],
             etiqueta="La acción cambia lo que se mide", pos=(270, 325))
    d.guardar()


def impacto_it_ot():
    d = Diagrama("impacto-it-ot", 900, 320, "Mantenimiento predictivo al conectar IT y OT",
                 "En la planta (OT), un sensor detecta una vibración anómala en una máquina. Por una conexión segura llega a "
                 "gestión (IT): el análisis predice una avería, el ERP pide el repuesto y la planificación programa la parada, "
                 "que vuelve a la máquina en el mejor momento.")
    d.zona(20, 40, 255, 200, "OT: planta", "#fff8e1")
    d.zona(305, 40, 575, 200, "IT: gestión", "#e3f2fd")
    puntos = [(148, 150), (430, 150), (610, 150), (790, 150), (790, 275), (148, 275), (148, 150)]
    d.recorrido(puntos, duracion=10, color="#e65100",
                resaltar=[("m", 0), ("an", 1), ("erp", 2), ("pl", 3)])
    d.caja("m", 148, 150, ["Sensor en una máquina", "vibración anómala"], "naranja", w=200, h=66)
    d.caja("an", 430, 150, ["Análisis", "predice una avería"], "azul", w=150, h=66)
    d.caja("erp", 610, 150, ["ERP", "pide el repuesto"], "azul", w=150, h=66)
    d.caja("pl", 790, 150, ["Planificación", "programa la parada"], "azul", w=150, h=66)
    d.flecha("m", "an", etiqueta="Conexión segura", desp=(0, -14))
    d.flecha("an", "erp")
    d.flecha("erp", "pl")
    d.camino([(790, 183), (790, 275), (148, 275), (148, 187)],
             etiqueta="Parada en el mejor momento", pos=(470, 300))
    d.guardar()


def investigar_proceso():
    d = Diagrama("investigar-proceso", 900, 240, "Proceso para investigar y comparar casos",
                 "Pregunta, búsqueda, filtrar fuentes, analizar casos, comparar y responder. Si al filtrar no encuentras "
                 "nada útil, vuelves a buscar con otras palabras clave.")
    xs = fila(6, 80, 820)
    pasos = [("p", ["Pregunta"]), ("b", ["Búsqueda"]), ("f", ["Filtrar", "fuentes"]),
             ("a", ["Analizar", "casos"]), ("c", ["Comparar"]), ("r", ["Responder"])]
    for x, (i, l) in zip(xs, pasos):
        d.caja(i, x, 90, l, "naranja" if i == "f" else "azul", w=128, h=62)
    for a, b in zip("pbfac", "bfacr"):
        d.flecha(a, b)
    d.camino([(xs[2], 121), (xs[2], 175), (xs[1], 175), (xs[1], 125)],
             etiqueta="Si no encuentras nada útil, cambia las palabras clave", pos=(300, 205))
    d.guardar()


def iot_mirai():
    """Caso Mirai (2016): animación en tres fases. Sin animación se ve el estado final."""
    d = Diagrama("iot-mirai", 900, 380, "Cómo unas cámaras inseguras dejaron sin servicio a medio Internet",
                 "Fase 1: el malware Mirai entra en cámaras y grabadores que conservan la contraseña de fábrica. "
                 "Fase 2: los dispositivos infectados envían a la vez una avalancha de peticiones a Dyn, un proveedor de DNS. "
                 "Fase 3: Dyn se satura y quienes intentan entrar en webs como Twitter, GitHub o Netflix no obtienen respuesta, "
                 "aunque esas webs seguían funcionando.")
    gris, rojo = "#eceff1", "#ffcdd2"
    d.caja("atk", 160, 42, ["Atacante", "controla la red de bots"], "morado", w=200, h=48)
    centros = []
    for fila_ in range(3):
        for col in range(3):
            centros.append((70 + col * 90, 130 + fila_ * 68))
    for i, (cx, cy) in enumerate(centros):
        d.caja(f"d{i}", cx, cy, ["Cámara" if i % 2 == 0 else "Grabador"], "rojo", w=78, h=46, borde="#c62828")
        p_ = 3 + i * 3
        d.css.append(f"@keyframes inf{i} {{ 0%, {p_ - 0.01:.2f}% {{ fill: {gris}; stroke: #546e7a; }} {p_}%, 100% {{ fill: {rojo}; stroke: #c62828; }} }}")
        d.css.append(f"@media (prefers-reduced-motion: no-preference) {{ #n-d{i} {{ animation: inf{i} 12s linear infinite; }} }}")
    d.cuerpo.append('<path d="M160,66 L160,96" fill="none" stroke="#546e7a" stroke-width="2" stroke-dasharray="6 5" marker-end="url(#f)"/>')
    d.caja("dyn", 505, 198, ["Dyn", "servicio de DNS", "traduce nombres a direcciones"], "azul", w=190, h=92)
    d.texto(505, 268, "Saturado", "h")
    d.cuerpo[-1] = d.cuerpo[-1].replace('class="h"', 'class="h sat" fill="#c62828"')
    d.css.append("@keyframes dyn { 0%, 62% { fill: #bbdefb; } 66%, 100% { fill: #ffcdd2; } }")
    d.css.append("@keyframes sat { 0%, 64% { opacity: 0; } 67%, 100% { opacity: 1; } }")
    d.css.append(".sat { fill: #c62828; }")
    d.css.append("@media (prefers-reduced-motion: no-preference) { #n-dyn { animation: dyn 12s linear infinite; } .sat { animation: sat 12s linear infinite; } }")
    d.css.append("#n-dyn { fill: #ffcdd2; }")
    # Puntos de ataque: dos por dispositivo, del dispositivo al DNS.
    destino = (505, 198)
    d.css.append(".bala { opacity: 0; }")
    n = 0
    for i, (cx, cy) in enumerate(centros):
        for k in range(2):
            s0 = 34 + (i % 3) * 3 + k * 12 + (i // 3) * 1.5
            dx, dy = destino[0] - cx, destino[1] - cy
            d.css.append(
                f"@keyframes b{n} {{ 0%, {s0:.2f}% {{ opacity: 0; transform: translate(0px, 0px); }} "
                f"{s0 + 0.5:.2f}% {{ opacity: 1; transform: translate(0px, 0px); }} "
                f"{s0 + 10:.2f}% {{ opacity: 1; transform: translate({dx}px, {dy}px); }} "
                f"{s0 + 10.5:.2f}%, 100% {{ opacity: 0; transform: translate({dx}px, {dy}px); }} }}")
            d.css.append(f"@media (prefers-reduced-motion: no-preference) {{ #b{n} {{ animation: b{n} 12s linear infinite; }} }}")
            d.fondo.append(f'<circle id="b{n}" class="bala" cx="{cx}" cy="{cy}" r="5" fill="#c62828"/>')
            n += 1
    for j, (web, y) in enumerate([("twitter.com", 110), ("github.com", 198), ("netflix.com", 286)]):
        d.caja(f"u{j}", 790, y, ["Una persona", f"¿Dónde está {web}?"], "gris", w=180, h=50)
        d.flecha(f"u{j}", "dyn", discontinua=True)
        d.texto(790, y + 42, "✘ No obtiene respuesta", "e")
        d.cuerpo[-1] = d.cuerpo[-1].replace('class="e"', 'class="e falla"')
    d.css.append(".falla { fill: #c62828; font-style: normal; font-weight: 700; }")
    d.css.append("@keyframes falla { 0%, 72% { opacity: 0; } 75%, 100% { opacity: 1; } }")
    d.css.append("@media (prefers-reduced-motion: no-preference) { .falla { animation: falla 12s linear infinite; } }")
    d.texto(160, 345, "1. Mirai entra con la contraseña de fábrica", "z")
    d.texto(505, 345, "2. Todos atacan a la vez", "z")
    d.texto(790, 345, "3. Las webs «desaparecen»", "z")
    d.guardar()


def gemelo_digital():
    d = Diagrama("gemelo-digital", 900, 350, "Cómo funciona un gemelo digital",
                 "A la izquierda, la línea de producción real con sensores envía datos en tiempo real a su gemelo digital, "
                 "una copia virtual. En el gemelo se prueban cambios: la prueba A crea un cuello de botella y la prueba B "
                 "funciona mejor. Solo lo que ha funcionado en el gemelo se aplica después en la línea real, sin pararla para probar.")
    d.zona(20, 40, 300, 225, "Mundo real", "#fff8e1")
    d.zona(350, 40, 530, 225, "Gemelo digital", "#e3f2fd")
    puntos = [(170, 140), (500, 140), (735, 100), (500, 140), (735, 200), (735, 300), (170, 300), (170, 140)]
    d.recorrido(puntos, duracion=11, color="#1565c0",
                resaltar=[("linea", 0), ("modelo", 1), ("pa", 2), ("pb", 4)])
    d.caja("linea", 170, 140, ["Línea de producción", "con sensores"], "naranja", w=220, h=70)
    d.caja("modelo", 500, 140, ["Modelo virtual", "copia de la línea"], "azul", w=180, h=70)
    d.caja("pa", 735, 100, ["Prueba A", "crea un cuello de botella"], "rojo", w=210, h=56)
    d.caja("pb", 735, 200, ["Prueba B", "funciona mejor"], "verde", w=210, h=56)
    d.flecha("linea", "modelo", etiqueta="Datos en tiempo real", desp=(0, -12))
    d.flecha("modelo", "pa", discontinua=True)
    d.flecha("modelo", "pb", discontinua=True)
    d.camino([(735, 228), (735, 300), (170, 300), (170, 175)],
             etiqueta="Solo se aplica en la línea real lo que ha funcionado en el gemelo", pos=(450, 325))
    d.guardar()


def animar_cadena():
    """Añade al SVG hecho a mano cadena-thd.svg un punto que recorre la cadena.

    Es idempotente: sustituye la animación anterior si ya existe.
    """
    ruta = os.path.join(SALIDA, "cadena-thd.svg")
    with open(ruta, encoding="utf-8") as f:
        svg = f.read()
    import re
    svg = re.sub(r"\n  <!-- animacion -->.*?<!-- /animacion -->", "", svg, flags=re.S)
    aux = Diagrama("aux", 900, 400, "", "")
    puntos = [(105, 165), (320, 165), (535, 165), (772, 165), (772, 275), (105, 275), (105, 165)]
    aux.recorrido(puntos, duracion=10, color="#1565c0")
    cajas = [("30", 0), ("245", 1), ("460", 2), ("675", 3)]
    css = list(aux.css)
    # Resalta cada caja (identificada por su x) cuando llega el punto, con los mismos tiempos que recorrido().
    tiempos = []
    pausa, viaje = 40, 85.0
    tramos = [math.hypot(puntos[i + 1][0] - puntos[i][0], puntos[i + 1][1] - puntos[i][1]) for i in range(len(puntos) - 1)]
    total = sum(tramos) + pausa * len(puntos)
    acum = 0
    for i in range(len(puntos)):
        tiempos.append((acum / total * viaje, (acum + pausa) / total * viaje))
        acum += pausa + (tramos[i] if i < len(tramos) else 0)
    for x, idx in cajas:
        a, b = tiempos[idx]
        fin = min(b + 4, 99)
        css.append(f"@keyframes c{x} {{ 0%, {max(a - 0.5, 0):.2f}% {{ stroke-width: 2; }} {a:.2f}%, {fin:.2f}% {{ stroke-width: 5; }} "
                   f"{min(fin + 3, 99.9):.2f}%, 100% {{ stroke-width: 2; }} }}")
        css.append(f"@media (prefers-reduced-motion: no-preference) {{ rect[x=\"{x}\"][y=\"110\"] {{ animation: c{x} 10s linear infinite; }} }}")
    bloque = ("\n  <!-- animacion -->\n  <style>\n    " + "\n    ".join(css) + "\n  </style>\n  "
              + aux.fondo[0] + "\n  <!-- /animacion -->")
    fondo = '<rect width="900" height="400" rx="12" fill="#ffffff"/>'
    assert fondo in svg
    svg = svg.replace(fondo, fondo + bloque, 1)
    with open(ruta, "w", encoding="utf-8") as f:
        f.write(svg)
    print("animado", os.path.normpath(ruta))


if __name__ == "__main__":
    for f in (ruta_unidad, blockchain_confianza, bigdata_flujo, ciber_ataque, ia_tradicional_ml, ia_ciclo,
              informe_orden, consultoria_tiempos, iot_recorrido, impacto_it_ot, investigar_proceso, iot_mirai, gemelo_digital, animar_cadena):
        f()
