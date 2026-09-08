# 📋 Trabajo pendiente — Graficador Científico

> Documento de traspaso para retomar el trabajo en otra máquina / nueva sesión.
> Última actualización: 2026-09-08. `main` == `develop`, CI en verde.
>
> **Primera auditoría — COMPLETA.** F1, C1–C6, A1–A5, B1, B2, D1, D2, E1–E3, F2, F3,
> G1–G6, H1, H2. Publicado como **v1.6.0** (C5/C6 bajo `[Sin publicar]`).
>
> **Segunda auditoría (2026-09-08)** — 13 hallazgos nuevos **R1–R13**, ninguno
> empezado (ver sección "SEGUNDA AUDITORÍA"). El de mayor impacto: **R1** — datos
> no numéricos en una celda / CSV malo → `NaN` en los ajustes y exportaciones.
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

## SEGUNDA AUDITORÍA (2026-09-08, post v1.6.0)

Repaso de código sobre el estado ya con toda la primera auditoría cerrada. Ningún
ítem empezado. Convención: 🔴 alta · 🟡 media · ⚪ baja. "(repro)" = confirmado en navegador.

### 🔴 Alta

- [ ] 🔴 **R1 — Datos no numéricos envenenan los ajustes y las exportaciones con `NaN`.** (repro)
  El filtro `serie.data.filter(p => p.x !== '' && p.y !== '')` aparece en **8 lugares**
  y ninguno chequea que el valor sea numérico (sólo `handleTablePaste` lo hace).
  Tipear letras en una celda (`type="text"`) o importar un CSV con basura →
  `parseDecimal("abc")` = `NaN` → regresión con NaN → **ecuación "y = NaNx + NaN",
  `R² = NaN`**, e igual en `chart_config.js` (intersección) y `export_manager.js` (×3).
  Fix: un helper `getNumericData(serie)` con `!isNaN(parseDecimal(...))`, usado en:
  `chart-manager.js:391`, `chart_config.js:238-239`, `data-manager.js:233`,
  `export_manager.js:102,245,368`. + validar en `updatePoint` / `importCSVFile`.

### 🟡 Media

- [ ] 🟡 **R2 — `importCSVFile` (`data-manager.js`) es más laxo que el pegado.**
  Guarda `normalizeDecimalInput()` sin validar; detecta cabecera con `/[a-zA-Z]/`
  (una fila `1e5,2e5` en notación científica se descarta como cabecera); la
  ambigüedad `,` decimal vs `,` separador la resuelve distinto que `handleTablePaste`.
  Unificar el parseo CSV entre los dos caminos de import.
- [ ] 🟡 **R3 — `getDataRange()` (`chart-manager.js:326`) filtra los datasets
  generados por *string matching* del `label`** (`includes('Ajuste'|'Tangente'|'Área'|'Pendiente')`).
  El dataset del ajuste real tiene `label: serie.name` → **NO se filtra**, sus puntos
  (extrapolados si el toggle está activo) cuentan en el rango. Las "Cajas de Error"
  tampoco están en la lista. Y una serie llamada p.ej. "Tangente 1" queda excluida.
  Fix: marcar los datasets generados con un flag (`_generated: true`) y filtrar por eso.
- [ ] 🟡 **R4 — La función de ajuste se evalúa a mano en 3 lugares.**
  `calculateFit` la calcula internamente (`fitFunc`, no la devuelve); `chart-manager`
  recalcula `y0` para la tangente y los puntos del área con su propio `switch` por
  tipo. A5 unificó los *coeficientes* pero no la *función*. Además las guardas
  difieren: `calculateDerivative` devuelve `NaN` para log/power con `x ≤ 0`, pero el
  `y0` de la tangente devuelve `0` → el "Punto Tangente" se dibuja en `y=0` (engañoso)
  mientras el panel muestra "Pendiente = NaN". Fix: `calculateFit` devuelve `fitFunc`
  y `chart-manager` lo reusa.
- [ ] 🟡 **R5 — `propagateProductQuotient` con un operando en 0** → `δA / |0|` = `Infinity`
  → resultado *"P = 0 ± Infinity"*. La UI sólo bloquea `quotient && valueB === 0`.
  Falta guarda para `valueA === 0` (y `product` con cualquier operando 0), o avisar
  que el método de error relativo no aplica ahí.
- [ ] 🟡 **R6 — `loadFromURL` no restaura `serie.units`.** Setea el `<select>` de unidad
  pero no la metadata que usan el título del eje y los headers de la tabla; tampoco
  guarda/restaura los prefijos SI. Un link compartido con unidades muestra el dropdown
  pero no la unidad en el eje ni en `Etiqueta (unidad ± error)`. `generateShareURL` +
  `loadFromURL` deben pasar por `updateAxisUnit` (o replicar su efecto sobre `serie.units`).

### ⚪ Baja

- [ ] ⚪ **R7 — `removeRow` con índice inválido borra la fila 0.** (repro)
  `serie.data.splice(NaN, 1)` → `NaN` coacciona a `0`. Falta
  `Number.isInteger(index) && index >= 0 && index < serie.data.length`.
- [ ] ⚪ **R8 — Overflow no controlado en exponencial.** `Math.exp(b·x)` con `b·x`
  grande → `Infinity` → área/tangente/puntos del ajuste con `Infinity`/`NaN`. Clamp o aviso.
- [ ] ⚪ **R9 — Código muerto:** `data-manager.getValidData` (no lo usa nadie, ni los
  tests), `ui-handlers.focusCell` exportado sin consumidor externo, el `return changed`
  de `reconcileManualLimits` que el llamador ignora.
- [ ] ⚪ **R10 — ~36 `console.log/warn` en producción**, varios de debug ("Unidad del
  eje X cambiada…", "⌨️ Atajos inicializados", "📊 Datos cargados…"). Gate detrás de
  `IS_DEVELOPMENT` o quitar.
- [ ] ⚪ **R11 — Modales apilables** (Ctrl+H de atajos sobre otro modal abierto) →
  focus traps + handlers de Escape anidados. Poco probable, pero define el comportamiento.
- [ ] ⚪ **R12 — `updateChart` en cada `onZoomComplete` (rueda)** recomputa todos los
  ajustes; la rueda dispara seguido. Considerar debounce como el del tipeo.
- [ ] ⚪ **R13 — `main.js:190` re-consulta `window.IS_DEVELOPMENT`** cuando ya hay una
  const `IS_DEVELOPMENT` calculada arriba en el módulo.

---

## Orden sugerido de ataque

### Primera auditoría — COMPLETA ✅
F1 · C1–C6 · A1–A5 · B1 · B2 · D1 · D2 · E1–E3 · F2 · F3 · G1–G6 · H1 · H2
(publicado como v1.6.0; C5/C6 bajo `[Sin publicar]`).

### Segunda auditoría — pendiente
1. **R1** (NaN en ajustes) — la de mayor impacto y acotada (un helper, 8 sitios).
2. **R4 + R3** — unificar `fitFunc` y el marcado de datasets generados; se tocan juntos en `chart-manager`.
3. **R2** — unificar el parseo CSV (relacionado con R1).
4. **R5, R6, R7, R8**.
5. **R9–R13** — limpieza.

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
