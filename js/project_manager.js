
// ============================================
// GESTIÓN DE PROYECTO (JSON)
// ============================================

/**
 * Exporta el estado actual del proyecto a un archivo JSON
 */
function exportProject() {
    const projectData = {
        version: '1.1.0',
        timestamp: new Date().toISOString(),
        config: {
            xLabel: document.getElementById('labelX').value,
            yLabel: document.getElementById('labelY').value,
            // Aquí se pueden agregar más configuraciones futuras
        },
        series: series
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(projectData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "proyecto_graficador_" + new Date().toISOString().slice(0, 10) + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

/**
 * Dispara el input de archivo oculto para importar proyecto
 */
function triggerImportProject() {
    document.getElementById('project-file-input').click();
}

/**
 * Maneja la carga del archivo JSON del proyecto
 * @param {HTMLInputElement} input - Elemento input file
 */
function importProject(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const projectData = JSON.parse(e.target.result);

            // Validación básica
            if (!projectData.series || !Array.isArray(projectData.series)) {
                throw new Error("El archivo no tiene un formato de proyecto válido.");
            }

            // Confirmar si hay datos existentes
            if (series.length > 0) {
                if (!confirm("Cargar un proyecto reemplazará todos los datos actuales. ¿Desea continuar?")) {
                    input.value = '';
                    return;
                }
            }

            // Restaurar series
            series = projectData.series;

            // Actualizar contador de IDs para evitar colisiones futuras
            const maxId = series.reduce((max, s) => Math.max(max, s.id), -1);
            serieCounter = maxId + 1;

            // Restaurar configuración
            if (projectData.config) {
                if (projectData.config.xLabel) document.getElementById('labelX').value = projectData.config.xLabel;
                if (projectData.config.yLabel) document.getElementById('labelY').value = projectData.config.yLabel;
                updateAxisLabels();
            }

            // Renderizar UI
            renderSeries();
            updateChart();

            // Notificar éxito (podríamos usar un toast mejorado luego)
            // alert("Proyecto cargado exitosamente"); 

        } catch (error) {
            console.error("Error al importar proyecto:", error);
            alert("Error al cargar el proyecto: " + error.message);
        }
        input.value = ''; // Reset input para permitir cargar el mismo archivo de nuevo
    };
    reader.readAsText(file);
}
