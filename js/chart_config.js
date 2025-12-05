
// ============================================
// CONFIGURACIÓN DE GRÁFICA
// ============================================

function toggleConfigPanel() {
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

function updateChartConfig() {
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
