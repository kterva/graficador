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
                        threshold: 10 // Mínimo movimiento para activar pan
                    },
                    limits: {
                        x: { min: 'original', max: 'original', minRange: 1 }, // Límites basados en datos originales
                        y: { min: 'original', max: 'original', minRange: 1 }
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
            const fit = calculateFit(validData, serie.fitType);
            serie.equation = fit.equation;
            serie.r2 = fit.r2;

            datasets.push({
                type: 'line',
                label: `${serie.name} (ajuste)`,
                data: fit.points,
                borderColor: serie.color,
                backgroundColor: 'transparent',
                showLine: true,
                pointRadius: 0,
                borderWidth: 2,
                borderDash: [5, 5],
                fill: false,
                tension: 0.4
            });

            // Add uncertainty lines if enabled and available
            if (showUncertaintyLines && fit.uncertainty && fit.maxSlopePoints && fit.minSlopePoints) {
                datasets.push({
                    type: 'line',
                    label: `${serie.name} (m máx)`,
                    data: fit.maxSlopePoints,
                    borderColor: serie.color,
                    backgroundColor: 'transparent',
                    showLine: true,
                    pointRadius: 0,
                    borderWidth: 1,
                    borderDash: [2, 2],
                    fill: false,
                    tension: 0
                });
                datasets.push({
                    type: 'line',
                    label: `${serie.name} (m mín)`,
                    data: fit.minSlopePoints,
                    borderColor: serie.color,
                    backgroundColor: 'transparent',
                    showLine: true,
                    pointRadius: 0,
                    borderWidth: 1,
                    borderDash: [2, 2],
                    fill: false,
                    tension: 0
                });
            }

            const eqDiv = document.getElementById(`eq-${serie.id}`);
            eqDiv.style.display = 'block';

            let uncertaintyHtml = '';
            if (fit.uncertainty && fit.uncertainty.mMax !== undefined) {
                const u = fit.uncertainty;
                const deltaM = (u.mMax - u.mMin) / 2;

                uncertaintyHtml = `
                    <div style="margin-top: 5px; font-size: 0.9em; border-top: 1px solid #eee; padding-top: 5px;">
                        <strong>Análisis de Pendiente:</strong><br>
                        m<sub>max</sub> = ${u.mMax.toFixed(4)}<br>
                        m<sub>min</sub> = ${u.mMin.toFixed(4)}<br>
                        m<sub>mejor</sub> = ${u.mBest.toFixed(4)}<br>
                        <strong>Δm = (m<sub>max</sub> - m<sub>min</sub>) / 2 = ${deltaM.toFixed(4)}</strong>
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

function calculateFit(data, type) {
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

        let eqStr = `y = ${a.toFixed(4)}x + ${b.toFixed(4)}`;
        if (result.uncertainty) {
            eqStr += `<br><span style="font-size:0.9em; color:#666">
                        m = ${a.toFixed(4)} ± ${result.uncertainty.slope.toFixed(4)}<br>
                        b = ${b.toFixed(4)} ± ${result.uncertainty.intercept.toFixed(4)}
                    </span>`;
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

    let minX = Math.min(...xs);
    const maxX = Math.max(...xs);

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
        if (uncertainty && uncertainty.mMax !== undefined) {
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
        let mMax, mMin;

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

            mMax = (yn_inner - y1_inner) / (xn_inner - x1_inner);
            mMin = (yn_outer - y1_outer) / (xn_outer - x1_outer);
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

            mMax = (yn_inner - y1_inner) / (xn_inner - x1_inner); // Steepest (more negative)
            mMin = (yn_outer - y1_outer) / (xn_outer - x1_outer); // Flattest (less negative)
        }

        // Ensure mMax is actually the larger value algebraically
        if (mMax < mMin) {
            [mMax, mMin] = [mMin, mMax];
        }

        // Calculate intercepts passing through centroid
        const bMax = yBar - mMax * xBar;
        const bMin = yBar - mMin * xBar;

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

function downloadChart() {
    const link = document.createElement('a');
    link.download = 'grafica.png';
    link.href = chart.toBase64Image();
    link.click();
}

initChart();
addSerie();
