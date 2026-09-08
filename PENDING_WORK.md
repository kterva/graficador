# 📋 Trabajo pendiente — Graficador Científico

> Documento de traspaso para retomar el trabajo en otra máquina / nueva sesión.
> Última actualización: 2026-09-08. Base: commit `cec00ce`, versión 1.5.0.
> Hechos: **F1**, **C1–C4**, **A1–A4**, **B1**, **B2**, **F2**, **F3**, **D1**, **D2**,
> **G1**, **G3**, **G5**, **G6**, **H1**, **H2**. Parciales: **E1**, **E2** (CSP puesta,
> falta la migración de manejadores `on*=` para poder endurecerla del todo).
> Siguiente: terminar **E2** (delegación de eventos) → endurecer **E1** (quitar
> `script-src 'unsafe-inline'`). Menores: **G2** (rótulo UI), **G4**, **A5**, **E3**.
> Nota: `.github/workflows/tests.yml` está commiteado localmente pero falta pushearlo
> (el token de `gh` necesita scope `workflow`: `gh auth refresh -s workflow`).

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
- [ ] ⚪ **A5 — Doble regresión por refresco.**
  `updateChart` llama `calculateFit()` y luego `getRegressionCoeffs()` por
  separado para cada serie en cada update (incluye pan/zoom). Reusar coeficientes.

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
- [ ] ⚪ **C5 — `alert()` / `confirm()` bloqueantes** para validaciones y
  confirmaciones destructivas. Migrar a modales no bloqueantes y estilables.
- [ ] ⚪ **C6 — Sin *focus trap* en los modales** (salvo ayuda de unidades).
  Añadir trampa de foco + retorno de foco al cerrar.

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

- [~] 🟡 **E1 — Sin CSP.** ✅ *Parcial:* agregado `<meta http-equiv="Content-Security-Policy">`
  en `index.html`. Fija los orígenes de script (los 4 CDN de cdnjs + `'self'`),
  `connect-src 'self' blob:` (bloquea exfiltración), `object-src/base-uri/
  form-action/frame-ancestors` cerrados. **Todavía incluye `script-src
  'unsafe-inline'`** porque quedan ~90 manejadores `on*=` en el HTML + 23
  generados en JS → falta E2 para poder quitarlo. Verificado en navegador: la app
  carga y funciona (chart, export PDF/CSV/proyecto, share, `?data=`, tour, modales)
  sin violaciones de CSP.
- [~] 🟡 **E2 — ~55 funciones en `window` + `onclick` inline.**
  ✅ *Parcial:* eliminados los 2 `<script>` inline de `index.html` (flag
  `IS_DEVELOPMENT` → `body[data-development]` leído en `main.js`; carga condicional
  de `dev-tools.js` movida a `main.js`).
  ⏳ **Falta el grueso:** migrar los ~90 `on*=` de `index.html` + los 23 generados
  en `ui-handlers`/`chart-manager`/`chart_config` a delegación de eventos
  (`data-action` + un listener central), y recién ahí quitar `'unsafe-inline'` de
  `script-src`. Es un refactor grande y transversal (toca cada botón/input/modal);
  conviene hacerlo como PR revisado con una pasada de test manual completa de la UI,
  no en commits directos a `main`.
- [ ] ⚪ **E3 — Revisar `parseExpression`** (análisis dimensional) por robustez,
  aunque no procesa datos de red.

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
- [ ] 🟡 **G2 — Análisis dimensional es "beta" presentado como completo.**
  `parseExpression` (`dimensional-analysis.js`): sin precedencia, sin `+/-`, ignora
  los paréntesis que tokeniza, `^` solo funciona tras una magnitud. Mejorar el
  parser o rotular la feature como experimental en la UI.
  ⏳ Parcial: documentado como "experimental" en README; falta rotularlo en la UI
  del modal o mejorar el parser.
- [x] ⚪ **G3 — `chart-manager.js` registra plugins de `Chart` en la evaluación del
  módulo.** ✅ Movido a `initChart()` con flag `_pluginsRegistered` idempotente.
  Verificado: los módulos que dependen de chart-manager ya se importan en Node
  sin el global `Chart` (los tests y `export_manager`).
- [ ] ⚪ **G4 — Cache-buster manual.** `index.html` (`js/main.js?v=1.5.0`) hay que
  actualizarlo a mano cada release (ya se desincronizó una vez). Automatizar o quitar.
  ⚠️ Ojo: los módulos hermanos que importa `main.js` **no** llevan `?v=`, así que
  hoy el cache-busting es parcial. Decisión pendiente (build-step mínimo vs. quitar).
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
7. **E2 → E1** — CSP inicial puesta ✅; falta la migración de ~90+23 manejadores
   `on*=` a delegación para quitar `script-src 'unsafe-inline'`. ← siguiente
8. Menores: **G2** (rótulo UI del análisis dimensional), **G4**, **A5**, **E3**.

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
