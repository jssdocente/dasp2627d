# 2.2 Internet de las Cosas (IoT)

Una cámara, un contador de la luz o un motor de avión tienen algo en común: pueden medir lo que ocurre y comunicarlo sin que nadie los consulte. Eso es el **Internet de las Cosas**: objetos físicos conectados que generan datos y, a veces, actúan.

<figure markdown="span">
  ![Contador eléctrico inteligente instalado en una vivienda](../../imagenes/ut2/iot-contador.jpg){ width="320" }
  <figcaption>Un contador inteligente es un dispositivo IoT cotidiano: mide el consumo y lo transmite sin visitas a domicilio. Foto: RobbieIanMorrison, <a href="https://creativecommons.org/licenses/by/4.0/deed.es">CC BY 4.0</a>, vía <a href="https://commons.wikimedia.org/wiki/File:Logarex_smart_household_electricity_meter_build_year_2023.jpg">Wikimedia Commons</a>.</figcaption>
</figure>

---

## 1. Qué Es, en Tres Ideas

- **Mide el mundo físico:** los sensores convierten temperatura, presencia o vibración en datos.
- **Conecta:** los datos viajan hasta donde pueden usarse, en local o en la nube.
- **Permite actuar:** con esos datos, una persona o un sistema toma una decisión, y un actuador puede ejecutarla.

### El recorrido de un dato

```mermaid
flowchart LR
    S["Sensor<br/>mide"] --> G["Pasarela<br/>reúne y envía"]
    G --> P["Plataforma<br/>guarda y analiza"]
    P --> D{"¿Hay que<br/>actuar?"}
    D -->|Sí| A["Actuador o aviso"]
    D -->|No| H["Histórico"]
    A -.->|Cambia lo que se mide| S
```

Es como el sistema nervioso: los sensores son los sentidos, la red son los nervios, la plataforma es el cerebro y el actuador, los músculos.

### Miniglosario

| Término | Significado |
| :--- | :--- |
| **Sensor** | Dispositivo que mide una magnitud física |
| **Actuador** | Dispositivo que ejecuta una acción física, como abrir una válvula |
| **Pasarela (*gateway*)** | Equipo que conecta los dispositivos con la red o la nube |
| **MQTT** | Protocolo ligero muy usado para enviar datos de dispositivos |
| **Telemetría** | Envío automático de medidas a distancia |

---

## 2. Dos Casos Reales

!!! example "Caso que funciona: motores que se pagan por hora de vuelo"
    - **Sector:** aviación.
    - **Problema:** una avería imprevista en un motor deja un avión en tierra y resulta muy cara.
    - **Decisión:** con [TotalCare](https://www.rolls-royce.com/products-and-services/civil-aerospace/services/totalcare.aspx), Rolls-Royce combina la monitorización de la salud del motor con el mantenimiento predictivo.
    - **Resultado:** la aerolínea [paga por hora de vuelo del motor](https://www.rolls-royce.com/products-and-services/civil-aerospace/services/passenger), de forma que el fabricante también gana si el motor funciona bien. Los datos permiten vender un servicio, no solo una máquina.

!!! danger "Caso que salió mal: las cámaras que tumbaron medio Internet"
    - **Sector:** dispositivos de consumo.
    - **Problema:** miles de cámaras y grabadores se vendían con contraseñas de fábrica que casi nadie cambiaba.
    - **Qué pasó:** el 21 de octubre de 2016, la red de dispositivos infectados por el *malware* Mirai atacó a Dyn, un proveedor de DNS. Hubo problemas de acceso a [sitios como Twitter, GitHub o Netflix](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/).
    - **Lección:** un dispositivo barato e inseguro no es solo un problema de quien lo compra. Puede convertirse en un arma contra terceros.

---

## 3. Riesgos y Buenas Prácticas

| Riesgo | Medida básica |
| :--- | :--- |
| Contraseñas de fábrica | Cambiarlas durante la instalación |
| Dispositivos sin actualizar | Elegir fabricantes con soporte y aplicar actualizaciones |
| Datos personales (rutinas, presencia) | Recoger solo lo necesario e informar a las personas afectadas |
| Fallos de conexión | Diseñar lo que debe seguir funcionando sin red |
| Coste de mantenimiento | Calcular baterías, sustituciones y soporte, no solo la compra |

---

## 4. Actividad

!!! actividad "En clase · 10 min · Diseña el sistema de un invernadero"
    Un agricultor pierde cosechas porque detecta tarde las heladas. Por parejas:

    1. Elegid qué sensor y qué actuador instalaríais.

    2. Dibujad el recorrido del dato, como en el diagrama anterior.

    3. Decidid qué debe seguir funcionando si cae Internet.

    4. Señalad un riesgo y una medida para reducirlo.

??? success "Una posible solución"
    Sensor de temperatura y aviso al móvil, con activación local de un sistema antiheladas. La decisión crítica debe tomarse **en local**, porque una helada no espera a que vuelva la conexión. Un riesgo sería una lectura errónea del sensor, que puede reducirse con un segundo sensor y una alerta si los valores no coinciden.

!!! tip "Si te ha tocado IoT"
    Tu pregunta se centra en un hogar, un aula o una pyme, así que estos casos solo son un modelo. Busca los tuyos y fíjate en si aportan **datos medidos**: ahorro, tiempo de respuesta o incidencias.
