/*
 * Simulador «Entrena un filtro de spam» para la página 2.5 de los apuntes DASP.
 * Elaboración propia. Un modelo muy sencillo aprende puntos por palabra a partir
 * de mensajes etiquetados. Solo actúa si la página contiene .ia-sim.
 *
 * Pasos: 0 enséñale, 1 ponlo a prueba, 2 el sesgo heredado, 3 corrígelo.
 * Los mensajes, la empresa y las cifras son inventados.
 */
(function () {
  "use strict";

  var PASOS = ["Enséñale", "Ponlo a prueba", "El sesgo heredado", "Corrígelo"];

  // Palabras tan comunes que no se tienen en cuenta.
  var VACIAS = ["para", "con", "que", "los", "las", "del", "una", "uno", "por", "tus", "sus",
    "este", "esta", "esto", "has", "hay", "les", "nos", "más", "muy"];

  // Paso 0: el alumnado etiqueta estos mensajes. «spam» es la etiqueta esperada.
  var ENTRENO = [
    { texto: "Has ganado un premio: reclama tu regalo gratis", spam: true },
    { texto: "Mañana cambiamos la hora de la reunión del proyecto", spam: false },
    { texto: "Oferta exclusiva: un móvil gratis si pulsas hoy", spam: true },
    { texto: "Te envío el informe del examen de Bases de Datos", spam: false },
    { texto: "Último aviso: tu premio caduca hoy, pulsa aquí", spam: true },
    { texto: "¿Quedamos el jueves para revisar el proyecto?", spam: false },
    { texto: "Gana dinero desde casa con esta oferta", spam: true },
    { texto: "Recuerda entregar la práctica antes del viernes", spam: false }
  ];

  // Paso 1: mensajes nuevos que el filtro no ha visto.
  var PRUEBA = [
    { de: "promo@ofertas-ya.example", texto: "Premio gratis para ti, pulsa hoy", spam: true },
    { de: "Lucía (compañera de clase)", texto: "Revisamos el proyecto mañana a primera hora", spam: false },
    { de: "Secretaría del centro", texto: "Entrada gratis a la charla de empresas del viernes", spam: false,
      aviso: "El filtro no entiende que es un aviso de tu centro: solo ve la palabra «gratis», que en tus ejemplos siempre era spam." },
    { de: "envios@paqueteria-rapida.example", texto: "Tu paquete está retenido: confirma el pago", spam: true,
      aviso: "Ninguna de estas palabras estaba en tus ejemplos, así que suma 0 y el filtro lo deja pasar. No avisa de que no sabe." }
  ];

  // Pasos 2 y 3: la libreta de una empresa inventada.
  var EMPRESA = {
    the: 7, you: 6, free: 6, your: 5, win: 5, offer: 5, click: 5, "for": 4, now: 4, money: 4, please: 3, hello: 3,
    proyecto: -5, factura: -5, "reunión": -4, pedido: -4, gracias: -4, informe: -4, hola: -3, adjunto: -3
  };
  var VARIADA = {
    free: 6, win: 5, offer: 5, click: 5, premio: 5, gratis: 5, money: 4, regalo: 4, reclama: 3, ganado: 3,
    proyecto: -5, factura: -5, invoice: -4, order: -4, "reunión": -4, pedido: -4, gracias: -4, informe: -4,
    thank: -3, hola: -3, adjunto: -3
  };
  var BORRABLES = ["the", "you", "please"];
  var BANDEJA = [
    { de: "Cliente de Irlanda", texto: "Hello, please send the invoice for order 1043. Thank you", spam: false },
    { de: "premios@sorteo-2026.example", texto: "Has ganado un premio: reclama tu regalo gratis hoy", spam: true },
    { de: "Proveedor de Mérida", texto: "Hola, te adjunto la factura del pedido. Gracias", spam: false }
  ];

  // ---------- Modelo ----------

  function clave(palabra) {
    return palabra.toLowerCase().replace(/[^a-z0-9áéíóúüñ]/g, "");
  }

  function cuenta(c) {
    return c.length >= 3 && VACIAS.indexOf(c) < 0 && !/^[0-9]+$/.test(c);
  }

  function palabras(texto) {
    return texto.split(/\s+/).map(clave).filter(cuenta);
  }

  // Cada palabra de un mensaje de spam suma 1 punto; de uno normal, resta 1.
  function entrenar(etiquetados) {
    var libreta = {};
    etiquetados.forEach(function (m) {
      palabras(m.texto).forEach(function (p) {
        libreta[p] = (libreta[p] || 0) + (m.etiqueta ? 1 : -1);
      });
    });
    return libreta;
  }

  function puntuar(libreta, texto) {
    return palabras(texto).reduce(function (s, p) { return s + (libreta[p] || 0); }, 0);
  }

  // ---------- Utilidades de DOM ----------

  function el(tag, clase, texto) {
    var e = document.createElement(tag);
    if (clase) e.className = clase;
    if (texto !== undefined) e.textContent = texto;
    return e;
  }

  function boton(texto, clase) {
    var b = el("button", "md-button" + (clase ? " " + clase : ""), texto);
    b.type = "button";
    return b;
  }

  function signo(n) { return (n > 0 ? "+" : n < 0 ? "−" : "") + Math.abs(n); }

  function etiquetaPal(palabra, puntos) {
    var s = el("span", "ia-pal " + (puntos > 0 ? "ia-pal-spam" : "ia-pal-ok"), palabra);
    s.appendChild(el("sup", null, signo(puntos)));
    return s;
  }

  // Pinta el texto de un mensaje marcando las palabras que el filtro conoce.
  function textoMarcado(libreta, texto) {
    var p = el("p", "ia-texto");
    texto.split(/(\s+)/).forEach(function (trozo) {
      var c = clave(trozo);
      var puntos = cuenta(c) ? (libreta[c] || 0) : 0;
      p.appendChild(puntos ? etiquetaPal(trozo, puntos) : document.createTextNode(trozo));
    });
    return p;
  }

  function acierta(libreta, m) { return (puntuar(libreta, m.texto) > 0) === m.spam; }

  function tarjeta(libreta, m) {
    var t = el("div", "ia-correo");
    t.appendChild(el("div", "ia-de", "De: " + m.de));
    t.appendChild(textoMarcado(libreta, m.texto));
    var puntos = puntuar(libreta, m.texto);
    t.appendChild(el("p", "ia-resultado " + (puntos > 0 ? "iot-mal" : "iot-ok"),
      "Suma " + signo(puntos) + " → " + (puntos > 0 ? "🚫 Va a spam" : "📥 Va a la bandeja de entrada")));
    var ok = acierta(libreta, m);
    t.appendChild(el("p", "ia-verdad " + (ok ? "iot-ok" : "iot-mal"),
      (ok ? "✔ Acierta" : "✘ Se equivoca") + ": en realidad " + (m.spam ? "es spam." : "es un mensaje normal.")));
    t.classList.add(ok ? "ia-correo-ok" : "ia-correo-mal");
    return t;
  }

  function pintarLibreta(cont, libreta, titulo, nota) {
    cont.appendChild(el("div", "iot-sub", titulo));
    var lista = Object.keys(libreta).filter(function (p) { return libreta[p] !== 0; })
      .sort(function (a, b) { return libreta[b] - libreta[a] || a.localeCompare(b); });
    if (!lista.length) {
      cont.appendChild(el("p", "cpg-nota", "Todavía está vacía: el filtro no sabe nada."));
    } else {
      var caja = el("div", "ia-libreta");
      lista.forEach(function (p) { caja.appendChild(etiquetaPal(p, libreta[p])); });
      cont.appendChild(caja);
    }
    if (nota) cont.appendChild(el("p", "cpg-nota", nota));
  }

  // ---------- Simulador ----------

  function iniciar(raiz) {
    raiz.textContent = "";
    var st = { paso: 0, etiquetados: [] };
    var v = {};

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

    // Si el alumnado salta al paso 2 sin etiquetar, se completan las etiquetas esperadas.
    function etiquetadosCompletos() {
      return ENTRENO.map(function (m, i) {
        return st.etiquetados[i] || { texto: m.texto, etiqueta: m.spam };
      });
    }

    function libretaEmpresa() {
      var base = st.paso === 3 && st.variada ? VARIADA : EMPRESA, l = {};
      Object.keys(base).forEach(function (p) {
        if (!(st.paso === 3 && st.borradas[p])) l[p] = base[p];
      });
      return l;
    }

    function irA(n, reiniciar) {
      st.paso = Math.max(0, Math.min(PASOS.length - 1, n));
      if (st.paso === 0 && reiniciar) st.etiquetados = [];
      st.visto = 0;
      st.todos = false;
      st.abierta = false;
      st.error = null;
      st.borradas = {};
      st.variada = false;
      st.tocado = false;
      construir();
      actualizar();
    }

    function construir() {
      escena.textContent = "";
      v = {};
      botonesPaso.forEach(function (b, n) { b.classList.toggle("bc-activo", n === st.paso); });
      anterior.disabled = st.paso === 0;
      siguiente.style.display = st.paso === PASOS.length - 1 ? "none" : "";

      var c = el("div", "iot-controles");
      if (st.paso === 1) {
        v.nuevo = boton("Llega un mensaje nuevo", "md-button--primary");
        v.nuevo.addEventListener("click", function () {
          st.visto = st.visto % PRUEBA.length + 1;
          if (st.visto === PRUEBA.length) st.todos = true;
          actualizar();
        });
        c.appendChild(v.nuevo);
      }
      if (st.paso === 2) {
        var abrir = boton("Abrir la bandeja de entrada", "md-button--primary");
        abrir.addEventListener("click", function () { st.abierta = true; actualizar(); });
        c.appendChild(abrir);
      }
      if (st.paso === 3) {
        BORRABLES.forEach(function (p) {
          var lab = el("label", "iot-control");
          var ch = el("input");
          ch.type = "checkbox";
          ch.addEventListener("change", function () { st.borradas[p] = ch.checked; st.tocado = true; actualizar(); });
          lab.appendChild(ch);
          lab.appendChild(document.createTextNode(" Borrar «" + p + "»"));
          c.appendChild(lab);
        });
        var labV = el("label", "iot-control");
        var chV = el("input");
        chV.type = "checkbox";
        chV.addEventListener("change", function () { st.variada = chV.checked; st.tocado = true; actualizar(); });
        labV.appendChild(chV);
        labV.appendChild(document.createTextNode(" Reentrenar con ejemplos variados: spam en español y correos normales en inglés"));
        c.appendChild(labV);
      }
      if (c.childNodes.length) escena.appendChild(c);

      var cuerpo = el("div", "iot-cuerpo");
      v.zona = el("div", "ia-zona");
      v.panel = el("div", "iot-planta ia-panel");
      cuerpo.appendChild(v.zona);
      cuerpo.appendChild(v.panel);
      escena.appendChild(cuerpo);
    }

    function etiquetar(spam) {
      var m = ENTRENO[st.etiquetados.length];
      st.etiquetados.push({ texto: m.texto, etiqueta: spam });
      st.error = spam !== m.spam ? m : null;
      actualizar();
    }

    function actualizar() {
      v.zona.textContent = "";
      v.panel.textContent = "";
      var hecho = false;

      if (st.paso === 0) {
        var n = st.etiquetados.length;
        if (n < ENTRENO.length) {
          var t = el("div", "ia-correo");
          t.appendChild(el("div", "ia-de", "Mensaje " + (n + 1) + " de " + ENTRENO.length));
          t.appendChild(el("p", "ia-texto", ENTRENO[n].texto));
          var b = el("div", "iot-controles");
          var bs = boton("🚫 Es spam"), bn = boton("📥 Es normal");
          bs.addEventListener("click", function () { etiquetar(true); });
          bn.addEventListener("click", function () { etiquetar(false); });
          b.appendChild(bs);
          b.appendChild(bn);
          t.appendChild(b);
          v.zona.appendChild(t);
        } else {
          v.zona.appendChild(el("p", "ia-resultado iot-ok", "✔ Has etiquetado los " + ENTRENO.length + " mensajes."));
        }
        if (st.error) {
          v.zona.appendChild(el("p", "ia-aviso", "Has marcado como " + (st.error.spam ? "normal" : "spam")
            + " «" + st.error.texto + "». El filtro aprende lo que tú le enseñas, aunque sea un error."));
        }
        pintarLibreta(v.panel, entrenar(st.etiquetados), "La libreta del filtro",
          "Cada palabra de un mensaje de spam suma 1 punto; de uno normal, resta 1.");
        hecho = n === ENTRENO.length;
      }

      if (st.paso === 1) {
        var lib = entrenar(etiquetadosCompletos());
        if (st.visto) {
          var m = PRUEBA[st.visto - 1];
          v.zona.appendChild(el("div", "ia-de", "Mensaje " + st.visto + " de " + PRUEBA.length));
          v.zona.appendChild(tarjeta(lib, m));
          if (m.aviso && !acierta(lib, m)) v.zona.appendChild(el("p", "ia-aviso", m.aviso));
        } else {
          v.zona.appendChild(el("p", "cpg-nota", "Pulsa «Llega un mensaje nuevo»."));
        }
        v.nuevo.textContent = st.visto === PRUEBA.length ? "Volver al primer mensaje" : "Llega un mensaje nuevo";
        pintarLibreta(v.panel, lib, "Tu libreta", "Un mensaje va a spam si sus palabras suman más de 0.");
        hecho = st.todos;
      }

      if (st.paso >= 2) {
        var libE = libretaEmpresa();
        if (st.paso === 2 && !st.abierta) {
          v.zona.appendChild(el("p", "cpg-nota", "Pulsa «Abrir la bandeja de entrada» para ver cómo trata el filtro tres mensajes que recibe la empresa."));
        } else {
          BANDEJA.forEach(function (msg) { v.zona.appendChild(tarjeta(libE, msg)); });
        }
        pintarLibreta(v.panel, libE, "La libreta de la empresa",
          st.paso === 3 && st.variada
            ? "Reentrenada con 400 mensajes variados: spam y correos normales en los dos idiomas."
            : "Entrenada con 400 mensajes antiguos: todo el spam estaba en inglés y todos los normales, en español.");
        var todosBien = BANDEJA.every(function (msg) { return acierta(libE, msg); });
        hecho = st.paso === 2 ? st.abierta : (st.tocado && todosBien);
      }

      siguiente.classList.toggle("bc-listo", hecho);
      guiaTexto.innerHTML = "<strong>Paso " + (st.paso + 1) + ". " + PASOS[st.paso] + ".</strong> " + texto(hecho);
    }

    function texto(hecho) {
      switch (st.paso) {
        case 0:
          return hecho
            ? "Tu filtro ya tiene una libreta de palabras: «gratis» y «premio» suman, «proyecto» resta. Nadie ha escrito una regla: "
              + "<strong>las ha sacado de tus ejemplos</strong>. Eso es entrenar. Pulsa <em>Siguiente</em>."
            : "Vas a enseñar a un filtro de correo. Lee cada mensaje y dile si es <strong>spam</strong> o un mensaje <strong>normal</strong>. "
              + "Mira cómo se llena la libreta de la derecha con cada respuesta.";
        case 1:
          return hecho
            ? "El filtro acierta con los mensajes parecidos a tus ejemplos, pero falla con la charla del centro y con el paquete. "
              + "No entiende lo que lee: <strong>suma puntos de palabras</strong>. Y con lo que no ha visto nunca decide igual, "
              + "sin avisar. Pulsa <em>Siguiente</em>."
            : "Llegan mensajes que el filtro no ha visto. Las palabras que conoce aparecen marcadas con sus puntos. "
              + "Pulsa el botón hasta ver los 4 mensajes y fíjate en cuándo se equivoca.";
        case 2:
          return hecho
            ? "El filtro de la empresa bloquea el pedido de un cliente solo por estar en inglés y deja pasar el spam en español. "
              + "Nadie lo programó así: <strong>lo aprendió de unos datos desequilibrados</strong>. Es lo mismo que le pasó a Amazon "
              + "con la palabra <em>women's</em>. Pulsa <em>Siguiente</em>."
            : "Ahora usas el filtro de una empresa inventada. Mira su libreta: ¿qué palabras puntúan como spam? "
              + "Después abre la bandeja de entrada.";
        default:
          if (!st.tocado) {
            return "Toca arreglarlo. Prueba primero a <strong>borrar palabras</strong> de la libreta, una a una, y mira qué pasa con el cliente. "
              + "Después prueba a reentrenar.";
          }
          if (hecho) {
            return "Con ejemplos variados, el filtro aprende palabras que de verdad delatan el spam, como «free» o «premio», y deja de castigar "
              + "el inglés. La lección: <strong>el arreglo sólido está en los datos</strong>, no en tapar palabras sueltas. "
              + "Y siempre hay que comprobar el resultado con mensajes de los dos grupos.";
          }
          if (!st.variada) {
            return "Al borrar una palabra, otras como «hello» o «for» siguen sumando, y el spam en español sigue entrando porque el filtro "
              + "nunca vio uno. <strong>Borrar palabras no enseña nada nuevo.</strong> Prueba a reentrenar.";
          }
          return "Todavía falla algún mensaje. Revisa las opciones.";
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
