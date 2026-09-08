# 📋 Trabajo pendiente — Graficador Científico

> Documento de traspaso para retomar el trabajo en otra máquina / nueva sesión.
> Última actualización: 2026-09-08. Publicado como **v1.6.0** (`main` == `develop` == `6d85c2d`).
>
> **Pasada de auditoría completa: cerrados** F1, C1–C4, A1–A5, B1, B2, E1, E2, E3,
> F2, F3, D1, D2, G1–G6, H1, H2 (todo en `main` y `develop`, con CI en verde).
>
> **Backlog COMPLETO.** (C5 y C6 cerrados: `alert()`/`confirm()` → modales propios
> `js/modal.js`; focus trap + Escape + retorno de foco en todos los modales.)
>
> Flujo de ramas: trabajar en `develop`, mergear a `main` (fast-forward) cuando quede bien.

## Cómo retomar

1. `git checkout develop && git pull`.
2. Leer este documento + `README.md` + `.agent/PROJECT_CONTEXT.md` (si existe localmente; está en `.gitignore`).
3. Correr los tests: `npm test` (o `node --test 'test/*.test.js'`). Deben pasar 107.
4. Servir localmente: `python3 -m http.server 8000` y abrir `http://localhost:8000`.
   ⚠️ Chrome cachea agresivo los módulos ES sin `Cache-Control`; para ver cambios,
   servir en un puerto nuevo cada vez (hard-reload no alcanza).
5. Trabajar en `develop`. El backlog de la auditoría está completo; ver "Orden sugerido de ataque" para ideas nuevas.

## Estado / contexto

App web *vanilla* (ES Modules, sin bundler), sitio estático servido por GitHub Pages
(`graficador.culturalibre.edu.uy`). Dependencias solo por CDN con SRI (Chart.js 3.9,
hammer.js, plugin zoom, jsPDF + autotable). ~9.500 líneas.

Flujo de módulos:
`state` → `data-manager` (CRUD puro) → `ui-handlers` (DOM/eventos) → `chart-manager`
(render) → `calculations` / `regression` (matemática pura, testeable en Node).

Este backlog salió de una auditoría íntegra del código (2026-09-07) más observaciones
de uso del autor. Ningún ítem está empezado todavía.

Convención de prioridad: 🔴 alta · 🟡 media · ⚪ baja. "(repro)" = hace falta
reproducir en el navegador para confirmar la causa antes de tocar código.

---

## A. Cálculo y gráfica

- [x] 🔴 **A1 — Tangente y Área rotas en ajuste exponencial.**
  ✅ Ramas `exponential` en `calculateDerivative` (`y' = a·b·e^(bx)`) y
  `calculateIntegral` (`∫ = (a/b)·e^(bx)`, guarda `|b|<1e-12` → derivada 0 / área
  `a·(x2−x1)`). Verificado en navegador (tangente y área numéricas, sin NaN) + tests F2.
- [x] 🟡 **A2 — Δm basura cuando las cajas de error se solapan.**
  ✅ `linearRegression` chequea `pn.x − Δxn > p1.x + Δx1`; si no, devuelve
  `uncertainty: null` + `uncertaintyWarning: 'overlap'`. `calculateFit` lo propaga y
  `chart-manager` muestra un aviso en lugar del `± Δm`/"Análisis de Pendiente" basura.
  Reproducido y verificado en navegador. Tests en `regression.test.js`.
- [x] 🟡 **A3 — Errores por punto se descartan silenciosamente.**
  ✅ Decisión: **limpiar de verdad**. La incertidumbre es por columna (lo impone la
  UI). `sanitizeImportedSeries` ahora descarta `xError/yError` por punto y a nivel
  serie; el punto queda `{x, y}`. README/ayuda actualizados. Nadie consumía esos
  campos (siempre se pisan con la incertidumbre de columna en `updateChart`).
- [x] ⚪ **A4 — Regresiones no lineales sin ponderar.**
  ✅ Documentado en la ayuda in-app (exp/log/potencial) y en README ("Notas
  metodológicas y limitaciones").
- [x] ⚪ **A5 — Doble regresión por refresco.**
  ✅ `calculateFit()` ahora devuelve `coeffs` (misma forma que `getRegressionCoeffs`)
  y `chart-manager` los reusa para tangente/área en lugar de rehacer la regresión
  en cada refresco. Verificado en navegador (exp + poly2: tangente y área correctas).

## B. Vista de la gráfica / escala

- [x] 🟡 **B1 — Ticks/escala quedan mal tras mover los ejes.** (repro)
  ✅ Reproducido: `syncZoomState()` dejaba el input redondeado a 4 decimales y las
  `options.scales` con el valor exacto; al editar después cualquier campo del panel,
  `updateChartConfig()` releía el input redondeado → la vista "derivaba" ~3e-5 por
  ciclo pan/zoom→editar. Fix: `syncZoomState()` escribe el **mismo** valor redondeado
  a 4 decimales en el input **y** en `options.scales` (imperceptible en píxeles,
  idempotente). Verificado: drift = 0.
- [x] 🟡 **B2 — Ajuste de vista / encuadre general.**
  ✅ Política definida y aplicada: **los inputs del panel de límites son la única
  fuente de verdad**. Input vacío ⇒ límite automático (Chart.js reencuadra al
  agregar/quitar datos o cambiar el ajuste); input con valor ⇒ vista fija. El
  pan/zoom completa los inputs (vía `syncZoomState`), así que el usuario siempre ve
  por qué la vista quedó fija y puede vaciarlos para re-encuadrar. Implementado en
  `reconcileManualLimits()`, llamado al inicio de `updateChart()`. Verificado en
  navegador (auto-fit, pan respetado, limpiar inputs re-fitea, límites del panel
  respetados, slider de tangente no perturba la vista).

## C. UI / estado

- [x] 🔴 **C1 — "Limpiar Todo" deja la gráfica desajustada (todo en un eje).** (repro)
  ✅ Reproducido y arreglado (`cec00ce`+): `clearAllData()` ahora llama `resetChartConfigPanel()` y `resetZoom()` al final.
  `clearAllData()` (`ui-handlers.js:518`) agrega serie vacía + `renderSeries` +
  `updateChart` + `updateChartConfig`, pero **no** llama `resetZoom()` ni limpia
  `chart.options.scales.{x,y}.{min,max}`. Con los datos nuevos vacíos la vista
  queda pegada a los límites / zoom anteriores. Agregar `resetZoom()` al final.
- [x] 🟡 **C2 — "Limpiar" no resetea la Configuración de Gráfica.**
  ✅ `clearAllData()` reinicia todo el panel vía `resetChartConfigPanel()` (nuevo
  export en `chart_config.js`). El botón "Limpiar" por serie se deja como está
  a propósito: resetear la config global al limpiar una serie de varias sería
  incorrecto. La confirmación destructiva de "Limpiar Todo" ya cubre el "preguntar antes".
- [x] 🟡 **C3 — Cambiar etiquetas de ejes no actualiza el cuadro de datos.**
  ✅ Nuevo helper `axisHeaderLabel(serie, axis)` en `ui-handlers.js`; `renderTable()`
  reescribe los `<th>` con `Etiqueta (unidad ± error)` y `updateChartConfig()`
  dispara `renderSeries()`.
- [x] 🟡 **C4 — Falta foco en la fila nueva.**
  ✅ Helper `focusCell(serieId, rowIndex, colIndex)` extraído; lo reusan el wrapper
  `addRow` y la rama `Enter` de `handleKeyDown`.
- [x] ⚪ **C5 — `alert()` / `confirm()` bloqueantes.** ✅ `js/modal.js`:
  `confirmDialog()` (Promise, estilable, no bloquea) reemplaza los `confirm()`;
  los `alert()` informativos pasan al toast (`showNotification`).
- [x] ⚪ **C6 — Sin *focus trap* en los modales.** ✅ `trapFocus()` +
  `activateModal()/deactivateModal()` en `js/modal.js`, cableado en todos los
  modales (ayuda, propagación, dimensional, datos de prueba, compartir, atajos,
  ayuda de unidades): atrapan Tab, cierran con Escape, devuelven el foco al abrir.

## D. Exportación

- [x] ⚪ **D1 — Dos exportadores CSV divergentes.**
  `data-manager.js exportCSV()` (por serie): delimitador `,`, sin saneo
  anti-inyección, `data:` URI. `export_manager.js downloadAllCSV()`: `;` +
  `sanitizeCSVField()` + Blob. Unificar el primero al formato del segundo.
  ✅ `data-manager.exportCSV()` ahora usa `;`, `sanitizeCSVField` (movido a
  `utils.js`, compartido) y descarga por Blob. Verificado en navegador (fórmula
  `=BAD` queda `'=BAD`).
- [x] ⚪ **D2 — Sin límite de tamaño en link compartido.**
  ✅ `copyShareURL()` avisa (toast de error) cuando la URL supera 8000 chars y
  sugiere usar "Guardar" + archivo `.json`.

## E. Seguridad

- [x] 🟡 **E1 — Sin CSP.** ✅ `<meta http-equiv="Content-Security-Policy">` en
  `index.html`, **sin `script-src 'unsafe-inline'`** (ya no hay `<script>` ni `on*=`
  inline). `script-src 'self' https://cdnjs.cloudflare.com`; `style-src` mantiene
  `'unsafe-inline'` (cientos de `style=` + `<style>` inyectados, impacto mucho menor);
  `connect-src 'self' blob:`; `object-src/base-uri/form-action/frame-ancestors`
  cerrados. Verificado en navegador: la app entera funciona sin violaciones de CSP.
- [x] 🟡 **E2 — ~55 funciones en `window` + `onclick` inline.**
  ✅ Migrados **todos** los manejadores inline a delegación de eventos:
  `js/events.js` (`registerActions()` + `initEventDelegation()`, un listener
  delegado en `document` por tipo `click/change/input/keydown/paste/submit`,
  despacha por `data-on-<tipo>="nombre"` con soporte de varias acciones separadas
  por espacio) + `js/actions.js` (registro de ~55 acciones `(event, el) => …` que
  leen params de `data-*`).
  - `index.html`: ~90 `on*=` → `data-on-*` + `data-axis/tab/test-type/help-id`.
  - `ui-handlers.js` `renderSeries`/`renderTable`, `chart-manager.js` (botón de
    ayuda), `share-manager.js`, `keyboard-shortcuts.js`, `tour-guide.js`: idem.
  - 8 `onmouseover/onmouseout="this.style…"` → reglas CSS `:hover` en `styles.css`
    (`#toolsMenu button:hover`, `.modal-close-x:hover`, `.btn-hover-scale:hover`).
  - `document.getElementById('axis-limits-details').open=true; …` → acción
    `openAxisLimitsHelp`.  ·  `alert('Plantillas…')` → toast `templatesComingSoon`.
  Los `window.*` se **mantienen** (los usa el tour; no son problema de CSP).
  Verificado a mano en navegador: data entry (change/input/keydown/Enter), add/remove
  fila y serie, mover filas, pegar, tipo de ajuste, color, toda la toolbar, menú de
  herramientas + compuestos, los 3 modales, panel de config (etiquetas/unidades/
  prefijos/checkboxes/ayuda de límites), tangente, área, zoom, ayuda + pestañas,
  presentación, menú móvil, intersección, export CSV/JPG, share, propagación de
  errores, dimensional + Enter.
- [x] ⚪ **E3 — Revisar `parseExpression`** (análisis dimensional) por robustez.
  ✅ Ya era seguro (try/catch, sin `eval`, no toca datos de red). Se cambió el
  fallo silencioso: tokens desconocidos, `+`/`-`, paréntesis, dos magnitudes sin
  operador y operadores colgando ahora devuelven `null` (fallo claro en la UI) en
  vez de una dimensión parcial engañosa. Tests nuevos en `dimensional-analysis.test.js`.

## F. Tests

- [x] 🟡 **F1 — `npm test` no corre.** ✅ `package.json` ahora usa
  `"test": "node --test test/*.test.js"`. Los 95 tests pasan (`npm test`).
- [x] 🟡 **F2 — Cobertura faltante:** ✅ Tests agregados para `calculateDerivative/Integral`
  exponencial (+ guarda `b≈0`), `linearRegression` con cajas solapadas / apenas
  no solapadas, y `sanitizeImportedSeries` con entradas hostiles (ids no finitos,
  strings tipo XSS, coords objeto, `__proto__`, drop de errores por punto).
  95 → 105 tests.
- [x] ⚪ **F3 — Sin CI.** ✅ `.github/workflows/tests.yml` corre `npm test` en push a
  `main` y en cada PR (Node 22).

## G. Calidad / deuda técnica

- [x] 🟡 **G1 — `units.js`: ~250 líneas muertas.** ✅ Marcado explícitamente como
  RESERVADO en el header del módulo (`convert`/`convertTemperature`/`resolveUnit`
  se mantienen y testean como base para reintroducir la conversión opcional).
  `updateAxisUnit` ya no destructura `convert`/`getCategoryName` (no se usaban).
- [x] 🟡 **G2 — Análisis dimensional es "beta" presentado como completo.**
  ✅ Rotulado como "experimental": chip `EXPERIMENTAL` en el título del modal,
  `(experimental)` en el menú Herramientas, y nota sobre las limitaciones del parser
  bajo el input. (Mejorar el parser en sí queda para E3.)
- [x] ⚪ **G3 — `chart-manager.js` registra plugins de `Chart` en la evaluación del
  módulo.** ✅ Movido a `initChart()` con flag `_pluginsRegistered` idempotente.
  Verificado: los módulos que dependen de chart-manager ya se importan en Node
  sin el global `Chart` (los tests y `export_manager`).
- [x] ⚪ **G4 — Cache-buster manual.** ✅ Quitado el `?v=1.5.0` de `index.html`.
  Sólo versionaba `main.js` (no sus módulos hermanos), daba falsa frescura y había
  que bumpearlo a mano. GitHub Pages sirve todo con `Cache-Control: max-age=600`,
  así que un release propaga en ~10 min de forma consistente. `APP_VERSION` queda
  sólo para el footer.
- [x] ⚪ **G5 — Limpiar código comentado / notas de proceso** ✅
  `project_manager.js` (nota sobre mutabilidad del array), `export_manager.js`
  (`bodies`/comentarios de autoTable), `chart_config.js` (bloque de razonamiento del
  `filter` de leyenda, reducido a 4 líneas), y helper de notificación de conversión
  muerto en `ui-handlers.js`.
- [x] ⚪ **G6 — Centralizar `showNotification`.** ✅ Nuevo `js/notifications.js` con un
  único `showNotification(message, type, durationMs)`. Migrados `share-manager`,
  `keyboard-shortcuts` (`⌨️` prefix), `presentation-mode` y el toast de pegado de
  `ui-handlers`. Eliminado el bloque de `@keyframes` duplicado de `keyboard-shortcuts`.

## H. Documentación

- [x] ⚪ **H1 — README desactualizado:** ✅ corregido: errores por columna (no por fila),
  y "sistema de unidades" ya no dice "conversión automática" (sólo etiquetas).
- [x] ⚪ **H2 — Documentar el método de incertidumbre** ✅ ayuda in-app del ajuste
  lineal ampliada + sección "Notas metodológicas y limitaciones" en README.

---

## Orden sugerido de ataque

1. ~~**F1** (test runner) — base para todo lo demás.~~ ✅
2. ~~**C1 + C3 + C4 + C2** — bugs de UI ya identificados, alto impacto y acotados.~~ ✅
3. ~~**A1** (exponencial) + **F2**.~~ ✅
4. ~~**A2, A3**.~~ ✅  (+ A4, H1, H2 docs)
5. ~~**G1, G3, G5, G6, D1, D2, F3**~~ ✅
6. ~~**B1 + B2** — encuadre / escala~~ ✅
7. ~~**E2 → E1** — delegación de eventos + CSP estricta~~ ✅ (rama
   `refactor/event-delegation-csp`, pendiente de merge/revisión).

**Backlog completo.** Sólo queda mergear el PR de E1/E2 y commitear `tests.yml` (F3).

## Mapa rápido de archivos

| Archivo | Responsabilidad |
|---|---|
| `js/state.js` | `AppState`, `sanitizeImportedSeries` |
| `js/events.js` | Delegación de eventos: `registerActions` + `initEventDelegation` |
| `js/actions.js` | Registro de acciones de UI (nombre → función) |
| `js/data-manager.js` | CRUD de series/puntos, import/export CSV por serie |
| `js/ui-handlers.js` | Render de series y tabla, eventos, modales, clear |
| `js/chart-manager.js` | `initChart`, `updateChart`, zoom/pan, tangente/área |
| `js/chart_config.js` | Panel de configuración, leyenda, intersección |
| `js/calculations.js` | `calculateFit`, `calculateDerivative`, `calculateIntegral` |
| `js/regression.js` | Algoritmos de regresión + incertidumbre de pendiente |
| `js/uncertainty-propagation.js` | Propagación de errores (suma/resta/prod/coc) |
| `js/units.js` | Catálogo de unidades (mayormente sin uso en runtime) |
| `js/dimensional-analysis.js` | Análisis dimensional (parser limitado) |
| `js/share-manager.js` | URL compartible (`?data=` base64) |
| `js/export_manager.js` | Export JPG / PDF / CSV combinado |
| `js/project_manager.js` | Guardar/cargar proyecto `.json` |
