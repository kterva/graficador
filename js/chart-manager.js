/**
 * ============================================
 * GESTIÓN DEL GRÁFICO
 * ============================================
 * 
 * Módulo para inicializar y actualizar el gráfico de Chart.js
 * 
 * @module chart-manager
 */

import { AppState } from './state.js';
import { errorBarsPlugin, bullseyePointsPlugin } from './chart-plugins.js';
import { calculateFit, calculateDerivative, calculateIntegral } from './calculations.js';
import { extractUnit, formatWithUncertainty, parseDecimal, formatNumber, numericPoints } from './utils.js';

// Los plugins se registran en initChart() (no en la evaluación del módulo): así este
// módulo se puede importar en Node —p.ej. desde los tests o export_manager— sin que
// el `Chart` global (cargado por CDN) tenga que existir. El flag hace la operación
// idempotente aunque se reinicialice el gráfico.
let _pluginsRegistered = false;

// R12: rueda de zoom / pan disparan sus "complete" en ráfaga. Se recompone la
// gráfica (con sus ajustes) una sola vez, ~120ms después de que el usuario frena.
let _fitRefreshTimer = null;
function debouncedFitRefresh() {
    clearTimeout(_fitRefreshTimer);
    _fitRefreshTimer = setTimeout(() => updateChart('none'), 120);
}

/**
 * Inicializa el gráfico de Chart.js
 */
export function initChart() {
    if (!_pluginsRegistered) {
        Chart.register(errorBarsPlugin);
        Chart.register(bullseyePointsPlugin);
        _pluginsRegistered = true;
    }

    const existingChart = Chart.getChart("myChart");
    if (existingChart) {
        existingChart.destroy();
    } else if (AppState.chart) {
        AppState.chart.destroy();
    }
    
    // Siempre comenzar con beginAtZero = true para que los ejes sean visibles
    const beginAtZero = true;
    
    const ctx = document.getElementById('myChart').getContext('2d');
    AppState.chart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 30,
                    right: 80,  // Espacio para etiqueta del eje X
                    bottom: 20,
                    left: 20
                }
            },
            plugins: {
                zoom: {
                    zoom: {
                        wheel: {
                            enabled: true,
                            speed: 0.05, // Reducir velocidad (default 0.1)
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'xy',
                        overScaleMode: 'xy', // Permite hacer zoom independiente en cada eje al posicionar el cursor sobre ellos
                        drag: {
                            enabled: false, // Deshabilitar drag zoom para evitar conflictos con pan
                        },
                        onZoomComplete: function ({ chart }) {
                            syncZoomState(chart);
                            // R12: la rueda dispara onZoomComplete en ráfaga; debounce
                            // para recomputar los ajustes una sola vez al frenar.
                            debouncedFitRefresh();
                        }
                    },
                    pan: {
                        enabled: true,
                        mode: 'xy',
                        modifierKey: null,
                        threshold: 10,
                        onPanStart: function ({ chart }) {
                            chart.canvas.style.cursor = 'grabbing';
                            AppState.isPanning = true;
                            hideCoordinatesTooltip();
                        },
                        onPanComplete: function ({ chart }) {
                            chart.canvas.style.cursor = 'grab';
                            AppState.isPanning = false;
                            // Sincronizar límites manuales con el nuevo estado del pan/zoom
                            syncZoomState(chart);
                            // Recalcula la curva extrapolada a los nuevos límites sin
                            // animación de rebote/flicker (R12: debounced).
                            debouncedFitRefresh();
                        }
                    },
                    limits: {
                        x: { minRange: 0.1 },
                        y: { minRange: 0.1 }
                    }
                },
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    // Filtrar todos los ítems para suprimir el tooltip nativo
                    // sin romper el sistema de detección de hover
                    filter: () => false
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    beginAtZero: beginAtZero,
                    position: 'bottom',
                    grace: '8%',
                    title: {
                        display: false,
                        text: 'X'
                    },
                    grid: {
                        display: true,
                        drawBorder: false,
                        color: (context) => context.tick.value === 0 ? '#333' : '#e5e5e5',
                        lineWidth: (context) => context.tick.value === 0 ? 2 : 1
                    },
                    ticks: {
                        display: true
                    }
                },
                y: {
                    beginAtZero: beginAtZero,
                    grace: '8%',
                    title: {
                        display: false,
                        text: 'Y'
                    },
                    grid: {
                        display: true,
                        drawBorder: false,
                        color: (context) => context.tick.value === 0 ? '#333' : '#e5e5e5',
                        lineWidth: (context) => context.tick.value === 0 ? 2 : 1
                    },
                    ticks: {
                        display: true
                    }
                }
            },
            onClick: function(e, elements) {
                // Reservado para futuros usos del clic sobre el gráfico.
            }
        }
    });

    // Escuchar mousemove en el canvas para mostrar coordenadas.
    // Se usa 'nearest' con intersect:false para facilitar el apuntado:
    // detecta el punto o segmento más cercano sin necesidad de estar exactamente encima.
    const canvas = document.getElementById('myChart');
    canvas.addEventListener('mousemove', function(e) {
        if (!AppState.chart) return;

        // Durante el arrastre (pan), no mostrar tooltip ni cambiar el cursor:
        // el plugin de zoom ya maneja el cursor 'grabbing'.
        if (AppState.isPanning) return;

        const elements = AppState.chart.getElementsAtEventForMode(
            e, 'nearest', { intersect: false, axis: 'x' }, false
        );

        if (elements.length === 0) {
            canvas.style.cursor = 'default';
            hideCoordinatesTooltip();
            return;
        }

        const { datasetIndex, index } = elements[0];
        const dataset = AppState.chart.data.datasets[datasetIndex];
        const label = dataset.label || '';

        const esInterno = label.includes('Caja Error')
            || label.includes('Tangente')
            || label.includes('Área')
            || label.includes('Pendiente')
            || label.includes('Punto Tangente')
            || label.includes('Incertidumbre');

        const esLineaAjuste = dataset.type === 'line' && !esInterno;
        const esPuntoUsuario = dataset.showLine === false && !esInterno;

        if (esLineaAjuste || esPuntoUsuario) {
            canvas.style.cursor = 'crosshair';
            const dataPoint = dataset.data[index];
            showCoordinatesTooltip(e, dataPoint.x, dataPoint.y);
        } else {
            canvas.style.cursor = 'default';
            hideCoordinatesTooltip();
        }
    });

    canvas.addEventListener('mouseleave', function() {
        hideCoordinatesTooltip();
    });
}

/**
 * Sincroniza los inputs de límites manuales con el estado del gráfico
 * después de hacer pan o zoom. Si el usuario había fijado un límite manualmente,
 * al arrastrar o hacer zoom ese límite debe actualizarse para no forzar
 * un reseteo visual al llamar a chart.update().
 *
 * B1: se escribe el MISMO valor redondeado a 4 decimales tanto en el input como
 * en `chart.options.scales`. Antes el input quedaba redondeado y las options con
 * el valor exacto; al editar después cualquier otro campo del panel,
 * `updateChartConfig()` releía el input redondeado y la vista "derivaba" unos
 * micro-pasos por ciclo pan/zoom → editar. 4 decimales están muy por debajo de
 * la resolución en píxeles, así que el snap es imperceptible.
 * @param {Chart} chart - Instancia del gráfico
 */
function syncZoomState(chart) {
    const syncLimit = (axis, limit, inputId) => {
        if (chart.options.scales[axis][limit] !== null && chart.options.scales[axis][limit] !== undefined) {
            const rounded = parseFloat(chart.scales[axis][limit].toFixed(4));
            chart.options.scales[axis][limit] = rounded;
            const input = document.getElementById(inputId);
            if (input) {
                input.value = formatNumber(rounded);
            }
        }
    };

    syncLimit('x', 'min', 'minX');
    syncLimit('x', 'max', 'maxX');
    syncLimit('y', 'min', 'minY');
    syncLimit('y', 'max', 'maxY');
}

/**
 * B2: los inputs del panel son la única fuente de verdad para los límites manuales.
 * Si un input está vacío, el límite correspondiente debe ser `null` para que Chart.js
 * reencuadre solo (al agregar/quitar datos o cambiar el ajuste). El pan/zoom no se
 * ve afectado porque `syncZoomState()` completa los inputs antes de que `updateChart`
 * corra. Devuelve true si algún límite cambió (para forzar reflow).
 * @param {Chart} chart
 * @returns {boolean}
 */
function reconcileManualLimits(chart) {
    let changed = false;
    const apply = (axis, limit, inputId) => {
        const el = document.getElementById(inputId);
        const raw = el ? el.value.trim() : '';
        const desired = raw === '' ? null : parseDecimal(raw);
        const current = chart.options.scales[axis][limit];
        if (raw === '' && current !== null && current !== undefined) {
            chart.options.scales[axis][limit] = null;
            changed = true;
        } else if (raw !== '' && !isNaN(desired) && current !== desired) {
            chart.options.scales[axis][limit] = desired;
            changed = true;
        }
    };
    apply('x', 'min', 'minX');
    apply('x', 'max', 'maxX');
    apply('y', 'min', 'minY');
    apply('y', 'max', 'maxY');
    return changed;
}

/**
 * Muestra las coordenadas del punto sobre la curva en un tooltip flotante.
 * @param {Event} e - Evento del mouse.
 * @param {number} x - Coordenada X.
 * @param {number} y - Coordenada Y.
 */
function showCoordinatesTooltip(e, x, y) {
    const tooltipId = 'coordinates-tooltip';
    let tooltip = document.getElementById(tooltipId);
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = tooltipId;
        tooltip.style.cssText = `
            position: absolute;
            background-color: rgba(0, 0, 0, 0.75);
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 2000;
            pointer-events: none;
            white-space: nowrap;
            display: none;
        `;
        document.body.appendChild(tooltip);
    }

    tooltip.textContent = `X: ${formatNumber(x, 4)}, Y: ${formatNumber(y, 4)}`;
    tooltip.style.left = `${e.x + 10}px`;
    tooltip.style.top = `${e.y + 10}px`;
    tooltip.style.display = 'block';
}

/**
 * Oculta el tooltip de coordenadas.
 */
function hideCoordinatesTooltip() {
    const tooltip = document.getElementById('coordinates-tooltip');
    if (tooltip) {
        tooltip.style.display = 'none';
    }
}

/**
 * Obtiene el rango de datos del gráfico
 * @returns {Object} Objeto con min y max
 */
export function getDataRange() {
    let minX = Infinity;
    let maxX = -Infinity;
    let hasData = false;

    if (AppState.chart && AppState.chart.data && AppState.chart.data.datasets) {
        AppState.chart.data.datasets.forEach(dataset => {
            // R3: sólo cuenta el dataset con puntos reales del usuario. Antes se
            // adivinaba por el texto del label (`includes('Tangente')`…), lo que
            // dejaba pasar la línea de ajuste (label = nombre de serie) y sus
            // puntos extrapolados, y excluía series con nombres como "Tangente 1".
            if (!dataset._userData) return;

            if (dataset.data && dataset.data.length > 0) {
                dataset.data.forEach(p => {
                    if (p.x !== undefined && p.x !== null) {
                        const val = parseDecimal(p.x);
                        if (!isNaN(val)) {
                            if (val < minX) minX = val;
                            if (val > maxX) maxX = val;
                            hasData = true;
                        }
                    }
                });
            }
        });
    }

    if (!hasData) {
        // Fallback a escalas si no hay datos crudos
        if (AppState.chart && AppState.chart.scales && AppState.chart.scales.x) {
            const xScale = AppState.chart.scales.x;
            const min = typeof xScale.min === 'number' && !isNaN(xScale.min) ? xScale.min : 0;
            const max = typeof xScale.max === 'number' && !isNaN(xScale.max) ? xScale.max : 10;
            return { min, max };
        }
        return { min: 0, max: 10 };
    }

    return { min: minX, max: maxX };
}

function getVisibleXRange() {
    if (!AppState.chart || !AppState.chart.scales || !AppState.chart.scales.x) {
        return null;
    }

    const xScale = AppState.chart.scales.x;
    const min = typeof xScale.min === 'number' && !isNaN(xScale.min) ? xScale.min :
        (xScale.options && typeof xScale.options.min === 'number' && !isNaN(xScale.options.min) ? xScale.options.min : null);
    const max = typeof xScale.max === 'number' && !isNaN(xScale.max) ? xScale.max :
        (xScale.options && typeof xScale.options.max === 'number' && !isNaN(xScale.options.max) ? xScale.options.max : null);

    return { min, max };
}

/**
 * Actualiza el gráfico con los datos actuales
 */
export function updateChart(animationMode) {
    const datasets = [];

    // B2: mantener los límites del gráfico alineados con los inputs del panel
    // (un input vacío ⇒ límite automático) para que la vista reencuadre al
    // agregar/quitar datos o cambiar el ajuste, respetando a la vez el pan/zoom
    // (que rellena los inputs vía syncZoomState antes de llegar acá).
    if (AppState.chart) reconcileManualLimits(AppState.chart);

    const showUncertaintyLinesCheckbox = document.getElementById('showUncertaintyLines');
    const showUncertaintyLines = showUncertaintyLinesCheckbox ? showUncertaintyLinesCheckbox.checked : false;
    const extrapolateNeg = document.getElementById('extrapolateNegInfinity')?.checked ?? false;
    const extrapolatePos = document.getElementById('extrapolatePosInfinity')?.checked ?? false;

    const xErr = parseDecimal(AppState.config.defaultXError || 0) || 0;
    const yErr = parseDecimal(AppState.config.defaultYError || 0) || 0;

    AppState.series.forEach(serie => {
        // R1: numericPoints descarta celdas no numéricas ("abc") que envenenaban los ajustes.
        const validData = numericPoints(serie).map(p => ({ ...p, xError: xErr, yError: yErr }));

        if (validData.length === 0) return;

        datasets.push({
            label: serie.name,
            data: validData,
            backgroundColor: serie.color,
            borderColor: serie.color,
            showLine: false,
            pointRadius: 0,       // El plugin bullseyePoints dibuja los puntos visualmente
            pointHitRadius: 12,   // Área de detección de hover (invisible)
            errorBars: true,
            _userData: true      // R3: el ÚNICO dataset con puntos reales del usuario
        });

        if (serie.fitType !== 'none' && validData.length >= 2) {
            const xLabel = AppState.chart.options.scales.x.title.text || 'X';
            const yLabel = AppState.chart.options.scales.y.title.text || 'Y';

            const dataRange = getDataRange();
            const visibleXRange = getVisibleXRange();

            let chartXMin = visibleXRange?.min;
            let chartXMax = visibleXRange?.max;

            if (chartXMin === null || chartXMin === undefined) {
                chartXMin = AppState.chart?.options?.scales?.x?.min;
            }
            if (chartXMax === null || chartXMax === undefined) {
                chartXMax = AppState.chart?.options?.scales?.x?.max;
            }
            if (chartXMin === null || chartXMin === undefined) chartXMin = dataRange.min;
            if (chartXMax === null || chartXMax === undefined) chartXMax = dataRange.max;

            const fitMin = extrapolateNeg ? chartXMin : undefined;
            const fitMax = extrapolatePos ? chartXMax : undefined;

            const fit = calculateFit(validData, serie.fitType, xLabel, yLabel, {
                min: fitMin,
                max: fitMax
            });
            serie.equation = fit.equation;
            serie.r2 = fit.r2;

            datasets.push({
                type: 'line',
                label: serie.name, // Solo "Serie 1" u "Otro nombre"
                data: fit.points,
                borderColor: '#000000',  // Negro
                backgroundColor: 'transparent',
                showLine: true,
                pointRadius: 0,
                borderWidth: 2,
                borderDash: [],  // Línea continua
                fill: false,
                tension: 0.4,
                pointStyle: 'line' // Mostrar como línea en leyenda
            });

            // Add uncertainty lines and error boxes if enabled and available
            if (showUncertaintyLines && fit.uncertainty && fit.maxSlopePoints && fit.maxSlopePoints.length > 0) {
                // Extraer unidades de las etiquetas de los ejes
                const xUnit = extractUnit(xLabel);
                const yUnit = extractUnit(yLabel);

                // Construir unidad de la pendiente (y/x)
                let slopeUnit = '';
                if (yUnit && xUnit) {
                    slopeUnit = ` ${yUnit}/${xUnit}`;
                } else if (yUnit) {
                    slopeUnit = ` ${yUnit}`;
                }

                // Formatear valores con cifras significativas correctas
                const formattedMax = formatWithUncertainty(fit.uncertainty.mMax, fit.uncertainty.slope);
                const formattedMin = formatWithUncertainty(fit.uncertainty.mMin, fit.uncertainty.slope);

                datasets.push({
                    type: 'line',
                    label: `Pendiente Máxima (m=${formattedMax.value}${slopeUnit})`,
                    data: fit.maxSlopePoints,
                    borderColor: '#dc3545',  // Rojo
                    backgroundColor: 'transparent',
                    showLine: true,
                    pointRadius: 0,
                    borderWidth: 1.5,
                    borderDash: [],  // Línea continua
                    fill: false,
                    tension: 0
                });
                datasets.push({
                    type: 'line',
                    label: `Pendiente Mínima (m=${formattedMin.value}${slopeUnit})`,
                    data: fit.minSlopePoints,
                    borderColor: '#007bff',  // Azul
                    backgroundColor: 'transparent',
                    showLine: true,
                    pointRadius: 0,
                    borderWidth: 1.5,
                    borderDash: [],  // Línea continua
                    fill: false,
                    tension: 0
                });

                // Draw Error Boxes for Endpoints to visualize the method
                if (validData.length >= 2) {
                    const sortedData = [...validData].sort((a, b) => a.x - b.x);
                    const p1 = sortedData[0];
                    const pn = sortedData[sortedData.length - 1];

                    const boxPoints = [p1, pn];

                    boxPoints.forEach((p, idx) => {
                        // Create a rectangle for the error box
                        const boxData = [
                            { x: p.x - p.xError, y: p.y + p.yError },
                            { x: p.x + p.xError, y: p.y + p.yError },
                            { x: p.x + p.xError, y: p.y - p.yError },
                            { x: p.x - p.xError, y: p.y - p.yError },
                            { x: p.x - p.xError, y: p.y + p.yError }
                        ];

                        datasets.push({
                            type: 'line',
                            label: `Caja Error ${idx === 0 ? 'Inicial' : 'Final'}`,
                            data: boxData,
                            borderColor: 'rgba(100, 100, 100, 0.5)',
                            backgroundColor: 'rgba(100, 100, 100, 0.1)',
                            showLine: true,
                            pointRadius: 0,
                            borderWidth: 1,
                            fill: true,
                            tension: 0
                        });
                    });
                }
            }

            const eqDiv = document.getElementById(`eq-${serie.id}`);
            if (eqDiv) {
                eqDiv.style.display = 'block';

                // Visualización de herramientas de cálculo.
                // A5: reutilizar los coeficientes que ya calculó calculateFit()
                // en lugar de rehacer la regresión en cada refresco (pan/zoom incluidos).
                const coeffs = fit.coeffs;

                // 1. TANGENTE (DERIVADA)
                const tangentDisplay = document.getElementById('tangentDisplay');
                if (AppState.tools.showTangent && coeffs) {
                    const tx = AppState.tools.tangentX;
                    const slope = calculateDerivative(tx, coeffs, serie.fitType);
                    // R4: misma función de ajuste que usa calculateFit (sin re-switch por tipo)
                    const y0 = fit.fitFunc ? fit.fitFunc(tx) : NaN;

                    if (!Number.isFinite(slope) || !Number.isFinite(y0)) {
                        // Fuera del dominio (ej. x ≤ 0 en logarítmico/potencial)
                        if (tangentDisplay) {
                            tangentDisplay.innerHTML = `<span style="color:#e67e22;">x = ${formatNumber(tx, 4)} está fuera del dominio de este ajuste.</span>`;
                        }
                    } else {
                    let minX = AppState.chart.scales.x ? AppState.chart.scales.x.min : validData[0].x;
                    let maxX = AppState.chart.scales.x ? AppState.chart.scales.x.max : validData[validData.length - 1].x;
                    const rangeX = maxX - minX;
                    const deltaX = rangeX * 0.15;

                    // Clampear la tangente a los límites de los datos para evitar que el gráfico se estire
                    const dataXs = validData.map(p => p.x);
                    const dataMin = Math.min(...dataXs);
                    const dataMax = Math.max(...dataXs);

                    let x1 = AppState.tools.tangentX - deltaX;
                    let x2 = AppState.tools.tangentX + deltaX;

                    if (x1 < dataMin) x1 = dataMin;
                    if (x2 > dataMax) x2 = dataMax;

                    const y1 = slope * (x1 - AppState.tools.tangentX) + y0;
                    const y2 = slope * (x2 - AppState.tools.tangentX) + y0;

                    datasets.push({
                        type: 'line',
                        label: 'Tangente',
                        data: [{ x: x1, y: y1 }, { x: x2, y: y2 }],
                        borderColor: '#e74c3c',
                        borderWidth: 2,
                        pointRadius: 0,
                        showLine: true,
                        fill: false,
                        borderDash: [5, 5]
                    });

                    datasets.push({
                        type: 'scatter',
                        label: 'Punto Tangente',
                        data: [{ x: AppState.tools.tangentX, y: y0 }],
                        backgroundColor: '#e74c3c',
                        pointRadius: 6,
                        pointHoverRadius: 8
                    });

                    if (tangentDisplay) {
                        const xUnit = extractUnit(xLabel);
                        const yUnit = extractUnit(yLabel);
                        const derivativeUnit = (yUnit && xUnit) ? ` ${yUnit}/${xUnit}` : '';

                        tangentDisplay.innerHTML = `
                            <strong>x = ${formatNumber(tx, 4)}${xUnit ? ' ' + xUnit : ''}</strong><br>
                            y = ${formatNumber(y0, 4)}${yUnit ? ' ' + yUnit : ''}<br>
                            <strong>Pendiente (dy/dx) = ${formatNumber(slope, 4)}${derivativeUnit}</strong>
                        `;
                    }
                    } // fin else (tangente dentro del dominio)
                }

                // 2. ÁREA (INTEGRAL)
                if (AppState.tools.showArea && coeffs) {
                    const area = calculateIntegral(AppState.tools.areaX1, AppState.tools.areaX2, coeffs, serie.fitType);

                    const areaPoints = [];
                    const steps = 50;
                    const stepSize = (AppState.tools.areaX2 - AppState.tools.areaX1) / steps;

                    for (let i = 0; i <= steps; i++) {
                        const x = AppState.tools.areaX1 + i * stepSize;
                        // R4: misma función de ajuste que la tangente y calculateFit
                        const y = fit.fitFunc ? fit.fitFunc(x) : NaN;
                        if (Number.isFinite(y)) areaPoints.push({ x, y });
                    }

                    datasets.push({
                        type: 'line',
                        label: 'Área',
                        data: areaPoints,
                        borderColor: 'transparent',
                        backgroundColor: 'rgba(108, 92, 231, 0.3)',
                        borderWidth: 0,
                        pointRadius: 0,
                        fill: 'origin',
                        showLine: true
                    });

                    const areaDisplay = document.getElementById('areaDisplay');
                    if (areaDisplay) {
                        const xUnit = extractUnit(xLabel);
                        const yUnit = extractUnit(yLabel);
                        const integralUnit = (yUnit && xUnit) ? ` ${yUnit}·${xUnit}` : '';
                        const formattedX1 = formatNumber(AppState.tools.areaX1, 4);
                        const formattedX2 = formatNumber(AppState.tools.areaX2, 4);

                        // R8: e^(bx) puede desbordar a Infinity con un intervalo/exponente grande.
                        if (!Number.isFinite(area)) {
                            areaDisplay.innerHTML = `<span style="color:#e67e22;">El área en [${formattedX1}, ${formattedX2}] es demasiado grande para calcularla (desbordamiento numérico).</span>`;
                        } else {
                            areaDisplay.innerHTML = `
                                <strong>Intervalo: [${formattedX1}, ${formattedX2}]${xUnit ? ' ' + xUnit : ''}</strong><br>
                                <strong>Área (∫y dx) = ${formatNumber(area, 4)}${integralUnit}</strong>
                            `;
                        }
                    }
                }

                let uncertaintyHtml = '';
                if (showUncertaintyLines && fit.uncertainty && fit.uncertainty.mMax !== undefined) {
                    const u = fit.uncertainty;
                    const deltaM = (u.mMax - u.mMin) / 2;

                    const xUnit = extractUnit(xLabel);
                    const yUnit = extractUnit(yLabel);

                    let slopeUnit = '';
                    if (yUnit && xUnit) {
                        slopeUnit = ` ${yUnit}/${xUnit}`;
                    } else if (yUnit) {
                        slopeUnit = ` ${yUnit}`;
                    }

                    const formattedMax = formatWithUncertainty(u.mMax, u.slope);
                    const formattedMin = formatWithUncertainty(u.mMin, u.slope);
                    const formattedBest = formatWithUncertainty(u.mBest, u.slope);
                    const formattedDelta = formatWithUncertainty(deltaM, u.slope);

                    uncertaintyHtml = `
                        <div style="margin-top: 5px; font-size: 0.9em; border-top: 1px solid #eee; padding-top: 5px;">
                            <strong>Análisis de Pendiente:</strong><br>
                            m<sub>max</sub> = ${formattedMax.value}${slopeUnit}<br>
                            m<sub>min</sub> = ${formattedMin.value}${slopeUnit}<br>
                            m<sub>mejor</sub> = ${formattedBest.value}${slopeUnit}<br>
                            <strong>Δm = (m<sub>max</sub> - m<sub>min</sub>) / 2 = ${formattedDelta.value}${slopeUnit}</strong>
                        </div>
                    `;
                } else if (showUncertaintyLines && fit.uncertaintyWarning === 'overlap') {
                    uncertaintyHtml = `
                        <div style="margin-top: 5px; font-size: 0.9em; color: #e67e22; border-top: 1px solid #eee; padding-top: 5px;">
                            ⚠️ Las cajas de error en X de los puntos extremos se solapan: no se puede
                            estimar la incertidumbre de la pendiente (Δm) por el método de máx/mín.
                            Reducí la incertidumbre en X o separá más los puntos extremos.
                        </div>
                    `;
                } else if (showUncertaintyLines && serie.fitType === 'linear') {
                    uncertaintyHtml = `
                        <div style="margin-top: 5px; font-size: 0.9em; color: #e67e22; border-top: 1px solid #eee; padding-top: 5px;">
                            ⚠️ Para ver el análisis de incertidumbre, debes ingresar valores de error (Δx o Δy) en la tabla de datos.
                        </div>
                    `;
                }

                eqDiv.innerHTML = `
                    <strong>Ecuación:</strong> ${fit.equation}
                    <button class="help-btn" data-on-click="toggleHelp" data-serie="${serie.id}" data-fit-type="${serie.fitType}">i</button>
                    ${fit.r2 !== null ? `<br><strong>R² =</strong> ${formatNumber(fit.r2, 6)}` : ''}
                    ${uncertaintyHtml}
                    <div class="help-text" id="help-${serie.id}"></div>
                `;
            }
        } else {
            const eqDiv = document.getElementById(`eq-${serie.id}`);
            if (eqDiv) {
                eqDiv.style.display = 'none';
            }
        }
    });

    AppState.chart.data.datasets = datasets;
    AppState.chart.update(animationMode);
}

/**
 * Restablece el zoom del gráfico
 */
export function resetZoom() {
    if (!AppState.chart) return;
    AppState.chart.resetZoom();

    AppState.chart.options.scales.x.min = null;
    AppState.chart.options.scales.x.max = null;
    AppState.chart.options.scales.y.min = null;
    AppState.chart.options.scales.y.max = null;

    document.getElementById('minX').value = '';
    document.getElementById('maxX').value = '';
    document.getElementById('minY').value = '';
    document.getElementById('maxY').value = '';

    updateChart('none');
}

/**
 * Acerca el zoom del gráfico
 */
export function zoomIn() {
    if (!AppState.chart) return;
    AppState.chart.zoom(1.2);
    syncZoomState(AppState.chart);
    updateChart('none');
}

/**
 * Aleja el zoom del gráfico
 */
export function zoomOut() {
    if (!AppState.chart) return;
    AppState.chart.zoom(0.8);
    syncZoomState(AppState.chart);
    updateChart('none');
}
