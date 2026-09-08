/**
 * ============================================
 * REGISTRO DE ACCIONES DE UI
 * ============================================
 *
 * Mapea los nombres usados en `data-on-<evento>="…"` (ver events.js) a funciones.
 * Reemplaza los ~90 manejadores `on*=` inline del HTML + los generados en JS.
 *
 * Cada acción es `(event, element) => void`. Los parámetros que antes se pasaban
 * literalmente en el atributo (`fn('x', this.value)`) se leen de `element.dataset`
 * y `element.value`.
 *
 * @module actions
 */

import { updateChart, resetZoom, zoomIn, zoomOut } from './chart-manager.js';
import {
    toggleMobileMenu, toggleConfigPanel, toggleIntersection, updateChartConfig
} from './chart_config.js';
import { togglePresentationMode } from './presentation-mode.js';
import { copyShareURL, closeShareModal, copyShareURLAgain } from './share-manager.js';
import { startTour } from './tour-guide.js';
import { showNotification } from './notifications.js';
import { deactivateModal } from './modal.js';
import {
    addSerie, removeSerie, addRow, removeRow, updatePoint, updateSerieColor,
    updateFitType, exportCSV, importCSV, clearTable, handleKeyDown, handleFileSelect,
    toggleTangent, updateTangentFromSlider, updateTangentFromInput, toggleArea,
    calculateArea, toggleHelp, toggleGenericHelp, toggleHelpModal, switchHelpTab,
    toggleErrorPropagation, calculateErrorPropagation, updateAxisUnit, updateAxisPrefix,
    updateCustomUnit, showUnitHelp, toggleToolsMenu, openErrorPropagationModal,
    closeErrorPropagationModal, openDimensionalAnalysisModal, closeDimensionalAnalysisModal,
    openTestDataModal, closeTestDataModal, analyzeDimension, moveRowUp, moveRowDown,
    clearAllData, handleTablePaste, handleDecimalInput
} from './ui-handlers.js';
import { exportProject, importProject, triggerImportProject } from './project_manager.js';
import { downloadChartJPG, downloadChartPDF, downloadAllCSV } from './export_manager.js';

// Helpers para leer parámetros del elemento
const axisOf = (el) => el.dataset.axis;
const serieOf = (el) => Number(el.dataset.serie);
const rowOf = (el) => Number(el.dataset.row);

export const ACTIONS = {
    // --- Cabecera / menús ---
    toggleMobileMenu: () => toggleMobileMenu(),
    toggleToolsMenu: () => toggleToolsMenu(),
    templatesComingSoon: () => showNotification('🧪 Plantillas: próximamente', 'info'),

    // --- Proyecto / exportación ---
    exportProject: () => exportProject(),
    importProject: (e, el) => importProject(el),
    triggerImportProject: () => triggerImportProject(),
    downloadChartJPG: () => downloadChartJPG(),
    downloadChartPDF: () => downloadChartPDF(),
    downloadAllCSV: () => downloadAllCSV(),

    // --- Compartir ---
    copyShareURL: () => copyShareURL(),
    copyShareURLAgain: () => copyShareURLAgain(),
    closeShareModal: () => closeShareModal(),

    // --- Presentación / tour / ayuda ---
    togglePresentationMode: () => togglePresentationMode(),
    startTour: () => startTour(),
    toggleHelpModal: () => toggleHelpModal(),
    switchHelpTab: (e, el) => switchHelpTab(el.dataset.tab),
    tourButton: (e, el) => window.handleTourButton?.(el.dataset.tourAction),
    closeKeyboardShortcutsModal: () => {
        const m = document.getElementById('keyboardShortcutsModal');
        if (m) { deactivateModal(m); m.remove(); }
    },

    // --- Series (panel izquierdo) ---
    addSerie: () => addSerie(),
    removeSerie: (e, el) => removeSerie(serieOf(el)),
    addRow: (e, el) => addRow(serieOf(el)),
    removeRow: (e, el) => removeRow(serieOf(el), rowOf(el)),
    moveRowUp: (e, el) => moveRowUp(serieOf(el), rowOf(el)),
    moveRowDown: (e, el) => moveRowDown(serieOf(el), rowOf(el)),
    clearAllData: () => clearAllData(),
    clearTable: (e, el) => clearTable(serieOf(el)),
    importCSV: (e, el) => importCSV(serieOf(el)),
    exportCSV: (e, el) => exportCSV(serieOf(el)),
    handleFileSelect: (e, el) => handleFileSelect(serieOf(el), el),
    updateSerieColor: (e, el) => updateSerieColor(serieOf(el), el.value),
    updateFitType: (e, el) => updateFitType(serieOf(el), el.value),
    handleTablePaste: (e, el) => handleTablePaste(e, serieOf(el)),
    toggleHelp: (e, el) => toggleHelp(serieOf(el), el.dataset.fitType),

    // --- Celdas de la tabla (usan data-serie/row/axis en el propio input) ---
    updatePoint: (e, el) => updatePoint(serieOf(el), rowOf(el), el.dataset.axis, el.value),
    handleKeyDown: (e, el) => handleKeyDown(e, serieOf(el), rowOf(el), Number(el.dataset.col)),
    handleDecimalInput: (e) => handleDecimalInput(e),

    // --- Gráfica / vista ---
    updateChart: () => updateChart(),
    zoomIn: () => zoomIn(),
    zoomOut: () => zoomOut(),
    resetZoom: () => resetZoom(),

    // --- Panel de configuración ---
    toggleConfigPanel: () => toggleConfigPanel(),
    updateChartConfig: () => updateChartConfig(),
    toggleIntersection: () => toggleIntersection(),
    showUnitHelp: () => showUnitHelp(),
    updateAxisPrefix: (e, el) => updateAxisPrefix(axisOf(el), el.value),
    updateAxisUnit: (e, el) => updateAxisUnit(axisOf(el), el.value),
    updateCustomUnit: (e, el) => updateCustomUnit(axisOf(el), el.value),
    toggleGenericHelp: (e, el) => toggleGenericHelp(el.dataset.helpId),
    openAxisLimitsHelp: (e, el) => {
        // Antes era JS inline: abrir el <details>, mostrar la ayuda y frenar el toggle nativo del summary.
        e.preventDefault();
        e.stopPropagation();
        const details = document.getElementById('axis-limits-details');
        if (details) details.open = true;
        toggleGenericHelp('help-axis-limits');
    },

    // --- Herramientas de cálculo ---
    toggleTangent: () => toggleTangent(),
    updateTangentFromSlider: () => updateTangentFromSlider(),
    updateTangentFromInput: () => updateTangentFromInput(),
    toggleArea: () => toggleArea(),
    calculateArea: () => calculateArea(),

    // --- Propagación de errores ---
    openErrorPropagationModal: () => openErrorPropagationModal(),
    closeErrorPropagationModal: () => closeErrorPropagationModal(),
    calculateErrorPropagation: () => calculateErrorPropagation(),
    toggleErrorPropagation: () => toggleErrorPropagation(),

    // --- Análisis dimensional ---
    openDimensionalAnalysisModal: () => openDimensionalAnalysisModal(),
    closeDimensionalAnalysisModal: () => closeDimensionalAnalysisModal(),
    analyzeDimension: () => analyzeDimension(),
    analyzeDimensionOnEnter: (e) => { if (e.key === 'Enter') analyzeDimension(); },

    // --- Datos de prueba (sólo hacen algo con dev-tools.js cargado) ---
    openTestDataModal: () => openTestDataModal(),
    closeTestDataModal: () => closeTestDataModal(),
    loadTestData: (e, el) => window.loadTestData?.(el.dataset.testType),
};
