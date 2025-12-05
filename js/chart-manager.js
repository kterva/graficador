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
import { errorBarsPlugin } from './chart-plugins.js';
import { calculateFit, calculateDerivative, calculateIntegral, getRegressionCoeffs } from './calculations.js';
import { extractUnit, formatWithUncertainty } from './utils.js';

/**
 * Inicializa el gráfico de Chart.js
 */
export function initChart() {
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
                        drag: {
                            enabled: false, // Deshabilitar drag zoom para evitar conflictos con pan
                        }
                    },
                    pan: {
                        enabled: true,
                        mode: 'xy',
                        modifierKey: null, // No requiere tecla modificadora, solo arrastrar
                        onPanStart: function ({ chart }) {
                            chart.canvas.style.cursor = 'grabbing';
                        },
                        onPanComplete: function ({ chart }) {
                            chart.canvas.style.cursor = 'grab';
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
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: false, // Ocultamos el título original, lo dibujará el plugin
                        text: 'X'
                    },
                    grid: {
                        display: true,
                        drawBorder: false // Ocultar borde del eje
                    },
                    ticks: {
                        display: true // Mantener los números
                    }
                },
                y: {
                    title: {
                        display: false, // Ocultamos el título original, lo dibujará el plugin
                        text: 'Y'
                    },
                    grid: {
                        display: true,
                        drawBorder: false // Ocultar borde del eje
                    },
                    ticks: {
                        display: true // Mantener los números
                    }
                }
            }
        }
    });

    // Registrar plugins
    Chart.register(errorBarsPlugin);
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
            // Ignorar datasets generados (ajustes, tangentes, etc.)
            if (dataset.label && (dataset.label.includes('Ajuste') || dataset.label.includes('Tangente') || dataset.label.includes('Área') || dataset.label.includes('Pendiente'))) {
                return;
            }

            if (dataset.data && dataset.data.length > 0) {
                dataset.data.forEach(p => {
                    if (p.x !== undefined && p.x !== null) {
                        const val = parseFloat(p.x);
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
            return { min: AppState.chart.scales.x.min || 0, max: AppState.chart.scales.x.max || 10 };
        }
        return { min: 0, max: 10 };
    }

    return { min: minX, max: maxX };
}

/**
 * Actualiza el gráfico con los datos actuales
 */
export function updateChart() {
    const datasets = [];
    const showUncertaintyLines = document.getElementById('showUncertaintyLines').checked;

    AppState.series.forEach(serie => {
        const validData = serie.data.filter(p => p.x !== '' && p.y !== '').map(p => ({
            x: parseFloat(p.x),
            y: parseFloat(p.y),
            xError: parseFloat(p.xError || 0),
            yError: parseFloat(p.yError || 0)
        }));

        if (validData.length === 0) return;

        datasets.push({
            label: serie.name,
            data: validData,
            backgroundColor: serie.color,
            borderColor: serie.color,
            showLine: false,
            pointRadius: 5,
            errorBars: true
        });

        if (serie.fitType !== 'none' && validData.length >= 2) {
            const xLabel = AppState.chart.options.scales.x.title.text || 'X';
            const yLabel = AppState.chart.options.scales.y.title.text || 'Y';
            const fit = calculateFit(validData, serie.fitType, xLabel, yLabel);
            serie.equation = fit.equation;
            serie.r2 = fit.r2;

            datasets.push({
                type: 'line',
                label: `Ajuste: ${serie.name}`,
                data: fit.points,
                borderColor: '#000000',  // Negro
                backgroundColor: 'transparent',
                showLine: true,
                pointRadius: 0,
                borderWidth: 2,
                borderDash: [],  // Línea continua
                fill: false,
                tension: 0.4
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

                // Visualización de herramientas de cálculo
                const coeffs = getRegressionCoeffs(validData, serie.fitType);

                // 1. TANGENTE (DERIVADA)
                if (AppState.tools.showTangent && coeffs) {
                    const slope = calculateDerivative(AppState.tools.tangentX, coeffs, serie.fitType);

                    let minX = AppState.chart.scales.x ? AppState.chart.scales.x.min : validData[0].x;
                    let maxX = AppState.chart.scales.x ? AppState.chart.scales.x.max : validData[validData.length - 1].x;
                    const rangeX = maxX - minX;
                    const deltaX = rangeX * 0.15;

                    let y0 = 0;
                    if (serie.fitType === 'linear') {
                        y0 = coeffs.a * AppState.tools.tangentX + coeffs.b;
                    } else if (serie.fitType === 'poly2') {
                        y0 = coeffs[0] * AppState.tools.tangentX * AppState.tools.tangentX + coeffs[1] * AppState.tools.tangentX + coeffs[2];
                    }

                    const x1 = AppState.tools.tangentX - deltaX;
                    const x2 = AppState.tools.tangentX + deltaX;
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

                    const tangentDisplay = document.getElementById('tangentDisplay');
                    if (tangentDisplay) {
                        // Extraer unidades de las etiquetas de los ejes
                        const xUnit = extractUnit(xLabel);
                        const yUnit = extractUnit(yLabel);

                        // Construir unidad de la derivada (dy/dx = y/x)
                        let derivativeUnit = '';
                        if (yUnit && xUnit) {
                            derivativeUnit = ` ${yUnit}/${xUnit}`;
                        }

                        // Formatear con cifras significativas
                        const formattedX = AppState.tools.tangentX.toFixed(4);
                        const formattedY = y0.toFixed(4);
                        const formattedSlope = slope.toFixed(4);

                        tangentDisplay.innerHTML = `
                            <strong>x = ${formattedX}${xUnit ? ' ' + xUnit : ''}</strong><br>
                            y = ${formattedY}${yUnit ? ' ' + yUnit : ''}<br>
                            <strong>Pendiente (dy/dx) = ${formattedSlope}${derivativeUnit}</strong>
                        `;
                    }
                }

                // 2. ÁREA (INTEGRAL)
                if (AppState.tools.showArea && coeffs) {
                    const area = calculateIntegral(AppState.tools.areaX1, AppState.tools.areaX2, coeffs, serie.fitType);

                    const areaPoints = [];
                    const steps = 50;
                    const stepSize = (AppState.tools.areaX2 - AppState.tools.areaX1) / steps;

                    for (let i = 0; i <= steps; i++) {
                        const x = AppState.tools.areaX1 + i * stepSize;
                        let y = 0;
                        if (serie.fitType === 'linear') {
                            y = coeffs.a * x + coeffs.b;
                        } else if (serie.fitType === 'poly2') {
                            y = coeffs[0] * x * x + coeffs[1] * x + coeffs[2];
                        }
                        areaPoints.push({ x, y });
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
                        // Extraer unidades de las etiquetas de los ejes
                        const xUnit = extractUnit(xLabel);
                        const yUnit = extractUnit(yLabel);

                        // Construir unidad de la integral (∫y dx = y·x)
                        let integralUnit = '';
                        if (yUnit && xUnit) {
                            integralUnit = ` ${yUnit}·${xUnit}`;
                        }

                        // Formatear con cifras significativas
                        const formattedX1 = AppState.tools.areaX1.toFixed(4);
                        const formattedX2 = AppState.tools.areaX2.toFixed(4);
                        const formattedArea = area.toFixed(4);

                        areaDisplay.innerHTML = `
                            <strong>Intervalo: [${formattedX1}, ${formattedX2}]${xUnit ? ' ' + xUnit : ''}</strong><br>
                            <strong>Área (∫y dx) = ${formattedArea}${integralUnit}</strong>
                        `;
                    }
                }

                let uncertaintyHtml = '';
                if (fit.uncertainty && fit.uncertainty.mMax !== undefined) {
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
                } else if (showUncertaintyLines && serie.fitType === 'linear') {
                    uncertaintyHtml = `
                        <div style="margin-top: 5px; font-size: 0.9em; color: #e67e22; border-top: 1px solid #eee; padding-top: 5px;">
                            ⚠️ Para ver el análisis de incertidumbre, debes ingresar valores de error (Δx o Δy) en la tabla de datos.
                        </div>
                    `;
                }

                eqDiv.innerHTML = `
                    <strong>Ecuación:</strong> ${fit.equation}
                    <button class="help-btn" onclick="toggleHelp(${serie.id}, '${serie.fitType}')">?</button>
                    <br><strong>R² =</strong> ${fit.r2.toFixed(6)}
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
    AppState.chart.update();
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

    AppState.chart.update();
}

/**
 * Acerca el zoom del gráfico
 */
export function zoomIn() {
    if (!AppState.chart) return;
    AppState.chart.zoom(1.2);
}

/**
 * Aleja el zoom del gráfico
 */
export function zoomOut() {
    if (!AppState.chart) return;
    AppState.chart.zoom(0.8);
}
