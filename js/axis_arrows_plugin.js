// ============================================
// PLUGIN DE EJES CON FLECHAS (ESTILO FÍSICA)
// ============================================

/**
 * Plugin personalizado para dibujar flechas en los extremos de los ejes
 * y etiquetas de magnitudes al estilo de gráficas de física
 */
const axisArrowsPlugin = {
    id: 'axisArrows',
    afterDraw(chart) {
        const ctx = chart.ctx;
        const chartArea = chart.chartArea;
        const xScale = chart.scales.x;
        const yScale = chart.scales.y;

        if (!chartArea || !xScale || !yScale) return;

        ctx.save();
        ctx.strokeStyle = '#666';
        ctx.fillStyle = '#666';
        ctx.lineWidth = 2;

        // Obtener etiquetas de los ejes
        const xLabel = xScale.options.title.text || 'X';
        const yLabel = yScale.options.title.text || 'Y';

        // ============================================
        // FLECHA EJE X (horizontal, apunta a la derecha)
        // ============================================
        const xAxisY = yScale.getPixelForValue(0) || chartArea.bottom;
        const xStart = chartArea.left;
        const xEnd = chartArea.right;
        const arrowSize = 10;

        // Línea del eje X
        ctx.beginPath();
        ctx.moveTo(xStart, xAxisY);
        ctx.lineTo(xEnd, xAxisY);
        ctx.stroke();

        // Flecha derecha (punta del eje X)
        ctx.beginPath();
        ctx.moveTo(xEnd, xAxisY);
        ctx.lineTo(xEnd - arrowSize, xAxisY - arrowSize / 2);
        ctx.lineTo(xEnd - arrowSize, xAxisY + arrowSize / 2);
        ctx.closePath();
        ctx.fill();

        // Etiqueta del eje X (al lado de la flecha)
        ctx.font = 'italic 14px Arial';
        ctx.fillStyle = '#333';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(xLabel, xEnd + 5, xAxisY);

        // ============================================
        // FLECHA EJE Y (vertical, apunta hacia arriba)
        // ============================================
        const yAxisX = xScale.getPixelForValue(0) || chartArea.left;
        const yStart = chartArea.bottom;
        const yEnd = chartArea.top;

        // Línea del eje Y
        ctx.beginPath();
        ctx.moveTo(yAxisX, yStart);
        ctx.lineTo(yAxisX, yEnd);
        ctx.stroke();

        // Flecha arriba (punta del eje Y)
        ctx.beginPath();
        ctx.moveTo(yAxisX, yEnd);
        ctx.lineTo(yAxisX - arrowSize / 2, yEnd + arrowSize);
        ctx.lineTo(yAxisX + arrowSize / 2, yEnd + arrowSize);
        ctx.closePath();
        ctx.fill();

        // Etiqueta del eje Y (al lado de la flecha)
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(yLabel, yAxisX, yEnd - 5);

        ctx.restore();
    }
};

// Registrar el plugin
Chart.register(axisArrowsPlugin);
