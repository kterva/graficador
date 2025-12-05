/**
 * ============================================
 * PLUGINS DE CHART.JS
 * ============================================
 * 
 * Plugins personalizados para Chart.js
 * 
 * @module chart-plugins
 */

/**
 * Plugin personalizado de Chart.js para dibujar barras de error
 * en los puntos de datos
 */
export const errorBarsPlugin = {
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
