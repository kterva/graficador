/**
 * ============================================
 * MANEJADORES DE INTERFAZ DE USUARIO
 * ============================================
 * 
 * Módulo para manejar eventos de UI y renderizado de elementos DOM
 * 
 * @module ui-handlers
 */

import { AppState } from './state.js';
import { addSerie as addSerieData, removeSerie as removeSerieData, addRow as addRowData, removeRow as removeRowData, updatePoint as updatePointData, updateSerieColor as updateSerieColorData, updateFitType as updateFitTypeData, updateDefaultError as updateDefaultErrorData, clearTable as clearTableData, exportCSV as exportCSVData, importCSVFile } from './data-manager.js';
import { updateChart, getDataRange } from './chart-manager.js';
import { propagateUncertainty, formatPropagationResult, validateAllInputs, formatWarnings } from './uncertainty-propagation.js';
import { showDecimalWarning, normalizeDecimalInput, escapeHTML } from './utils.js';

// Debounce para updateChart: evita recalcular en cada tecla mientras se escribe un número
let _chartUpdateTimer = null;
function debouncedUpdateChart() {
    clearTimeout(_chartUpdateTimer);
    _chartUpdateTimer = setTimeout(() => updateChart(), 400);
}

/**
 * Renderiza todas las series en el DOM
 */
export function renderSeries() {
    const container = document.getElementById('series-container');
    container.innerHTML = '';

    AppState.series.forEach(serie => {
        const div = document.createElement('div');
        div.className = 'serie-section';
        div.innerHTML = `
            <div class="serie-header">
                <span class="serie-name">${escapeHTML(serie.name)}</span>
                <div>
                    <input type="file" id="file-${serie.id}" style="display:none" accept=".csv" onchange="handleFileSelect(${serie.id}, this)">
                    <button class="btn btn-primary" style="padding: 2px 8px; font-size: 12px;" onclick="importCSV(${serie.id})">Importar CSV</button>
                    <button class="btn btn-primary" style="padding: 2px 8px; font-size: 12px;" onclick="exportCSV(${serie.id})">Exportar CSV</button>
                    <button class="btn btn-danger" style="padding: 2px 8px; font-size: 12px;" onclick="clearTable(${serie.id})">Limpiar</button>
                    <button class="btn-remove-serie" onclick="removeSerie(${serie.id})">Eliminar</button>
                </div>
            </div>
            
            <label>Color:</label>
            <input type="color" class="color-input" value="${escapeHTML(serie.color)}"
                   onchange="updateSerieColor(${serie.id}, this.value)">
            
            <label style="display:block; margin-top:10px;">Tipo de Ajuste:</label>
            <select id="fit-type-${serie.id}" onchange="updateFitType(${serie.id}, this.value)">
                <option value="none" ${serie.fitType === 'none' ? 'selected' : ''}>Sin ajuste</option>
                <option value="linear" ${serie.fitType === 'linear' ? 'selected' : ''}>Lineal</option>
                <option value="poly2" ${serie.fitType === 'poly2' || serie.fitType === 'polynomial2' ? 'selected' : ''}>Polinomial (grado 2)</option>
                <option value="poly3" ${serie.fitType === 'poly3' || serie.fitType === 'polynomial3' ? 'selected' : ''}>Polinomial (grado 3)</option>
                <option value="exponential" ${serie.fitType === 'exponential' ? 'selected' : ''}>Exponencial</option>
                <option value="logarithmic" ${serie.fitType === 'logarithmic' ? 'selected' : ''}>Logarítmico</option>
                <option value="power" ${serie.fitType === 'power' ? 'selected' : ''}>Potencial</option>
            </select>

            <table>
                <thead>
                    <tr>
                        <th>X</th>
                        <th>Y</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody id="table-${serie.id}" onpaste="handleTablePaste(event, ${serie.id})">
                </tbody>
            </table>
            <button class="btn btn-primary" onclick="addRow(${serie.id})">+ Agregar Fila</button>
            <p style="margin: 6px 0 0 0; font-size: 11px; color: #aaa;">
                💡 Podés pegar datos directamente desde Excel o Google Sheets (Ctrl+V sobre la tabla)<br>
                💡 Los errores X/Y se aplican desde la configuración de columna, no desde cada fila
            </p>
            
            <div class="equation-display" id="eq-${serie.id}" style="display:none;"></div>
        `;
        container.appendChild(div);
        renderTable(serie.id);
    });
}

/**
 * Renderiza la tabla de datos de una serie
 * @param {number} serieId - ID de la serie
 */
export function renderTable(serieId) {
    const serie = AppState.series.find(s => s.id === serieId);
    if (!serie) return;

    const tbody = document.getElementById(`table-${serieId}`);
    tbody.innerHTML = '';

    serie.data.forEach((point, index) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td><input type="text" inputmode="decimal" step="any" value="${escapeHTML(point.x)}"
                       data-serie="${serieId}" data-row="${index}" data-col="0"
                       onkeydown="handleKeyDown(event, ${serieId}, ${index}, 0)"
                       oninput="handleDecimalInput(event)"
                       onchange="updatePoint(${serieId}, ${index}, 'x', this.value)"></td>
            <td><input type="text" inputmode="decimal" step="any" value="${escapeHTML(point.y)}"
                       data-serie="${serieId}" data-row="${index}" data-col="1"
                       onkeydown="handleKeyDown(event, ${serieId}, ${index}, 1)"
                       oninput="handleDecimalInput(event)"
                       onchange="updatePoint(${serieId}, ${index}, 'y', this.value)"></td>
            <td>
                <div class="action-btn-group">
                    <button class="btn btn-secondary btn-xs" onclick="moveRowUp(${serieId}, ${index})" ${index === 0 ? 'disabled' : ''} title="Subir">↑</button>
                    <button class="btn btn-secondary btn-xs" onclick="moveRowDown(${serieId}, ${index})" ${index === serie.data.length - 1 ? 'disabled' : ''} title="Bajar">↓</button>
                    <button class="btn btn-danger btn-xs" onclick="removeRow(${serieId}, ${index})" title="Eliminar">×</button>
                </div>
            </td>
        `;
    });
}

/**
 * Maneja la navegación por teclado en las tablas
 * @param {KeyboardEvent} event - Evento de teclado
 * @param {number} serieId - ID de la serie
 * @param {number} rowIndex - Índice de la fila
 * @param {number} colIndex - Índice de la columna
 */
export function handleKeyDown(event, serieId, rowIndex, colIndex) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const serie = AppState.series.find(s => s.id === serieId);
        if (!serie) return;

        // If it's the last row, add a new one
        if (rowIndex === serie.data.length - 1) {
            addRowData(serieId);
            renderTable(serieId);
        }

        // Focus the cell below
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
        const serie = AppState.series.find(s => s.id === serieId);
        if (!serie) return;

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

/**
 * Maneja la selección de archivo CSV
 * @param {number} serieId - ID de la serie
 * @param {HTMLInputElement} input - Input de archivo
 */
export function handleFileSelect(serieId, input) {
    const file = input.files[0];
    if (!file) return;

    importCSVFile(serieId, file, (success) => {
        if (success) {
            renderTable(serieId);
            updateChart();
        }
        input.value = ''; // Reset input
    });
}

/**
 * Activa/desactiva la herramienta de tangente
 */
export function toggleTangent() {
    AppState.tools.showTangent = document.getElementById('showTangent').checked;
    const controls = document.getElementById('tangentControls');
    controls.style.display = AppState.tools.showTangent ? 'block' : 'none';

    if (AppState.tools.showTangent) {
        const { min, max } = getDataRange();
        const slider = document.getElementById('tangentSlider');
        const input = document.getElementById('tangentXInput');

        slider.min = min;
        slider.max = max;
        slider.step = (max - min) / 100;

        // Solo inicializar si está fuera de rango o es 0
        if (AppState.tools.tangentX < min || AppState.tools.tangentX > max || AppState.tools.tangentX === 0) {
            AppState.tools.tangentX = (min + max) / 2;
        }

        slider.value = AppState.tools.tangentX;
        input.value = AppState.tools.tangentX.toFixed(4);
    }
    updateChart();
}

/**
 * Actualiza la tangente desde el slider
 */
export function updateTangentFromSlider() {
    AppState.tools.tangentX = parseFloat(document.getElementById('tangentSlider').value);
    document.getElementById('tangentXInput').value = AppState.tools.tangentX.toFixed(4);
    updateChart('none');
}

/**
 * Actualiza la tangente desde el input
 */
export function updateTangentFromInput() {
    AppState.tools.tangentX = parseFloat(document.getElementById('tangentXInput').value);
    document.getElementById('tangentSlider').value = AppState.tools.tangentX;
    updateChart();
}

/**
 * Activa/desactiva la herramienta de área
 */
export function toggleArea() {
    AppState.tools.showArea = document.getElementById('showArea').checked;
    const controls = document.getElementById('areaControls');
    controls.style.display = AppState.tools.showArea ? 'block' : 'none';

    if (AppState.tools.showArea) {
        const { min, max } = getDataRange();

        // Solo inicializar si son 0 o están invertidos
        if (AppState.tools.areaX1 === 0 && AppState.tools.areaX2 === 0) {
            AppState.tools.areaX1 = min;
            AppState.tools.areaX2 = max;
        }

        document.getElementById('areaX1').value = AppState.tools.areaX1.toFixed(4);
        document.getElementById('areaX2').value = AppState.tools.areaX2.toFixed(4);
    }
    updateChart();
}

/**
 * Calcula el área (trigger para actualizar gráfico)
 */
export function calculateArea() {
    AppState.tools.areaX1 = parseFloat(document.getElementById('areaX1').value);
    AppState.tools.areaX2 = parseFloat(document.getElementById('areaX2').value);
    updateChart();
}

/**
 * Muestra/oculta la ayuda contextual de un tipo de ajuste
 * @param {number} serieId - ID de la serie
 * @param {string} fitType - Tipo de ajuste
 */
export function toggleHelp(serieId, fitType) {
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
                • <strong>R (Coeficiente de correlación)</strong>: Índice que mide el grado de relación entre dos variables cuantitativas y continuas (de -1 a 1)<br>
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

/**
 * Muestra u oculta un panel de ayuda genérico por su ID
 * @param {string} helpId - ID del elemento contenedor de la ayuda
 */
export function toggleGenericHelp(helpId) {
    const helpDiv = document.getElementById(helpId);
    if (!helpDiv) return;

    if (helpDiv.style.display === 'block') {
        helpDiv.style.display = 'none';
    } else {
        helpDiv.style.display = 'block';
    }
}

/**
 * Muestra/oculta el modal de ayuda
 */
export function toggleHelpModal() {
    const modal = document.getElementById('helpModal');
    if (modal.style.display === 'none' || modal.style.display === '') {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    } else {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

/**
 * Cambia de pestaña en el modal de ayuda
 * @param {string} tabName - Nombre de la pestaña
 */
export function switchHelpTab(tabName) {
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

    // Activar pestaña seleccionada (buscada por data-tab, sin depender del global `event`)
    const selectedTab = document.querySelector(`.help-tab[data-tab="${tabName}"]`);
    if (selectedTab) {
        selectedTab.classList.add('active');
        selectedTab.style.borderBottom = '3px solid #667eea';
        selectedTab.style.color = '#667eea';
    }
}

// ============================================
// FUNCIONES WRAPPER PARA EXPONER AL SCOPE GLOBAL
// ============================================

/**
 * Agrega una nueva serie (wrapper para exponer)
 */
export function addSerie() {
    addSerieData();
    renderSeries();
}

/**
 * Elimina una serie (wrapper para exponer)
 */
export function removeSerie(id) {
    removeSerieData(id);
    renderSeries();
    updateChart();
}

/**
 * Agrega una fila (wrapper para exponer)
 */
export function addRow(serieId) {
    addRowData(serieId);
    renderTable(serieId);
}

/**
 * Elimina una fila (wrapper para exponer)
 */
export function removeRow(serieId, index) {
    removeRowData(serieId, index);
    renderTable(serieId);
    updateChart();
}

/**
 * Actualiza un punto (wrapper para exponer)
 */
export function updatePoint(serieId, index, axis, value) {
    // Normalizar: reemplazar coma por punto antes de guardar
    const normalized = normalizeDecimalInput(value);
    updatePointData(serieId, index, axis, normalized);
    debouncedUpdateChart(); // Espera 400ms desde la última tecla antes de redibujar
}

/**
 * Maneja el input en celdas numéricas:
 * - Si el usuario escribe punto (.), muestra aviso de que debe usar coma
 * - Si el usuario escribe coma (,), la reemplaza automáticamente por punto en el valor interno
 */
export function handleDecimalInput(event) {
    const input = event.target;
    const val = input.value;
    if (val.includes('.')) {
        showDecimalWarning(input);
    }
}

/**
 * Actualiza la incertidumbre por defecto (columna) de una serie
 * @param {number} serieId - ID de la serie
 * @param {string} axis - Eje ('x' o 'y')
 * @param {number} value - Valor de incertidumbre
 */
export function updateDefaultError(serieId, axis, value) {
    updateDefaultErrorData(serieId, axis, value);
    renderTable(serieId);
    updateChart();
}

/**
 * Actualiza el color de una serie (wrapper para exponer)
 */
export function updateSerieColor(serieId, color) {
    updateSerieColorData(serieId, color);
    updateChart();
}

/**
 * Actualiza el tipo de ajuste (wrapper para exponer)
 */
export function updateFitType(serieId, fitType) {
    updateFitTypeData(serieId, fitType);
    updateChart();
}

/**
 * Exporta CSV (wrapper para exponer)
 */
export function exportCSV(serieId) {
    exportCSVData(serieId);
}

/**
 * Trigger para importar CSV (wrapper para exponer)
 */
export function importCSV(serieId) {
    document.getElementById(`file-${serieId}`).click();
}

/**
 * Limpia la tabla (wrapper para exponer)
 */
export function clearTable(serieId) {
    if (confirm('¿Estás seguro de que quieres borrar todos los datos de esta serie?')) {
        clearTableData(serieId);
        renderTable(serieId);
        updateChart();
    }
}

/**
 * Borra TODOS los datos de TODAS las series y reinicia el proyecto
 */
export function clearAllData() {
    if (confirm('⚠️ DESTRUCTIVO: ¿Estás seguro de que quieres BORRAR TODO el proyecto? \nSe perderán todas las series y configuraciones.')) {
        AppState.series = [];
        AppState.nextId = 1;

        // Agregar una serie vacía por defecto para que el usuario no quede en el limbo
        addSerieData(); // Esta función ya existe en este módulo y usa AppState.

        renderSeries();
        updateChart();
        import('./chart_config.js').then(mod => mod.updateChartConfig());
    }
}

// ============================================
// PROPAGACIÓN DE ERRORES
// ============================================

/**
 * Activa/desactiva la calculadora de propagación de errores
 */
export function toggleErrorPropagation() {
    const isChecked = document.getElementById('showErrorPropagation').checked;
    const controls = document.getElementById('errorPropagationControls');
    controls.style.display = isChecked ? 'block' : 'none';
}

/**
 * Calcula la propagación de errores
 */
export function calculateErrorPropagation() {
    const operation = document.getElementById('errorOperation').value;
    const valueA = parseFloat(document.getElementById('errorValueA').value);
    const deltaA = parseFloat(document.getElementById('errorDeltaA').value);
    const valueB = parseFloat(document.getElementById('errorValueB').value);
    const deltaB = parseFloat(document.getElementById('errorDeltaB').value);

    // Validar inputs
    if (isNaN(valueA) || isNaN(deltaA) || isNaN(valueB) || isNaN(deltaB)) {
        alert('Por favor, ingresa todos los valores numéricos');
        return;
    }

    if (deltaA < 0 || deltaB < 0) {
        alert('Los errores deben ser valores positivos');
        return;
    }

    if (operation === 'quotient' && valueB === 0) {
        alert('No se puede dividir por cero');
        return;
    }

    try {
        // Validar precisión de los inputs
        const warnings = validateAllInputs(valueA, deltaA, valueB, deltaB);

        // Calcular resultado
        const result = propagateUncertainty(valueA, deltaA, valueB, deltaB, operation);

        // Mostrar resultado con advertencias si las hay
        const resultDiv = document.getElementById('errorPropagationResult');
        let html = '';

        if (warnings.length > 0) {
            html += formatWarnings(warnings);
        }

        html += formatPropagationResult(result);

        resultDiv.innerHTML = html;
        resultDiv.style.display = 'block';
    } catch (error) {
        alert('Error en el cálculo: ' + error.message);
    }
}

// ============================================
// CONVERSIÓN DE UNIDADES
// ============================================

/**
 * Actualiza la unidad de un eje y convierte los datos
 * 
 * @param {string} axis - 'x' o 'y'
 * @param {string} newUnit - Nueva unidad seleccionada
 */
export function updateAxisUnit(axis, newUnit) {
    // Importar funciones de unidades dinámicamente
    import('./units.js').then(unitsModule => {
        const { convert, detectCategory, getCategoryName } = unitsModule;

        const unitSelect = document.getElementById(`unit${axis.toUpperCase()}`);
        const customInput = document.getElementById(`unit${axis.toUpperCase()}Custom`);
        const prefixSelect = document.getElementById(`prefix${axis.toUpperCase()}`);
        const prefix = prefixSelect ? prefixSelect.value : '';
        
        let actualBase = newUnit;
        
        if (unitSelect && unitSelect.value === 'custom_manual') {
            if (customInput) customInput.style.display = 'block';
            if (newUnit === 'custom_manual') return; // Solo querían mostrar la caja
            actualBase = newUnit;
        } else {
            if (customInput) {
                customInput.style.display = 'none';
                customInput.value = '';
            }
        }

        if (!actualBase) {
            // Limpiar unidad si seleccionó 'Sin unidad' o vacío
            for (const serie of AppState.series) {
                if (!serie.units) serie.units = {};
                serie.units[axis] = {
                    unit: '',
                    category: 'none',
                    original: ''
                };
            }
            import('./chart_config.js').then(mod => mod.updateChartConfig());
            updateChart();
            return;
        }

        const combinedUnit = prefix + actualBase;

        // Detectar categoría de la nueva unidad combinada
        let newCategory = detectCategory(combinedUnit);
        if (!newCategory) {
            newCategory = 'custom';
            console.log(`Unidad desconocida detectada: ${combinedUnit}. Asignando categoría 'custom'`);
        }

        // Verificar si hay datos para convertir
        if (AppState.series.length === 0) {
            console.log(`Unidad del eje ${axis.toUpperCase()} establecida a: ${combinedUnit}`);
            import('./chart_config.js').then(mod => mod.updateChartConfig());
            updateChart();
            return;
        }

        // Buscar la unidad actual en las series
        // Ya no se realizan conversiones matemáticas por decisión de diseño.
        // Solo se actualizan las etiquetas/metadatos para el gráfico.
        for (const serie of AppState.series) {
            if (!serie.units) serie.units = {};
            serie.units[axis] = {
                unit: combinedUnit,
                category: newCategory,
                original: combinedUnit
            };
        }

        // Actualizar gráfica
        import('./chart_config.js').then(mod => mod.updateChartConfig());
        updateChart();
        renderSeries();

        console.log(`Unidad del eje ${axis.toUpperCase()} cambiada a ${combinedUnit} (etiqueta actualizada).`);
    }).catch(error => {
        console.error('Error al cargar módulo de unidades:', error);
        alert('Error al convertir unidades');
    });
}

/**
 * Procesa la unidad escrita manualmente en el input personalizado
 * @param {string} axis - 'x' o 'y'
 * @param {string} newUnit - Valor tipeado
 */
export function updateCustomUnit(axis, newUnit) {
    if (!newUnit.trim()) return;
    updateAxisUnit(axis, newUnit.trim());
}

/**
 * Se llama cuando cambia el selector de prefijo.
 * Obtiene la unidad base actual (del select o del custom input) y vuelve a procesar.
 */
export function updateAxisPrefix(axis, prefixValue) {
    const unitSelect = document.getElementById(`unit${axis.toUpperCase()}`);
    const customInput = document.getElementById(`unit${axis.toUpperCase()}Custom`);
    
    let baseUnit = '';
    if (unitSelect && unitSelect.value === 'custom_manual') {
        baseUnit = customInput ? customInput.value.trim() : '';
        if (!baseUnit) baseUnit = 'custom_manual';
    } else if (unitSelect) {
        baseUnit = unitSelect.value;
    }
    
    updateAxisUnit(axis, baseUnit);
}

/**
 * Muestra una notificación temporal de conversión exitosa
 */
function showUnitConversionNotification(from, to, count) {
    if (count === 0) return; // No mostrar nada si no hubo conversión matemática real

    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 3000;
        animation: slideIn 0.3s ease-out;
    `;
    notification.innerHTML = `
        <strong>✓ Conversión exitosa</strong><br>
        ${count} valores convertidos de <strong>${from}</strong> a <strong>${to}</strong>
    `;

    document.body.appendChild(notification);

    // Remover después de 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Muestra el modal de ayuda específico para las unidades
 */
export function showUnitHelp() {
    if (document.getElementById('unitHelpModal')) return;

    const modal = document.createElement('div');
    modal.id = 'unitHelpModal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0, 0, 0, 0.5); z-index: 4000;
        display: flex; justify-content: center; align-items: center;
        animation: fadeIn 0.2s;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        background: white; padding: 25px; border-radius: 8px;
        max-width: 500px; width: 90%; box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        position: relative; line-height: 1.5; color: #333;
    `;

    content.innerHTML = `
        <button id="closeUnitHelp" style="position: absolute; top: 10px; right: 15px; border: none; background: none; font-size: 24px; cursor: pointer; color: #888;">&times;</button>
        <h3 style="margin-top: 0; color: #4a5568; border-bottom: 2px solid #ebf8ff; padding-bottom: 10px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">📏 Sistema de Unidades</h3>
        
        <p style="margin-bottom: 15px;">El graficador te permite gestionar las unidades físicas de tus datos de forma inteligente:</p>
        
        <ul style="padding-left: 20px; text-align: left;">
            <li style="margin-bottom: 12px;"><strong>Unidades Base:</strong> Seleccioná la unidad correcta de la lista para organizar las etiquetas de los ejes de tu gráfica.</li>
            <li style="margin-bottom: 12px;"><strong>Prefijos:</strong> Usá el menú de la izquierda para agregar un prefijo a la unidad (mili, micro, kilo, etc.), lo cual se reflejará instantáneamente en el gráfico (ej. <i>mA</i>, <i>kV</i>).</li>
            <li style="margin-bottom: 12px;"><strong>Unidades Personalizadas:</strong> Si tu unidad no está en la lista, seleccioná <i>"Otra (Personalizada)..."</i> y escribíla. ¡Podés combinarlas con los prefijos!</li>
        </ul>
        <div style="text-align: right; margin-top: 25px;">
            <button id="closeUnitHelpBtn" style="padding: 8px 16px; background-color: #4a5568; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Entendido</button>
        </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    document.getElementById('closeUnitHelp').onclick = closeUnitHelp;
    document.getElementById('closeUnitHelpBtn').onclick = closeUnitHelp;
    modal.onclick = (e) => { if (e.target === modal) closeUnitHelp(); };
}

/**
 * Cierra el modal de ayuda de unidades, si está abierto
 */
export function closeUnitHelp() {
    const modal = document.getElementById('unitHelpModal');
    if (modal && document.body.contains(modal)) {
        document.body.removeChild(modal);
    }
}

// ============================================
// CONTROL DE MENÚ Y MODALES
// ============================================

/**
 * Toggle del menú de herramientas
 */
export function toggleToolsMenu() {
    const menu = document.getElementById('toolsMenu');
    const button = document.querySelector('[aria-controls="toolsMenu"]');
    const isHidden = menu.style.display === 'none';

    menu.style.display = isHidden ? 'block' : 'none';

    // Actualizar aria-expanded para accesibilidad
    if (button) {
        button.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
    }

    // Cerrar al hacer click fuera
    if (isHidden) {
        setTimeout(() => {
            document.addEventListener('click', closeMenuOnClickOutside);
        }, 0);
    } else {
        document.removeEventListener('click', closeMenuOnClickOutside);
    }
}

function closeMenuOnClickOutside(event) {
    const menu = document.getElementById('toolsMenu');
    const button = document.querySelector('[aria-controls="toolsMenu"]');

    if (!menu.contains(event.target) && !button.contains(event.target)) {
        menu.style.display = 'none';
        button.setAttribute('aria-expanded', 'false');
        document.removeEventListener('click', closeMenuOnClickOutside);
    }
}
/**
 * Abre el modal de propagación de errores
 */
export function openErrorPropagationModal() {
    const modal = document.getElementById('errorPropagationModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';

    // Cerrar el menú de herramientas
    const menu = document.getElementById('toolsMenu');
    menu.style.display = 'none';
}

/**
 * Cierra el modal de propagación de errores
 */
export function closeErrorPropagationModal() {
    const modal = document.getElementById('errorPropagationModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';

    // Limpiar resultado
    const resultDiv = document.getElementById('errorPropagationResult');
    resultDiv.style.display = 'none';
}

// ============================================
// ANÁLISIS DIMENSIONAL
// ============================================

/**
 * Abre el modal de análisis dimensional
 */
export function openDimensionalAnalysisModal() {
    const modal = document.getElementById('dimensionalAnalysisModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';

    // Cerrar el menú de herramientas
    const menu = document.getElementById('toolsMenu');
    menu.style.display = 'none';

    // Llenar catálogo si está vacío
    const catalog = document.getElementById('dimCatalog');
    if (catalog.children.length === 0) {
        populateDimensionalCatalog();
    }
}

/**
 * Cierra el modal de análisis dimensional
 */
export function closeDimensionalAnalysisModal() {
    const modal = document.getElementById('dimensionalAnalysisModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';

    // Limpiar resultado
    const resultDiv = document.getElementById('dimResult');
    resultDiv.style.display = 'none';
    document.getElementById('dimExpression').value = '';
}

/**
 * Abre el modal de datos de prueba
 */
export function openTestDataModal() {
    const modal = document.getElementById('testDataModal');
    if (modal) modal.style.display = 'block';
    
    // Cerrar el menú de herramientas
    const menu = document.getElementById('toolsMenu');
    if (menu) menu.style.display = 'none';
}

/**
 * Cierra el modal de datos de prueba
 */
export function closeTestDataModal() {
    const modal = document.getElementById('testDataModal');
    if (modal) modal.style.display = 'none';
}

/**
 * Llena el catálogo de magnitudes físicas
 */
function populateDimensionalCatalog() {
    // Importar dinámicamente el módulo de análisis dimensional
    import(`./dimensional-analysis.js?v=${Date.now()}`).then(module => {
        const { MAGNITUDE_INFO } = module;
        const catalog = document.getElementById('dimCatalog');

        let html = '';
        let isEven = false;

        for (const [name, info] of Object.entries(MAGNITUDE_INFO)) {
            const bgColor = isEven ? '#f8f9fa' : 'white';
            html += `
                <tr style="background: ${bgColor};">
                    <td style="padding: 10px;">${name}</td>
                    <td style="padding: 10px; font-family: monospace;">${info.symbol}</td>
                    <td style="padding: 10px; font-family: monospace; color: #667eea;">${info.dimension.toString()}</td>
                    <td style="padding: 10px;">${info.units.join(', ')}</td>
                </tr>
            `;
            isEven = !isEven;
        }

        catalog.innerHTML = html;
    });
}

/**
 * Analiza una expresión dimensional
 */
export function analyzeDimension() {
    const expression = document.getElementById('dimExpression').value.trim();

    if (!expression) {
        alert('Por favor, ingresa una expresión');
        return;
    }

    // Importar dinámicamente el módulo de análisis dimensional
    import(`./dimensional-analysis.js?v=${Date.now()}`).then(module => {
        const { parseExpression, identifyMagnitude, suggestUnitsForDimension } = module;

        try {
            const dimension = parseExpression(expression);

            if (!dimension) {
                alert('No se pudo analizar la expresión. Verifica la sintaxis.');
                return;
            }

            // Mostrar resultado
            const resultDiv = document.getElementById('dimResult');
            const dimValue = document.getElementById('dimValue');
            const dimMagnitude = document.getElementById('dimMagnitude');
            const dimUnits = document.getElementById('dimUnits');

            dimValue.textContent = dimension.toString();

            const magnitude = identifyMagnitude(dimension);
            dimMagnitude.textContent = magnitude || 'Magnitud no identificada';

            const units = suggestUnitsForDimension(dimension);
            dimUnits.textContent = units.length > 0 ? units.join(', ') : 'No hay unidades del S.I. para esta dimensión';

            resultDiv.style.display = 'block';

            // Scroll al resultado
            resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } catch (error) {
            console.error('Error al analizar dimensión:', error);
            alert('Error al analizar la expresión: ' + error.message);
        }
    }).catch(err => console.error("Error cargando units.js", err));
}

/**
 * Mueve una fila de datos hacia arriba
 * @param {number} serieId - ID de la serie
 * @param {number} index - Índice de la fila
 */
export function moveRowUp(serieId, index) {
    const serie = AppState.series.find(s => s.id === serieId);
    if (!serie || index <= 0) return;

    // Intercambiar datos
    const temp = serie.data[index];
    serie.data[index] = serie.data[index - 1];
    serie.data[index - 1] = temp;

    renderTable(serieId);
    updateChart();
}

/**
 * Mueve una fila de datos hacia abajo
 * @param {number} serieId - ID de la serie
 * @param {number} index - Índice de la fila
 */
export function moveRowDown(serieId, index) {
    const serie = AppState.series.find(s => s.id === serieId);
    if (!serie || index >= serie.data.length - 1) return;

    // Intercambiar datos
    const temp = serie.data[index];
    serie.data[index] = serie.data[index + 1];
    serie.data[index + 1] = temp;

    renderTable(serieId);
    updateChart();
}

// ============================================
// CLIPBOARD — PEGAR DESDE EXCEL / GOOGLE SHEETS
// ============================================

/**
 * Maneja el pegado de datos tabulares desde Excel, Google Sheets o LibreOffice Calc.
 * Detecta el número de columnas para asignar automáticamente X y Y.
 *
 * Formato soportado:
 *   2 columnas: X, Y
 *
 * @param {ClipboardEvent} event
 * @param {number} serieId - ID de la serie destino
 */
export function handleTablePaste(event, serieId) {
    const text = event.clipboardData?.getData('text');
    if (!text) return;

    const rows = text.split(/\r?\n/).filter(r => r.trim() !== '');
    if (rows.length === 0) return;

    // Detectar separador: tab (Excel/Sheets) o coma (CSV)
    const sep = rows[0].includes('\t') ? '\t' : ',';
    const parsed = rows.map(r => r.split(sep).map(v => v.trim()));
    const numCols = parsed[0].length;

    // Saltar cabecera si la primera celda no es numérica
    const startIdx = isNaN(parseFloat(parsed[0][0])) ? 1 : 0;
    const dataRows = parsed.slice(startIdx);
    if (dataRows.length === 0) return;

    const serie = AppState.series.find(s => s.id === serieId);
    if (!serie) return;

    serie.data = dataRows.map(cols => {
        const toNum = (v) => (v !== undefined && v !== '' && !isNaN(parseFloat(v))) ? parseFloat(v) : '';
        return { x: toNum(cols[0]), y: toNum(cols[1]) };
    });

    if (serie.data.length === 0) {
        serie.data = [{ x: '', y: '' }];
    }

    // Prevenir el pegado nativo del navegador DESPUES de leer los datos
    event.preventDefault();

    renderTable(serieId);
    updateChart();
    _showPasteNotification(serie.data.length, numCols);
}

/**
 * Muestra una notificación temporal con el resultado del pegado.
 * @param {number} count - Número de filas pegadas
 * @param {number} cols  - Número de columnas detectadas
 */
function _showPasteNotification(count, cols) {
    const label = 'X, Y';
    const n = document.createElement('div');
    n.style.cssText = 'position:fixed;top:80px;right:20px;background:linear-gradient(135deg,#11998e,#38ef7d);' +
        'color:white;padding:14px 20px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.3);' +
        'z-index:3000;font-size:14px;font-weight:500;transition:opacity .3s';
    n.textContent = `✓ ${count} fila${count !== 1 ? 's' : ''} pegada${count !== 1 ? 's' : ''} (${label})`;
    document.body.appendChild(n);
    setTimeout(() => { n.style.opacity = '0'; setTimeout(() => n.remove(), 300); }, 3000);
}
