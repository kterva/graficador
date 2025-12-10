// ============================================
// EXPORTACIÓN DE GRÁFICA
// ============================================

import { AppState } from './state.js';

// Helper: Redondeo a cifras significativas
function getDecimalPlaces(uncertainty) {
    if (!uncertainty || uncertainty === 0) return 2; // Default
    const log10 = Math.floor(Math.log10(Math.abs(uncertainty)));
    // Queremos 1 cifra significativa para el error
    // Si error es 0.02 (10^-2), places = 2.
    // Si error es 12 (10^1), places = -1 (redondear a decenas) -> Pero en tabla mejor mostrar decimales si hace falta
    // Generalmente para tabla de datos, si error es > 1, usamos 0 decimales, si es < 1, los necesarios.
    return Math.max(0, -log10);
}

function formatValue(val, uncertainty) {
    if (uncertainty === 0) return parseFloat(val).toString(); // Sin incertidumbre, como venga

    // Regla: El error se redondea a 1 cifra significativa.
    // Y el valor se redondea al mismo orden de magnitud.

    const places = getDecimalPlaces(uncertainty);

    // Formatear error a 1 cifra sig (pero mostrando ceros necesarios)
    // Para visualización simple, toFixed va bien si places >= 0
    return parseFloat(val).toFixed(places);
}

function formatError(err) {
    if (err === 0) return "0";
    const places = getDecimalPlaces(err);
    return parseFloat(err).toFixed(places);
}


export function downloadChartJPG() {
    const chart = AppState.chart;
    if (!chart) return;

    const includeTable = document.getElementById('includeTableInExport')?.checked;
    const canvasOriginal = document.getElementById('myChart');

    // Crear canvas temporal para la composición
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');

    if (includeTable) {
        // === MODO CON TABLA (Dibujo Manual) ===
        const chartWidth = canvasOriginal.width;
        const chartHeight = canvasOriginal.height;
        const tableWidth = 350; // Un poco más estrecho
        const totalWidth = tableWidth + chartWidth;
        const totalHeight = Math.max(chartHeight, 600);

        tempCanvas.width = totalWidth;
        tempCanvas.height = totalHeight;

        // Fondo Blanco
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // 1. Dibujar Tabla a la Izquierda
        // SIN TÍTULO "Tabla de Datos"

        let yPos = 40;
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = '#000000';

        // Analizar Errores Constantes (Asumimos Serie 1 o Multiserie plana)
        // Para simplificar, analizamos por serie y dibujamos bloques si hay varias

        AppState.series.forEach((serie, index) => {
            if (index > 0) yPos += 20; // Espacio entre series 

            // Detectar constancia
            const validData = serie.data.filter(p => p.x !== '');
            const firstXErr = parseFloat(validData[0]?.xError || 0);
            const firstYErr = parseFloat(validData[0]?.yError || 0);

            const isXErrConst = validData.every(p => parseFloat(p.xError || 0) === firstXErr);
            const isYErrConst = validData.every(p => parseFloat(p.yError || 0) === firstYErr);

            // Obtener configuración desde DOM para asegurar consistencia
            const labelX = document.getElementById('labelX')?.value || 'X';
            const unitX = document.getElementById('unitX')?.value || '';
            const labelY = document.getElementById('labelY')?.value || 'Y';
            const unitY = document.getElementById('unitY')?.value || '';

            // Construir cabeceras
            // Formato deseado: (X ± 0.1) (s)

            // Eje X
            let headX = labelX;
            if (isXErrConst && firstXErr > 0) {
                headX = `(${headX} ± ${formatError(firstXErr)})`;
            }
            if (unitX) {
                headX += ` (${unitX})`;
            }

            // Eje Y
            let headY = labelY;
            if (isYErrConst && firstYErr > 0) {
                headY = `(${headY} ± ${formatError(firstYErr)})`;
            }
            if (unitY) {
                headY += ` (${unitY})`;
            }

            // Nombre de serie si hay más de una
            if (AppState.series.length > 1) {
                ctx.font = 'bold 13px Arial';
                ctx.fillText(serie.name, 20, yPos);
                yPos += 20;
            }

            ctx.font = 'bold 12px Arial';
            ctx.fillText(headX, 30, yPos);
            ctx.fillText(headY, 180, yPos);

            yPos += 8;
            ctx.beginPath();
            ctx.moveTo(20, yPos);
            ctx.lineTo(tableWidth - 20, yPos);
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.stroke();
            yPos += 18;

            ctx.font = '12px Arial';

            validData.forEach(p => {
                if (yPos > totalHeight - 20) return;

                const xErr = parseFloat(p.xError || 0);
                const yErr = parseFloat(p.yError || 0);

                // Valor X
                let xStr = formatValue(p.x, xErr > 0 ? xErr : 0);
                // Si error no es constante, agregarlo
                if (!isXErrConst && xErr > 0) {
                    xStr += ` ± ${formatError(xErr)} `;
                }

                // Valor Y
                let yStr = formatValue(p.y, yErr > 0 ? yErr : 0);
                if (!isYErrConst && yErr > 0) {
                    yStr += ` ± ${formatError(yErr)} `;
                }

                ctx.fillText(xStr, 30, yPos);
                ctx.fillText(yStr, 180, yPos);
                yPos += 18;
            });
        });

        // 2. Dibujar Gráfico a la Derecha
        ctx.drawImage(canvasOriginal, tableWidth, 0);

    } else {
        // === MODO SOLO GRÁFICA ===
        tempCanvas.width = canvasOriginal.width;
        tempCanvas.height = canvasOriginal.height;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        ctx.drawImage(canvasOriginal, 0, 0);
    }

    const link = document.createElement('a');
    link.download = 'grafica_completa.jpg';
    link.href = tempCanvas.toDataURL('image/jpeg', 0.9);
    link.click();
}

export function downloadChartPDF() {
    const chart = AppState.chart;
    if (!chart) return;

    const includeTable = document.getElementById('includeTableInExport')?.checked;
    const { jsPDF } = window.jspdf;

    const doc = new jsPDF({
        orientation: includeTable ? 'landscape' : 'landscape',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;

    // Título PDF (Solo en el documento fuera de la imagen)
    doc.setFontSize(16);
    const title = chart.options.plugins.title?.text || 'Gráfica de Datos';
    doc.text(title, margin, margin + 5);

    const canvas = document.getElementById('myChart');
    const imgData = canvas.toDataURL('image/png', 1.0);

    if (includeTable) {
        // 1. Preparar datos
        const bodies = []; // Array de { head: [], body: [] } por serie si queremos separarlas
        // O una sola tabla. "autoTable" soporta multiple bodies? No, multiples llamadas.

        let currentY = 25;
        const tableWidth = pageWidth * 0.35;

        AppState.series.forEach(serie => {
            const validData = serie.data.filter(p => p.x !== '');
            const firstXErr = parseFloat(validData[0]?.xError || 0);
            const firstYErr = parseFloat(validData[0]?.yError || 0);

            const isXErrConst = validData.every(p => parseFloat(p.xError || 0) === firstXErr);
            const isYErrConst = validData.every(p => parseFloat(p.yError || 0) === firstYErr);

            // Obtener configuración desde DOM
            const labelX = document.getElementById('labelX')?.value || 'X';
            const unitX = document.getElementById('unitX')?.value || '';
            const labelY = document.getElementById('labelY')?.value || 'Y';
            const unitY = document.getElementById('unitY')?.value || '';

            // Eje X
            let headX = labelX;
            if (isXErrConst && firstXErr > 0) headX = `(${headX} ± ${formatError(firstXErr)})`;
            if (unitX) headX += ` (${unitX})`;

            // Eje Y
            let headY = labelY;
            if (isYErrConst && firstYErr > 0) headY = `(${headY} ± ${formatError(firstYErr)})`;
            if (unitY) headY += ` (${unitY})`;

            const body = validData.map(p => {
                const xErr = parseFloat(p.xError || 0);
                const yErr = parseFloat(p.yError || 0);

                let xStr = formatValue(p.x, xErr > 0 ? xErr : 0);
                if (!isXErrConst && xErr > 0) xStr += ` ± ${formatError(xErr)} `;

                let yStr = formatValue(p.y, yErr > 0 ? yErr : 0);
                if (!isYErrConst && yErr > 0) yStr += ` ± ${formatError(yErr)} `;

                return [xStr, yStr];
            });

            // Render tabla
            doc.setFontSize(10);
            if (AppState.series.length > 1) {
                doc.text(serie.name, margin, currentY);
                currentY += 5;
            }

            doc.autoTable({
                head: [[headX, headY]],
                body: body,
                startY: currentY,
                margin: { left: margin },
                tableWidth: tableWidth,
                theme: 'grid',
                styles: { fontSize: 9, cellPadding: 2, halign: 'center' },
                headStyles: { fillColor: [52, 152, 219], halign: 'center' }
            });

            currentY = doc.lastAutoTable.finalY + 10;
        });

        // 2. Gráfica a la derecha
        const chartX = margin + tableWidth + 10;
        const chartWidth = pageWidth - chartX - margin;
        const imgProps = doc.getImageProperties(imgData);
        const chartHeight = (imgProps.height * chartWidth) / imgProps.width;

        doc.addImage(imgData, 'PNG', chartX, 25, chartWidth, chartHeight);

    } else {
        const imgProps = doc.getImageProperties(imgData);
        const pdfWidth = pageWidth;
        const pdfHeight = (imgProps.height * (pdfWidth - 2 * margin)) / imgProps.width;
        doc.addImage(imgData, 'PNG', margin, 25, pdfWidth - 2 * margin, pdfHeight);
    }

    doc.save('reporte_graficador.pdf');
}
