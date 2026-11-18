/*
 * Ejercicio «Limpia los datos» para la página 2.4 de los apuntes DASP.
 * Elaboración propia. Tienda, clientes y cifras inventados.
 * Parte 1: encontrar los fallos de una tabla de pedidos y ver cómo cambian el KPI y la decisión.
 * Parte 2: correlación no es causa. Solo actúa si la página contiene .bd-sim.
 */
(function () {
  "use strict";

  var PEDIDOS = [
    { id: "P-101", fecha: "03/10", cliente: "Lucía M.", provincia: "Badajoz", uds: 2, importe: 18.4 },
    { id: "P-102", fecha: "03/10", cliente: "Jorge P.", provincia: "Cáceres", uds: 1, importe: 9.2 },
    { id: "P-103", fecha: "05/10", cliente: "Ana R.", provincia: "Badajoz", uds: 3, importe: 27.6 },
    { id: "P-104", fecha: "06/10", cliente: "Pedro L.", provincia: "Cáceres", uds: 1, importe: 1250,
      fallo: "Importe imposible: 1 unidad no cuesta 1.250 €. Se escribió sin la coma; el importe real era 12,50 €.",
      arreglo: "Corregir a 12,50 €", aplicar: function (p) { p.importe = 12.5; }, campo: "importe" },
    { id: "P-105", fecha: "07/10", cliente: "test test", provincia: "Cáceres", uds: 1, importe: 0.01,
      fallo: "Es un pedido de prueba que hizo el equipo de desarrollo al montar la tienda.",
      arreglo: "Eliminar la fila", aplicar: function (p) { p.borrado = true; }, campo: "cliente" },
    { id: "P-103", fecha: "05/10", cliente: "Ana R.", provincia: "Badajoz", uds: 3, importe: 27.6,
      fallo: "Duplicado: el pedido P-103 ya está en la tabla. Contarlo dos veces infla las ventas.",
      arreglo: "Eliminar el duplicado", aplicar: function (p) { p.borrado = true; }, campo: "id" },
    { id: "P-106", fecha: "09/10", cliente: "Carmen S.", provincia: "badajoz ", uds: 2, importe: 18.4,
      fallo: "«badajoz » con minúscula y un espacio al final: el análisis lo cuenta como otra provincia.",
      arreglo: "Unificar como «Badajoz»", aplicar: function (p) { p.provincia = "Badajoz"; }, campo: "provincia" },
    { id: "P-107", fecha: "10/10", cliente: "Luis G.", provincia: "Madrid", uds: 4, importe: 36.8 },
    { id: "P-108", fecha: "12/10", cliente: "Elena F.", provincia: "", uds: 2, importe: 18.4,
      fallo: "Falta la provincia. No se puede adivinar: inventar el dato sería peor que dejarlo vacío.",
      arreglo: "Marcar como «Sin dato»", aplicar: function (p) { p.provincia = "Sin dato"; }, campo: "provincia" },
    { id: "P-109", fecha: "13/10", cliente: "Raúl T.", provincia: "Badajoz", uds: 1, importe: 9.2 },
    { id: "P-110", fecha: "14/10", cliente: "Sara V.", provincia: "Cáceres", uds: 2, importe: 18.4 },
    { id: "P-111", fecha: "15/10", cliente: "Iván D.", provincia: "Badajoz", uds: 2, importe: 18.4 }
  ];
  var FALLOS = PEDIDOS.filter(function (p) { return p.fallo; }).length;

  var MESES = ["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
  var ABANICOS = [5, 6, 10, 18, 35, 70, 95, 90, 50, 20, 8, 5];
  var RECLAMACIONES = [3, 4, 8, 14, 30, 62, 90, 86, 44, 15, 6, 4];
  var CALOR = [10, 14, 22, 32, 52, 78, 98, 94, 66, 38, 18, 10];

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

  function euros(x) {
    return x.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
  }

  function iniciar(raiz) {
    raiz.textContent = "";
    var filas = PEDIDOS.map(function (p) { return Object.assign({}, p); });
    var arreglados = 0;

    // ---------- Parte 1 ----------
    raiz.appendChild(el("div", "cpg-titulo", "1. Limpia los datos"));
    raiz.appendChild(el("p", null, "Estos son los pedidos de octubre de una tienda online inventada. La dirección quiere abrir un punto de "
      + "recogida en la provincia que más compra. Haz clic en las filas sospechosas: hay " + FALLOS + " fallos."));
    var cuerpo = el("div", "bd-cuerpo");
    var tablaCaja = el("div", "bd-tabla-caja");
    var tabla = el("table", "bd-tabla");
    var thead = el("thead");
    var trh = el("tr");
    ["Pedido", "Fecha", "Cliente", "Provincia", "Uds.", "Importe"].forEach(function (h) { trh.appendChild(el("th", null, h)); });
    thead.appendChild(trh);
    tabla.appendChild(thead);
    var tbody = el("tbody");
    tabla.appendChild(tbody);
    tablaCaja.appendChild(tabla);
    var detalle = el("div", "cpg-resultado bd-detalle");
    detalle.setAttribute("aria-live", "polite");
    tablaCaja.appendChild(detalle);
    var panel = el("div", "iot-planta bd-panel");
    cuerpo.appendChild(tablaCaja);
    cuerpo.appendChild(panel);
    raiz.appendChild(cuerpo);

    function pintarTabla() {
      tbody.textContent = "";
      filas.forEach(function (p) {
        var tr = el("tr", p.borrado ? "bd-borrada" : (p.limpia ? "bd-limpia" : ""));
        tr.tabIndex = 0;
        var prov = p.provincia === "" ? "—" : (p.provincia === "badajoz " ? "«badajoz »" : p.provincia);
        [["id", p.id], ["fecha", p.fecha], ["cliente", p.cliente], ["provincia", prov],
         ["uds", String(p.uds)], ["importe", euros(p.importe)]].forEach(function (c) {
          tr.appendChild(el("td", (p.revelado && p.campo === c[0] && !p.limpia && !p.borrado) ? "bd-mal" : "", c[1]));
        });
        tr.addEventListener("click", function () { elegir(p); });
        tr.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); elegir(p); } });
        tbody.appendChild(tr);
      });
    }

    function elegir(p) {
      detalle.textContent = "";
      detalle.className = "cpg-resultado bd-detalle";
      if (p.borrado || p.limpia) {
        detalle.appendChild(el("p", null, "Esta fila ya está resuelta."));
        return;
      }
      if (!p.fallo) {
        detalle.className += " cpg-r-bien";
        detalle.appendChild(el("p", null, "Pedido " + p.id + ": esta fila parece correcta."));
        return;
      }
      p.revelado = true;
      pintarTabla();
      detalle.className += " cpg-r-mal";
      detalle.appendChild(el("p", "cpg-veredicto", "Pedido " + p.id + ": hay un problema."));
      detalle.appendChild(el("p", null, p.fallo));
      var b = boton(p.arreglo, "md-button--primary");
      b.addEventListener("click", function () {
        p.aplicar(p);
        p.limpia = !p.borrado;
        arreglados++;
        detalle.textContent = "";
        detalle.className = "cpg-resultado bd-detalle cpg-r-bien";
        detalle.appendChild(el("p", null, "Arreglado. Mira cómo cambian los indicadores."));
        pintarTabla();
        pintarPanel();
      });
      detalle.appendChild(b);
    }

    function pintarPanel() {
      panel.textContent = "";
      var validas = filas.filter(function (p) { return !p.borrado; });
      var total = validas.reduce(function (s, p) { return s + p.importe; }, 0);
      var porProv = {};
      validas.forEach(function (p) {
        var k = p.provincia === "" ? "(vacío)" : p.provincia;
        porProv[k] = (porProv[k] || 0) + p.importe;
      });
      var claves = Object.keys(porProv).sort(function (a, b) { return porProv[b] - porProv[a]; });
      var max = porProv[claves[0]];
      panel.appendChild(el("div", "iot-sub", "Indicadores (" + arreglados + " de " + FALLOS + " fallos corregidos)"));
      var f1 = el("div", "iot-estado");
      f1.appendChild(el("span", null, "Pedidos"));
      f1.appendChild(el("strong", null, String(validas.length)));
      panel.appendChild(f1);
      var f2 = el("div", "iot-estado");
      f2.appendChild(el("span", null, "Ticket medio"));
      f2.appendChild(el("strong", null, euros(total / validas.length)));
      panel.appendChild(f2);
      panel.appendChild(el("div", "iot-sub", "Ventas por provincia"));
      claves.forEach(function (k) {
        var f = el("div", "ia-barra bd-barra");
        f.appendChild(el("span", null, k));
        var fondo = el("span", "ia-barra-fondo");
        var rel = el("span", "ia-barra-relleno");
        rel.style.width = Math.max(2, Math.round(porProv[k] / max * 100)) + "%";
        fondo.appendChild(rel);
        f.appendChild(fondo);
        f.appendChild(el("strong", null, euros(porProv[k])));
        panel.appendChild(f);
      });
      var limpio = arreglados === FALLOS;
      var decision = el("div", "cpg-resultado " + (limpio ? "cpg-r-bien" : "cpg-r-mal"));
      decision.appendChild(el("p", "cpg-veredicto", "Decisión que sugieren los datos: abrir el punto de recogida en " + claves[0] + "."));
      decision.appendChild(el("p", "cpg-nota", limpio
        ? "Con los datos limpios, la decisión cambia por completo. Un solo importe mal escrito pesaba más que todos los pedidos juntos."
        : "Ojo: todavía quedan fallos. ¿Te fiarías de esta decisión?"));
      panel.appendChild(decision);
    }

    pintarTabla();
    pintarPanel();

    // ---------- Parte 2 ----------
    raiz.appendChild(el("div", "cpg-titulo", "2. ¿Correlación o causa?"));
    raiz.appendChild(el("p", null, "La tienda también vende abanicos y bombones. Al cruzar los datos del año aparece esta relación: "
      + "cuando suben las ventas de abanicos, suben las reclamaciones por bombones que llegan derretidos."));
    var g = svgEl("svg", { viewBox: "0 0 400 190", class: "bd-grafica", role: "img",
      "aria-label": "Ventas de abanicos y reclamaciones por bombones derretidos a lo largo del año; las dos suben en verano" });
    function xm(i) { return 40 + i * (340 / 11); }
    function ym(vv) { return 160 - vv * 1.4; }
    MESES.forEach(function (m, i) {
      var t = svgEl("text", { x: xm(i), y: 178, "text-anchor": "middle", class: "iot-eje" });
      t.textContent = m;
      g.appendChild(t);
    });
    g.appendChild(svgEl("line", { x1: 40, x2: 380, y1: 160, y2: 160, class: "iot-rejilla" }));
    function serie(datos, clase) {
      return svgEl("polyline", { points: datos.map(function (vv, i) { return xm(i) + "," + ym(vv); }).join(" "), class: clase });
    }
    g.appendChild(serie(ABANICOS, "bd-s1"));
    g.appendChild(serie(RECLAMACIONES, "bd-s2"));
    var calor = serie(CALOR, "bd-s3");
    calor.style.display = "none";
    g.appendChild(calor);
    var leyenda = el("div", "bd-leyenda");
    [["bd-l1", "Ventas de abanicos"], ["bd-l2", "Reclamaciones por bombones derretidos"]].forEach(function (l) {
      var s = el("span", null);
      s.appendChild(el("span", "bd-muestra " + l[0]));
      s.appendChild(document.createTextNode(l[1]));
      leyenda.appendChild(s);
    });
    var leyCalor = el("span", null);
    leyCalor.appendChild(el("span", "bd-muestra bd-l3"));
    leyCalor.appendChild(document.createTextNode("Temperatura media"));
    leyCalor.style.display = "none";
    leyenda.appendChild(leyCalor);
    var graf = el("div", "bd-graf");
    graf.appendChild(g);
    graf.appendChild(leyenda);
    raiz.appendChild(graf);

    raiz.appendChild(el("p", "cpg-enunciado", "¿Qué debería hacer la tienda?"));
    var ops = el("div", "bd-opciones");
    var res = el("div", "cpg-resultado");
    res.setAttribute("aria-live", "polite");
    var OPCIONES = [
      { t: "Dejar de vender abanicos para reducir las reclamaciones.", ok: false,
        r: "Los abanicos no derriten los bombones. Dejar de venderlos solo haría perder ventas: las reclamaciones seguirían igual." },
      { t: "Buscar una causa común. Si es el calor, usar envío refrigerado en verano.", ok: true,
        r: "Exacto. Las dos cosas dependen de una tercera: el calor. Por eso se mueven juntas sin que una cause la otra." },
      { t: "Es pura casualidad: no hay que hacer nada.", ok: false,
        r: "No es casualidad: hay una causa común que explica las dos. Ignorarla deja sin resolver las reclamaciones." }
    ];
    OPCIONES.forEach(function (o) {
      var b = boton(o.t, "cpg-opcion bd-opcion");
      b.addEventListener("click", function () {
        if (b.disabled) return;
        Array.prototype.forEach.call(ops.children, function (x, i) {
          x.disabled = true;
          if (OPCIONES[i].ok) x.classList.add("cpg-bien");
        });
        if (!o.ok) b.classList.add("cpg-mal");
        calor.style.display = "";
        leyCalor.style.display = "";
        res.className = "cpg-resultado " + (o.ok ? "cpg-r-bien" : "cpg-r-mal");
        res.appendChild(el("p", "cpg-veredicto", o.ok ? "✔ Bien visto." : "✘ No es la mejor decisión."));
        res.appendChild(el("p", null, o.r));
        res.appendChild(el("p", "cpg-nota", "En la gráfica aparece ahora la temperatura: sube y baja con las otras dos. "
          + "Que dos datos se muevan juntos (correlación) no demuestra que uno provoque el otro (causa)."));
        var otra = boton("Volver a intentarlo");
        otra.addEventListener("click", function () {
          res.textContent = "";
          res.className = "cpg-resultado";
          calor.style.display = "none";
          leyCalor.style.display = "none";
          Array.prototype.forEach.call(ops.children, function (x) { x.disabled = false; x.classList.remove("cpg-bien", "cpg-mal"); });
        });
        res.appendChild(otra);
      });
      ops.appendChild(b);
    });
    raiz.appendChild(ops);
    raiz.appendChild(res);
  }

  function arrancar() {
    document.querySelectorAll(".bd-sim").forEach(iniciar);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", arrancar);
  } else {
    arrancar();
  }
})();
