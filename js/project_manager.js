// ============================================
// GESTIÓN DE PROYECTO (JSON)
// ============================================

import { AppState } from './state.js';
import { renderSeries } from './ui-handlers.js';
import { updateChart } from './chart-manager.js';
import { updateChartConfig } from './chart_config.js';

/**
 * Exporta el estado actual del proyecto a un archivo JSON
 */
export function exportProject() {
    const projectData = {
        version: '1.2.0',
        timestamp: new Date().toISOString(),
        config: {
            xLabel: document.getElementById('labelX').value,
            yLabel: document.getElementById('labelY').value,
            // Aquí se pueden agregar más configuraciones futuras
            unitX: document.getElementById('unitX')?.value || '',
            unitY: document.getElementById('unitY')?.value || '',
            chartTitle: document.getElementById('chartTitle')?.value || ''
        },
        series: AppState.series
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
export function triggerImportProject() {
    document.getElementById('project-file-input').click();
}

/**
 * Maneja la carga del archivo JSON del proyecto
 * @param {HTMLInputElement} input - Elemento input file (pasado automágicamente por el evento onchange si se configura bien, pero aquí lo buscaremos explícitamente si es undefined)
 */
export function importProject(input) {
    // Si se llama desde el onchange HTML con 'this', input será el elemento. 
    // Si no, buscamos el elemento por ID.
    const fileInput = input || document.getElementById('project-file-input');
    const file = fileInput.files[0];

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
            if (AppState.series.length > 0) {
                if (!confirm("Cargar un proyecto reemplazará todos los datos actuales. ¿Desea continuar?")) {
                    fileInput.value = '';
                    return;
                }
            }

            // Restaurar series
            AppState.series.length = 0; // Limpiar array existente manteniendo la referencia si fuera const (aunque AppState.series debería ser modificado en state, aquí asumimos mutabilidad directa del array del proxy o state)
            // Mejor: reemplazamos el contenido
            AppState.series.push(...projectData.series);

            // Actualizar contador de IDs para evitar colisiones futuras
            const maxId = AppState.series.reduce((max, s) => Math.max(max, s.id), -1);
            AppState.serieCounter = maxId + 1;

            // Restaurar configuración
            if (projectData.config) {
                if (projectData.config.xLabel) document.getElementById('labelX').value = projectData.config.xLabel;
                if (projectData.config.yLabel) document.getElementById('labelY').value = projectData.config.yLabel;
                if (projectData.config.unitX) document.getElementById('unitX').value = projectData.config.unitX;
                if (projectData.config.unitY) document.getElementById('unitY').value = projectData.config.unitY;
                if (projectData.config.chartTitle) document.getElementById('chartTitle').value = projectData.config.chartTitle;

                updateChartConfig();
            }

            // Renderizar UI
            renderSeries();
            updateChart();

            // Notificar éxito
            // alert("Proyecto cargado exitosamente"); 

        } catch (error) {
            console.error("Error al importar proyecto:", error);
            alert("Error al cargar el proyecto: " + error.message);
        }
        fileInput.value = ''; // Reset input para permitir cargar el mismo archivo de nuevo
    };
    reader.readAsText(file);
}
