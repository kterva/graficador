/**
 * ============================================
 * GRAFICADOR CON AJUSTES DE FUNCIONES
 * ============================================
 * 
 * Aplicación web para visualizar datos experimentales y realizar
 * ajustes de curvas con análisis de incertidumbre.
 * 
 * @author Leonardo Trujillo
 * @version 1.4.0 - Modular
 */

// ============================================
// IMPORTACIONES DE MÓDULOS
// ============================================

import { initChart, updateChart, resetZoom, zoomIn, zoomOut } from './chart-manager.js';
import { toggleMobileMenu, toggleConfigPanel, toggleIntersection, showIntersection, updateChartConfig } from './chart_config.js';
import { AppState } from './state.js';
import { initKeyboardShortcuts } from './keyboard-shortcuts.js';
import { togglePresentationMode, initPresentationMode } from './presentation-mode.js';
import { copyShareURL, closeShareModal, copyShareURLAgain, initShareManager } from './share-manager.js';
import { initTour } from './tour-guide.js';
import {
    addSerie,
    removeSerie,
    addRow,
    removeRow,
    updatePoint,
    updateSerieColor,
    updateFitType,
    updateDefaultError,
    exportCSV,
    importCSV,
    clearTable,
    renderSeries,
    handleKeyDown,
    handleFileSelect,
    toggleTangent,
    updateTangentFromSlider,
    updateTangentFromInput,
    toggleArea,
    calculateArea,
    toggleHelp,
    toggleGenericHelp,
    toggleHelpModal,
    switchHelpTab,
    toggleErrorPropagation,
    calculateErrorPropagation,
    updateAxisUnit,
    updateAxisPrefix,
    updateCustomUnit,
    showUnitHelp,
    toggleToolsMenu,
    openErrorPropagationModal,
    closeErrorPropagationModal,
    openDimensionalAnalysisModal,
    closeDimensionalAnalysisModal,
    openTestDataModal,
    closeTestDataModal,
    analyzeDimension,
    moveRowUp,
    moveRowDown,
    clearAllData,
    handleTablePaste,
    handleDecimalInput
} from './ui-handlers.js';
import {
    exportProject,
    importProject,
    triggerImportProject
} from './project_manager.js';
import {
    downloadChartJPG,
    downloadChartPDF,
    downloadAllCSV
} from './export_manager.js';

// ============================================
// EXPONER FUNCIONES AL SCOPE GLOBAL
// ============================================
// Gestión de Proyecto y Exportación
window.exportProject = exportProject;
window.importProject = importProject;
window.triggerImportProject = triggerImportProject;
window.downloadChartJPG = downloadChartJPG;
window.downloadChartPDF = downloadChartPDF;
window.downloadAllCSV  = downloadAllCSV;

// Necesario para que funcionen los onclick en el HTML

window.addSerie = addSerie;
window.removeSerie = removeSerie;
window.addRow = addRow;
window.removeRow = removeRow;
window.updatePoint = updatePoint;
window.updateSerieColor = updateSerieColor;
window.updateFitType = updateFitType;
window.updateDefaultError = updateDefaultError;
window.exportCSV = exportCSV;
window.importCSV = importCSV;
window.clearTable = clearTable;
window.handleKeyDown = handleKeyDown;
window.handleFileSelect = handleFileSelect;
window.updateChart = updateChart;
window.resetZoom = resetZoom;
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.toggleTangent = toggleTangent;
window.updateTangentFromSlider = updateTangentFromSlider;
window.updateTangentFromInput = updateTangentFromInput;
window.toggleArea = toggleArea;
window.calculateArea = calculateArea;
window.toggleHelp = toggleHelp;
window.toggleGenericHelp = toggleGenericHelp;
window.toggleHelpModal = toggleHelpModal;
window.switchHelpTab = switchHelpTab;
window.toggleErrorPropagation = toggleErrorPropagation;
window.calculateErrorPropagation = calculateErrorPropagation;
window.updateAxisUnit = updateAxisUnit;
window.updateAxisPrefix = updateAxisPrefix;
window.updateCustomUnit = updateCustomUnit;
window.showUnitHelp = showUnitHelp;
window.toggleToolsMenu = toggleToolsMenu;
window.openErrorPropagationModal = openErrorPropagationModal;
window.closeErrorPropagationModal = closeErrorPropagationModal;
window.togglePresentationMode = togglePresentationMode;
window.copyShareURL = copyShareURL;
window.closeShareModal = closeShareModal;
window.copyShareURLAgain = copyShareURLAgain;
window.openDimensionalAnalysisModal = openDimensionalAnalysisModal;
window.closeDimensionalAnalysisModal = closeDimensionalAnalysisModal;
window.openTestDataModal = openTestDataModal;
window.closeTestDataModal = closeTestDataModal;
window.analyzeDimension = analyzeDimension;
window.moveRowUp = moveRowUp;
window.moveRowDown = moveRowDown;
window.clearAllData = clearAllData;
window.handleTablePaste = handleTablePaste;
window.handleDecimalInput = handleDecimalInput;
window.toggleMobileMenu = toggleMobileMenu;
window.toggleConfigPanel = toggleConfigPanel;
window.toggleIntersection = toggleIntersection;
window.showIntersection = showIntersection;
window.updateChartConfig = updateChartConfig;

// ============================================
// INICIALIZACIÓN DE LA APLICACIÓN
// ============================================

// Exponer AppState globalmente para depuración y acceso desde otros módulos (como el tour)
window.AppState = AppState;

/**
 * Inicializa la aplicación cuando el DOM está listo
 */
document.addEventListener('DOMContentLoaded', () => {
    initChart();

    // Crear primera serie automáticamente para que el usuario vea la tabla desde el inicio
    addSerie();

    initKeyboardShortcuts();
    initPresentationMode();
    initShareManager(); // Cargar datos desde URL si existe
    initTour(); // Inicializar tour guiado
    // Configurar event listeners globales
    setupGlobalEventListeners();

    // Mostrar panel de desarrollo si está habilitado
    if (typeof window.IS_DEVELOPMENT !== 'undefined' && window.IS_DEVELOPMENT) {
        const devPanel = document.getElementById('dev-panel');
        if (devPanel) devPanel.style.display = 'block';

        const devTip = document.getElementById('help-dev-tip');
        if (devTip) devTip.style.display = 'block';

        console.log('🔧 Modo Desarrollo Activado');
    }
});

/**
 * Configura event listeners globales
 */
function setupGlobalEventListeners() {
    // Cerrar modal al hacer clic fuera
    document.addEventListener('click', function (event) {
        const modal = document.getElementById('helpModal');
        if (modal && event.target === modal) {
            toggleHelpModal();
        }
    });

    // Efecto hover en botón de ayuda
    const helpBtn = document.getElementById('helpButton');
    if (helpBtn) {
        helpBtn.addEventListener('mouseenter', function () {
            this.style.transform = 'scale(1.1) rotate(15deg)';
        });
        helpBtn.addEventListener('mouseleave', function () {
            this.style.transform = 'scale(1) rotate(0deg)';
        });
    }
}

// ============================================
// EXPORTAR PARA OTROS MÓDULOS (SI ES NECESARIO)
// ============================================

export { updateChart, renderSeries };
