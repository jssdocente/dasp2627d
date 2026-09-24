# 1.3 Estructura Organizativa y Convergencia OT / IT

Uno de los mayores desafíos técnicos y de gestión de la digitalización no es la tecnología en sí misma, sino la integración entre dos mundos que durante décadas operaron de espaldas: el mundo corporativo de las oficinas (**IT - Information Technology**) y el mundo de las líneas de producción y plantas industriales (**OT - Operational Technology**).

---

## 1. Estructura Empresarial e Identidad Digital

En cualquier organización moderna, los departamentos (Recursos Humanos, Finanzas, Operaciones, TI, Logística) están jerarquizados y requieren accesos diferenciados a la información:

```mermaid
graph TD
    CEO[Dirección General / CEO]
    CEO --> RRHH[Recursos Humanos]
    CEO --> FIN[Contabilidad / Finanzas]
    CEO --> OPS[Operaciones / Planta Fabril]
    CEO --> IT_DIR[Dirección de TI / Ciberseguridad]

    RRHH -->|"Nóminas, Contratos (Confidencial)"| AD[Directorio Activo / IAM]
    FIN -->|"ERP, Facturas, Cuentas Bancarias"| AD
    OPS -->|"SCADA, PLCs, Telemetría"| AD
    IT_DIR -->|"Políticas de Seguridad y Cortafuegos"| AD
```

### Control de Acceso y Gestión de Identidades (IAM)
La digitalización de una empresa exige abandonar la gestión manual de contraseñas compartidas mediante sistemas de **Control de Acceso Basado en Roles (RBAC)**:

- **Principio de Mínimo Privilegio (*Least Privilege*):** Un operario de planta solo tiene permisos de lectura sobre la receta del producto y control sobre su estación de trabajo; no puede acceder a las nóminas de RRHH ni modificar las reglas del cortafuegos corporativo.
- **Autenticación Multifactor (MFA / 2FA):** Exigencia de al menos dos factores distintos de autenticación:

    1. *Algo que sabes:* Contraseña o PIN.
    2. *Algo que tienes:* Llave de seguridad FIDO2 (YubiKey), app autenticadora TOTP (Google Authenticator) o tarjeta inteligente RFID.
    3. *Algo que eres:* Biometría (huella dactilar, reconocimiento facial 3D o iris).

!!! warning "El dilema ético y técnico de la biometría"
    A diferencia de una contraseña comprometida (que se restablece en 10 segundos con un nuevo hash en base de datos), **los datos biométricos no se pueden cambiar**. Si una base de datos con las huellas o el escaneo facial de los trabajadores es sustraída por ciberdelincuentes, la identidad de esos empleados queda expuesta de por vida. Por ello, el RGPD europeo cataloga la biometría como dato de categoría especial y exige cifrado de extremo a extremo y procesado en local.

---

## 2. El Choque de Dos Mundos: IT vs. OT

Para un profesional de la informática, entender la diferencia entre IT y OT es indispensable para evitar incidentes catastróficos en fábricas, hospitales o redes de transporte.

```mermaid
flowchart TD
    subgraph Entorno IT - Tecnologías de la Información
        IT1[Servidores Web y Bases de Datos]
        IT2[ERP Corporativo / SAP]
        IT3[Puestos Ofimáticos y Correo]
        IT_PRIO["Prioridad Tríada CIA:<br/><b>1º Confidencialidad</b><br/>2º Integridad<br/>3º Disponibilidad"]
    end

    subgraph Frontera Crítica / Firewall Industrial
        FW[Firewall / DMZ Industrial / Modelo Purdue]
    end

    subgraph Entorno OT - Tecnologías Operativas
        OT_PRIO["Prioridad Tríada CIA:<br/><b>1º Disponibilidad (99.999%)</b><br/>2º Integridad Física<br/>3º Confidencialidad"]
        OT1[SCADA / HMI Pantallas Táctiles]
        OT2[PLCs y Autómatas Programables]
        OT3[Robots, Calderas, Bombas, Turbinas]
    end

    IT1 <--> FW
    IT2 <--> FW
    FW <--> OT1
    OT1 --> OT2 --> OT3
```

---

## 3. Matriz Comparativa Técnica: IT vs. OT

| Criterio | Entorno IT (Information Technology) | Entorno OT (Operational Technology) |
| :--- | :--- | :--- |
| **Objetivo central** | Gestión, análisis y almacenamiento de datos corporativos | Control y monitorización en tiempo real de procesos físicos |
| **Prioridad de Seguridad** | **Confidencialidad** > Integridad > Disponibilidad | **Disponibilidad (24/7/365)** > Integridad > Confidencialidad |
| **Tolerancia al retardo** | Tolera latencias de segundos o reintentos TCP | **Tiempo real estricto (*jitter* < milisegundos)** |
| **Impacto de un fallo** | Pérdida de dinero, daño reputacional, fuga de datos | **Daño a infraestructuras, explosiones, riesgo vital para personas** |
| **Ciclo de vida del hardware** | 3 a 5 años (servidores, portátiles, switches) | **15 a 30 años (turbinas, generadores, PLCs industriales)** |
| **Gestión de parches** | Actualizaciones automáticas semanales/mensuales | Parchear requiere parar la fábrica; se audita durante meses |
| **Protocolos habituales** | TCP/IP, HTTPS, SSH, DNS, REST, GraphQL | Modbus, Profinet, EtherCAT, OPC-UA, CAN Bus, DNP3 |

---

## 4. La Superficie de Ataque Industrial y Casos Históricos

Históricamente, los sistemas industriales de planta estaban aislados del exterior mediante lo que se denominaba un **aislamiento por espacio de aire (*air gap*)**. La digitalización ha derribado ese aislamiento: ahora las máquinas de planta envían datos a la nube para mantenimiento predictivo, lo que abre la puerta a ciberataques devastadores.

```mermaid
graph LR
    Hacker([Ciberdelincuente]) -->|Phishing a empleado de oficina| PC[PC de Oficina IT]
    PC -->|Movimiento Lateral por red mal segmentada| DMZ[Servidor Intermedio / DMZ]
    DMZ -->|Salto a red industrial| PLC[Autómata PLC / SCADA]
    PLC -->|Manipulación de parámetros físicos| Fabrica[(Catástrofe Física / Parada de Planta)]
```

### Casos Reales Paradigmáticos:

1. **Stuxnet (2010):** El primer ciberarma militar conocida de la historia. Infectó sistemas SCADA de Siemens mediante memorias USB y alteró las frecuencias de rotación de las centrifugadoras de enriquecimiento de uranio en la planta iraní de Natanz, destruyéndolas físicamente mientras en las pantallas de los operadores mostraba lecturas falsas de normalidad.

2. **Ransomware Colonial Pipeline (2021):** Un grupo de ciberdelincuentes secuestró los sistemas de facturación (IT) del mayor oleoducto de la costa este de EEUU. Por miedo a que el malware saltara a la red operativa de bombeo (OT), la compañía cerró el oleoducto durante 6 días, provocando compras de pánico de gasolina y crisis de transporte en varios estados.

3. **Ciberataque al Hospital Clínic de Barcelona (2023):** Un ransomware secuestró miles de historiales clínicos y paralizó servicios de radioterapia y quirófanos programados durante semanas, evidenciando que en el ámbito sanitario la convergencia IT/OT compromete directamente la salud de los pacientes.

---

## 5. El Marco Regulatorio Europeo: Directiva NIS2

Ante la avalancha de ataques a infraestructuras críticas, la Unión Europea aprobó la **Directiva NIS2 (Network and Information Security 2)**:

- **Ámbito ampliado:** Ya no solo afecta a multinacionales de energía o telecomunicaciones; ahora obliga a pymes y proveedores de sectores esenciales (sanidad, tratamiento de aguas, logística alimentaria, automoción, industria química).
- **Régimen sancionador:** Multas de hasta 10 millones de euros o el 2% del volumen de negocio global, junto con **responsabilidad civil e inhabilitación directa de los directivos** que descuiden la seguridad de sus redes.
- **Obligaciones técnicas:** Segmentación estricta de redes de control industrial mediante el **Modelo Purdue**, planes de respuesta a incidentes en menos de 24 horas y auditoría continua de la cadena de suministro de software.

---

## Reto de Laboratorio: Segmentación de Red con el Modelo Purdue

??? tip "Actividad Técnica: Arquitectura de Red Segura IT / OT"
    Imagina que eres contratado por una embotelladora industrial. El director de TI propone conectar los PLCs de la línea de llenado directamente al switch de la oficina para poder ver el estado de las botellas desde su portátil por WiFi.
    
    **Tu tarea:**

    1. Diseña un esquema básico aplicando el **Modelo Purdue** con al menos 3 capas:

        - *Nivel 0/1:* Sensores de nivel y PLCs de planta.
        - *Nivel 2/3:* Servidores SCADA locales e historiadores de datos de planta.
        - *Nivel 3.5 / DMZ:* Cortafuegos con políticas de filtrado donde reside el servidor que publica datos hacia el ERP corporativo.
        - *Nivel 4:* Red corporativa IT.

    2. Explica tres razones técnicas por las que conectar los autómatas directamente a la WiFi de oficina supone una negligencia grave de seguridad.
