// ============================================
// GESTIÓN DE PROYECTO (JSON)
// ============================================

import { AppState, sanitizeImportedSeries } from './state.js';
import { renderSeries } from './ui-handlers.js';
import { updateChart } from './chart-manager.js';
import { updateChartConfig } from './chart_config.js';
import { PROJECT_FILE_FORMAT_VERSION } from './utils.js';
import { showNotification } from './notifications.js';
import { confirmDialog } from './modal.js';

/**
 * Exporta el estado actual del proyecto a un archivo JSON
 */
export function exportProject() {
    const projectData = {
        version: PROJECT_FILE_FORMAT_VERSION,
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
    reader.onload = async function (e) {
        try {
            const projectData = JSON.parse(e.target.result);

            // Validación básica
            if (!projectData.series || !Array.isArray(projectData.series)) {
                throw new Error("El archivo no tiene un formato de proyecto válido.");
            }

            // Confirmar si hay datos existentes
            if (AppState.series.length > 0) {
                const ok = await confirmDialog({
                    message: 'Cargar un proyecto reemplaza todos los datos actuales. ¿Continuar?',
                    confirmText: 'Cargar', danger: true
                });
                if (!ok) {
                    fileInput.value = '';
                    return;
                }
            }

            // Restaurar series (reemplazar el contenido, mantener la referencia del array)
            AppState.series.length = 0;
            AppState.series.push(...sanitizeImportedSeries(projectData.series));

            // Actualizar contador de IDs para evitar colisiones futuras
            const maxId = AppState.series.reduce((max, s) => Math.max(max, s.id), 0);
            AppState.nextId = maxId + 1;

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

            showNotification('✓ Proyecto cargado', 'success');
        } catch (error) {
            console.error("Error al importar proyecto:", error);
            showNotification('Error al cargar el proyecto: ' + error.message, 'error');
        }
        fileInput.value = ''; // Reset input para permitir cargar el mismo archivo de nuevo
    };
    reader.readAsText(file);
}
