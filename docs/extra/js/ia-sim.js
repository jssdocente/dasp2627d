/*
 * Simulador «Entrena tu propio filtro» para la página 2.5 de los apuntes DASP.
 * Elaboración propia. Un modelo de vecinos más cercanos (k-NN) aprende de
 * ejemplos de candidaturas inventadas. Solo actúa si la página contiene .ia-sim.
 *
 * Pasos: 0 aprender de ejemplos, 1 predecir, 2 el sesgo heredado, 3 corregirlo.
 */
(function () {
  "use strict";

  var PASOS = ["Aprender de ejemplos", "Predecir", "El sesgo heredado", "Corregirlo"];
  var X0 = 44, X1 = 384, Y0 = 262, Y1 = 18;     // área de la gráfica en el viewBox
  var COLS = 34, FILAS = 24;

  // ---------- Datos ----------

  function azar(semilla) {
    var s = semilla;
    return function () {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };
  }

  function merito(p) { return (p.nota / 10) * 0.6 + (p.exp / 5) * 0.4; }

  // Decisiones antiguas de una empresa inventada: al centro B se le exigía mucho más.
  function historico(revisado) {
    var r = azar(17), datos = [];
    for (var i = 0; i < 44; i++) {
      var centro = i < 30 ? "A" : "B";
      var p = { nota: 3 + r() * 7, exp: r() * 5, centro: centro };
      p.localidad = r() < 0.9 ? centro : (centro === "A" ? "B" : "A");
      var exigencia = centro === "B" && !revisado ? 0.78 : 0.56;
      p.si = merito(p) > exigencia;
      datos.push(p);
    }
    return datos;
  }

  // Candidaturas de prueba con la misma calidad en los dos centros.
  function prueba() {
    var r = azar(99), lista = [];
    ["A", "B"].forEach(function (c) {
      for (var i = 0; i < 80; i++) {
        lista.push({ nota: 3 + r() * 7, exp: r() * 5, centro: c, localidad: r() < 0.9 ? c : (c === "A" ? "B" : "A") });
      }
    });
    return lista;
  }

  var INICIALES = [
    { nota: 8.5, exp: 4, si: true }, { nota: 9, exp: 2.5, si: true },
    { nota: 4, exp: 1, si: false }, { nota: 5, exp: 0.5, si: false }
  ];
  var NUEVAS = [{ nota: 7.5, exp: 3.2 }, { nota: 4.5, exp: 2 }, { nota: 9.8, exp: 0.1 }, { nota: 2.5, exp: 4.8 }];

  // ---------- Modelo: k vecinos más cercanos ----------

  function distancia(a, b, cols) {
    var dx = (a.nota - b.nota) / 10, dy = (a.exp - b.exp) / 5, d = dx * dx + dy * dy;
    if (cols.centro && a.centro !== b.centro) d += 0.09;
    if (cols.localidad && a.localidad !== b.localidad) d += 0.09;
    return Math.sqrt(d);
  }

  function predecir(datos, q, k, cols) {
    var orden = datos.map(function (p) { return { p: p, d: distancia(p, q, cols) }; })
      .sort(function (a, b) { return a.d - b.d; })
      .slice(0, Math.min(k, datos.length));
    var si = orden.filter(function (o) { return o.p.si; }).length;
    return { si: si * 2 > orden.length, votos: si, k: orden.length, cerca: orden.length ? orden[0].d : 1, vecinos: orden };
  }

  // ---------- Utilidades de DOM ----------

  function el(tag, clase, texto) {
    var e = document.createElement(tag);
    if (clase) e.className = clase;
    if (texto !== undefined) e.textContent = texto;
    return e;
  }

  function svgEl(tag, attrs) {
    var e = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }

  function boton(texto, clase) {
    var b = el("button", "md-button" + (clase ? " " + clase : ""), texto);
    b.type = "button";
    return b;
  }

  function xDe(nota) { return X0 + (nota / 10) * (X1 - X0); }
  function yDe(exp) { return Y0 - (exp / 5) * (Y0 - Y1); }
  function num(x) { return x.toFixed(1).replace(".", ","); }
  function pct(x) { return Math.round(x * 100) + " %"; }

  function iniciar(raiz) {
    raiz.textContent = "";
    var st = { paso: 0, propios: INICIALES.slice(), etiqueta: true, añadidos: 0, nuevas: 0,
               vista: "A", vistoB: false, cols: { centro: true, localidad: true }, revisado: false };
    var v = {};
    var PRUEBA = prueba();

    var barra = el("div", "bc-pasos");
    var botonesPaso = PASOS.map(function (nombre, n) {
      var b = boton((n + 1) + ". " + nombre, "bc-paso");
      b.addEventListener("click", function () { irA(n); });
      barra.appendChild(b);
      return b;
    });
    var guia = el("div", "bc-guia");
    guia.setAttribute("aria-live", "polite");
    var guiaTexto = el("p", "bc-guia-texto");
    guia.appendChild(guiaTexto);
    var escena = el("div", "bc-escena");
    var nav = el("div", "bc-nav");
    var anterior = boton("← Anterior");
    var siguiente = boton("Siguiente →", "md-button--primary");
    var repetir = boton("Repetir este paso");
    [anterior, siguiente, repetir].forEach(function (b) { nav.appendChild(b); });
    [barra, guia, escena, nav].forEach(function (e) { raiz.appendChild(e); });
    anterior.addEventListener("click", function () { irA(st.paso - 1); });
    siguiente.addEventListener("click", function () { irA(st.paso + 1); });
    repetir.addEventListener("click", function () { irA(st.paso, true); });

    function irA(n, reiniciar) {
      st.paso = Math.max(0, Math.min(PASOS.length - 1, n));
      if (st.paso === 0 && reiniciar) { st.propios = INICIALES.slice(); st.añadidos = 0; }
      st.nuevas = 0;
      st.ultima = null;
      st.vista = "A";
      st.vistoB = false;
      if (st.paso === 3) { st.cols = { centro: true, localidad: true }; st.revisado = false; st.tocado = false; }
      construir();
      actualizar();
    }

    function datosActuales() {
      if (st.paso <= 1) return st.propios;
      return historico(st.paso === 3 && st.revisado);
    }

    function colsActuales() {
      if (st.paso <= 1) return {};
      if (st.paso === 2) return { centro: true, localidad: true };
      return st.cols;
    }

    function k() { return st.paso <= 1 ? 3 : 5; }

    // ---------- Escena ----------

    function construir() {
      escena.textContent = "";
      v = {};
      botonesPaso.forEach(function (b, n) { b.classList.toggle("bc-activo", n === st.paso); });
      anterior.disabled = st.paso === 0;
      siguiente.style.display = st.paso === PASOS.length - 1 ? "none" : "";

      var c = el("div", "iot-controles");
      if (st.paso === 0) {
        c.appendChild(document.createTextNode("Al hacer clic en la gráfica añades un ejemplo de: "));
        [[true, "✔ Contratada"], [false, "✘ No contratada"]].forEach(function (op) {
          var b = boton(op[1], "iot-opcion" + (st.etiqueta === op[0] ? " bc-activo" : ""));
          b.addEventListener("click", function () {
            st.etiqueta = op[0];
            Array.prototype.forEach.call(c.querySelectorAll(".iot-opcion"), function (x) { x.classList.remove("bc-activo"); });
            b.classList.add("bc-activo");
          });
          c.appendChild(b);
        });
      }
      if (st.paso === 1) {
        v.nueva = boton("Llega una candidatura nueva", "md-button--primary");
        v.nueva.addEventListener("click", function () {
          st.ultima = NUEVAS[st.nuevas % NUEVAS.length];
          st.nuevas++;
          actualizar();
        });
        c.appendChild(v.nueva);
      }
      if (st.paso >= 2) {
        c.appendChild(document.createTextNode("Ver el mapa como una candidatura del: "));
        ["A", "B"].forEach(function (centro) {
          var b = boton("Centro " + centro, "iot-opcion" + (st.vista === centro ? " bc-activo" : ""));
          b.addEventListener("click", function () {
            st.vista = centro;
            if (centro === "B") st.vistoB = true;
            Array.prototype.forEach.call(c.querySelectorAll(".iot-opcion"), function (x) { x.classList.remove("bc-activo"); });
            b.classList.add("bc-activo");
            actualizar();
          });
          c.appendChild(b);
        });
      }
      escena.appendChild(c);

      if (st.paso === 3) {
        var arreglos = el("div", "iot-controles");
        [["centro", "Usar la columna «centro»"], ["localidad", "Usar la columna «localidad»"]].forEach(function (op) {
          var lab = el("label", "iot-control");
          var ch = el("input");
          ch.type = "checkbox";
          ch.checked = st.cols[op[0]];
          ch.addEventListener("change", function () { st.cols[op[0]] = ch.checked; st.tocado = true; actualizar(); });
          lab.appendChild(ch);
          lab.appendChild(document.createTextNode(" " + op[1]));
          arreglos.appendChild(lab);
        });
        var labR = el("label", "iot-control");
        var chR = el("input");
        chR.type = "checkbox";
        chR.checked = st.revisado;
        chR.addEventListener("change", function () { st.revisado = chR.checked; st.tocado = true; actualizar(); });
        labR.appendChild(chR);
        labR.appendChild(document.createTextNode(" Revisar las decisiones antiguas del centro B con el mismo criterio que las del A"));
        arreglos.appendChild(labR);
        escena.appendChild(arreglos);
      }

      var cuerpo = el("div", "iot-cuerpo");
      cuerpo.appendChild(construirGrafica());
      v.panel = el("div", "iot-planta ia-panel");
      cuerpo.appendChild(v.panel);
      escena.appendChild(cuerpo);
    }

    function construirGrafica() {
      var g = svgEl("svg", { viewBox: "0 0 400 300", class: "ia-grafica", role: "img",
        "aria-label": "Mapa de decisiones del modelo según la nota y los años de experiencia" });
      v.celdas = [];
      var w = (X1 - X0) / COLS, h = (Y0 - Y1) / FILAS;
      for (var i = 0; i < COLS; i++) {
        for (var j = 0; j < FILAS; j++) {
          var r = svgEl("rect", { x: X0 + i * w, y: Y1 + j * h, width: w + 0.5, height: h + 0.5 });
          g.appendChild(r);
          v.celdas.push({ r: r, nota: ((i + 0.5) / COLS) * 10, exp: (1 - (j + 0.5) / FILAS) * 5 });
        }
      }
      [0, 2, 4, 6, 8, 10].forEach(function (n) {
        var t = svgEl("text", { x: xDe(n), y: Y0 + 14, "text-anchor": "middle", class: "iot-eje" });
        t.textContent = n;
        g.appendChild(t);
      });
      [0, 1, 2, 3, 4, 5].forEach(function (e) {
        var t = svgEl("text", { x: X0 - 6, y: yDe(e) + 3, "text-anchor": "end", class: "iot-eje" });
        t.textContent = e;
        g.appendChild(t);
      });
      var tx = svgEl("text", { x: (X0 + X1) / 2, y: 296, "text-anchor": "middle", class: "iot-eje" });
      tx.textContent = "Nota en la prueba técnica";
      g.appendChild(tx);
      var ty = svgEl("text", { x: 10, y: (Y0 + Y1) / 2, "text-anchor": "middle", class: "iot-eje",
        transform: "rotate(-90 10 " + (Y0 + Y1) / 2 + ")" });
      ty.textContent = "Años de experiencia";
      g.appendChild(ty);
      g.appendChild(svgEl("rect", { x: X0, y: Y1, width: X1 - X0, height: Y0 - Y1, class: "ia-marco" }));
      v.lineas = svgEl("g");
      v.puntos = svgEl("g");
      g.appendChild(v.lineas);
      g.appendChild(v.puntos);
      if (st.paso === 0) {
        g.classList.add("ia-clic");
        g.addEventListener("click", function (ev) {
          var pt = g.createSVGPoint();
          pt.x = ev.clientX; pt.y = ev.clientY;
          var p = pt.matrixTransform(g.getScreenCTM().inverse());
          if (p.x < X0 || p.x > X1 || p.y < Y1 || p.y > Y0) return;
          st.propios.push({ nota: (p.x - X0) / (X1 - X0) * 10, exp: (Y0 - p.y) / (Y0 - Y1) * 5, si: st.etiqueta });
          st.añadidos++;
          actualizar();
        });
      }
      v.svg = g;
      return g;
    }

    function marca(p, extra) {
      var cx = xDe(p.nota), cy = yDe(p.exp);
      var clase = "ia-punto " + (p.si === undefined ? "ia-nueva" : p.si ? "ia-si" : "ia-no") + (extra ? " " + extra : "");
      if (p.centro === "B") {
        return svgEl("path", { d: "M" + cx + "," + (cy - 6) + " L" + (cx + 6) + "," + (cy + 5) + " L" + (cx - 6) + "," + (cy + 5) + " z", class: clase });
      }
      return svgEl("circle", { cx: cx, cy: cy, r: p.si === undefined ? 7 : 5, class: clase });
    }

    // ---------- Pintado ----------

    function actualizar() {
      var datos = datosActuales(), cols = colsActuales();
      v.celdas.forEach(function (c) {
        var q = { nota: c.nota, exp: c.exp, centro: st.vista, localidad: st.vista };
        var pr = predecir(datos, q, k(), cols);
        c.r.setAttribute("class", pr.si ? "ia-zona-si" : "ia-zona-no");
      });
      v.puntos.textContent = "";
      v.lineas.textContent = "";
      datos.forEach(function (p) { v.puntos.appendChild(marca(p)); });

      v.panel.textContent = "";
      var hecho = false;
      if (st.paso === 0) {
        v.panel.appendChild(el("div", "iot-sub", "Tus ejemplos"));
        var si = datos.filter(function (p) { return p.si; }).length;
        v.panel.appendChild(el("p", null, si + " contratadas y " + (datos.length - si) + " no contratadas."));
        v.panel.appendChild(el("p", "cpg-nota", "Cada zona toma el color de la mayoría de sus 3 ejemplos más cercanos. Nadie ha escrito ninguna regla."));
        hecho = st.añadidos >= 4;
      }
      if (st.paso === 1) {
        v.panel.appendChild(el("div", "iot-sub", "Predicción"));
        if (st.ultima) {
          var pr = predecir(datos, st.ultima, 3, {});
          v.puntos.appendChild(marca(st.ultima));
          pr.vecinos.forEach(function (o) {
            v.lineas.appendChild(svgEl("line", { x1: xDe(st.ultima.nota), y1: yDe(st.ultima.exp),
              x2: xDe(o.p.nota), y2: yDe(o.p.exp), class: "ia-vecino" }));
          });
          v.panel.appendChild(el("p", null, "Nota " + num(st.ultima.nota) + " y " + num(st.ultima.exp) + " años de experiencia."));
          v.panel.appendChild(el("p", "ia-resultado " + (pr.si ? "iot-ok" : "iot-mal"),
            (pr.si ? "✔ Contratar" : "✘ No contratar") + " · " + (pr.si ? pr.votos : pr.k - pr.votos) + " de " + pr.k + " vecinos"));
          if (pr.cerca > 0.3) {
            v.panel.appendChild(el("p", "ia-aviso", "Esta candidatura está lejos de todos tus ejemplos, y aun así el modelo da una respuesta sin avisar de que no sabe."));
            st.vistoLejos = true;
          }
        } else {
          v.panel.appendChild(el("p", null, "Pulsa «Llega una candidatura nueva»."));
        }
        hecho = st.nuevas >= 3;
      }
      if (st.paso >= 2) {
        var pa = predecir(datos, { nota: 8, exp: 2.5, centro: "A", localidad: "A" }, 5, cols);
        var pb = predecir(datos, { nota: 8, exp: 2.5, centro: "B", localidad: "B" }, 5, cols);
        v.panel.appendChild(el("div", "iot-sub", "Misma candidatura, distinto centro"));
        v.panel.appendChild(el("p", null, "Nota 8 y 2,5 años de experiencia:"));
        [["Centro A", pa], ["Centro B", pb]].forEach(function (par) {
          var f = el("div", "iot-estado");
          f.appendChild(el("span", null, par[0]));
          f.appendChild(el("strong", par[1].si ? "iot-ok" : "iot-mal", par[1].si ? "✔ Contratar" : "✘ No contratar"));
          v.panel.appendChild(f);
        });
        var tasas = { A: [0, 0], B: [0, 0] };
        PRUEBA.forEach(function (q) {
          var r = predecir(datos, q, 5, cols);
          tasas[q.centro][1]++;
          if (r.si) tasas[q.centro][0]++;
        });
        var ta = tasas.A[0] / tasas.A[1], tb = tasas.B[0] / tasas.B[1];
        v.panel.appendChild(el("div", "iot-sub", "Medir por grupos: candidaturas aceptadas"));
        v.panel.appendChild(el("p", "cpg-nota", "80 candidaturas nuevas de cada centro, con la misma calidad."));
        [["Centro A", ta], ["Centro B", tb]].forEach(function (par) {
          var f = el("div", "ia-barra");
          f.appendChild(el("span", null, par[0]));
          var fondo = el("span", "ia-barra-fondo");
          var rel = el("span", "ia-barra-relleno");
          rel.style.width = Math.round(par[1] * 100) + "%";
          fondo.appendChild(rel);
          f.appendChild(fondo);
          f.appendChild(el("strong", null, pct(par[1])));
          v.panel.appendChild(f);
        });
        st.dif = Math.abs(ta - tb);
        hecho = st.paso === 2 ? st.vistoB : (st.tocado && st.dif <= 0.1);
      }
      siguiente.classList.toggle("bc-listo", hecho);
      guiaTexto.innerHTML = "<strong>Paso " + (st.paso + 1) + ". " + PASOS[st.paso] + ".</strong> " + texto(hecho);
    }

    function texto(hecho) {
      switch (st.paso) {
        case 0:
          return hecho
            ? "El mapa se ha ido adaptando a tus ejemplos: eso es <strong>entrenar</strong>. El modelo no sabe qué es una nota ni "
              + "qué es la experiencia; solo copia lo que se parece a lo que ya ha visto. Pulsa <em>Siguiente</em>."
            : "Una empresa inventada quiere un modelo que decida qué candidaturas pasan a entrevista. Cada punto es una candidatura "
              + "antigua: en verde, contratada; en rojo, no. Elige una etiqueta y <strong>haz clic en la gráfica para añadir al menos "
              + "4 ejemplos</strong>. Mira cómo cambia el mapa de colores.";
        case 1:
          if (hecho) {
            return "El modelo siempre contesta, aunque la candidatura no se parezca a nada de lo que ha visto. Por eso decimos que "
              + "<strong>predice, no comprende</strong>: no sabe cuándo no sabe. Pulsa <em>Siguiente</em>.";
          }
          return "Ahora llegan candidaturas que el modelo no ha visto. Para decidir, mira sus 3 ejemplos más cercanos (las líneas "
            + "discontinuas) y vota. Pulsa el botón al menos 3 veces y fíjate en la tercera.";
        case 2:
          return hecho
            ? "Con la misma nota y la misma experiencia, al centro B se le dice que no. El modelo no tiene prejuicios propios: "
              + "<strong>ha aprendido los de las decisiones antiguas</strong>, en las que al centro B se le exigía más. Pulsa <em>Siguiente</em>."
            : "Ahora el modelo se entrena con 44 decisiones antiguas de la empresa. Los círculos son candidaturas del centro de formación A "
              + "y los triángulos, del B. Pulsa <strong>Centro B</strong> para ver el mapa con los ojos de una candidatura de ese centro.";
        default:
          if (!st.tocado) {
            return "Prueba a corregir el modelo. Primero quita solo la columna «centro» y mira las barras. "
              + "Después prueba las otras opciones. El objetivo es que los dos centros tengan una tasa parecida.";
          }
          if (hecho && st.revisado) {
            return "Al revisar los datos antiguos con un criterio único, las tasas se igualan aunque el modelo vea el centro. "
              + "Es la medida más sólida: <strong>arreglar los datos y medir por grupos</strong>, no solo esconder columnas.";
          }
          if (hecho) {
            return "Las tasas se igualan al quitar también «localidad», que delataba el centro en 9 de cada 10 casos. Aquí conocíamos "
              + "esa pista; con datos reales hay muchas pistas indirectas que no se ven, como la palabra <em>women's</em> en el caso de Amazon. "
              + "Prueba también a revisar los datos antiguos.";
          }
          if (!st.cols.centro && st.cols.localidad) {
            return "Sin la columna «centro», la diferencia sigue: la «localidad» coincide con el centro casi siempre y el modelo la usa como pista. "
              + "<strong>Quitar una columna no basta.</strong>";
          }
          return "Todavía hay mucha diferencia entre centros. Prueba otra combinación.";
      }
    }

    irA(0);
  }

  function arrancar() {
    document.querySelectorAll(".ia-sim").forEach(iniciar);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", arrancar);
  } else {
    arrancar();
  }
})();
