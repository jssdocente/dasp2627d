/*
 * Simulador de blockchain por pasos para la página 2.6 de los apuntes DASP.
 * Elaboración propia. Usa SHA-256 real (Web Crypto) y una prueba de trabajo
 * sencilla: el hash de cada bloque debe empezar por DIF.
 * Solo actúa si la página contiene un elemento .bc-sim.
 *
 * Pasos: 0 huella, 1 un bloque, 2 la cadena, 3 minar, 4 las copias,
 * 5 la trampa, 6 modo libre. Se puede saltar de paso libremente; el botón
 * Siguiente se resalta cuando el alumno ha hecho la acción del paso.
 */
(function () {
  "use strict";

  var DIF = "000";
  var CERO = "0".repeat(64);
  var HUELLA_INICIAL = "Lote 17: 480 kg de mango";
  var DATOS = [
    "Bloque inicial de la cadena",
    "Finca → Cooperativa: 500 kg de mango, lote 17",
    "Cooperativa → Transportista: 480 kg, lote 17",
    "Transportista → Supermercado: 480 kg, lote 17"
  ];
  var PASOS = ["La huella", "Un bloque", "La cadena", "Minar", "Las copias", "La trampa", "Modo libre"];

  async function sha256(texto) {
    var buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
    return Array.from(new Uint8Array(buf))
      .map(function (b) { return b.toString(16).padStart(2, "0"); })
      .join("");
  }

  function contenido(b) {
    return b.numero + "|" + b.anterior + "|" + b.datos + "|" + b.nonce;
  }

  async function minarBloque(b, alAvanzar) {
    b.nonce = 0;
    for (;;) {
      var h = await sha256(contenido(b));
      if (h.startsWith(DIF)) { b.hash = h; return; }
      b.nonce++;
      if (alAvanzar && b.nonce % 200 === 0) alAvanzar(b.nonce);
    }
  }

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

  function corto(h) {
    return h.slice(0, 16) + "…";
  }

  function copiar(cadena) {
    return cadena.map(function (b) { return Object.assign({}, b); });
  }

  async function iniciar(raiz) {
    raiz.textContent = "";
    var aviso = el("p", "bc-guia-texto", "Preparando la cadena…");
    raiz.appendChild(aviso);

    var original = [];
    for (var i = 0; i < DATOS.length; i++) {
      var nb = { numero: i + 1, anterior: i === 0 ? CERO : original[i - 1].hash, datos: DATOS[i], nonce: 0, hash: "" };
      await minarBloque(nb);
      original.push(nb);
    }
    var huellaOriginal = await sha256(HUELLA_INICIAL);
    raiz.removeChild(aviso);

    var st = { paso: 0, cadena: copiar(original), tocado: false, repartido: false, huella: HUELLA_INICIAL };
    var v = {};

    // Esqueleto: barra de pasos, guía, escena y navegación.
    var barra = el("div", "bc-pasos");
    var botonesPaso = PASOS.map(function (nombre, n) {
      var b = boton((n < 6 ? (n + 1) + ". " : "") + nombre, "bc-paso");
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
    var reiniciar = boton("Repetir este paso");
    nav.appendChild(anterior);
    nav.appendChild(siguiente);
    nav.appendChild(reiniciar);
    [barra, guia, escena, nav].forEach(function (e) { raiz.appendChild(e); });

    anterior.addEventListener("click", function () { irA(st.paso - 1); });
    siguiente.addEventListener("click", function () { irA(st.paso + 1); });
    reiniciar.addEventListener("click", function () { irA(st.paso); });

    var cola = Promise.resolve();
    function actualizar() {
      cola = cola.then(pintar).catch(function (e) { console.error(e); });
      return cola;
    }

    function irA(n) {
      st.paso = Math.max(0, Math.min(PASOS.length - 1, n));
      st.cadena = copiar(original);
      st.tocado = false;
      st.repartido = false;
      st.huella = HUELLA_INICIAL;
      construir();
      actualizar();
    }

    // ---------- Construcción de cada escena ----------

    function construir() {
      escena.textContent = "";
      v = {};
      botonesPaso.forEach(function (b, n) { b.classList.toggle("bc-activo", n === st.paso); });
      anterior.disabled = st.paso === 0;
      siguiente.style.display = st.paso === PASOS.length - 1 ? "none" : "";
      switch (st.paso) {
        case 0: construirHuella(); break;
        case 1: construirCadena({ n: 1, editable: false, nonce: false, accion: null }); break;
        case 2: construirCadena({ n: 4, editable: true, nonce: false, accion: "enlace" }); break;
        case 3: construirCadena({ n: 4, editable: true, nonce: true, accion: "minar" }); break;
        case 4: construirReparto(); break;
        default:
          construirFalsear();
          escena.appendChild(el("div", "bc-copia-titulo", "Copia de la Empresa A: la tuya, puedes modificarla"));
          construirCadena({ n: 4, editable: true, nonce: true, accion: "minar" });
          construirOtras();
          v.red = el("div", "bc-red");
          escena.appendChild(v.red);
      }
    }

    function construirHuella() {
      var caja = el("div", "bc-huella");
      caja.appendChild(el("label", "bc-etiqueta", "Texto (puedes escribir aquí)"));
      var texto = el("input", "bc-datos");
      texto.type = "text";
      texto.value = st.huella;
      texto.setAttribute("aria-label", "Texto del que se calcula la huella");
      texto.addEventListener("input", function () { st.huella = texto.value; actualizar(); });
      caja.appendChild(texto);
      caja.appendChild(el("span", "bc-etiqueta", "Huella del texto original"));
      caja.appendChild(el("code", "bc-hash bc-hash-largo", huellaOriginal));
      caja.appendChild(el("span", "bc-etiqueta", "Huella del texto actual (en rojo, los caracteres que han cambiado)"));
      v.huella = el("code", "bc-hash bc-hash-largo");
      caja.appendChild(v.huella);
      v.cuenta = el("div", "bc-sello");
      caja.appendChild(v.cuenta);
      escena.appendChild(caja);
    }

    function construirCadena(op) {
      var fila = el("div", "bc-cadena");
      v.tarjetas = [];
      v.op = op;
      for (var i = 0; i < op.n; i++) {
        v.tarjetas.push(crearTarjeta(i, op, fila));
        if (i < op.n - 1) fila.appendChild(el("div", "bc-flecha", "→"));
      }
      escena.appendChild(fila);
    }

    function crearTarjeta(i, op, fila) {
      var b = st.cadena[i];
      var t = { tarjeta: el("div", "bc-bloque") };
      t.tarjeta.appendChild(el("div", "bc-titulo", "Bloque " + b.numero));

      t.tarjeta.appendChild(el("label", "bc-etiqueta", op.editable ? "Datos (puedes escribir aquí)" : "Datos"));
      t.datos = el("textarea", "bc-datos");
      t.datos.rows = 3;
      t.datos.value = b.datos;
      t.datos.readOnly = !op.editable;
      t.datos.setAttribute("aria-label", "Datos del bloque " + b.numero);
      t.datos.addEventListener("input", function () {
        b.datos = t.datos.value;
        st.tocado = true;
        actualizar();
      });
      t.tarjeta.appendChild(t.datos);

      t.tarjeta.appendChild(el("span", "bc-etiqueta bc-et-anterior", "Hash anterior"));
      t.anterior = el("code", "bc-hash bc-campo-anterior");
      t.tarjeta.appendChild(t.anterior);

      if (op.nonce) {
        t.tarjeta.appendChild(el("span", "bc-etiqueta", "Nonce (número de prueba)"));
        t.nonce = el("code", "bc-hash");
        t.tarjeta.appendChild(t.nonce);
      }

      t.tarjeta.appendChild(el("span", "bc-etiqueta", "Hash de este bloque (su huella)"));
      t.hash = el("code", "bc-hash");
      t.tarjeta.appendChild(t.hash);

      t.estado = el("div", "bc-sello");
      t.tarjeta.appendChild(t.estado);

      if (op.accion === "enlace" && i > 0) {
        t.boton = boton("Actualizar «hash anterior»", "bc-accion");
        t.boton.addEventListener("click", function () {
          b.anterior = st.cadena[i - 1].hash;
          actualizar();
        });
      } else if (op.accion === "minar") {
        t.boton = boton("Minar", "bc-accion");
        t.boton.addEventListener("click", async function () {
          t.boton.disabled = true;
          if (i > 0) b.anterior = st.cadena[i - 1].hash;
          await minarBloque(b, function (n) { if (t.nonce) t.nonce.textContent = n + " intentos…"; });
          actualizar();
        });
      }
      if (t.boton) t.tarjeta.appendChild(t.boton);

      fila.appendChild(t.tarjeta);
      return t;
    }

    function miniBloque(b, clase) {
      var mini = el("div", "bc-mini" + (clase ? " " + clase : ""));
      mini.appendChild(el("span", "bc-mini-num", "Bloque " + b.numero));
      mini.appendChild(el("span", "bc-mini-datos", b.datos));
      mini.appendChild(el("code", "bc-hash", b.hash.slice(0, 10) + "…"));
      return mini;
    }

    function construirReparto() {
      var enviar = boton("Enviar el bloque 4 a la red", "md-button--primary bc-accion");
      enviar.disabled = st.repartido;
      enviar.addEventListener("click", function () {
        st.repartido = true;
        construir();
        actualizar();
      });
      escena.appendChild(enviar);
      [["Empresa A", true], ["Empresa B", false], ["Empresa C", false]].forEach(function (e) {
        var fila = el("div", "bc-mini-fila");
        fila.appendChild(el("strong", "bc-mini-nombre", e[0]));
        original.forEach(function (b, i) {
          if (i < 3) {
            fila.appendChild(miniBloque(b));
          } else if (e[1]) {
            fila.appendChild(miniBloque(b, st.repartido ? "" : "bc-nuevo"));
          } else if (st.repartido) {
            fila.appendChild(miniBloque(b, "bc-llega"));
          } else {
            fila.appendChild(el("div", "bc-mini bc-hueco", "Bloque 4: todavía no lo tiene"));
          }
        });
        escena.appendChild(fila);
      });
    }

    function construirFalsear() {
      v.falsear = boton("Falsear el bloque 3 (480 → 450 kg)", "md-button--primary bc-accion");
      v.falsear.addEventListener("click", function () {
        var t = v.tarjetas[2];
        t.datos.value = t.datos.value.replace("480", "450");
        st.cadena[2].datos = t.datos.value;
        st.tocado = true;
        actualizar();
      });
      escena.appendChild(v.falsear);
    }

    function construirOtras() {
      escena.appendChild(el("div", "bc-copia-titulo",
        "Copias de las Empresas B y C: están en sus ordenadores y no puedes tocarlas"));
      v.celdas = [];
      ["Empresa B", "Empresa C"].forEach(function (nombre) {
        var fila = el("div", "bc-mini-fila");
        fila.appendChild(el("strong", "bc-mini-nombre", nombre));
        original.forEach(function (b, i) {
          var mini = miniBloque(b);
          fila.appendChild(mini);
          v.celdas.push({ i: i, mini: mini });
        });
        escena.appendChild(fila);
      });
    }

    // ---------- Cálculo y pintado ----------

    function estados() {
      var reglaPow = st.paso >= 3;
      return st.cadena.map(function (b, i) {
        var enlaceOk = i === 0 || b.anterior === st.cadena[i - 1].hash;
        var powOk = b.hash.startsWith(DIF);
        return {
          enlaceOk: enlaceOk,
          powOk: powOk,
          valido: enlaceOk && (!reglaPow || powOk),
          mod: b.datos !== original[i].datos,
          reglaPow: reglaPow
        };
      });
    }

    async function pintar() {
      if (st.paso === 0) {
        var h = await sha256(st.huella);
        v.huella.textContent = "";
        var distintos = 0;
        for (var k = 0; k < h.length; k++) {
          var dif = h[k] !== huellaOriginal[k];
          if (dif) distintos++;
          v.huella.appendChild(el("span", dif ? "bc-dif" : null, h[k]));
        }
        v.cuenta.textContent = distintos + " de 64 caracteres distintos";
        terminar(st.huella !== HUELLA_INICIAL, { distintos: distintos });
        return;
      }

      for (var i = 0; i < st.cadena.length; i++) {
        st.cadena[i].hash = await sha256(contenido(st.cadena[i]));
      }
      var es = estados();
      var primerRoto = es.findIndex(function (e) { return !e.valido; });

      if (v.tarjetas) {
        v.tarjetas.forEach(function (t, i) {
          var b = st.cadena[i];
          var e = es[i];
          t.anterior.textContent = i === 0 ? corto(b.anterior) + " (es el primero)" : corto(b.anterior);
          if (t.nonce) t.nonce.textContent = String(b.nonce);
          t.hash.textContent = corto(b.hash);
          t.tarjeta.classList.toggle("bc-roto", !e.valido);
          t.tarjeta.classList.toggle("bc-mod", e.valido && e.mod && st.paso === 2);
          t.tarjeta.classList.toggle("bc-enlace-roto", !e.enlaceOk);
          if (!e.enlaceOk) {
            t.estado.textContent = "✘ Su «hash anterior» ya no coincide con la huella del bloque " + i;
          } else if (e.reglaPow && !e.powOk) {
            t.estado.textContent = "✘ Su huella no empieza por " + DIF;
          } else if (e.mod && st.paso === 2) {
            t.estado.textContent = "✎ Datos cambiados: ahora tiene otra huella";
          } else {
            t.estado.textContent = "✔ Válido";
          }
          if (t.boton) {
            t.boton.disabled = st.paso === 2 ? e.enlaceOk : e.valido;
            t.boton.classList.toggle("bc-pulso", i === primerRoto);
          }
        });
      }

      var integraA = primerRoto < 0;
      var ultimo = st.cadena[st.cadena.length - 1].hash;
      var coincide = ultimo === original[original.length - 1].hash;

      if (v.red) pintarVotacion(es, coincide, integraA, ultimo);
      if (v.falsear) v.falsear.style.display = st.tocado ? "none" : "";

      var hecho = false;
      if (st.paso === 1) hecho = true;
      if (st.paso === 2 || st.paso === 3) hecho = st.tocado && integraA;
      if (st.paso === 4) hecho = st.repartido;
      if (st.paso >= 5) hecho = integraA && !coincide;
      terminar(hecho, { primerRoto: primerRoto, integraA: integraA });
    }

    function pintarVotacion(es, coincide, integraA, ultimo) {
      var distintos = [];
      st.cadena.forEach(function (b, i) {
        if (b.datos !== original[i].datos || b.hash !== original[i].hash) distintos.push(i);
      });
      v.celdas.forEach(function (c) {
        c.mini.classList.toggle("bc-difiere", distintos.indexOf(c.i) >= 0);
      });
      v.red.textContent = "";
      v.red.appendChild(el("div", "bc-red-titulo", "Votación de la red: cada empresa compara el último hash de su copia"));
      var hashRed = original[original.length - 1].hash;
      [["A (tú)", ultimo, coincide], ["B", hashRed, true], ["C", hashRed, true]].forEach(function (c) {
        var nodo = el("div", "bc-nodo" + (c[2] ? "" : " bc-roto"));
        nodo.appendChild(el("strong", null, "Empresa " + c[0]));
        nodo.appendChild(el("code", "bc-hash", corto(c[1])));
        v.red.appendChild(nodo);
      });
      var veredicto;
      if (coincide) {
        veredicto = "3 de 3 copias coinciden: la red acepta la cadena.";
      } else {
        var nums = distintos.map(function (i) { return i + 1; });
        var lista = nums.length > 1
          ? "los bloques " + nums.slice(0, -1).join(", ") + " y " + nums[nums.length - 1]
          : "el bloque " + nums[0];
        veredicto = "Solo 1 de 3 copias dice lo que tú dices. B y C tienen otra versión de " + lista
          + " (en amarillo). Son mayoría: gana su versión y la tuya se descarta.";
        if (!integraA) veredicto = "Además de estar rota, tu copia no coincide con las demás. " + veredicto;
      }
      v.red.appendChild(el("p", "bc-veredicto" + (coincide ? "" : " bc-mal"), veredicto));
    }

    function terminar(hecho, d) {
      siguiente.classList.toggle("bc-listo", hecho);
      guiaTexto.innerHTML = textoGuia(hecho, d);
    }

    function textoGuia(hecho, d) {
      var t = "<strong>Paso " + (st.paso + 1) + ". " + PASOS[st.paso] + ".</strong> ";
      switch (st.paso) {
        case 0:
          return t + (hecho
            ? "Has cambiado muy poco y han cambiado " + d.distintos + " de los 64 caracteres de la huella. "
              + "A partir de la huella no se puede reconstruir el texto, pero cualquier cambio se nota. Pulsa <em>Siguiente</em>."
            : "Un <em>hash</em> es como la huella dactilar de un texto: un código de 64 caracteres que se calcula a partir de él. "
              + "Cambia una sola letra o un número del texto y fíjate en la huella.");
        case 1:
          return t + "Un bloque es un paquete con unos datos (aquí, un envío de mango) y su huella. "
            + "Además guarda la huella del bloque anterior; como este es el primero, ahí solo hay ceros. "
            + "Pulsa <em>Siguiente</em> para encadenar más bloques.";
        case 2:
          if (!st.tocado) {
            return t + "Cada bloque guarda en «Hash anterior» la huella del bloque de su izquierda: eso es lo que los encadena. "
              + "Cambia algo en los datos del <strong>bloque 2</strong> y mira qué le pasa al bloque 3.";
          }
          return t + (hecho
            ? "Lo has arreglado actualizando los bloques uno a uno, en un momento. Si fuera tan fácil, cualquiera podría "
              + "reescribir la historia. Pulsa <em>Siguiente</em> para ver qué lo impide."
            : "El bloque " + d.primerRoto + " tiene otra huella, así que el bloque " + (d.primerRoto + 1) + " apunta a una huella "
              + "que ya no existe: la cadena se ha roto. Pulsa «Actualizar hash anterior» en el bloque rojo. ¿Qué le pasa al siguiente?");
        case 3:
          if (!st.tocado) {
            return t + "¿Te habías fijado en que todas las huellas empiezan por <code>000</code>? Es una regla de la red: "
              + "un bloque solo vale si su huella empieza así. Para conseguirlo se cambia un número, el <em>nonce</em>, "
              + "y se prueba una y otra vez. Cambia los datos del <strong>bloque 2</strong>.";
          }
          return t + (hecho
            ? "Cada bloque ha costado miles de intentos. Aquí son unos segundos; en las redes reales la dificultad es "
              + "muchísimo mayor y rehacer bloques exige mucho cálculo y energía. Pulsa <em>Siguiente</em>."
            : "Ahora el bloque " + (d.primerRoto + 1) + " no cumple la regla. Pulsa <em>Minar</em> en el bloque rojo de la izquierda, "
              + "mira cuántos intentos necesita y repite con los siguientes.");
        case 4:
          return t + (hecho
            ? "B y C han comprobado el bloque (que su «hash anterior» encaja y que su huella empieza por 000) y lo han "
              + "añadido a su copia. Las tres copias vuelven a ser idénticas. Pulsa <em>Siguiente</em>."
            : "No hay un servidor central: cada empresa guarda su propia copia de la cadena en sus ordenadores. "
              + "La Empresa A acaba de crear el bloque 4. Pulsa «Enviar el bloque 4 a la red».");
        case 5:
          if (!st.tocado) {
            return t + "Eres la Empresa A y quieres rebajar en secreto los kilos entregados. "
              + "Cambia los datos de <strong>tu</strong> copia o pulsa «Falsear el bloque 3».";
          }
          if (!d.integraA) {
            return t + "Tu copia está rota desde el bloque " + (d.primerRoto + 1) + ". "
              + "Mina los bloques rojos, de izquierda a derecha, para tapar la trampa.";
          }
          return t + (hecho
            ? "Tu copia parece correcta, pero B y C nunca vieron tu cambio y siguen guardando el dato original. "
              + "En la votación pierdes 2 a 1 y tu versión se descarta. Para ganar tendrías que controlar más de la mitad de la red."
            : "Tu copia vuelve a coincidir con las demás.");
        default:
          return t + "Todo a la vista: cambia datos, mina, falsea y repite cuantas veces quieras.";
      }
    }

    irA(0);
  }

  function arrancar() {
    var raices = document.querySelectorAll(".bc-sim");
    if (!raices.length) return;
    if (!window.crypto || !crypto.subtle) {
      raices.forEach(function (r) {
        r.textContent = "Tu navegador no permite calcular hashes en esta página. Ábrela con https.";
      });
      return;
    }
    raices.forEach(function (r) { iniciar(r); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", arrancar);
  } else {
    arrancar();
  }
})();
