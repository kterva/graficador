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

/**
 * Plugin que dibuja los puntos de datos con estilo "diana científica":
 * un círculo exterior hueco + punto central sólido.
 *
 * Esto permite ver el valor exacto (centro) y distinguir el punto
 * desde lejos (aro exterior), sin tapar las barras de error.
 *
 * Solo actúa sobre datasets con errorBars: true (datos reales).
 */
export const bullseyePointsPlugin = {
    id: 'bullseyePoints',
    afterDatasetsDraw(chart) {
        const { ctx } = chart;

        chart.data.datasets.forEach((dataset, i) => {
            if (!dataset.errorBars) return; // Solo datasets de datos reales
            const meta = chart.getDatasetMeta(i);
            if (meta.hidden) return;

            const color = dataset.borderColor || '#333';

            ctx.save();
            meta.data.forEach(point => {
                const { x, y } = point;

                // Círculo exterior (aro)
                ctx.beginPath();
                ctx.arc(x, y, 6, 0, Math.PI * 2);
                ctx.strokeStyle = color;
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Punto central sólido
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
            });
            ctx.restore();
        });
    }
};
