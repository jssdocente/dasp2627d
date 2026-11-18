/*
 * Playground de modelos cloud para la página 2.3 de los apuntes DASP.
 * Elaboración propia. Dos partes: explorar quién gestiona cada capa en
 * on-premise, IaaS, PaaS y SaaS, y elegir el modelo para casos inventados.
 * Solo actúa si la página contiene un elemento .cloud-pg.
 */
(function () {
  "use strict";

  var CAPAS = ["Aplicación", "Datos", "Sistema operativo", "Servidores", "Almacenamiento", "Edificio y energía"];

  var MODELOS = {
    onprem: {
      nombre: "On-premise",
      tuyas: 6,
      resumen: "Todo es tuyo: compras los equipos, los instalas en tu edificio y los mantienes.",
      coche: "Como comprar un coche: lo eliges todo, pero lo pagas de golpe, lo aseguras y lo reparas tú.",
      ventaja: "Control total y sin depender de Internet ni de un proveedor.",
      coste: "Inversión inicial alta y personal técnico propio."
    },
    iaas: {
      nombre: "IaaS",
      tuyas: 3,
      resumen: "El proveedor te alquila máquinas virtuales y almacenamiento; el sistema operativo y lo de encima son cosa tuya.",
      coche: "Como alquilar un coche: no lo compras ni lo reparas, pero conduces, eliges la ruta y pones la gasolina.",
      ventaja: "Flexibilidad: eliges el sistema operativo y lo configuras como quieras.",
      coste: "Sigues instalando parches, copias y seguridad del sistema."
    },
    paas: {
      nombre: "PaaS",
      tuyas: 2,
      resumen: "Subes tu código y la plataforma lo ejecuta; no administras el sistema operativo.",
      coche: "Como un coche con conductor: tú dices adónde vas; conducir y mantenerlo es cosa suya.",
      ventaja: "Te concentras en programar; el escalado y el sistema los gestiona el proveedor.",
      coste: "Menos control y más dependencia de las reglas de esa plataforma."
    },
    saas: {
      nombre: "SaaS",
      tuyas: 1,
      resumen: "Usas una aplicación ya hecha a través del navegador o de una app.",
      coche: "Como un taxi o un autobús: solo te subes; el vehículo y casi siempre la ruta no los eliges tú.",
      ventaja: "Funciona desde el primer día, sin instalar ni mantener nada.",
      coste: "Te adaptas a la aplicación; cambiar de proveedor y sacar tus datos puede costar."
    }
  };
  var ORDEN = ["onprem", "iaas", "paas", "saas"];

  // Casos inventados para practicar; no coinciden con los de la actividad de clase.
  var CASOS = [
    {
      texto: "Una clínica dental de 6 personas quiere gestionar citas y recordatorios por SMS. No tiene informático.",
      mejor: "saas", defendibles: [],
      porque: "Hay programas de gestión de citas listos para usar. Con IaaS o PaaS tendrían que desarrollar y mantener la aplicación, y no tienen a nadie para hacerlo."
    },
    {
      texto: "Has programado el backend de una app móvil en Node.js. Quieres desplegarlo sin parchear servidores y que aguante los picos del fin de semana.",
      mejor: "paas", defendibles: ["iaas"],
      porque: "PaaS ejecuta tu código y escala sin que administres el sistema operativo. IaaS también sirve, pero tendrías que instalar, actualizar y escalar las máquinas tú."
    },
    {
      texto: "Una asesoría usa un programa de contabilidad antiguo que solo funciona en Windows Server con una configuración muy concreta. Quiere dejar de tener el servidor en la oficina.",
      mejor: "iaas", defendibles: [],
      porque: "IaaS te da una máquina virtual en la que controlas el sistema operativo y puedes reproducir esa configuración. PaaS no te deja elegir el sistema, y ese programa no existe como SaaS."
    },
    {
      texto: "Un laboratorio firma un contrato que exige que ciertos datos no salgan de sus instalaciones.",
      mejor: "onprem", defendibles: [],
      porque: "Si el contrato lo impide, la nube pública queda descartada para esos datos. Ojo: el resto de servicios del laboratorio, como el correo, sí podrían ir a la nube."
    },
    {
      texto: "Un equipo de 4 personas necesita GPU potentes durante tres semanas para entrenar un modelo de IA. Después no las volverá a usar.",
      mejor: "iaas", defendibles: ["paas"],
      porque: "Alquilar máquinas con GPU por horas evita comprar un equipo caro que luego quedaría parado. Algunos servicios gestionados de IA, que son PaaS, también encajan."
    },
    {
      texto: "El departamento comercial quiere empezar el lunes con un CRM para registrar clientes y oportunidades de venta.",
      mejor: "saas", defendibles: [],
      porque: "Un CRM en SaaS se contrata y se usa en días. Desarrollar uno propio solo tiene sentido con necesidades muy especiales."
    },
    {
      texto: "Has hecho la web de una tienda con Laravel y código propio, y no quieres administrar Linux.",
      mejor: "paas", defendibles: ["saas"],
      porque: "PaaS despliega tu código y se ocupa del sistema. Si la tienda no necesitara código propio, una plataforma de comercio electrónico en SaaS también sería buena opción."
    },
    {
      texto: "Una empresa tiene un centro de datos propio recién renovado, con personal técnico y una carga de trabajo estable las 24 horas.",
      mejor: "onprem", defendibles: ["iaas"],
      porque: "Con la inversión hecha y una carga estable, mantenerlo puede salir más barato que pagar por uso. La nube encaja mejor cuando la demanda varía o falta personal. Es una decisión de costes, no de moda."
    }
  ];

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

  function tuyasDe(clave) {
    return CAPAS.slice(0, MODELOS[clave].tuyas);
  }

  function lista(capas) {
    if (capas.length === 1) return capas[0].toLowerCase();
    return capas.slice(0, -1).join(", ").toLowerCase() + " y " + capas[capas.length - 1].toLowerCase();
  }

  function iniciar(raiz) {
    raiz.textContent = "";

    // ---------- Parte 1: explorar ----------
    raiz.appendChild(el("div", "cpg-titulo", "1. Explora: ¿quién gestiona cada capa?"));
    var selector = el("div", "cpg-selector");
    raiz.appendChild(selector);
    var cuerpo = el("div", "cpg-cuerpo");
    var pila = el("div", "cpg-pila");
    var info = el("div", "cpg-info");
    cuerpo.appendChild(pila);
    cuerpo.appendChild(info);
    raiz.appendChild(cuerpo);

    var filas = CAPAS.map(function (capa) {
      var f = el("div", "cpg-capa");
      f.appendChild(el("span", "cpg-capa-nombre", capa));
      var quien = el("span", "cpg-quien");
      f.appendChild(quien);
      pila.appendChild(f);
      return { fila: f, quien: quien };
    });

    var botonesModelo = {};
    ORDEN.forEach(function (clave) {
      var b = boton(MODELOS[clave].nombre, "cpg-modelo");
      b.addEventListener("click", function () { mostrar(clave); });
      selector.appendChild(b);
      botonesModelo[clave] = b;
    });

    function mostrar(clave) {
      var m = MODELOS[clave];
      ORDEN.forEach(function (k) { botonesModelo[k].classList.toggle("cpg-activo", k === clave); });
      filas.forEach(function (f, i) {
        var tuya = i < m.tuyas;
        f.fila.classList.toggle("cpg-tuya", tuya);
        f.fila.classList.toggle("cpg-proveedor", !tuya);
        f.quien.textContent = tuya ? "Tu empresa" : "Proveedor";
      });
      info.textContent = "";
      info.appendChild(el("p", "cpg-resumen", m.resumen));
      var dl = el("div", "cpg-datos");
      [["Analogía", m.coche], ["A favor", m.ventaja], ["En contra", m.coste]].forEach(function (par) {
        var p = el("p");
        p.appendChild(el("strong", null, par[0] + ": "));
        p.appendChild(document.createTextNode(par[1]));
        dl.appendChild(p);
      });
      info.appendChild(dl);
    }

    // ---------- Parte 2: elegir ----------
    raiz.appendChild(el("div", "cpg-titulo", "2. Practica: ¿qué modelo elegirías?"));
    var caso = el("div", "cpg-caso");
    raiz.appendChild(caso);

    var n = 0;
    var puntos = 0;
    var respondido = false;

    function pintarCaso() {
      caso.textContent = "";
      respondido = false;
      if (n >= CASOS.length) {
        caso.appendChild(el("p", "cpg-enunciado",
          "Has obtenido " + puntos.toString().replace(".", ",") + " de " + CASOS.length + " puntos."));
        caso.appendChild(el("p", null,
          "Una respuesta defendible vale medio punto. Fíjate en los casos que has fallado: casi siempre la clave está en "
          + "quién mantiene el sistema, cuánto varía la demanda y qué exige la normativa o el contrato."));
        var otra = boton("Volver a empezar", "md-button--primary");
        otra.addEventListener("click", function () { n = 0; puntos = 0; pintarCaso(); });
        caso.appendChild(otra);
        return;
      }
      var c = CASOS[n];
      caso.appendChild(el("div", "cpg-progreso", "Caso " + (n + 1) + " de " + CASOS.length + " · " + puntos.toString().replace(".", ",") + " puntos"));
      caso.appendChild(el("p", "cpg-enunciado", c.texto));
      var opciones = el("div", "cpg-selector");
      var resultado = el("div", "cpg-resultado");
      resultado.setAttribute("aria-live", "polite");
      ORDEN.forEach(function (clave) {
        var b = boton(MODELOS[clave].nombre, "cpg-opcion");
        b.addEventListener("click", function () {
          if (respondido) return;
          respondido = true;
          responder(c, clave, b, opciones, resultado);
        });
        opciones.appendChild(b);
      });
      caso.appendChild(opciones);
      caso.appendChild(resultado);
    }

    function responder(c, clave, b, opciones, resultado) {
      var bien = clave === c.mejor;
      var vale = c.defendibles.indexOf(clave) >= 0;
      puntos += bien ? 1 : (vale ? 0.5 : 0);
      Array.prototype.forEach.call(opciones.children, function (o, i) {
        o.disabled = true;
        var k = ORDEN[i];
        if (k === c.mejor) o.classList.add("cpg-bien");
        else if (c.defendibles.indexOf(k) >= 0) o.classList.add("cpg-vale");
      });
      if (!bien && !vale) b.classList.add("cpg-mal");

      var titulo = bien ? "✔ Buena elección."
        : vale ? "≈ Defendible, aunque hay una opción más ajustada: " + MODELOS[c.mejor].nombre + "."
        : "✘ No es la mejor opción. La más ajustada es " + MODELOS[c.mejor].nombre + ".";
      resultado.className = "cpg-resultado " + (bien ? "cpg-r-bien" : vale ? "cpg-r-vale" : "cpg-r-mal");
      resultado.appendChild(el("p", "cpg-veredicto", titulo));
      resultado.appendChild(el("p", null, c.porque));
      resultado.appendChild(el("p", "cpg-nota",
        "Con " + MODELOS[clave].nombre + ", tu empresa gestionaría: " + lista(tuyasDe(clave)) + ". "
        + "Arriba lo tienes marcado capa a capa."));
      mostrar(clave);

      var sig = boton(n + 1 < CASOS.length ? "Siguiente caso →" : "Ver resultado", "md-button--primary");
      sig.addEventListener("click", function () { n++; pintarCaso(); });
      resultado.appendChild(sig);
    }

    mostrar("onprem");
    pintarCaso();
  }

  function arrancar() {
    document.querySelectorAll(".cloud-pg").forEach(iniciar);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", arrancar);
  } else {
    arrancar();
  }
})();
