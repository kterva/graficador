/**
 * ============================================
 * GRAFICADOR CON AJUSTES DE FUNCIONES
 * ============================================
 * 
 * Aplicación web para visualizar datos experimentales y realizar
 * ajustes de curvas con análisis de incertidumbre.
 * 
 * @author Graficador Team
 * @version 1.1.0
 */

// ============================================
// VARIABLES GLOBALES Y ESTADO
// ============================================

// Flag de desarrollo: true para activar herramientas de prueba, false para producción
const IS_DEVELOPMENT = true;

/**
 * Array de series de datos del usuario
 * @type {Array<Serie>}
 */
let series = [];

/**
 * Contador para generar IDs únicos de series
 * @type {number}
 */
let serieCounter = 0;

/**
 * Instancia del gráfico de Chart.js
 * @type {Chart|null}
 */
let chart = null;

/**
 * Paleta de colores para las series
 * @type {string[]}
 */
const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22'];

// Estado de herramientas de cálculo
let showTangent = false;
let tangentX = 0;
let showArea = false;
let areaX1 = 0;
let areaX2 = 0;

// ============================================
// PLUGIN DE BARRAS DE ERROR
// ============================================

/**
 * Plugin personalizado de Chart.js para dibujar barras de error
 * en los puntos de datos
 */
const errorBarsPlugin = {
    id: 'errorBars',
    afterDatasetsDraw(chart, args, options) {
        const { ctx } = chart;

        chart.data.datasets.forEach((dataset, i) => {
            const meta = chart.getDatasetMeta(i);
            if (!meta.hidden && dataset.errorBars) {
                ctx.save();
                ctx.strokeStyle = dataset.borderColor || 'black';
                ctx.lineWidth = 1;

                dataset.data.forEach((point, index) => {
                    if (point.xError || point.yError) {
                        const model = meta.data[index];
                        if (!model) return;

                        const x = model.x;
                        const y = model.y;

                        // Draw X error bars
                        if (point.xError) {
                            const xErrPix = Math.abs(chart.scales.x.getPixelForValue(point.x + point.xError) - chart.scales.x.getPixelForValue(point.x));

                            ctx.beginPath();
                            ctx.moveTo(x - xErrPix, y);
                            ctx.lineTo(x + xErrPix, y);
                            // Caps
                            ctx.moveTo(x - xErrPix, y - 3);
                            ctx.lineTo(x - xErrPix, y + 3);
                            ctx.moveTo(x + xErrPix, y - 3);
                            ctx.lineTo(x + xErrPix, y + 3);
                            ctx.stroke();
                        }

                        // Draw Y error bars
                        if (point.yError) {
                            const yErrPix = Math.abs(chart.scales.y.getPixelForValue(point.y + point.yError) - chart.scales.y.getPixelForValue(point.y));

                            ctx.beginPath();
                            ctx.moveTo(x, y - yErrPix);
                            ctx.lineTo(x, y + yErrPix);
                            // Caps
                            ctx.moveTo(x - 3, y - yErrPix);
                            ctx.lineTo(x + 3, y - yErrPix);
                            ctx.moveTo(x - 3, y + yErrPix);
                            ctx.lineTo(x + 3, y + yErrPix);
                            ctx.stroke();
                        }
                    }
                });
                ctx.restore();
            }
        });
    }
};

Chart.register(errorBarsPlugin);

// ============================================
// FUNCIONES AUXILIARES PARA UNIDADES Y FORMATO
// ============================================

/**
 * Extrae la unidad de una etiqueta de eje
 * Ej: "Tiempo (s)" -> "s", "Velocidad (m/s)" -> "m/s"
 */
function extractUnit(label) {
    const match = label.match(/\(([^)]+)\)/);
    return match ? match[1] : '';
}

/**
 * Calcula el número de cifras significativas basado en la incertidumbre
 * Regla: La incertidumbre se redondea a 1-2 cifras significativas,
 * y el valor se redondea al mismo decimal.
 */
function formatWithUncertainty(value, uncertainty) {
    if (!uncertainty || uncertainty === 0) {
        return value.toFixed(4); // Sin incertidumbre, usar 4 decimales
    }

    // Encontrar el orden de magnitud de la incertidumbre
    const orderOfMagnitude = Math.floor(Math.log10(Math.abs(uncertainty)));

    // Redondear incertidumbre a 1 cifra significativa
    const uncertaintyRounded = Math.round(uncertainty / Math.pow(10, orderOfMagnitude)) * Math.pow(10, orderOfMagnitude);

    // Determinar decimales necesarios
    const decimals = Math.max(0, -orderOfMagnitude);

    return {
        value: value.toFixed(decimals),
        uncertainty: uncertaintyRounded.toFixed(decimals)
    };
}

function initChart() {
    const ctx = document.getElementById('myChart').getContext('2d');
    chart = new Chart(ctx, {
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
}

function addSerie() {
    const id = serieCounter++;
    const color = colors[id % colors.length];

    const serie = {
        id: id,
        name: `Serie ${id + 1}`,
        color: color,
        data: [{ x: '', y: '', xError: 0, yError: 0 }],
        fitType: 'none',
        equation: '',
        r2: null
    };

    series.push(serie);
    renderSeries();
}

function removeSerie(id) {
    series = series.filter(s => s.id !== id);
    renderSeries();
    updateChart();
}

function renderSeries() {
    const container = document.getElementById('series-container');
    container.innerHTML = '';

    series.forEach(serie => {
        const div = document.createElement('div');
        div.className = 'serie-section';
        div.innerHTML = `
                    <div class="serie-header">
                        <span class="serie-name">${serie.name}</span>
                        <div>
                            <input type="file" id="file-${serie.id}" style="display:none" accept=".csv" onchange="handleFileSelect(${serie.id}, this)">
                            <button class="btn btn-primary" style="padding: 2px 8px; font-size: 12px;" onclick="importCSV(${serie.id})">Importar CSV</button>
                            <button class="btn btn-primary" style="padding: 2px 8px; font-size: 12px;" onclick="exportCSV(${serie.id})">Exportar CSV</button>
                            <button class="btn btn-danger" style="padding: 2px 8px; font-size: 12px;" onclick="clearTable(${serie.id})">Limpiar</button>
                            <button class="btn-remove-serie" onclick="removeSerie(${serie.id})">Eliminar</button>
                        </div>
                    </div>
                    
                    <label>Color:</label>
                    <input type="color" class="color-input" value="${serie.color}" 
                           onchange="updateSerieColor(${serie.id}, this.value)">
                    
                    <label style="display:block; margin-top:10px;">Tipo de Ajuste:</label>
                    <select onchange="updateFitType(${serie.id}, this.value)">
                        <option value="none">Sin ajuste</option>
                        <option value="linear">Lineal</option>
                        <option value="poly2">Polinomial (grado 2)</option>
                        <option value="poly3">Polinomial (grado 3)</option>
                        <option value="exponential">Exponencial</option>
                        <option value="logarithmic">Logarítmico</option>
                        <option value="power">Potencial</option>
                    </select>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>X</th>
                                <th>±X</th>
                                <th>Y</th>
                                <th>±Y</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody id="table-${serie.id}">
                        </tbody>
                    </table>
                    <button class="btn btn-primary" onclick="addRow(${serie.id})">+ Agregar Fila</button>
                    <button class="btn btn-primary" onclick="updateChart()">Graficar</button>
                    
                    <div class="equation-display" id="eq-${serie.id}" style="display:none;"></div>
                `;
        container.appendChild(div);
        renderTable(serie.id);
    });
}

function renderTable(serieId) {
    const serie = series.find(s => s.id === serieId);
    const tbody = document.getElementById(`table-${serieId}`);
    tbody.innerHTML = '';

    serie.data.forEach((point, index) => {
        const row = tbody.insertRow();
        row.innerHTML = `
                    <td><input type="number" step="any" value="${point.x}" 
                               data-serie="${serieId}" data-row="${index}" data-col="0"
                               onkeydown="handleKeyDown(event, ${serieId}, ${index}, 0)"
                               onchange="updatePoint(${serieId}, ${index}, 'x', this.value)"></td>
                    <td><input type="number" step="any" value="${point.xError || 0}" 
                               data-serie="${serieId}" data-row="${index}" data-col="1"
                               onkeydown="handleKeyDown(event, ${serieId}, ${index}, 1)"
                               onchange="updatePoint(${serieId}, ${index}, 'xError', this.value)" placeholder="0"></td>
                    <td><input type="number" step="any" value="${point.y}" 
                               data-serie="${serieId}" data-row="${index}" data-col="2"
                               onkeydown="handleKeyDown(event, ${serieId}, ${index}, 2)"
                               onchange="updatePoint(${serieId}, ${index}, 'y', this.value)"></td>
                    <td><input type="number" step="any" value="${point.yError || 0}" 
                               data-serie="${serieId}" data-row="${index}" data-col="3"
                               onkeydown="handleKeyDown(event, ${serieId}, ${index}, 3)"
                               onchange="updatePoint(${serieId}, ${index}, 'yError', this.value)" placeholder="0"></td>
                    <td><button class="btn btn-danger" onclick="removeRow(${serieId}, ${index})">×</button></td>
                `;
    });
}

function addRow(serieId) {
    const serie = series.find(s => s.id === serieId);
    serie.data.push({ x: '', y: '', xError: 0, yError: 0 });
    renderTable(serieId);
}

function removeRow(serieId, index) {
    const serie = series.find(s => s.id === serieId);
    if (serie.data.length > 1) {
        serie.data.splice(index, 1);
        renderTable(serieId);
    }
}

function updatePoint(serieId, index, axis, value) {
    const serie = series.find(s => s.id === serieId);
    serie.data[index][axis] = value;
    updateChart(); // Auto-update chart when data changes
}

function updateSerieColor(serieId, color) {
    const serie = series.find(s => s.id === serieId);
    serie.color = color;
    updateChart();
}

function updateFitType(serieId, fitType) {
    const serie = series.find(s => s.id === serieId);
    serie.fitType = fitType;
    updateChart();
}

function exportCSV(serieId) {
    const serie = series.find(s => s.id === serieId);
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "X,Y,xError,yError\n";

    serie.data.forEach(p => {
        if (p.x !== '' && p.y !== '') {
            csvContent += `${p.x},${p.y},${p.xError || 0},${p.yError || 0}\n`;
        }
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${serie.name.replace(/\s+/g, '_')}_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function importCSV(serieId) {
    document.getElementById(`file-${serieId}`).click();
}

function clearTable(serieId) {
    if (confirm('¿Estás seguro de que quieres borrar todos los datos de esta serie?')) {
        const serie = series.find(s => s.id === serieId);
        serie.data = [{ x: '', y: '', xError: 0, yError: 0 }];
        renderTable(serieId);
        updateChart();
    }
}

function handleKeyDown(event, serieId, rowIndex, colIndex) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const serie = series.find(s => s.id === serieId);

        // If it's the last row, add a new one
        if (rowIndex === serie.data.length - 1) {
            addRow(serieId);
        }

        // Focus the cell below
        // We need to wait for renderTable to complete if a row was added
        setTimeout(() => {
            const nextInput = document.querySelector(`input[data-serie="${serieId}"][data-row="${rowIndex + 1}"][data-col="${colIndex}"]`);
            if (nextInput) {
                nextInput.focus();
                nextInput.select();
            }
        }, 10);
    } else if (event.key === 'ArrowUp') {
        if (rowIndex > 0) {
            event.preventDefault();
            const prevInput = document.querySelector(`input[data-serie="${serieId}"][data-row="${rowIndex - 1}"][data-col="${colIndex}"]`);
            if (prevInput) {
                prevInput.focus();
                prevInput.select();
            }
        }
    } else if (event.key === 'ArrowDown') {
        const serie = series.find(s => s.id === serieId);
        if (rowIndex < serie.data.length - 1) {
            event.preventDefault();
            const nextInput = document.querySelector(`input[data-serie="${serieId}"][data-row="${rowIndex + 1}"][data-col="${colIndex}"]`);
            if (nextInput) {
                nextInput.focus();
                nextInput.select();
            }
        }
    }
}

function handleFileSelect(serieId, input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const text = e.target.result;
        const lines = text.split('\n');
        const serie = series.find(s => s.id === serieId);

        // Clear existing data
        serie.data = [];

        lines.forEach((line, index) => {
            const cleanLine = line.trim();
            if (!cleanLine) return;

            // Skip header if it contains letters
            if (index === 0 && /[a-zA-Z]/.test(cleanLine)) return;

            const parts = cleanLine.split(',');
            if (parts.length >= 2) {
                serie.data.push({
                    x: parseFloat(parts[0]),
                    y: parseFloat(parts[1]),
                    xError: parseFloat(parts[2] || 0),
                    yError: parseFloat(parts[3] || 0)
                });
            }
        });

        if (serie.data.length === 0) {
            serie.data.push({ x: '', y: '', xError: 0, yError: 0 });
        }

        renderTable(serieId);
        updateChart();
        input.value = ''; // Reset input
    };
    reader.readAsText(file);
}

function updateChart() {
    const datasets = [];
    const showUncertaintyLines = document.getElementById('showUncertaintyLines').checked;

    series.forEach(serie => {
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
            const xLabel = chart.options.scales.x.title.text || 'X';
            const yLabel = chart.options.scales.y.title.text || 'Y';
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
                const xLabel = chart.options.scales.x.title.text || 'X';
                const yLabel = chart.options.scales.y.title.text || 'Y';
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
                        // Top-Left, Top-Right, Bottom-Right, Bottom-Left, Top-Left
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
            eqDiv.style.display = 'block';

            // ============================================
            // VISUALIZACIÓN DE HERRAMIENTAS DE CÁLCULO
            // ============================================

            const coeffs = getRegressionCoeffs(validData, serie.fitType);

            /* console.log('UpdateChart Debug:', {
                showTangent, tangentX,
                showArea, areaX1, areaX2,
                coeffs, fitType: serie.fitType,
                validDataLength: validData.length
            });

            if (!coeffs) {
                console.error('Coeffs is null for fitType:', serie.fitType);
            } */

            // 1. TANGENTE (DERIVADA)
            if (showTangent && coeffs) {
                const slope = calculateDerivative(tangentX, coeffs, serie.fitType);

                // Calcular puntos para dibujar un segmento de tangente
                // Longitud visual aproximada: 20% del rango X
                let minX = chart.scales.x ? chart.scales.x.min : validData[0].x;
                let maxX = chart.scales.x ? chart.scales.x.max : validData[validData.length - 1].x;
                const rangeX = maxX - minX;
                const deltaX = rangeX * 0.15;

                // y - y0 = m(x - x0) -> y = m(x - x0) + y0
                // Necesitamos y0 = f(x0)
                let y0 = 0;
                if (serie.fitType === 'linear') {
                    y0 = coeffs.a * tangentX + coeffs.b;
                } else if (serie.fitType === 'poly2') {
                    y0 = coeffs[0] * tangentX * tangentX + coeffs[1] * tangentX + coeffs[2];
                }

                const x1 = tangentX - deltaX;
                const x2 = tangentX + deltaX;
                const y1 = slope * (x1 - tangentX) + y0;
                const y2 = slope * (x2 - tangentX) + y0;

                datasets.push({
                    type: 'line',
                    label: 'Tangente',
                    data: [{ x: x1, y: y1 }, { x: x2, y: y2 }],
                    borderColor: '#e74c3c', // Rojo brillante
                    borderWidth: 2,
                    pointRadius: 0,
                    showLine: true,
                    fill: false,
                    borderDash: [5, 5]
                });

                // Punto de tangencia
                datasets.push({
                    type: 'scatter',
                    label: 'Punto Tangente',
                    data: [{ x: tangentX, y: y0 }],
                    backgroundColor: '#e74c3c',
                    pointRadius: 6,
                    pointHoverRadius: 8
                });

                // Actualizar display
                const tangentDisplay = document.getElementById('tangentDisplay');
                if (tangentDisplay) {
                    tangentDisplay.innerHTML = `
                            <strong>x = ${tangentX.toFixed(4)}</strong><br>
                            y = ${y0.toFixed(4)}<br>
                            Pendiente (dy/dx) = ${slope.toFixed(4)}
                        `;
                }
            }

            // 2. ÁREA (INTEGRAL)
            if (showArea && coeffs) {
                const area = calculateIntegral(areaX1, areaX2, coeffs, serie.fitType);

                // Crear dataset para sombrear área
                // Generar puntos densos entre x1 y x2
                const areaPoints = [];
                const steps = 50;
                const stepSize = (areaX2 - areaX1) / steps;

                for (let i = 0; i <= steps; i++) {
                    const x = areaX1 + i * stepSize;
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
                    backgroundColor: 'rgba(108, 92, 231, 0.3)', // Violeta semitransparente
                    borderWidth: 0,
                    pointRadius: 0,
                    fill: 'origin', // Llenar hasta el eje X
                    showLine: true
                });

                // Actualizar display
                const areaDisplay = document.getElementById('areaDisplay');
                if (areaDisplay) {
                    areaDisplay.innerHTML = `
                            <strong>Intervalo: [${areaX1.toFixed(4)}, ${areaX2.toFixed(4)}]</strong><br>
                            Área (∫y dx) = ${area.toFixed(4)}
                        `;
                }
            }

            let uncertaintyHtml = '';
            if (fit.uncertainty && fit.uncertainty.mMax !== undefined) {
                const u = fit.uncertainty;
                const deltaM = (u.mMax - u.mMin) / 2;

                // Extraer unidades de las etiquetas de los ejes
                const xLabel = chart.options.scales.x.title.text || 'X';
                const yLabel = chart.options.scales.y.title.text || 'Y';
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
        } else {
            const eqDiv = document.getElementById(`eq-${serie.id}`);
            eqDiv.style.display = 'none';
        }
    });

    chart.data.datasets = datasets;
    chart.update();
}

function downloadChart() {
    const link = document.createElement('a');
    link.download = 'grafica.png';
    link.href = document.getElementById('myChart').toDataURL('image/png');
    link.click();
}

function downloadChartPNG() {
    downloadChart();
}

function downloadChartPDF() {
    const { jsPDF } = window.jspdf;
    const canvas = document.getElementById('myChart');

    // Crear PDF con orientación landscape si el gráfico es ancho
    const orientation = canvas.width > canvas.height ? 'l' : 'p';
    const pdf = new jsPDF(orientation, 'mm', 'a4');

    const imgData = canvas.toDataURL('image/png', 1.0);

    // Calcular dimensiones para ajustar a la página A4
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;

    const imgWidth = pageWidth - 2 * margin;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
    pdf.save('grafica.pdf');
}

// ============================================
// HERRAMIENTAS DE CÁLCULO (DERIVADA E INTEGRAL)
// ============================================

function getDataRange() {
    let minX = Infinity;
    let maxX = -Infinity;
    let hasData = false;

    if (chart && chart.data && chart.data.datasets) {
        chart.data.datasets.forEach(dataset => {
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
        if (chart && chart.scales && chart.scales.x) {
            return { min: chart.scales.x.min || 0, max: chart.scales.x.max || 10 };
        }
        return { min: 0, max: 10 };
    }

    return { min: minX, max: maxX };
}

function toggleTangent() {
    showTangent = document.getElementById('showTangent').checked;
    const controls = document.getElementById('tangentControls');
    controls.style.display = showTangent ? 'block' : 'none';

    if (showTangent) {
        const { min, max } = getDataRange();
        const slider = document.getElementById('tangentSlider');
        const input = document.getElementById('tangentXInput');

        slider.min = min;
        slider.max = max;
        slider.step = (max - min) / 100;

        // Solo inicializar si está fuera de rango o es 0
        if (tangentX < min || tangentX > max || tangentX === 0) {
            tangentX = (min + max) / 2;
        }

        slider.value = tangentX;
        input.value = tangentX.toFixed(4);
    }
    updateChart();
}

function updateTangentFromSlider() {
    tangentX = parseFloat(document.getElementById('tangentSlider').value);
    document.getElementById('tangentXInput').value = tangentX.toFixed(4);
    updateChart();
}

function updateTangentFromInput() {
    tangentX = parseFloat(document.getElementById('tangentXInput').value);
    document.getElementById('tangentSlider').value = tangentX;
    updateChart();
}

function toggleArea() {
    showArea = document.getElementById('showArea').checked;
    const controls = document.getElementById('areaControls');
    controls.style.display = showArea ? 'block' : 'none';

    if (showArea) {
        const { min, max } = getDataRange();

        // Solo inicializar si son 0 o están invertidos
        if (areaX1 === 0 && areaX2 === 0) {
            areaX1 = min;
            areaX2 = max;
        }

        document.getElementById('areaX1').value = areaX1.toFixed(4);
        document.getElementById('areaX2').value = areaX2.toFixed(4);
    }
    updateChart();
}

function calculateArea() {
    areaX1 = parseFloat(document.getElementById('areaX1').value);
    areaX2 = parseFloat(document.getElementById('areaX2').value);
    updateChart();
}

/**
 * Calcula la derivada (pendiente) en un punto x
 */
function calculateDerivative(x, coeffs, type) {
    if (type === 'linear') {
        // y = ax + b -> y' = a
        return coeffs.a;
    } else if (type === 'poly2') {
        // y = ax^2 + bx + c -> y' = 2ax + b
        // coeffs = [a, b, c]
        return 2 * coeffs[0] * x + coeffs[1];
    }
    return 0;
}

/**
 * Calcula la integral definida entre x1 y x2
 */
function calculateIntegral(x1, x2, coeffs, type) {
    if (type === 'linear') {
        // y = ax + b -> ∫y = (a/2)x^2 + bx
        const F = (x) => (coeffs.a / 2) * x * x + coeffs.b * x;
        return F(x2) - F(x1);
    } else if (type === 'poly2') {
        // y = ax^2 + bx + c -> ∫y = (a/3)x^3 + (b/2)x^2 + cx
        const F = (x) => (coeffs[0] / 3) * Math.pow(x, 3) + (coeffs[1] / 2) * x * x + coeffs[2] * x;
        return F(x2) - F(x1);
    }
    return 0;
}

/**
 * Obtiene coeficientes numéricos de la regresión
 */
function getRegressionCoeffs(data, type) {
    if (type === 'linear') {
        return linearRegression(data); // Retorna {a, b, ...}
    } else if (type === 'poly2') {
        const xs = data.map(p => p.x);
        const ys = data.map(p => p.y);
        return polynomialRegression(xs, ys, 2); // Retorna [a, b, c]
    }
    return null;
}

function calculateFit(data, type, xLabel = 'X', yLabel = 'Y') {
    const xs = data.map(p => p.x);
    const ys = data.map(p => p.y);
    const n = xs.length;

    let equation = '';
    let r2 = 0;
    let fitFunc = null;
    let uncertainty = null;

    if (type === 'linear') {
        const result = linearRegression(data);
        const a = result.a;
        const b = result.b;

        // Extraer unidades
        const xUnit = extractUnit(xLabel);
        const yUnit = extractUnit(yLabel);
        let slopeUnit = '';
        if (yUnit && xUnit) {
            slopeUnit = ` ${yUnit}/${xUnit}`;
        } else if (yUnit) {
            slopeUnit = ` ${yUnit}`;
        }
        let interceptUnit = yUnit ? ` ${yUnit}` : '';

        let eqStr = '';
        if (result.uncertainty) {
            const formattedA = formatWithUncertainty(a, result.uncertainty.slope);
            const formattedB = formatWithUncertainty(b, result.uncertainty.intercept);

            eqStr = `y = ${formattedA.value}x + ${formattedB.value}`;
            eqStr += `<br><span style="font-size:0.9em; color:#666">
                        m = ${formattedA.value} ± ${formattedA.uncertainty}${slopeUnit}<br>
                        b = ${formattedB.value} ± ${formattedB.uncertainty}${interceptUnit}
                    </span>`;
        } else {
            eqStr = `y = ${a.toFixed(4)}x + ${b.toFixed(4)}`;
        }

        equation = eqStr;
        r2 = result.r2;
        fitFunc = x => a * x + b;
        uncertainty = result.uncertainty;
    }
    else if (type === 'poly2') {
        const coeffs = polynomialRegression(xs, ys, 2);
        equation = `y = ${coeffs[0].toFixed(4)}x² + ${coeffs[1].toFixed(4)}x + ${coeffs[2].toFixed(4)}`;
        r2 = calculateR2(ys, xs.map(x => coeffs[0] * x * x + coeffs[1] * x + coeffs[2]));
        fitFunc = x => coeffs[0] * x * x + coeffs[1] * x + coeffs[2];
    }
    else if (type === 'poly3') {
        const coeffs = polynomialRegression(xs, ys, 3);
        equation = `y = ${coeffs[0].toFixed(4)}x³ + ${coeffs[1].toFixed(4)}x² + ${coeffs[2].toFixed(4)}x + ${coeffs[3].toFixed(4)}`;
        r2 = calculateR2(ys, xs.map(x => coeffs[0] * x * x * x + coeffs[1] * x * x + coeffs[2] * x + coeffs[3]));
        fitFunc = x => coeffs[0] * x * x * x + coeffs[1] * x * x + coeffs[2] * x + coeffs[3];
    }
    else if (type === 'exponential') {
        const result = exponentialRegression(xs, ys);
        equation = `y = ${result.a.toFixed(4)}e^(${result.b.toFixed(4)}x)`;
        r2 = result.r2;
        fitFunc = x => result.a * Math.exp(result.b * x);
    }
    else if (type === 'logarithmic') {
        const result = logarithmicRegression(xs, ys);
        equation = `y = ${result.a.toFixed(4)}ln(x) + ${result.b.toFixed(4)}`;
        r2 = result.r2;
        fitFunc = x => result.a * Math.log(x) + result.b;
    }
    else if (type === 'power') {
        const result = powerRegression(xs, ys);
        equation = `y = ${result.a.toFixed(4)}x^(${result.b.toFixed(4)})`;
        r2 = result.r2;
        fitFunc = x => result.a * Math.pow(x, result.b);
    }

    // Calculate range including errors to ensure lines cover the error boxes
    let minX = Infinity;
    let maxX = -Infinity;

    for (let i = 0; i < n; i++) {
        const x = xs[i];
        const xErr = data[i].xError || 0;
        if (x - xErr < minX) minX = x - xErr;
        if (x + xErr > maxX) maxX = x + xErr;
    }

    // Fallback if no data
    if (minX === Infinity) {
        minX = Math.min(...xs);
        maxX = Math.max(...xs);
    }

    // Adjust minX for logarithmic and power functions if necessary
    if ((type === 'logarithmic' || type === 'power') && minX <= 0) {
        minX = 0.0001; // Avoid 0 or negative values
    }

    const range = maxX - minX;
    const points = [];
    const maxSlopePoints = [];
    const minSlopePoints = [];

    for (let i = 0; i <= 100; i++) {
        const x = minX + (range * i / 100);
        // Ensure x is valid for the function type
        if ((type === 'logarithmic' || type === 'power') && x <= 0) continue;

        points.push({ x: x, y: fitFunc(x) });

        // Generate points for max/min slope lines if uncertainty exists
        if (uncertainty && uncertainty.mMax !== undefined && isFinite(uncertainty.mMax) && isFinite(uncertainty.mMin)) {
            maxSlopePoints.push({ x: x, y: uncertainty.mMax * x + uncertainty.bMax });
            minSlopePoints.push({ x: x, y: uncertainty.mMin * x + uncertainty.bMin });
        }
    }

    return { equation, r2, points, uncertainty, maxSlopePoints, minSlopePoints };
}

function linearRegression(data) {
    const xs = data.map(p => p.x);
    const ys = data.map(p => p.y);
    const n = xs.length;

    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = ys.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((sum, x, i) => sum + x * ys[i], 0);
    const sumX2 = xs.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const yPred = xs.map(x => slope * x + intercept);
    const r2 = calculateR2(ys, yPred);

    // Calculate Uncertainty using Max/Min Slope Method
    let uncertainty = null;
    const hasErrors = data.some(p => p.xError > 0 || p.yError > 0);

    if (hasErrors && n >= 2) {
        // Sort by X to find endpoints
        const sortedData = [...data].sort((a, b) => a.x - b.x);
        const p1 = sortedData[0];
        const pn = sortedData[n - 1];

        // Centroid
        const xBar = sumX / n;
        const yBar = sumY / n;

        // Worst case slopes (Endpoint Method)
        // Max Slope: Steepest possible line between error boxes of endpoints
        // Min Slope: Flattest possible line between error boxes of endpoints

        // Case 1: Positive slope
        let mMax, mMin, bMax, bMin;

        if (slope >= 0) {
            // Steepest: (x1+dx, y1-dy) to (xn-dx, yn+dy)
            // Denominator min, Numerator max
            const x1_inner = p1.x + p1.xError;
            const y1_inner = p1.y - p1.yError;
            const xn_inner = pn.x - pn.xError;
            const yn_inner = pn.y + pn.yError;

            // Flattest: (x1-dx, y1+dy) to (xn+dx, yn-dy)
            // Denominator max, Numerator min
            const x1_outer = p1.x - p1.xError;
            const y1_outer = p1.y + p1.yError;
            const xn_outer = pn.x + pn.xError;
            const yn_outer = pn.y - pn.yError;

            // Calculate intercepts using the points that defined the slopes
            // mMax passes through (x1_inner, y1_inner)
            // Note: We need to be careful which points we use depending on which slope became max/min
            // after the swap.

            // Calculate both slopes
            const m1 = (yn_inner - y1_inner) / (xn_inner - x1_inner);
            const m2 = (yn_outer - y1_outer) / (xn_outer - x1_outer);

            // Determine which is max and which is min
            if (m1 > m2) {
                mMax = m1;
                mMin = m2;
                // mMax passes through inner points
                bMax = y1_inner - mMax * x1_inner;
                // mMin passes through outer points
                bMin = y1_outer - mMin * x1_outer;
            } else {
                mMax = m2;
                mMin = m1;
                // mMax passes through outer points
                bMax = y1_outer - mMax * x1_outer;
                // mMin passes through inner points
                bMin = y1_inner - mMin * x1_inner;
            }

        } else {
            // Negative slope logic
            // Steepest (most negative): (x1+dx, y1+dy) to (xn-dx, yn-dy)
            const x1_inner = p1.x + p1.xError;
            const y1_inner = p1.y + p1.yError;
            const xn_inner = pn.x - pn.xError;
            const yn_inner = pn.y - pn.yError;

            // Flattest (least negative): (x1-dx, y1-dy) to (xn+dx, yn+dy)
            const x1_outer = p1.x - p1.xError;
            const y1_outer = p1.y - p1.yError;
            const xn_outer = pn.x + pn.xError;
            const yn_outer = pn.y + pn.yError;

            const m1 = (yn_inner - y1_inner) / (xn_inner - x1_inner);
            const m2 = (yn_outer - y1_outer) / (xn_outer - x1_outer);

            // Determine which is max and which is min
            if (m1 > m2) {
                mMax = m1;
                mMin = m2;
                bMax = y1_inner - mMax * x1_inner;
                bMin = y1_outer - mMin * x1_outer;
            } else {
                mMax = m2;
                mMin = m1;
                bMax = y1_outer - mMax * x1_outer;
                bMin = y1_inner - mMin * x1_inner;
            }
        }

        const slopeError = (mMax - mMin) / 2;
        const interceptError = Math.abs(bMax - bMin) / 2;

        uncertainty = {
            slope: slopeError,
            intercept: interceptError,
            mMax: mMax,
            mMin: mMin,
            bMax: bMax,
            bMin: bMin,
            mBest: slope
        };
    }

    return { a: slope, b: intercept, r2, uncertainty };
}

function polynomialRegression(xs, ys, degree) {
    const n = xs.length;
    const matrix = [];
    const result = [];

    for (let i = 0; i <= degree; i++) {
        const row = [];
        for (let j = 0; j <= degree; j++) {
            let sum = 0;
            for (let k = 0; k < n; k++) {
                sum += Math.pow(xs[k], i + j);
            }
            row.push(sum);
        }
        matrix.push(row);

        let sum = 0;
        for (let k = 0; k < n; k++) {
            sum += ys[k] * Math.pow(xs[k], i);
        }
        result.push(sum);
    }

    return gaussianElimination(matrix, result).reverse();
}

function gaussianElimination(matrix, result) {
    const n = matrix.length;

    for (let i = 0; i < n; i++) {
        let maxRow = i;
        for (let k = i + 1; k < n; k++) {
            if (Math.abs(matrix[k][i]) > Math.abs(matrix[maxRow][i])) {
                maxRow = k;
            }
        }

        [matrix[i], matrix[maxRow]] = [matrix[maxRow], matrix[i]];
        [result[i], result[maxRow]] = [result[maxRow], result[i]];

        for (let k = i + 1; k < n; k++) {
            const factor = matrix[k][i] / matrix[i][i];
            result[k] -= factor * result[i];
            for (let j = i; j < n; j++) {
                matrix[k][j] -= factor * matrix[i][j];
            }
        }
    }

    const solution = new Array(n);
    for (let i = n - 1; i >= 0; i--) {
        solution[i] = result[i];
        for (let j = i + 1; j < n; j++) {
            solution[i] -= matrix[i][j] * solution[j];
        }
        solution[i] /= matrix[i][i];
    }

    return solution;
}

// Helper function for non-linear regressions that need to call linearRegression with arrays
function linearRegressionArrays(xs, ys) {
    const data = xs.map((x, i) => ({ x, y: ys[i], xError: 0, yError: 0 }));
    return linearRegression(data);
}

function exponentialRegression(xs, ys) {
    const lnYs = ys.map(y => Math.log(y));
    const result = linearRegressionArrays(xs, lnYs);
    const a = Math.exp(result.intercept);
    const b = result.slope;

    const yPred = xs.map(x => a * Math.exp(b * x));
    const r2 = calculateR2(ys, yPred);

    return { a, b, r2 };
}

function logarithmicRegression(xs, ys) {
    const lnXs = xs.map(x => Math.log(x));
    const result = linearRegressionArrays(lnXs, ys);
    const a = result.slope;
    const b = result.intercept;

    const yPred = xs.map(x => a * Math.log(x) + b);
    const r2 = calculateR2(ys, yPred);

    return { a, b, r2 };
}

function powerRegression(xs, ys) {
    const lnXs = xs.map(x => Math.log(x));
    const lnYs = ys.map(y => Math.log(y));
    const result = linearRegressionArrays(lnXs, lnYs);
    const a = Math.exp(result.intercept);
    const b = result.slope;

    const yPred = xs.map(x => a * Math.pow(x, b));
    const r2 = calculateR2(ys, yPred);

    return { a, b, r2 };
}

function calculateR2(observed, predicted) {
    const mean = observed.reduce((a, b) => a + b, 0) / observed.length;
    const ssTotal = observed.reduce((sum, y) => sum + Math.pow(y - mean, 2), 0);
    const ssResidual = observed.reduce((sum, y, i) => sum + Math.pow(y - predicted[i], 2), 0);
    return 1 - (ssResidual / ssTotal);
}

function toggleHelp(serieId, fitType) {
    const helpDiv = document.getElementById(`help-${serieId}`);

    if (helpDiv.style.display === 'block') {
        helpDiv.style.display = 'none';
        return;
    }

    let helpText = '';

    switch (fitType) {
        case 'linear':
            helpText = `
                        <strong>Ecuación Lineal: y = ax + b</strong><br>
                        • <strong>a</strong>: Pendiente de la recta (cuánto cambia Y por cada unidad de X)<br>
                        • <strong>b</strong>: Ordenada al origen (valor de Y cuando X = 0)<br>
                        • <strong>R²</strong>: Coeficiente de determinación (0 a 1, más cerca de 1 = mejor ajuste)<br>
                        <br>
                        <strong>Incertidumbre (Método de Pendiente Máxima/Mínima):</strong><br>
                        • <strong>m ± Δm</strong>: Pendiente con su error estimado<br>
                        • <strong>b ± Δb</strong>: Ordenada con su error estimado<br>
                        <em>Calculado usando las cajas de error de los puntos extremos.</em>
                    `;
            break;
        case 'poly2':
            helpText = `
                        <strong>Ecuación Polinomial Grado 2: y = ax² + bx + c</strong><br>
                        • <strong>a</strong>: Coeficiente cuadrático (controla la curvatura de la parábola)<br>
                        • <strong>b</strong>: Coeficiente lineal<br>
                        • <strong>c</strong>: Término independiente (valor de Y cuando X = 0)<br>
                        • <strong>R²</strong>: Coeficiente de determinación (0 a 1, más cerca de 1 = mejor ajuste)
                    `;
            break;
        case 'poly3':
            helpText = `
                        <strong>Ecuación Polinomial Grado 3: y = ax³ + bx² + cx + d</strong><br>
                        • <strong>a</strong>: Coeficiente cúbico (controla la forma de la curva)<br>
                        • <strong>b</strong>: Coeficiente cuadrático<br>
                        • <strong>c</strong>: Coeficiente lineal<br>
                        • <strong>d</strong>: Término independiente (valor de Y cuando X = 0)<br>
                        • <strong>R²</strong>: Coeficiente de determinación (0 a 1, más cerca de 1 = mejor ajuste)
                    `;
            break;
        case 'exponential':
            helpText = `
                        <strong>Ecuación Exponencial: y = a·e^(bx)</strong><br>
                        • <strong>a</strong>: Valor inicial (valor de Y cuando X = 0)<br>
                        • <strong>b</strong>: Tasa de crecimiento/decrecimiento exponencial<br>
                        &nbsp;&nbsp;- Si b > 0: crecimiento exponencial<br>
                        &nbsp;&nbsp;- Si b < 0: decrecimiento exponencial<br>
                        • <strong>e</strong>: Número de Euler (≈ 2.71828)<br>
                        • <strong>R²</strong>: Coeficiente de determinación (0 a 1, más cerca de 1 = mejor ajuste)
                    `;
            break;
        case 'logarithmic':
            helpText = `
                        <strong>Ecuación Logarítmica: y = a·ln(x) + b</strong><br>
                        • <strong>a</strong>: Factor de escala del logaritmo<br>
                        • <strong>b</strong>: Desplazamiento vertical<br>
                        • <strong>ln</strong>: Logaritmo natural (base e)<br>
                        • <strong>R²</strong>: Coeficiente de determinación (0 a 1, más cerca de 1 = mejor ajuste)<br>
                        <em>Nota: Solo funciona con valores X positivos</em>
                    `;
            break;
        case 'power':
            helpText = `
                        <strong>Ecuación Potencial: y = a·x^b</strong><br>
                        • <strong>a</strong>: Coeficiente de escala<br>
                        • <strong>b</strong>: Exponente (determina el tipo de relación)<br>
                        &nbsp;&nbsp;- Si b > 1: crecimiento acelerado<br>
                        &nbsp;&nbsp;- Si 0 < b < 1: crecimiento desacelerado<br>
                        &nbsp;&nbsp;- Si b < 0: decrecimiento<br>
                        • <strong>R²</strong>: Coeficiente de determinación (0 a 1, más cerca de 1 = mejor ajuste)<br>
                        <em>Nota: Solo funciona con valores X e Y positivos</em>
                    `;
            break;
    }

    helpDiv.innerHTML = helpText;
    helpDiv.style.display = 'block';
}

function resetZoom() {
    if (!chart) return;
    chart.resetZoom();

    // Forzar actualización de escalas para ajustar a los datos
    chart.options.scales.x.min = null;
    chart.options.scales.x.max = null;
    chart.options.scales.y.min = null;
    chart.options.scales.y.max = null;

    // Actualizar inputs de configuración si están abiertos
    document.getElementById('minX').value = '';
    document.getElementById('maxX').value = '';
    document.getElementById('minY').value = '';
    document.getElementById('maxY').value = '';

    chart.update();
}

function zoomIn() {
    if (!chart) return;
    chart.zoom(1.2); // Acercar 20%
}

function zoomOut() {
    if (!chart) return;
    chart.zoom(0.8); // Alejar 20%
}

function downloadChart() {
    const link = document.createElement('a');
    link.download = 'grafica.png';
    link.href = chart.toBase64Image();
    link.click();
}

// ============================================
// DATOS DE PRUEBA (SOLO PARA DESARROLLO)
// ============================================

function loadTestData(type) {
    if (typeof IS_DEVELOPMENT === 'undefined' || !IS_DEVELOPMENT) return;

    // Limpiar series existentes
    series = [];
    serieCounter = 1;

    const testSets = {
        linear: {
            name: 'Lineal',
            data: [
                { x: 1, y: 2, xError: 0.1, yError: 0.2 },
                { x: 2, y: 4, xError: 0.1, yError: 0.3 },
                { x: 3, y: 6, xError: 0.1, yError: 0.2 },
                { x: 4, y: 8, xError: 0.1, yError: 0.4 },
                { x: 5, y: 10, xError: 0.1, yError: 0.3 }
            ],
            fitType: 'linear'
        },
        quadratic: {
            name: 'Cuadrática',
            data: [
                { x: 1, y: 1, xError: 0.1, yError: 0.2 },
                { x: 2, y: 4, xError: 0.1, yError: 0.3 },
                { x: 3, y: 9, xError: 0.1, yError: 0.5 },
                { x: 4, y: 16, xError: 0.1, yError: 0.8 },
                { x: 5, y: 25, xError: 0.1, yError: 1.0 }
            ],
            fitType: 'poly2'
        },
        exponential: {
            name: 'Exponencial',
            data: [
                { x: 0, y: 1, xError: 0, yError: 0.1 },
                { x: 1, y: 2.7, xError: 0, yError: 0.2 },
                { x: 2, y: 7.4, xError: 0, yError: 0.5 },
                { x: 3, y: 20.1, xError: 0, yError: 1.0 },
                { x: 4, y: 54.6, xError: 0, yError: 2.0 }
            ],
            fitType: 'exponential'
        },
        logarithmic: {
            name: 'Logarítmica',
            data: [
                { x: 1, y: 0, xError: 0, yError: 0.1 },
                { x: 2, y: 0.69, xError: 0, yError: 0.1 },
                { x: 5, y: 1.61, xError: 0, yError: 0.1 },
                { x: 10, y: 2.30, xError: 0, yError: 0.2 },
                { x: 20, y: 3.00, xError: 0, yError: 0.2 }
            ],
            fitType: 'logarithmic'
        },
        power: {
            name: 'Potencial',
            data: [
                { x: 1, y: 1, xError: 0, yError: 0.1 },
                { x: 2, y: 4, xError: 0, yError: 0.2 },
                { x: 3, y: 9, xError: 0, yError: 0.3 },
                { x: 4, y: 16, xError: 0, yError: 0.5 },
                { x: 5, y: 25, xError: 0, yError: 0.7 }
            ],
            fitType: 'power'
        },
        uncertainty: {
            name: 'Con Incertidumbre',
            data: [
                { x: 1, y: 2.1, xError: 0.2, yError: 0.3 },
                { x: 2, y: 3.9, xError: 0.2, yError: 0.4 },
                { x: 3, y: 6.2, xError: 0.2, yError: 0.5 },
                { x: 4, y: 7.8, xError: 0.2, yError: 0.6 },
                { x: 5, y: 10.1, xError: 0.2, yError: 0.7 }
            ],
            fitType: 'linear'
        }
    };

    const testData = testSets[type];
    if (!testData) return;

    // Crear nueva serie con datos de prueba
    const serie = {
        id: 1,
        name: testData.name,
        color: colors[0],
        data: testData.data,
        fitType: testData.fitType,
        equation: '',
        r2: 0
    };

    series.push(serie);

    // Actualizar UI
    renderSeries();
    updateChart();

    console.log(`Datos de prueba cargados: ${type}`);
}
// ============================================
// SISTEMA DE AYUDA
// ============================================

function toggleHelpModal() {
    const modal = document.getElementById('helpModal');
    if (modal.style.display === 'none' || modal.style.display === '') {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevenir scroll del body
    } else {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function switchHelpTab(tabName) {
    // Ocultar todos los contenidos
    const contents = document.querySelectorAll('.help-content');
    contents.forEach(content => content.style.display = 'none');

    // Remover clase active de todas las pestañas
    const tabs = document.querySelectorAll('.help-tab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
        tab.style.borderBottom = '3px solid transparent';
        tab.style.color = '#666';
    });

    // Mostrar contenido seleccionado
    document.getElementById(`help-${tabName}`).style.display = 'block';

    // Activar pestaña seleccionada
    event.target.classList.add('active');
    event.target.style.borderBottom = '3px solid #667eea';
    event.target.style.color = '#667eea';
}

// Cerrar modal al hacer clic fuera
document.addEventListener('click', function (event) {
    const modal = document.getElementById('helpModal');
    if (modal && event.target === modal) {
        toggleHelpModal();
    }
});

// Efecto hover en botón de ayuda
document.addEventListener('DOMContentLoaded', function () {
    const helpBtn = document.getElementById('helpButton');
    if (helpBtn) {
        helpBtn.addEventListener('mouseenter', function () {
            this.style.transform = 'scale(1.1) rotate(15deg)';
        });
        helpBtn.addEventListener('mouseleave', function () {
            this.style.transform = 'scale(1) rotate(0deg)';
        });
    }
});

// ============================================
// INICIALIZACIÓN DE DESARROLLO
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    if (typeof IS_DEVELOPMENT !== 'undefined' && IS_DEVELOPMENT) {
        // Mostrar panel de datos de prueba
        const devPanel = document.getElementById('dev-panel');
        if (devPanel) devPanel.style.display = 'block';

        // Mostrar tip de ayuda de desarrollo
        const devTip = document.getElementById('help-dev-tip');
        if (devTip) devTip.style.display = 'block';

        console.log('🔧 Modo Desarrollo Activado');
    }
});

initChart();
addSerie();

