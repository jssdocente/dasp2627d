/*
 * Simulador IoT por pasos para la página 2.2 de los apuntes DASP.
 * Elaboración propia. Escenario inventado: una noche en la cámara frigorífica
 * de una cooperativa de cereza. Solo actúa si la página contiene .iot-sim.
 *
 * Pasos: 0 el sensor mide, 1 el mensaje, 2 publicar y suscribirse,
 * 3 la regla, 4 se cae Internet, 5 modo libre.
 */
(function () {
  "use strict";

  var TOPIC = "cooperativa/camara1/temperatura";
  var TICKS = 36;          // 6 horas en tramos de 10 minutos
  var AVERIA = 8;          // 23:20, se avería el compresor principal
  var CORTE = 5;           // 22:50, se cae Internet
  var LIMITE = 6;          // en este ejemplo, la fruta se estropea a 6 °C
  var BASE = 2;
  var VELOCIDAD = 330;     // ms por tramo
  var PASOS = ["El sensor mide", "El mensaje", "Publicar y suscribirse", "La regla", "Se cae Internet", "Modo libre"];

  var PUBLICADORES = [
    { nombre: "Sensor de temperatura · cámara 1", topic: "cooperativa/camara1/temperatura", carga: '{"t": 3.4}' },
    { nombre: "Sensor de puerta · cámara 1", topic: "cooperativa/camara1/puerta", carga: '{"abierta": false}' },
    { nombre: "Sensor de temperatura · cámara 2", topic: "cooperativa/camara2/temperatura", carga: '{"t": 2.1}' }
  ];
  var SUSCRIPTORES = [
    { nombre: "Panel web (DAW)", filtro: "cooperativa/#" },
    { nombre: "App móvil del encargado (DAM)", filtro: "cooperativa/camara1/temperatura" },
    { nombre: "Compresor de reserva · cámara 1", filtro: "cooperativa/camara1/temperatura" }
  ];
  var FILTROS = ["cooperativa/camara1/temperatura", "cooperativa/camara1/#", "cooperativa/+/temperatura", "cooperativa/#"];
  var OBJETIVO_APP = "cooperativa/+/temperatura";

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

  function dos(n) { return (n < 10 ? "0" : "") + n; }

  function hora(t) {
    var m = 22 * 60 + t * 10;
    return dos(Math.floor(m / 60) % 24) + ":" + dos(m % 60);
  }

  function grados(x) { return x.toFixed(1).replace(".", ",") + " °C"; }

  // Coincidencia de filtros MQTT: + sustituye a un nivel y # a todo lo que sigue.
  function coincide(filtro, topic) {
    var f = filtro.split("/"), t = topic.split("/");
    for (var i = 0; i < f.length; i++) {
      if (f[i] === "#") return true;
      if (i >= t.length) return false;
      if (f[i] !== "+" && f[i] !== t[i]) return false;
    }
    return f.length === t.length;
  }

  // Calcula la noche completa a partir de la configuración.
  function simular(cfg) {
    var temp = BASE, reserva = false, estropeada = false, avisoNadie = false;
    var noche = [];
    for (var t = 0; t <= TICKS; t++) {
      var internet = !(cfg.corte && t >= CORTE);
      var principal = !(cfg.averia && t >= AVERIA);
      if (t > 0) {
        if (principal) temp = Math.max(BASE, temp - 0.3);
        else if (reserva) temp = Math.max(BASE, temp - 0.45);
        else temp += 0.35;
      }
      temp = Math.round(temp * 10) / 10;
      var eventos = [];
      if (cfg.corte && t === CORTE) eventos.push({ tipo: "mal", txt: "Una tormenta corta la conexión a Internet de la cooperativa." });
      if (cfg.averia && t === AVERIA) eventos.push({ tipo: "mal", txt: "Se avería el compresor principal: la cámara empieza a calentarse." });
      if (cfg.regla && !reserva && temp > cfg.umbral) {
        if (cfg.donde === "local") {
          reserva = true;
          eventos.push({ tipo: "bien", txt: "La pasarela aplica la regla y enciende el compresor de reserva." });
          eventos.push(internet
            ? { tipo: "bien", txt: "Aviso enviado al móvil del encargado." }
            : { tipo: "info", txt: "El aviso al móvil queda guardado: se enviará cuando vuelva la conexión." });
        } else if (internet) {
          reserva = true;
          eventos.push({ tipo: "bien", txt: "La regla, en la nube, ordena encender el compresor de reserva y avisa al móvil." });
        } else if (!avisoNadie) {
          avisoNadie = true;
          eventos.push({ tipo: "mal", txt: "Se supera el umbral, pero la regla está en la nube y el dato no llega: nadie actúa." });
        }
      }
      if (temp >= LIMITE && !estropeada) {
        estropeada = true;
        eventos.push({ tipo: "mal", txt: "La cámara llega a " + grados(temp) + ": la fruta se estropea." });
      }
      noche.push({ t: t, temp: temp, internet: internet, principal: principal, reserva: reserva,
                   estropeada: estropeada, eventos: eventos });
    }
    return noche;
  }

  function iniciar(raiz) {
    raiz.textContent = "";
    var st = { paso: 0, umbral: 7, donde: "nube", averia: true, corte: true, filtros: SUSCRIPTORES.map(function (s) { return s.filtro; }),
               terminado: false, resultado: null, enviado: false, cambiado: false };
    var v = {};
    var reloj = null;

    var barra = el("div", "bc-pasos");
    var botonesPaso = PASOS.map(function (nombre, n) {
      var b = boton((n < 5 ? (n + 1) + ". " : "") + nombre, "bc-paso");
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
    repetir.addEventListener("click", function () { irA(st.paso); });

    function parar() {
      if (reloj) { clearInterval(reloj); reloj = null; }
    }

    function irA(n) {
      parar();
      st.paso = Math.max(0, Math.min(PASOS.length - 1, n));
      st.terminado = false;
      st.resultado = null;
      st.enviado = false;
      st.cambiado = false;
      if (st.paso === 4) st.donde = "nube";
      construir();
      guiar();
    }

    function cfgPaso() {
      switch (st.paso) {
        case 0: case 1: return { regla: false, averia: true, corte: false };
        case 3: return { regla: true, umbral: st.umbral, donde: "nube", averia: true, corte: false };
        case 4: return { regla: true, umbral: Math.min(st.umbral, 4.5), donde: st.donde, averia: true, corte: true };
        default: return { regla: true, umbral: st.umbral, donde: st.donde, averia: st.averia, corte: st.corte };
      }
    }

    // ---------- Escenas ----------

    function construir() {
      escena.textContent = "";
      v = {};
      botonesPaso.forEach(function (b, n) { b.classList.toggle("bc-activo", n === st.paso); });
      anterior.disabled = st.paso === 0;
      siguiente.style.display = st.paso === PASOS.length - 1 ? "none" : "";
      if (st.paso === 2) { construirPubSub(); return; }
      construirControles();
      var cuerpo = el("div", "iot-cuerpo");
      cuerpo.appendChild(construirPlanta());
      cuerpo.appendChild(construirGrafica());
      escena.appendChild(cuerpo);
      if (st.paso >= 1) {
        escena.appendChild(el("div", "iot-sub", st.paso === 1 ? "Mensajes que publica el sensor" : "Registro de la noche"));
        v.log = el("div", "iot-log");
        v.log.setAttribute("aria-live", "off");
        escena.appendChild(v.log);
      }
      pintarTramo(null);
    }

    function construirControles() {
      var c = el("div", "iot-controles");
      v.play = boton("▶ Simular la noche", "md-button--primary");
      v.play.addEventListener("click", reproducir);
      c.appendChild(v.play);

      if (st.paso === 3 || st.paso === 5) {
        var lab = el("label", "iot-control");
        lab.appendChild(document.createTextNode("Umbral de la regla: "));
        var r = el("input");
        r.type = "range"; r.min = "3"; r.max = "8"; r.step = "0.5"; r.value = String(st.umbral);
        var val = el("strong", null, grados(st.umbral));
        r.addEventListener("input", function () {
          st.umbral = parseFloat(r.value);
          val.textContent = grados(st.umbral);
          pintarTramo(null);
        });
        lab.appendChild(r);
        lab.appendChild(val);
        c.appendChild(lab);
      }
      if (st.paso === 4 || st.paso === 5) {
        var grupo = el("div", "iot-control");
        grupo.appendChild(document.createTextNode("¿Dónde está la regla? "));
        [["nube", "En la nube"], ["local", "En la pasarela (local)"]].forEach(function (op) {
          var b = boton(op[1], "iot-opcion" + (st.donde === op[0] ? " bc-activo" : ""));
          b.addEventListener("click", function () {
            st.donde = op[0];
            Array.prototype.forEach.call(grupo.querySelectorAll(".iot-opcion"), function (x) { x.classList.remove("bc-activo"); });
            b.classList.add("bc-activo");
          });
          grupo.appendChild(b);
        });
        c.appendChild(grupo);
      }
      if (st.paso === 5) {
        [["averia", "Avería del compresor"], ["corte", "Corte de Internet"]].forEach(function (op) {
          var lab = el("label", "iot-control");
          var ch = el("input");
          ch.type = "checkbox";
          ch.checked = st[op[0]];
          ch.addEventListener("change", function () { st[op[0]] = ch.checked; });
          lab.appendChild(ch);
          lab.appendChild(document.createTextNode(" " + op[1]));
          c.appendChild(lab);
        });
      }
      escena.appendChild(c);
    }

    function construirPlanta() {
      var p = el("div", "iot-planta");
      p.appendChild(el("div", "iot-sub", "Cámara 1 · cooperativa (ejemplo inventado)"));
      v.hora = el("div", "iot-hora");
      v.temp = el("div", "iot-temp");
      p.appendChild(v.hora);
      p.appendChild(v.temp);
      v.estados = {};
      [["principal", "Compresor principal"], ["reserva", "Compresor de reserva"], ["internet", "Internet"], ["fruta", "Fruta"]]
        .forEach(function (e) {
          var f = el("div", "iot-estado");
          f.appendChild(el("span", null, e[1]));
          var val = el("strong");
          f.appendChild(val);
          p.appendChild(f);
          v.estados[e[0]] = val;
        });
      return p;
    }

    function construirGrafica() {
      var g = svgEl("svg", { viewBox: "0 0 380 160", class: "iot-grafica", role: "img",
        "aria-label": "Gráfica de la temperatura de la cámara durante la noche" });
      g.appendChild(svgEl("rect", { x: 34, y: 15, width: 336, height: yDe(LIMITE) - 15, class: "iot-peligro" }));
      var tl = svgEl("text", { x: 366, y: 28, "text-anchor": "end", class: "iot-eje" });
      tl.textContent = "La fruta se estropea";
      g.appendChild(tl);
      [0, 2, 4, 6, 8, 10].forEach(function (c) {
        g.appendChild(svgEl("line", { x1: 34, x2: 370, y1: yDe(c), y2: yDe(c), class: "iot-rejilla" }));
        var tx = svgEl("text", { x: 28, y: yDe(c) + 4, "text-anchor": "end", class: "iot-eje" });
        tx.textContent = c + "°";
        g.appendChild(tx);
      });
      [0, 12, 24, 36].forEach(function (t) {
        var tx = svgEl("text", { x: xDe(t), y: 152, "text-anchor": t === TICKS ? "end" : "middle", class: "iot-eje" });
        tx.textContent = hora(t);
        g.appendChild(tx);
      });
      v.umbral = svgEl("line", { x1: 34, x2: 370, class: "iot-umbral" });
      v.umbralTxt = svgEl("text", { x: 38, class: "iot-eje iot-umbral-txt" });
      g.appendChild(v.umbral);
      g.appendChild(v.umbralTxt);
      v.linea = svgEl("polyline", { class: "iot-linea", points: "" });
      g.appendChild(v.linea);
      v.punto = svgEl("circle", { r: 4, class: "iot-punto" });
      g.appendChild(v.punto);
      return g;
    }

    function xDe(t) { return 34 + t * (336 / TICKS); }
    function yDe(c) { return 135 - c * 12; }

    // ---------- Reproducción ----------

    function reproducir() {
      parar();
      var cfg = cfgPaso();
      var noche = simular(cfg);
      st.terminado = false;
      st.resultado = null;
      st.cfg = cfg;
      if (v.log) v.log.textContent = "";
      v.play.disabled = true;
      var puntos = [];
      var t = 0;
      guiar();
      reloj = setInterval(function () {
        var tramo = noche[t];
        puntos.push(xDe(t).toFixed(1) + "," + yDe(Math.min(tramo.temp, 10.5)).toFixed(1));
        v.linea.setAttribute("points", puntos.join(" "));
        pintarTramo(tramo, cfg);
        registrar(tramo, cfg);
        t++;
        if (t > TICKS) {
          parar();
          v.play.disabled = false;
          v.play.textContent = "▶ Repetir la noche";
          st.terminado = true;
          st.resultado = tramo;
          if (v.log) linea("fin", "04:00 · Fin de la noche: " + (tramo.estropeada ? "la fruta se ha estropeado." : "la fruta se ha salvado."));
          guiar();
        }
      }, VELOCIDAD);
    }

    function pintarTramo(tr, cfg) {
      cfg = cfg || cfgPaso();
      var conRegla = cfg.regla;
      v.umbral.style.display = conRegla ? "" : "none";
      v.umbralTxt.style.display = conRegla ? "" : "none";
      if (conRegla) {
        v.umbral.setAttribute("y1", yDe(cfg.umbral));
        v.umbral.setAttribute("y2", yDe(cfg.umbral));
        v.umbralTxt.setAttribute("y", yDe(cfg.umbral) - 4);
        v.umbralTxt.textContent = "Umbral de la regla";
      }
      if (!tr) {
        v.linea.setAttribute("points", "");
        v.punto.style.display = "none";
        v.hora.textContent = "22:00";
        v.temp.textContent = grados(BASE);
        tr = { principal: true, reserva: false, internet: true, estropeada: false, temp: BASE };
      } else {
        v.punto.style.display = "";
        v.punto.setAttribute("cx", xDe(tr.t));
        v.punto.setAttribute("cy", yDe(Math.min(tr.temp, 10.5)));
        v.hora.textContent = hora(tr.t);
        v.temp.textContent = grados(tr.temp);
      }
      v.temp.classList.toggle("iot-mal", tr.temp >= LIMITE);
      estado("principal", tr.principal ? "funciona" : "averiado", tr.principal);
      estado("reserva", tr.reserva ? "encendido" : "apagado", true);
      estado("internet", tr.internet ? "conectado" : "sin conexión", tr.internet);
      estado("fruta", tr.estropeada ? "estropeada" : "en buen estado", !tr.estropeada);
    }

    function estado(k, txt, ok) {
      v.estados[k].textContent = txt;
      v.estados[k].className = ok ? "iot-ok" : "iot-mal";
    }

    function registrar(tr, cfg) {
      if (!v.log) return;
      var carga = '{"t": ' + tr.temp.toFixed(1) + ', "hora": "' + hora(tr.t) + '"}';
      var destino;
      if (cfg.regla && cfg.donde === "local") {
        destino = tr.internet ? "→ pasarela (regla) y broker en la nube" : "→ pasarela (regla); a la nube no llega";
      } else {
        destino = tr.internet ? "→ broker en la nube" : "✘ sin conexión: no llega a la nube";
      }
      var perdido = !tr.internet && !(cfg.regla && cfg.donde === "local");
      linea(perdido ? "msg iot-perdido" : "msg", hora(tr.t) + "  " + TOPIC + "  " + carga + "  " + destino);
      tr.eventos.forEach(function (e) { linea("ev iot-" + e.tipo, hora(tr.t) + " · " + e.txt); });
    }

    function linea(clase, txt) {
      var l = el("div", "iot-l " + clase, txt);
      v.log.appendChild(l);
      v.log.scrollTop = v.log.scrollHeight;
    }

    // ---------- Publicar y suscribirse ----------

    function construirPubSub() {
      var cont = el("div", "iot-pubsub");
      var colP = el("div", "iot-col");
      colP.appendChild(el("div", "iot-sub", "Publicadores"));
      PUBLICADORES.forEach(function (p) {
        var c = el("div", "iot-tarjeta");
        c.appendChild(el("strong", null, p.nombre));
        c.appendChild(el("code", null, p.topic));
        colP.appendChild(c);
      });
      var colB = el("div", "iot-col iot-col-broker");
      v.broker = el("div", "iot-tarjeta iot-broker");
      v.broker.appendChild(el("strong", null, "Broker MQTT"));
      v.brokerTxt = el("span", null, "Reparte cada mensaje a quien esté suscrito a su topic.");
      v.broker.appendChild(v.brokerTxt);
      var enviar = boton("Publicar un mensaje de cada sensor", "md-button--primary");
      enviar.addEventListener("click", publicar);
      colB.appendChild(el("div", "iot-sub", "En medio"));
      colB.appendChild(v.broker);
      colB.appendChild(enviar);
      var colS = el("div", "iot-col");
      colS.appendChild(el("div", "iot-sub", "Suscriptores (cambia su filtro)"));
      v.subs = SUSCRIPTORES.map(function (s, i) {
        var c = el("div", "iot-tarjeta");
        c.appendChild(el("strong", null, s.nombre));
        var sel = el("select", "iot-select");
        FILTROS.forEach(function (f) {
          var o = el("option", null, f);
          o.value = f;
          sel.appendChild(o);
        });
        sel.value = st.filtros[i];
        sel.setAttribute("aria-label", "Filtro de suscripción de " + s.nombre);
        sel.addEventListener("change", function () {
          st.filtros[i] = sel.value;
          st.cambiado = true;
          st.enviado = false;
          recibe.textContent = "";
          c.classList.remove("iot-recibe");
          guiar();
        });
        c.appendChild(sel);
        var recibe = el("div", "iot-recibido");
        c.appendChild(recibe);
        colS.appendChild(c);
        return { tarjeta: c, recibe: recibe };
      });
      cont.appendChild(colP);
      cont.appendChild(colB);
      cont.appendChild(colS);
      escena.appendChild(cont);
    }

    function publicar() {
      var entregas = 0;
      v.subs.forEach(function (s, i) {
        var lista = PUBLICADORES.filter(function (p) { return coincide(st.filtros[i], p.topic); });
        entregas += lista.length;
        s.recibe.textContent = "";
        s.recibe.appendChild(el("span", "iot-recibido-tit", lista.length ? "Recibe:" : "No recibe nada."));
        lista.forEach(function (p) { s.recibe.appendChild(el("code", null, p.topic + " " + p.carga)); });
        s.tarjeta.classList.remove("iot-recibe");
        void s.tarjeta.offsetWidth;
        if (lista.length) s.tarjeta.classList.add("iot-recibe");
      });
      v.brokerTxt.textContent = "Ha recibido 3 mensajes y ha hecho " + entregas + " entregas.";
      st.enviado = true;
      guiar();
    }

    // ---------- Guía ----------

    function guiar() {
      var hecho = false;
      var r = st.resultado;
      if (st.paso === 0 || st.paso === 1) hecho = st.terminado;
      if (st.paso === 2) hecho = st.enviado && st.filtros[1] === OBJETIVO_APP;
      if (st.paso === 3) hecho = st.terminado && !r.estropeada;
      if (st.paso === 4) hecho = st.terminado && !r.estropeada && st.cfg.donde === "local";
      siguiente.classList.toggle("bc-listo", hecho);
      guiaTexto.innerHTML = "<strong>Paso " + (st.paso + 1) + ". " + PASOS[st.paso] + ".</strong> " + texto(hecho, r);
    }

    function texto(hecho, r) {
      switch (st.paso) {
        case 0:
          return st.terminado
            ? "El sensor ha medido cada 10 minutos. A las 23:20 se averió el compresor y la temperatura subió hasta estropear la fruta, "
              + "pero nadie se enteró: <strong>medir no sirve de nada si el dato no llega a nadie</strong>. Pulsa <em>Siguiente</em>."
            : "Es de noche en la cámara frigorífica de una cooperativa de cereza. Un sensor mide la temperatura cada 10 minutos. "
              + "Pulsa <em>Simular la noche</em> y mira la gráfica.";
        case 1:
          return st.terminado
            ? "Cada lectura se ha convertido en un mensaje con un <em>topic</em> (la «dirección» del dato) y una carga en JSON, "
              + "que es lo que leería tu código. Aun así, la fruta se ha estropeado: falta alguien que actúe. Pulsa <em>Siguiente</em>."
            : "Ahora verás lo que envía el sensor. En IoT es habitual usar <strong>MQTT</strong>: el sensor <em>publica</em> mensajes "
              + "en un <em>topic</em> y un servidor llamado <em>broker</em> los recibe. Pulsa <em>Simular la noche</em>.";
        case 2:
          if (hecho) {
            return "¡Eso es! Con <code>+</code> la app recibe la temperatura de todas las cámaras, pero no la puerta. "
              + "Fíjate en que los sensores no saben quién los escucha: puedes añadir suscriptores sin tocarlos. Pulsa <em>Siguiente</em>.";
          }
          return "Los sensores no envían los datos a una app concreta: los publican en el broker, y cada suscriptor indica qué topics "
            + "quiere con un filtro. <code>+</code> sustituye a un nivel y <code>#</code> a todo lo que sigue. "
            + "<strong>Reto:</strong> haz que la app móvil reciba la temperatura de las dos cámaras, pero no el sensor de puerta, "
            + "y pulsa <em>Publicar</em>." + (st.enviado ? " Todavía no: mira qué recibe la app." : "");
        case 3:
          if (!st.terminado) {
            return "Ahora hay una regla en la nube: «si la temperatura supera el umbral, enciende el compresor de reserva y avisa al móvil». "
              + "El umbral empieza en 7 °C. Simula la noche y, si la fruta se estropea, baja el umbral y repite.";
          }
          return r.estropeada
            ? "La fruta se ha estropeado: el umbral es demasiado alto y, cuando la regla actúa, ya es tarde. Baja el umbral y repite."
            : "La fruta se ha salvado: la regla actúa antes de llegar a " + LIMITE + " °C. Un umbral demasiado bajo, en cambio, "
              + "encendería el compresor de reserva por cualquier variación. Pulsa <em>Siguiente</em>.";
        case 4:
          if (!st.terminado) {
            return "Esta noche, además, una tormenta corta Internet a las 22:50. La regla está bien ajustada. Elige dónde se ejecuta, "
              + "<strong>en la nube</strong> o <strong>en la pasarela</strong> de la cooperativa, y simula la noche. Prueba las dos opciones.";
          }
          if (st.cfg.donde === "nube") {
            return "Sin conexión, el dato no llega a la nube y la regla no se ejecuta: la fruta se estropea aunque la regla fuera correcta. "
              + "Prueba ahora con la regla en la pasarela.";
          }
          return "Con la regla en la pasarela, la decisión se toma en local y la fruta se salva. El aviso al móvil espera a que vuelva "
            + "la conexión. <strong>Lo crítico se decide cerca del dispositivo</strong>; es la idea del <em>edge computing</em>, que verás en la UT3.";
        default:
          return "Combina umbral, ubicación de la regla, avería y corte de Internet, y simula tantas noches como quieras.";
      }
    }

    irA(0);
  }

  function arrancar() {
    document.querySelectorAll(".iot-sim").forEach(iniciar);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", arrancar);
  } else {
    arrancar();
  }
})();
