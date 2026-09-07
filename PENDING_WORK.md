# 📋 Trabajo pendiente — Graficador Científico

> Documento de traspaso para retomar el trabajo en otra máquina / nueva sesión.
> Última actualización: 2026-09-07. Base: commit `cec00ce`, versión 1.5.0.

## Cómo retomar

1. `git pull` en `main`.
2. Leer este documento entero + `README.md` + `.agent/PROJECT_CONTEXT.md` (si existe localmente; está en `.gitignore`).
3. Correr los tests: `node --test 'test/*.test.js'` (ver ítem **F1**: el `npm test` está roto).
4. Servir localmente: `python3 -m http.server 8000` y abrir `http://localhost:8000`.
5. Elegir un ítem del backlog siguiendo el "Orden sugerido de ataque" del final.

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

- [ ] 🔴 **A1 — Tangente y Área rotas en ajuste exponencial.**
  `calculateDerivative()` y `calculateIntegral()` (`js/calculations.js`) no tienen
  rama `exponential` → devuelven `undefined` → el panel muestra `NaN` y la recta
  tangente no se dibuja. El punto de tangencia sí aparece (rama exponencial
  explícita en `chart-manager.js:509`), lo que confunde.
  Agregar `y' = a·b·e^(bx)` y `∫ = (a/b)·e^(bx)` (con guarda `b≈0`) + tests.
- [ ] 🟡 **A2 — Δm basura cuando las cajas de error se solapan.**
  `regression.js` (`linearRegression`, método pendiente máx/mín): si `xError` es
  grande vs. la separación en X, `xn_inner - x1_inner ≤ 0` → `mMax/mMin`
  negativos o infinitos. Hay guarda `isFinite()` para **dibujar** las líneas pero
  no para el `± Δm` que se muestra en la ecuación y en "Análisis de Pendiente".
  Validar `xn_inner > x1_inner`; si no se cumple, no reportar incertidumbre y
  avisar que las cajas de error se solapan.
- [ ] 🟡 **A3 — Errores por punto se descartan silenciosamente.**
  `chart-manager.js:344` siempre pisa `xError/yError` de cada punto con
  `AppState.config.defaultXError/Y` (incertidumbre de columna). `sanitizeImportedSeries`
  (state.js) todavía conserva los errores por punto y el README habla de "±X, ±Y"
  por fila. Un proyecto/link viejo pierde esos datos sin aviso.
  Decidir: soportar incertidumbre por punto, o limpiar de verdad (sanitizer +
  formato de archivo + docs).
- [ ] ⚪ **A4 — Regresiones no lineales sin ponderar.**
  `exponential` / `logarithmic` / `power` hacen mínimos cuadrados sobre datos
  linealizados con `log`, sin pesos (sesgo hacia valores chicos). El R² sí se
  calcula en el espacio original (correcto). Documentarlo en la ayuda.
- [ ] ⚪ **A5 — Doble regresión por refresco.**
  `updateChart` llama `calculateFit()` y luego `getRegressionCoeffs()` por
  separado para cada serie en cada update (incluye pan/zoom). Reusar coeficientes.

## B. Vista de la gráfica / escala

- [ ] 🟡 **B1 — Ticks/escala quedan mal tras mover los ejes.** (repro)
  `syncZoomState()` (`chart-manager.js`) redondea los límites a 4 decimales y los
  reescribe en `chart.options.scales` **y** en los inputs; combinado con
  `grace: '8%'` y `updateChart('none')` la escala "salta" o los valores no cierran.
  Revisar: no redondear de forma destructiva en `options` (redondear solo el input
  visible), revisar `grace` cuando hay min/max manual, y la generación de ticks
  con rangos fraccionarios.
- [ ] 🟡 **B2 — Ajuste de vista / encuadre general.**
  Al agregar/borrar datos o cambiar el tipo de ajuste, la vista no siempre
  reencuadra bien. Definir cuándo se autoajusta y cuándo respeta el zoom del
  usuario, y aplicarlo consistentemente.

## C. UI / estado

- [ ] 🔴 **C1 — "Limpiar Todo" deja la gráfica desajustada (todo en un eje).** (repro)
  `clearAllData()` (`ui-handlers.js:518`) agrega serie vacía + `renderSeries` +
  `updateChart` + `updateChartConfig`, pero **no** llama `resetZoom()` ni limpia
  `chart.options.scales.{x,y}.{min,max}`. Con los datos nuevos vacíos la vista
  queda pegada a los límites / zoom anteriores. Agregar `resetZoom()` al final.
- [ ] 🟡 **C2 — "Limpiar" no resetea la Configuración de Gráfica.**
  Ni `clearAllData()` ni el botón "Limpiar" por serie tocan los inputs de título,
  etiquetas, unidades, prefijos, límites ni los checkboxes. Resetear todo el panel
  a valores por defecto (o preguntar antes).
- [ ] 🟡 **C3 — Cambiar etiquetas de ejes no actualiza el cuadro de datos.**
  `renderTable()` (`ui-handlers.js:98`) tiene `<th>X</th><th>Y</th>` fijos.
  `labelX/labelY` (`onchange="updateChartConfig()"`) no re-renderiza la tabla.
  Que los encabezados reflejen `Etiqueta (unidad ± error)` y que
  `updateChartConfig()` dispare `renderSeries()` (como ya hace `updateAxisUnit`).
- [ ] 🟡 **C4 — Falta foco en la fila nueva.**
  El botón "+ Agregar Fila" (`addRow` wrapper, `ui-handlers.js:437`) solo
  re-renderiza. Enfocar y seleccionar el input X de la fila recién creada (como ya
  hace el `Enter` en `handleKeyDown`). Extraer "focus a fila N" a un helper y reusarlo.
- [ ] ⚪ **C5 — `alert()` / `confirm()` bloqueantes** para validaciones y
  confirmaciones destructivas. Migrar a modales no bloqueantes y estilables.
- [ ] ⚪ **C6 — Sin *focus trap* en los modales** (salvo ayuda de unidades).
  Añadir trampa de foco + retorno de foco al cerrar.

## D. Exportación

- [ ] ⚪ **D1 — Dos exportadores CSV divergentes.**
  `data-manager.js exportCSV()` (por serie): delimitador `,`, sin saneo
  anti-inyección, `data:` URI. `export_manager.js downloadAllCSV()`: `;` +
  `sanitizeCSVField()` + Blob. Unificar el primero al formato del segundo.
- [ ] ⚪ **D2 — Sin límite de tamaño en link compartido.**
  `generateShareURL()` (`share-manager.js`) puede generar URLs de decenas de KB
  (base64 infla ~2-3×) que se truncan al abrirlas. Avisar cuando el link supere ~8 KB.

## E. Seguridad

- [ ] 🟡 **E1 — Sin CSP.** Agregar `<meta http-equiv="Content-Security-Policy">`
  (defensa en profundidad frente a `innerHTML` + datos de `?data=`).
  **Bloqueante previo: E2.**
- [ ] 🟡 **E2 — ~55 funciones en `window` + `onclick` inline.**
  Migrar a `addEventListener` / delegación de eventos. Habilita CSP estricta y
  reduce fragilidad.
- [ ] ⚪ **E3 — Revisar `parseExpression`** (análisis dimensional) por robustez,
  aunque no procesa datos de red.

## F. Tests

- [ ] 🟡 **F1 — `npm test` no corre.** `package.json` → cambiar a
  `"test": "node --test test/*.test.js"` (el `node --test test/` falla en Node ≥ 22/24
  con `Cannot find module '.../test'`). Ya está en la allowlist de
  `.claude/settings.json` como si anduviera. Los 95 tests pasan con el glob.
- [ ] 🟡 **F2 — Cobertura faltante:** `calculateDerivative/Integral` exponencial (A1),
  `linearRegression` con cajas solapadas (A2), `sanitizeImportedSeries` con entradas
  hostiles.
- [ ] ⚪ **F3 — Sin CI.** Workflow de GitHub Actions que corra los tests en cada push/PR.

## G. Calidad / deuda técnica

- [ ] 🟡 **G1 — `units.js`: ~250 líneas muertas.** `convert()`, `convertTemperature()`,
  `resolveUnit()` sin consumidor real (comentario propio: "ya no se realizan
  conversiones matemáticas por decisión de diseño"; solo los usan los tests).
  Borrar o marcar explícitamente como reservado.
- [ ] 🟡 **G2 — Análisis dimensional es "beta" presentado como completo.**
  `parseExpression` (`dimensional-analysis.js`): sin precedencia, sin `+/-`, ignora
  los paréntesis que tokeniza, `^` solo funciona tras una magnitud. Mejorar el
  parser o rotular la feature como experimental en la UI.
- [ ] ⚪ **G3 — `chart-manager.js` registra plugins de `Chart` en la evaluación del
  módulo** → explota fuera del navegador (ya hay workaround con import dinámico en
  `export_manager.js`). Mover a `initChart()` con guarda idempotente.
- [ ] ⚪ **G4 — Cache-buster manual.** `index.html` (`js/main.js?v=1.5.0`) hay que
  actualizarlo a mano cada release (ya se desincronizó una vez). Automatizar o quitar.
- [ ] ⚪ **G5 — Limpiar código comentado / notas de proceso** en producción:
  `project_manager.js:76`, `export_manager.js:256`, bloque de razonamiento en el
  `filter` de leyenda de `chart_config.js:63-89`.
- [ ] ⚪ **G6 — Centralizar `showNotification`.** Duplicada en `share-manager`,
  `keyboard-shortcuts`, `presentation-mode`, `ui-handlers` con estilos inline repetidos.

## H. Documentación

- [ ] ⚪ **H1 — README desactualizado:** habla de errores "±X, ±Y" por fila (hoy es
  por columna) y de "conversión automática entre unidades" (deshabilitada).
- [ ] ⚪ **H2 — Documentar el método de incertidumbre** (pendiente máx/mín por
  extremos) y sus límites en la ayuda.

---

## Orden sugerido de ataque

1. **F1** (test runner) — base para todo lo demás.
2. **C1 + C3 + C4 + C2** — bugs de UI ya identificados, alto impacto y acotados.
3. **A1** (exponencial) + **F2**.
4. **B1 + B2** — encuadre / escala; necesita sesión de reproducción en navegador.
5. **A2, A3**.
6. **E2 → E1** — refactor de eventos + CSP.
7. **G1–G6, D1–D2**, docs.

## Mapa rápido de archivos

| Archivo | Responsabilidad |
|---|---|
| `js/state.js` | `AppState`, `sanitizeImportedSeries` |
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
