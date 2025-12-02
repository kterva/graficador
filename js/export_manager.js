
// ============================================
// EXPORTACIÓN DE GRÁFICA
// ============================================

function downloadChartPNG() {
    if (!chart) return;
    const link = document.createElement('a');
    link.download = 'grafica.png';
    link.href = chart.toBase64Image();
    link.click();
}

function downloadChartPDF() {
    if (!chart) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'landscape',
    });

    const canvas = document.getElementById('myChart');
    const imgData = canvas.toDataURL('image/png', 1.0);

    // Título del PDF
    doc.setFontSize(18);
    doc.text(chart.options.plugins.title?.text || 'Gráfica de Datos', 15, 15);

    // Agregar imagen
    // Ajustar dimensiones para que quepa en A4 landscape (297x210 mm)
    const imgProps = doc.getImageProperties(imgData);
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    doc.addImage(imgData, 'PNG', 10, 25, pdfWidth - 20, pdfHeight - 20);

    // Agregar metadatos o tabla de datos en página siguiente si se desea
    // Por ahora solo la gráfica

    doc.save('grafica.pdf');
}
