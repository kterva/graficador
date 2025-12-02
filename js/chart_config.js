
// ============================================
// CONFIGURACIÓN DE GRÁFICA
// ============================================

function toggleConfigPanel() {
    const content = document.getElementById('config-panel-content');
    if (content.style.display === 'none') {
        content.style.display = 'block';
    } else {
        content.style.display = 'none';
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

    chart.options.scales.x.title.text = labelX;
    chart.options.scales.y.title.text = labelY;

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
