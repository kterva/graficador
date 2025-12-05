
// ============================================
// CONFIGURACIÓN DE GRÁFICA
// ============================================

import { AppState } from './state.js';

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

    if (menu.style.display === 'none' || menu.classList.contains('mobile-hidden')) {
        menu.style.display = 'flex';
        menu.classList.remove('mobile-hidden');
        if (btn) btn.textContent = '✕';
    } else {
        menu.style.display = 'none';
        menu.classList.add('mobile-hidden');
        if (btn) btn.textContent = '☰';
    }
}

export function updateChartConfig() {
    const chart = AppState.chart;
    if (!chart) return;

    // Título
    const title = document.getElementById('chartTitle').value;
    chart.options.plugins.title = {
        display: !!title,
        text: title,
        font: { size: 18 }
    };

    // Ejes
    const labelX = document.getElementById('labelX').value;
    const labelY = document.getElementById('labelY').value;
    const unitX = document.getElementById('unitX')?.value || '';
    const unitY = document.getElementById('unitY')?.value || '';

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

    chart.options.scales.x.min = minX !== '' ? parseFloat(minX) : null;
    chart.options.scales.x.max = maxX !== '' ? parseFloat(maxX) : null;
    chart.options.scales.y.min = minY !== '' ? parseFloat(minY) : null;
    chart.options.scales.y.max = maxY !== '' ? parseFloat(maxY) : null;

    // Grid
    const showGridX = document.getElementById('showGridX').checked;
    const showGridY = document.getElementById('showGridY').checked;

    chart.options.scales.x.grid.display = showGridX;
    chart.options.scales.y.grid.display = showGridY;

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

    const data1 = s1.data.filter(p => p.x !== '' && p.y !== '').map(p => ({ x: parseFloat(p.x), y: parseFloat(p.y) }));
    const data2 = s2.data.filter(p => p.x !== '' && p.y !== '').map(p => ({ x: parseFloat(p.x), y: parseFloat(p.y) }));

    // Regresión lineal simple: y = ax + b
    const regress = (data) => {
        const n = data.length;
        const sumX = data.reduce((s, p) => s + p.x, 0);
        const sumY = data.reduce((s, p) => s + p.y, 0);
        const sumXY = data.reduce((s, p) => s + p.x * p.y, 0);
        const sumX2 = data.reduce((s, p) => s + p.x * p.x, 0);
        const a = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const b = (sumY - a * sumX) / n;
        return { a, b };
    };

    const r1 = regress(data1);
    const r2 = regress(data2);

    // Intersección: a1*x + b1 = a2*x + b2  =>  x = (b2 - b1) / (a1 - a2)
    if (Math.abs(r1.a - r2.a) < 0.0001) {
        content.innerHTML = '<p style="color: #e67e22;">⚠️ Las rectas son paralelas (misma pendiente), no hay intersección.</p>';
        display.style.display = 'block';
        return;
    }

    const xInt = (r2.b - r1.b) / (r1.a - r2.a);
    const yInt = r1.a * xInt + r1.b;

    content.innerHTML = `
        <p><strong>Series:</strong> ${s1.name} ∩ ${s2.name}</p>
        <p style="font-size: 1.2em; margin-top: 10px;">
            <strong>X = ${xInt.toFixed(4)}</strong><br>
            <strong>Y = ${yInt.toFixed(4)}</strong>
        </p>
    `;
    display.style.display = 'block';
}
