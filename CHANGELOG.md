# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Sin publicar]

### Corregido
- **La ecuación del ajuste ahora refleja las unidades de los ejes**: si los ejes tienen unidad (p. ej. "Tiempo (s)" / "Distancia (m)"), el ajuste lineal muestra siempre la pendiente y la ordenada con sus unidades físicas (`m = 2,0100 m/s`, `b = 0,0900 m`), no sólo cuando están activadas las líneas de incertidumbre. Los ajustes no lineales (cuadrático, cúbico, exponencial, logarítmico, potencial) llevan una nota `[y en m, x en s]`.

## [1.6.1] - 2026-09-08

Diálogos y accesibilidad de los modales, y una segunda pasada de auditoría (R1–R13)
centrada en correctitud numérica.

### Corregido
- **Datos no numéricos ya no rompen los ajustes**: escribir texto en una celda (o importar un CSV con basura) hacía que la ecuación quedara `y = NaNx + NaN`. Ahora esas celdas se ignoran para el cálculo (y para las exportaciones y la intersección).
- **Importación de CSV**: usa el mismo parser que el pegado desde Excel/Sheets — detecta el separador, no confunde la notación científica (`1e3`) con una cabecera, y valida cada celda.
- **Propagación de errores** con A o B en 0: antes daba `± Infinity`; ahora avisa que el método relativo no aplica.
- **Links compartidos**: se restaura el prefijo SI (mili, kilo…) — antes el eje mostraba `(m)` mientras la tabla mostraba `(km)`.
- **Tangente en logarítmico/potencial fuera de dominio** (x ≤ 0): avisa "fuera del dominio" en vez de dibujar el punto en y = 0.
- **Área** con desbordamiento numérico (exponencial muy pronunciada): avisa en vez de mostrar `Área = Infinity`.
- Reordenar/eliminar filas con un índice inválido ya no borra la fila 0.

### Cambiado
- **Modales**: los `alert()` / `confirm()` nativos del navegador (que congelaban toda la página y no se podían estilar) se reemplazaron por notificaciones y un diálogo de confirmación propios (`js/modal.js`). Afecta a "Limpiar" / "Limpiar Todo", cargar proyecto, y las validaciones de Propagación de Errores y Análisis Dimensional.
- **Accesibilidad**: todos los modales (ayuda, propagación, dimensional, datos de prueba, compartir, atajos, ayuda de unidades) ahora atrapan el foco de teclado mientras están abiertos, se cierran con `Escape`, y devuelven el foco al control que los abrió al cerrarse (WCAG 2.1.2 / 2.4.3). Con modales apilados, `Escape` cierra sólo el de arriba.

### Interno
- El zoom con la rueda ya no recompone la gráfica (y sus ajustes) en cada tick — se agrupa con un debounce.
- Segunda pasada de auditoría de código (R1–R13): además de lo de arriba, `utils.numericPoints` / `parseTabular` como puntos únicos de verdad, `calculateFit` devuelve la función de ajuste (usada por tangente y área), limpieza de `console.log` de debug y de código muerto. +6 tests (113 total).

## [1.6.0] - 2026-09-08

Pasada de auditoría completa del código: bugs de cálculo y de UI, endurecimiento de
seguridad (CSP estricta + delegación de eventos), unificación de utilidades y CI.

### Añadido
- **SEO**: `meta description`, Open Graph, Twitter Card, `<link rel="canonical">`, `robots.txt` y `sitemap.xml` para mejorar la indexación en buscadores.
- **Imagen de vista previa** (`assets/og-image.png`) para que el link se vea bien al compartirlo (WhatsApp, Twitter, etc.).
- **CI**: workflow de GitHub Actions (`.github/workflows/tests.yml`) que corre los 107 tests en cada push a `main`/`develop` y en cada PR.

### Corregido
- **Tests**: `npm test` volvió a funcionar (`node --test test/*.test.js`); el patrón anterior fallaba en Node ≥ 22.
- **"Limpiar Todo"**: ahora suelta el zoom y los límites manuales de los ejes; antes la gráfica quedaba pegada a la vista anterior con los datos ya vacíos.
- **"Limpiar Todo"**: también reinicia el panel de Configuración de Gráfica (título, etiquetas, unidades, prefijos, ± error, límites y checkboxes) a sus valores por defecto.
- Los encabezados del cuadro de datos reflejan la etiqueta, unidad e incertidumbre de cada eje (`Etiqueta (unidad ± error)`) y se actualizan al cambiar la configuración.
- **"+ Agregar Fila"**: enfoca y selecciona la celda X de la fila recién creada, igual que ya hacía la tecla Enter.
- **Tangente y Área** en ajuste **exponencial**: antes mostraban `NaN` y no dibujaban la recta tangente (faltaban las ramas `exponential` en la derivada e integral).
- **Incertidumbre de la pendiente**: cuando las cajas de error en X de los puntos extremos se solapan, ya no se muestra un `± Δm` sin sentido; se avisa que el método de máx/mín no aplica.
- La incertidumbre por punto de proyectos/links viejos se descarta explícitamente al importar (la incertidumbre es por columna); antes quedaba como dato muerto en el estado.
- **Vista de la gráfica**: tras hacer pan/zoom y luego editar cualquier campo del panel, la vista ya no "deriva" unos micro-pasos (el límite redondeado que se mostraba en el input volvía a escribirse como valor real).
- **Encuadre**: los campos de límites de eje son ahora la única fuente de verdad — si están vacíos la vista se auto-encuadra al agregar/quitar datos o cambiar el ajuste; si tienen un valor (incluido el que deja un pan/zoom) la vista queda fija. Vaciar un campo vuelve a auto-encuadrar ese eje.

### Documentación
- README: la incertidumbre se ingresa por columna (no por fila); el sistema de unidades sólo etiqueta, no convierte datos.
- Nueva sección "Notas metodológicas y limitaciones" (método de máx/mín, regresiones no lineales sin ponderar, análisis dimensional experimental).
- Ayuda in-app del ajuste lineal, exponencial, logarítmico y potencial ampliada con esas notas.

### Seguridad
- **Content-Security-Policy** (`<meta>`) sin `script-src 'unsafe-inline'`: se eliminaron todos los `<script>` y manejadores `on*=` inline (pasan por una delegación de eventos central, `js/events.js` + `js/actions.js`). Un script inyectado —inline o desde otro host— queda bloqueado; sólo se permiten scripts propios y los 4 CDN de cdnjs (con SRI). `connect-src 'self'` evita exfiltración; `object-src`/`base-uri`/`form-action`/`frame-ancestors` cerrados.
- El flag de desarrollo pasa a `body[data-development]` y la carga de `dev-tools.js` a `main.js`.
- Efectos de hover que estaban como JS inline (`onmouseover="this.style…"`) migrados a reglas CSS.

### Interno
- El análisis dimensional queda rotulado como **experimental** en la UI (chip en el modal, aclaración en el menú y nota sobre las limitaciones del parser). Además, las expresiones que el parser no entiende (paréntesis, `+`/`-`, magnitudes desconocidas) ahora fallan con un mensaje claro en vez de devolver una dimensión parcial engañosa.
- Tangente y área reutilizan los coeficientes que ya calculó el ajuste, en vez de repetir la regresión en cada refresco.
- Quitado el cache-buster manual (`js/main.js?v=…`): sólo versionaba el módulo principal y había que actualizarlo a mano cada release.
- Exportación CSV por serie unificada con la exportación combinada: delimitador `;`, saneo anti-inyección de fórmulas y descarga por Blob.
- Aviso al copiar un link compartido demasiado largo (> 8 KB) que podría truncarse.
- Notificaciones flotantes centralizadas en un único módulo (`notifications.js`); se eliminaron 4 implementaciones duplicadas.
- Los plugins de Chart.js se registran en `initChart()` (no al evaluar el módulo), lo que permite importar la lógica de gráfica en Node.
- `units.js` marcado como reservado; limpieza de código comentado y notas de proceso.
- Cobertura de tests ampliada de 95 a 107 (derivada/integral exponencial, cajas de error solapadas, `sanitizeImportedSeries` con entradas hostiles, `parseExpression`).
- `.claude/settings.json` sacado del control de versiones (config local, ahora en `.gitignore`).

## [1.5.0] - 2026-08-06

### Añadido
- **Exportaciones**: la ecuación del ajuste y el R² de cada serie ahora se incluyen en las exportaciones a PDF, imagen (JPG) y CSV.
- **Tests automatizados**: suite con `node --test` (sin dependencias nuevas) cubriendo regresión, cálculos, unidades y propagación de incertidumbre.
- **Seguridad**: integridad de subrecursos (SRI) en las librerías cargadas por CDN (Chart.js, Hammer.js, plugin de zoom, jsPDF, jsPDF-AutoTable).

### Corregido
- Corregido signo duplicado (`+ -`) en ecuaciones generadas con coeficientes negativos (ajustes lineal, polinomial grado 2 y grado 3).
- **Móvil**: eliminado overflow horizontal en pantallas ≤360px (faltaba `min-width: 0` en los items del grid `.layout`).
- **Accesibilidad**: restaurado el pinch-to-zoom, removiendo `user-scalable=no` del viewport (incumplía WCAG 1.4.4).
- Sincronizada la versión mostrada en el footer y el cache-buster del script principal, que seguían en 1.4.0.

## [1.4.0] - 2025-12-05

### Añadido
- **Documentación**: Nuevos archivos `project_context.md` y `quick_start.md` para facilitar el onboarding.
- **Modo Desarrollo**: Flag `IS_DEVELOPMENT` para habilitar herramientas de prueba en rama `develop`.

### Mejorado
- **Interfaz Móvil**: Menú de cabecera tipo "popover" para mejor experiencia en pantallas pequeñas.
- **Layout**: Reorganización de paneles de control (Zoom -> Config -> Cálculo -> Exportar) y unificación de estilos visuales.
- **Estabilidad**:
    - Solucionado "temblor" en slider de tangente (limitación a rango de datos y desactivación de animación).
    - Ejes configurados para mostrar siempre el origen (0,0) al restablecer zoom.


## [1.1.0] - 2025-12-01

### Añadido
- **Gestión de Proyectos**:
    - Guardar proyecto completo en formato JSON (series, datos, configuración).
    - Cargar proyectos previamente guardados.
- **Personalización de Gráfica**:
    - Panel de configuración para título, etiquetas de ejes y límites.
    - Control de visualización de grid.
    - **Ejes con flechas estilo física**: Los ejes X e Y ahora tienen flechas en sus extremos y etiquetas de magnitudes.
- **Introducción Visual**: Sección de bienvenida en la página principal que explica las capacidades del graficador.
- **Diseño Responsive**:
    - Interfaz optimizada para dispositivos móviles (celulares y tablets).
    - Tablas con desplazamiento horizontal y botones táctiles mejorados.
- **Mejoras de Usabilidad**:
    - **Zoom controlado**: Sensibilidad reducida para mayor precisión.
    - **Autoajuste inteligente**: El botón "Restablecer Zoom" ahora recalcula los límites para mostrar todos los puntos, incluso si se cambiaron manualmente.
- **Análisis de Incertidumbre Avanzado**:
    - **Cálculo de Pendiente**: Para ajustes lineales, se muestra el cálculo de $m_{max}$, $m_{min}$ y $\Delta m$ basado en las barras de error.
    - **Visualización Gráfica**: Líneas de pendiente máxima (roja) y mínima (azul) continuas con valores en la leyenda.
    - **Cajas de Error**: Se visualizan los rectángulos de error de los puntos extremos para confirmar la alineación de las pendientes.
    - **Línea de Ajuste**: Negra y continua para mejor contraste con las líneas de incertidumbre.
- **Exportación Avanzada**:
    - Exportación a PDF (además de PNG).
- **Análisis de Incertidumbre**:
    - Soporte para ingresar errores en X e Y (±X, ±Y).
    - Visualización de barras de error en la gráfica.
    - Cálculo de incertidumbre para pendiente e intercepto en regresión lineal (Método de Pendiente Máxima/Mínima).
- **Gestión de Archivos CSV**:
    - Funcionalidad para exportar series individuales a CSV.
    - Funcionalidad para importar datos desde archivos CSV.
- **Mejoras en Tabla de Datos**:
    - Botón "Limpiar" para borrar rápidamente todos los datos de una serie.
    - Navegación por teclado: `Enter` para mover foco abajo/crear fila, flechas para navegar.
- **Documentación**:
    - Ayuda contextual actualizada con explicación de incertidumbres.
    - README.md con instrucciones detalladas.

### Cambiado
- La gráfica ahora se actualiza automáticamente al modificar los datos en la tabla.
- Mejorada la estructura interna de datos para soportar propiedades de error (`xError`, `yError`).

### Corregido
- Solucionado problema donde las líneas de ajuste exponencial, logarítmico y potencial no se mostraban en la gráfica (faltaba `showLine: true` en el dataset).
- Corregido error de compatibilidad en funciones de regresión no lineal que causaba valores `NaN` (agregada función auxiliar `linearRegressionArrays`).
- Agregada validación para evitar errores de cálculo en ajustes logarítmicos y potenciales con valores no positivos.

## [1.0.0] - 2025-12-01

### Añadido
- Versión inicial del Graficador.
- Soporte para múltiples series de datos.
- Tipos de ajuste: Lineal, Polinomial (2 y 3), Exponencial, Logarítmico, Potencial.
- Cálculo de coeficiente R².
- Visualización interactiva con Chart.js.
- Detección de intersecciones.
- Personalización de colores por serie.
