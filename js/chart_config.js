
// ============================================
// CONFIGURACIÓN DE GRÁFICA
// ============================================

import { AppState } from './state.js';
import { linearRegression } from './regression.js';
import { escapeHTML, parseDecimal, formatNumber } from './utils.js';

export function toggleConfigPanel() {
    const content = document.getElementById('config-panel-content');
    const icon = document.getElementById('config-toggle-icon');
    if (content.style.display === 'none') {
        content.style.display = 'block';
        if (icon) icon.textContent = '▲';
    } else {
        content.style.display = 'none';
        if (icon) icon.textContent = '▼';
    }
}

/**
 * Toggle mobile menu visibility
 */
export function toggleMobileMenu() {
    const menu = document.getElementById('headerMenu');
    const btn = document.getElementById('mobileMenuBtn');
    if (!menu) return;

    const isOpen = menu.classList.contains('mobile-open');
    if (isOpen) {
        menu.classList.remove('mobile-open');
        if (btn) btn.textContent = '☰';
    } else {
        menu.classList.add('mobile-open');
        if (btn) btn.textContent = '✕';
    }
}

export function updateChartConfig() {
    const chart = AppState.chart;
    if (!chart) return;

    // Título
    const title = document.getElementById('chartTitle').value;
    chart.options.plugins.title = {
        display: false, // Ocultar título interno (ya se muestra en HTML y exportación)
        text: title,
        font: { size: 18 }
    };
    chart.options.plugins.legend = {
        position: 'top',
        labels: {
            filter: function (item, chart) {
                // Lógica personalizada de leyenda:
                // Si hay solo 1 serie (AppState.series.length === 1):
                const isSingleSeries = AppState.series.length === 1;

                // "item.text" es el label del dataset. 
                // Buscamos ocultar el dataset de Puntos (que tiene el nombre de la serie)
                // y mostrar SIEMPRE el de Ajuste (que empieza con "Ajuste:")

                if (isSingleSeries) {
                    // Si el label es igual al nombre de la serie y NO es un estilo de línea, es el de puntos.
                    // El de ajuste ahora se llama igual, pero tiene pointStyle = 'line'.
                    // Sin embargo, `item` en filter puede no tener todas las props del dataset.
                    // Verificamos si item.text es igual al nombre de la serie única.

                    if (item.text === AppState.series[0].name) {
                        // Si es el dataset de Puntos, lo ocultamos. ¿Cómo distinguirlo del de Ajuste?
                        // Chart.js genera items de leyenda. El dataset de puntos tiene index X y el de linea Y.
                        // Generalmente Puntos van primero.
                        // Ojo: Si ambos tienen el mismo label, Chart.js a veces los agrupa?
                        // No, genera dos items si son diferentes datasets.

                        // Si el item usa pointStyle 'rect' (default para puntos/barras) o 'circle' vs 'line'
                        // item.pointStyle puede decirnos.

                        // PERO: Hemos configurado pointStyle: 'line' para el ajuste.
                        // Los puntos usan default (circle).

                        if (item.pointStyle !== 'line') {
                            return false; // Ocultar puntos
                        }
                    }

                    // Ocultar items que no sean lineas de ajuste o pendiente
                    // (Pendiente empieza con 'Pendiente' asi que pasa)
                }
                return true;
            }
        }
    };

    // Ejes
    const labelX = document.getElementById('labelX').value;
    const labelY = document.getElementById('labelY').value;
    const defaultXError = document.getElementById('defaultXError')?.value;
    const defaultYError = document.getElementById('defaultYError')?.value;

    AppState.config.defaultXError = defaultXError !== undefined && defaultXError !== '' ? parseDecimal(defaultXError) : 0;
    AppState.config.defaultYError = defaultYError !== undefined && defaultYError !== '' ? parseDecimal(defaultYError) : 0;

    function getComposedUnit(axis) {
        const prefixSelect = document.getElementById(`prefix${axis.toUpperCase()}`);
        const unitSelect = document.getElementById(`unit${axis.toUpperCase()}`);
        const customInput = document.getElementById(`unit${axis.toUpperCase()}Custom`);
        
        const prefix = prefixSelect ? prefixSelect.value : '';
        let baseUnit = '';
        
        if (unitSelect && unitSelect.value === 'custom_manual') {
            baseUnit = customInput ? customInput.value.trim() : '';
        } else if (unitSelect) {
            baseUnit = unitSelect.value;
        }
        
        if (!baseUnit) return '';
        return prefix + baseUnit;
    }

    const unitX = getComposedUnit('x');
    const unitY = getComposedUnit('y');

    // Formatear etiquetas con unidades: "Etiqueta (unidad)"
    const xAxisLabel = unitX ? `${labelX} (${unitX})` : labelX;
    const yAxisLabel = unitY ? `${labelY} (${unitY})` : labelY;

    chart.options.scales.x.title.text = xAxisLabel;
    chart.options.scales.y.title.text = yAxisLabel;

    // Límites
    const minX = document.getElementById('minX').value;
    const maxX = document.getElementById('maxX').value;
    const minY = document.getElementById('minY').value;
    const maxY = document.getElementById('maxY').value;

    chart.options.scales.x.min = minX !== '' ? parseDecimal(minX) : null;
    chart.options.scales.x.max = maxX !== '' ? parseDecimal(maxX) : null;
    chart.options.scales.y.min = minY !== '' ? parseDecimal(minY) : null;
    chart.options.scales.y.max = maxY !== '' ? parseDecimal(maxY) : null;

    // Grid
    const showGridCheckbox = document.getElementById('showGrid');
    const showGrid = showGridCheckbox ? showGridCheckbox.checked : true;

    const showGridXCheckbox = document.getElementById('showGridX');
    const showGridYCheckbox = document.getElementById('showGridY');
    const showGridX = showGridXCheckbox ? showGridXCheckbox.checked : showGrid;
    const showGridY = showGridYCheckbox ? showGridYCheckbox.checked : showGrid;

    chart.options.scales.x.grid.display = showGridX;
    chart.options.scales.y.grid.display = showGridY;

    // Origen
    const beginAtZero = document.getElementById('beginAtZero')?.checked ?? false;
    chart.options.scales.x.beginAtZero = beginAtZero;
    chart.options.scales.y.beginAtZero = beginAtZero;

    chart.update();
}

/**
 * Toggle intersection display based on checkbox
 */
export function toggleIntersection() {
    const checkbox = document.getElementById('showIntersectionCheck');
    const display = document.getElementById('intersection-display');

    if (!display) return;

    if (checkbox && checkbox.checked) {
        // Calcular y mostrar intersección
        showIntersection();
    } else {
        // Ocultar
        display.style.display = 'none';
    }
}

/**
 * Calcular y mostrar punto de intersección entre dos series
 */
export function showIntersection() {
    const display = document.getElementById('intersection-display');
    const content = document.getElementById('intersection-content');

    if (!display || !content || !window.AppState) return;

    const series = window.AppState.series;

    if (series.length < 2) {
        content.innerHTML = '<p style="color: #e67e22;">⚠️ Necesitas al menos 2 series para calcular la intersección.</p>';
        display.style.display = 'block';
        return;
    }

    // Obtener los ajustes de las primeras dos series con ajuste lineal
    const linearSeries = series.filter(s => s.fitType === 'linear' && s.data.filter(p => p.x !== '' && p.y !== '').length >= 2);

    if (linearSeries.length < 2) {
        content.innerHTML = '<p style="color: #e67e22;">⚠️ Necesitas al menos 2 series con ajuste lineal para calcular la intersección.</p>';
        display.style.display = 'block';
        return;
    }

    // Calcular coeficientes de las dos primeras series lineales
    const s1 = linearSeries[0];
    const s2 = linearSeries[1];

    const data1 = s1.data.filter(p => p.x !== '' && p.y !== '').map(p => ({ x: parseDecimal(p.x), y: parseDecimal(p.y) }));
    const data2 = s2.data.filter(p => p.x !== '' && p.y !== '').map(p => ({ x: parseDecimal(p.x), y: parseDecimal(p.y) }));

    // Regresión lineal simple: y = ax + b (misma implementación que el resto de la app)
    const r1 = linearRegression(data1);
    const r2 = linearRegression(data2);

    if (!r1 || !r2) {
        content.innerHTML = '<p style="color: #e67e22;">⚠️ No se puede calcular la intersección: una de las series tiene todos los valores de X iguales (línea vertical).</p>';
        display.style.display = 'block';
        return;
    }

    // Intersección: a1*x + b1 = a2*x + b2  =>  x = (b2 - b1) / (a1 - a2)
    if (Math.abs(r1.a - r2.a) < 0.0001) {
        content.innerHTML = '<p style="color: #e67e22;">⚠️ Las rectas son paralelas (misma pendiente), no hay intersección.</p>';
        display.style.display = 'block';
        return;
    }

    const xInt = (r2.b - r1.b) / (r1.a - r2.a);
    const yInt = r1.a * xInt + r1.b;

    content.innerHTML = `
        <p><strong>Series:</strong> ${escapeHTML(s1.name)} ∩ ${escapeHTML(s2.name)}</p>
        <p style="font-size: 1.2em; margin-top: 10px;">
            <strong>X = ${formatNumber(xInt, 4)}</strong><br>
            <strong>Y = ${formatNumber(yInt, 4)}</strong>
        </p>
    `;
    display.style.display = 'block';
}
