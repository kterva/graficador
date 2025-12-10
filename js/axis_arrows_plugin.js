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

        // Verificar si los ejes (valor 0) están visibles en el área actual
        const xZero = xScale.getPixelForValue(0);
        const yZero = yScale.getPixelForValue(0);

        ctx.save();
        ctx.fillStyle = '#333';
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;

        const xLabel = xScale.options.title.text || 'X';
        const yLabel = yScale.options.title.text || 'Y';
        const arrowSize = 10;

        // ============================================
        // FLECHA EJE X (Horizontal)
        // ============================================
        // Solo dibujar si la línea Y=0 (eje X) está visible verticalmente
        if (yZero >= chartArea.top && yZero <= chartArea.bottom) {
            const arrowX = chartArea.right;
            const arrowY = yZero;

            // Dibujar línea del eje X explícitamente
            ctx.beginPath();
            ctx.moveTo(chartArea.left, arrowY);
            ctx.lineTo(chartArea.right, arrowY);
            ctx.stroke();

            // Dibujar flecha (apunta derecha)
            ctx.beginPath();
            ctx.moveTo(arrowX, arrowY);
            ctx.lineTo(arrowX - arrowSize, arrowY - arrowSize / 2);
            ctx.lineTo(arrowX - arrowSize, arrowY + arrowSize / 2);
            ctx.closePath();
            ctx.fill();

            // Etiqueta X
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(xLabel, arrowX + 5, arrowY);
        }

        // ============================================
        // FLECHA EJE Y (Vertical)
        // ============================================
        // Solo dibujar si la línea X=0 (eje Y) está visible horizontalmente
        if (xZero >= chartArea.left && xZero <= chartArea.right) {
            const arrowX = xZero;
            const arrowY = chartArea.top;

            // Dibujar línea del eje Y explícitamente
            ctx.beginPath();
            ctx.moveTo(arrowX, chartArea.bottom);
            ctx.lineTo(arrowX, chartArea.top);
            ctx.stroke();

            // Dibujar flecha (apunta arriba)
            ctx.beginPath();
            ctx.moveTo(arrowX, arrowY);
            ctx.lineTo(arrowX - arrowSize / 2, arrowY + arrowSize);
            ctx.lineTo(arrowX + arrowSize / 2, arrowY + arrowSize);
            ctx.closePath();
            ctx.fill();

            // Etiqueta Y
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(yLabel, arrowX, arrowY - 5);
        }

        ctx.restore();
    }
};

// Registrar el plugin
Chart.register(axisArrowsPlugin);
