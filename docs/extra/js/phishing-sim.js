/*
 * Ejercicio «¿Es phishing?» para la página 2.7 de los apuntes DASP.
 * Elaboración propia. Empresa, personas y correos inventados. Los dominios
 * terminan en .example, reservado para ejemplos, para no coincidir con
 * ninguno real. Solo actúa si la página contiene .ph-sim.
 *
 * En el cuerpo, el texto entre {{ y }} es una pista que se resalta al corregir.
 */
(function () {
  "use strict";

  var CORREOS = [
    {
      de: "Mensajería Exprés", dir: "avisos@mensajeria-expres-entregas.example", marcarDir: true,
      asunto: "{{Último aviso}}: tu paquete está retenido",
      cuerpo: "Hola:\n\nTu paquete no se ha podido entregar porque {{faltan 1,99 € de gastos de aduana}}. "
        + "Si no los pagas {{en las próximas 24 horas}}, se devolverá al remitente.",
      enlace: { texto: "Pagar ahora", url: "https://mensajeria-expres.pago-seguro.example/aduanas" }, marcarEnlace: true,
      phishing: true,
      pistas: ["Prisa: «último aviso» y un plazo de 24 horas.", "Pide un pago pequeño para que no lo pienses.",
               "El dominio del remitente y el del enlace no coinciden, y ninguno es el de una empresa que conozcas.",
               "¿Esperabas un paquete del extranjero? Si no, ya es sospechoso."]
    },
    {
      de: "Marta Ruiz", dir: "marta.ruiz@ceramicas-guadiana.example",
      asunto: "Acta de la reunión del jueves",
      cuerpo: "Hola:\n\nComo quedamos en la reunión, te paso el acta para que añadas lo de los pedidos de noviembre. "
        + "Cuando puedas, me dices si falta algo.\n\nUn saludo,\nMarta",
      adjunto: "acta-reunion-jueves.pdf",
      phishing: false,
      pistas: ["Remitente de tu propia empresa y con el dominio correcto.", "Hace referencia a algo que esperabas: la reunión del jueves.",
               "No hay prisa, no pide datos ni dinero, y el adjunto es un PDF normal."]
    },
    {
      de: "Antonio Gil (Gerente)", dir: "antonio.gil.gerente@correo-personal.example", marcarDir: true,
      asunto: "Urgente y confidencial",
      cuerpo: "Necesito que hagas {{una transferencia de 8.400 € a un proveedor nuevo}} antes de las 14:00. "
        + "Es una operación {{confidencial}}, no lo comentes con nadie. {{Estoy en una reunión y no puedo atender llamadas}}, "
        + "así que respóndeme solo por aquí.",
      phishing: true,
      pistas: ["Es el «fraude del CEO»: alguien se hace pasar por la gerencia.", "Escribe desde una cuenta personal, no desde la de la empresa.",
               "Urgencia, secreto y una excusa para que no puedas comprobarlo por teléfono.",
               "Cualquier pago fuera de lo habitual se confirma por otro canal, aunque parezca venir del jefe."]
    },
    {
      de: "Soporte informático", dir: "soporte@ceramicas-guadlana.example", marcarDir: true,
      asunto: "Tu contraseña caduca hoy",
      cuerpo: "Tu contraseña del correo caduca hoy. Para {{mantener la misma contraseña}}, confírmala en el siguiente enlace. "
        + "Si no lo haces, {{tu cuenta se bloqueará}}.",
      enlace: { texto: "Mantener mi contraseña", url: "https://ceramicas-guadlana.example/login" }, marcarEnlace: true,
      phishing: true,
      pistas: ["Fíjate bien: «guadlana» con l, no «guadiana». Es un dominio que imita al de tu empresa.",
               "Pide escribir la contraseña en un enlace.", "Amenaza con bloquear la cuenta para meter prisa.",
               "Informática no necesita que le «confirmes» tu contraseña."]
    },
    {
      de: "Banco Lusitano", dir: "avisos@bancolusitano.example",
      asunto: "Tu extracto de octubre ya está disponible",
      cuerpo: "Hola:\n\nYa puedes consultar el extracto de octubre de la cuenta de tu empresa. "
        + "Por seguridad, en nuestros correos no incluimos enlaces ni te pedimos claves: entra desde la app o la web habitual.",
      phishing: false,
      pistas: ["No hay enlace ni adjunto, y no pide ningún dato.", "Te remite al canal que ya usas, la app o la web habitual.",
               "Aun así, si dudas, entra tú directamente en la web del banco en lugar de usar un correo."]
    },
    {
      de: "Arcillas del Sur · Facturación", dir: "facturacion@arcillasdelsur.example",
      asunto: "Factura pendiente de pago",
      cuerpo: "Buenos días:\n\nAdjuntamos la factura pendiente. Para verla correctamente, {{abre el archivo y pulsa «Habilitar contenido»}}.",
      adjunto: "Factura_0923.pdf.exe", marcarAdjunto: true,
      phishing: true,
      pistas: ["El remitente es un proveedor real de la empresa: su cuenta puede haber sido robada. Un remitente conocido no basta.",
               "El adjunto termina en .exe: es un programa, no un PDF.",
               "Pedir que «habilites contenido» es una forma habitual de ejecutar código malicioso.",
               "Ante la duda, llama al proveedor a su número de siempre."]
    },
    {
      de: "Plataforma de formación", dir: "no-responder@formacion-ceramica.example",
      asunto: "Recordatorio: el curso de prevención de riesgos empieza el lunes",
      cuerpo: "Hola:\n\nTe recordamos que el lunes a las 9:00 empieza el curso de prevención de riesgos al que te inscribió tu empresa. "
        + "Puedes consultar el programa en la plataforma.",
      enlace: { texto: "Ver el programa", url: "https://formacion-ceramica.example/cursos/prevencion" },
      phishing: false,
      pistas: ["Habla de algo que esperabas: un curso en el que ya estás inscrito.",
               "El enlace va al mismo dominio que el remitente.", "Solo informa: no pide contraseñas, pagos ni datos."]
    },
    {
      de: "Administrador del correo", dir: "admin@mail-cuota-buzon.example", marcarDir: true,
      asunto: "Tu buzón está lleno (98 %)",
      cuerpo: "{{Estimado usuario}}:\n\nSu buzón ha alcanzado el 98 % de su capacidad y {{dejará de recibir mensajes}}. "
        + "Para ampliar el espacio gratis, {{inicie sesión con su usuario y contraseña}}.",
      enlace: { texto: "Ampliar espacio", url: "https://mail-cuota-buzon.example/ampliar" }, marcarEnlace: true,
      phishing: true,
      pistas: ["Saludo genérico: no sabe ni cómo te llamas.", "Un dominio que no es el de tu empresa ni el de tu proveedor de correo.",
               "Amenaza con dejar de recibir mensajes y pide usuario y contraseña."]
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

  // Convierte «texto {{pista}} texto» en nodos, con las pistas en <span class="ph-pista">.
  function conPistas(destino, texto) {
    texto.split(/(\{\{.*?\}\})/).forEach(function (trozo) {
      if (trozo.indexOf("{{") === 0) {
        destino.appendChild(el("span", "ph-pista", trozo.slice(2, -2)));
      } else if (trozo) {
        destino.appendChild(document.createTextNode(trozo));
      }
    });
  }

  function iniciar(raiz) {
    raiz.textContent = "";
    var n = 0, aciertos = 0;
    var marcador = el("div", "cpg-progreso");
    var zona = el("div", "ph-zona");
    raiz.appendChild(marcador);
    raiz.appendChild(zona);

    function pintar() {
      zona.textContent = "";
      if (n >= CORREOS.length) { final(); return; }
      marcador.textContent = "Correo " + (n + 1) + " de " + CORREOS.length + " · " + aciertos + " aciertos";
      var c = CORREOS[n];

      var correo = el("div", "ph-correo");
      var cab = el("div", "ph-cabecera");
      var de = el("div");
      de.appendChild(el("span", "ph-campo", "De: "));
      de.appendChild(el("strong", null, c.de + " "));
      de.appendChild(el("span", "ph-dir" + (c.marcarDir ? " ph-pista-cab" : ""), "<" + c.dir + ">"));
      cab.appendChild(de);
      var as = el("div");
      as.appendChild(el("span", "ph-campo", "Asunto: "));
      var asu = el("strong");
      conPistas(asu, c.asunto);
      as.appendChild(asu);
      cab.appendChild(as);
      correo.appendChild(cab);

      var cuerpo = el("div", "ph-cuerpo");
      c.cuerpo.split("\n").forEach(function (lin, i) {
        if (i) cuerpo.appendChild(el("br"));
        conPistas(cuerpo, lin);
      });
      correo.appendChild(cuerpo);

      if (c.enlace) {
        var en = el("div", "ph-enlace");
        en.appendChild(el("span", "ph-boton-falso", c.enlace.texto));
        var ver = boton("¿Adónde lleva?", "ph-ver");
        var url = el("code", "ph-url" + (c.marcarEnlace ? " ph-pista-cab" : ""), c.enlace.url);
        url.hidden = true;
        ver.addEventListener("click", function () { url.hidden = false; ver.style.display = "none"; });
        en.appendChild(ver);
        en.appendChild(url);
        correo.appendChild(en);
        correo.urlNodo = url;
        correo.verNodo = ver;
      }
      if (c.adjunto) {
        correo.appendChild(el("div", "ph-adjunto" + (c.marcarAdjunto ? " ph-pista-cab" : ""), "📎 " + c.adjunto));
      }
      zona.appendChild(correo);

      var botones = el("div", "cpg-selector");
      var res = el("div", "cpg-resultado");
      res.setAttribute("aria-live", "polite");
      [[false, "Es legítimo"], [true, "Es phishing"]].forEach(function (op) {
        var b = boton(op[1], "cpg-opcion");
        b.addEventListener("click", function () {
          if (b.disabled) return;
          responder(c, op[0], b, botones, res, correo);
        });
        botones.appendChild(b);
      });
      zona.appendChild(botones);
      zona.appendChild(res);
    }

    function responder(c, dice, b, botones, res, correo) {
      var bien = dice === c.phishing;
      if (bien) aciertos++;
      Array.prototype.forEach.call(botones.children, function (o) { o.disabled = true; });
      b.classList.add(bien ? "cpg-bien" : "cpg-mal");
      correo.classList.add("ph-revelado");
      if (correo.urlNodo) { correo.urlNodo.hidden = false; correo.verNodo.style.display = "none"; }
      res.className = "cpg-resultado " + (bien ? "cpg-r-bien" : "cpg-r-mal");
      res.appendChild(el("p", "cpg-veredicto",
        (bien ? "✔ Correcto: " : "✘ No: ") + (c.phishing ? "es phishing." : "es un correo legítimo.")));
      var ul = el("ul");
      c.pistas.forEach(function (p) { ul.appendChild(el("li", null, p)); });
      res.appendChild(ul);
      if (c.phishing) res.appendChild(el("p", "cpg-nota", "Lo resaltado en amarillo son las señales de alarma."));
      var sig = boton(n + 1 < CORREOS.length ? "Siguiente correo →" : "Ver resultado", "md-button--primary");
      sig.addEventListener("click", function () { n++; pintar(); });
      res.appendChild(sig);
      marcador.textContent = "Correo " + (n + 1) + " de " + CORREOS.length + " · " + aciertos + " aciertos";
    }

    function final() {
      marcador.textContent = "Resultado";
      var r = el("div", "cpg-resultado " + (aciertos >= 7 ? "cpg-r-bien" : aciertos >= 5 ? "cpg-r-vale" : "cpg-r-mal"));
      r.appendChild(el("p", "cpg-veredicto", "Has acertado " + aciertos + " de " + CORREOS.length + "."));
      r.appendChild(el("p", null, "Las señales que más se repiten:"));
      var ul = el("ul");
      ["Prisa o amenazas: «último aviso», «se bloqueará», «antes de las 14:00».",
       "Un remitente o un enlace cuyo dominio no encaja, aunque se parezca mucho.",
       "Te pide contraseñas, pagos o «habilitar contenido».",
       "Algo que no esperabas, o una petición fuera de lo habitual.",
       "Un remitente conocido no basta: su cuenta puede estar robada."]
        .forEach(function (t) { ul.appendChild(el("li", null, t)); });
      r.appendChild(ul);
      r.appendChild(el("p", null, "Y si dudas: no pinches, compruébalo por otro canal (teléfono, web habitual) y avisa a informática. "
        + "Avisar de un error propio también ayuda: cuanto antes se sepa, menos daño hace."));
      var otra = boton("Volver a empezar", "md-button--primary");
      otra.addEventListener("click", function () { n = 0; aciertos = 0; pintar(); });
      r.appendChild(otra);
      zona.appendChild(r);
    }

    pintar();
  }

  function arrancar() {
    document.querySelectorAll(".ph-sim").forEach(iniciar);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", arrancar);
  } else {
    arrancar();
  }
})();
