/**
 * ============================================
 * TOUR GUIADO INTERACTIVO
 * ============================================
 * 
 * Módulo para el tour guiado de la aplicación
 * 
 * @module tour-guide
 */

import { AppState } from './state.js';
import { updateChart } from './chart-manager.js';
import { renderSeries } from './ui-handlers.js';
import { updateChartConfig } from './chart_config.js';
import { formatNumber } from './utils.js';

/**
 * Configuración del tour
 */
const TOUR_STEPS = [
    {
        id: 'welcome',
        title: '¡Bienvenido al Graficador Científico! 👋',
        content: `
            <p>Te guiaré paso a paso por las funcionalidades principales.</p>
            <p>Usaremos datos de ejemplo para que veas cómo funciona todo.</p>
            <p><strong>Duración:</strong> ~3 minutos</p>
        `,
        position: 'center',
        buttons: [
            { text: 'Saltar Tour', action: 'skip', secondary: true },
            { text: 'Comenzar', action: 'next' }
        ]
    },
    {
        id: 'load-linear-data',
        title: 'Paso 1: Cargar Datos 📈',
        content: `
            <p>Primero, carguemos datos de ejemplo con una función <strong>lineal</strong>.</p>
            <p>Haz clic en <strong>"Siguiente"</strong> para cargar los datos automáticamente.</p>
        `,
        position: 'center',
        action: () => {
            // Cargar datos lineales programáticamente
            loadLinearDataForTour();
        },
        waitFor: () => {
            // Esperar a que haya al menos una serie con datos
            return window.AppState?.series?.length > 0 &&
                window.AppState.series[0]?.data?.length > 0;
        },
        buttons: [
            { text: 'Atrás', action: 'back', secondary: true },
            { text: 'Siguiente', action: 'next' }
        ]
    },
    {
        id: 'view-chart',
        title: 'Paso 2: Visualizar la Gráfica 📊',
        content: `
            <p>¡Excelente! Los datos se han cargado y graficado automáticamente.</p>
            <p>Observa:</p>
            <ul>
                <li>✅ Puntos de datos con barras de error</li>
                <li>✅ Línea de ajuste lineal (y = ax + b)</li>
                <li>✅ Ecuación y R² mostrados</li>
            </ul>
        `,
        highlight: '.chart-container',
        position: 'left',
        buttons: [
            { text: 'Atrás', action: 'back', secondary: true },
            { text: 'Siguiente', action: 'next' }
        ]
    },
    {
        id: 'add-quadratic',
        title: 'Paso 3: Agregar Segunda Serie 📐',
        content: `
            <p>Ahora agreguemos una función <strong>cuadrática</strong> para comparar.</p>
            <p>Haz clic en <strong>"Siguiente"</strong> para cargar la segunda serie.</p>
        `,
        position: 'center',
        action: () => {
            // Cargar datos cuadráticos programáticamente
            loadQuadraticDataForTour();
        },
        waitFor: () => {
            return window.AppState?.series?.length >= 2;
        },
        buttons: [
            { text: 'Atrás', action: 'back', secondary: true },
            { text: 'Siguiente', action: 'next' }
        ]
    },
    {
        id: 'multiple-series',
        title: 'Paso 4: Múltiples Series 🎨',
        content: `
            <p>¡Perfecto! Ahora tienes dos series en la misma gráfica.</p>
            <p>Cada serie tiene:</p>
            <ul>
                <li>✅ Color diferente</li>
                <li>✅ Su propia ecuación de ajuste</li>
                <li>✅ R² independiente</li>
            </ul>
        `,
        highlight: '.chart-container',
        position: 'left',
        buttons: [
            { text: 'Atrás', action: 'back', secondary: true },
            { text: 'Siguiente', action: 'next' }
        ]
    },
    {
        id: 'derivative',
        title: 'Paso 5: Calcular Derivada ∂',
        content: `
            <p>Ahora calculemos la <strong>derivada</strong> (pendiente) en un punto.</p>
            <p>Activa el checkbox <strong>"Mostrar Tangente (Derivada)"</strong> y mueve el slider.</p>
        `,
        highlight: '#tangentControls',
        position: 'left',
        action: () => {
            const tangentControls = document.getElementById('tangentControls');
            if (tangentControls) {
                tangentControls.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        },
        waitFor: () => {
            return document.getElementById('showTangent')?.checked === true;
        },
        buttons: [
            { text: 'Atrás', action: 'back', secondary: true },
            { text: 'Siguiente', action: 'next' }
        ]
    },
    {
        id: 'integral',
        title: 'Paso 6: Calcular Integral ∫',
        content: `
            <p>También podemos calcular el <strong>área bajo la curva</strong> (integral).</p>
            <p>Activa el checkbox <strong>"∫ Mostrar Área (Integral)"</strong>.</p>
        `,
        highlight: '#areaControls',
        position: 'left',
        waitFor: () => {
            return document.getElementById('showArea')?.checked === true;
        },
        buttons: [
            { text: 'Atrás', action: 'back', secondary: true },
            { text: 'Siguiente', action: 'next' }
        ]
    },
    {
        id: 'units',
        title: 'Paso 7: Unidades Físicas 📏',
        content: `
            <p>El graficador soporta <strong>unidades físicas</strong>.</p>
            <p>Abre <strong>"⚙️ Configuración de Gráfica"</strong> y prueba cambiar las unidades de los ejes.</p>
            <p>Las derivadas e integrales mostrarán las unidades correctas automáticamente.</p>
        `,
        highlight: '.config-section',
        position: 'left',
        action: () => {
            const configSection = document.querySelector('.config-section');
            if (configSection) {
                configSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        },
        buttons: [
            { text: 'Atrás', action: 'back', secondary: true },
            { text: 'Siguiente', action: 'next' }
        ]
    },
    {
        id: 'tools-menu',
        title: 'Paso 8: Herramientas Avanzadas 🧰',
        content: `
            <p>En el menú <strong>"🧰 Herramientas"</strong> encontrarás:</p>
            <ul>
                <li>📐 <strong>Propagación de Errores</strong> - Calcula incertidumbres</li>
                <li>🧪 <strong>Plantillas de Experimentos</strong> - Próximamente</li>
            </ul>
        `,
        highlight: 'nav[aria-label="Menú de herramientas"]',
        position: 'bottom',
        buttons: [
            { text: 'Atrás', action: 'back', secondary: true },
            { text: 'Siguiente', action: 'next' }
        ],
        action: () => {
            // Asegurar que el modal esté cerrado si volvemos atrás
            if (window.closeDimensionalAnalysisModal) {
                window.closeDimensionalAnalysisModal();
            }
        }
    },
    {
        id: 'dimensional-analysis',
        title: 'Paso 9: Análisis Dimensional 🔬',
        content: `
            <p>¡Nueva funcionalidad! Verifica la coherencia de tus ecuaciones.</p>
            <p>Escribe expresiones como <strong>velocidad * tiempo</strong> y obtén las unidades S.I. correctas.</p>
            <p>El sistema soporta notación científica y superíndices automáticos.</p>
        `,
        highlight: '#dimensionalAnalysisModal',
        position: 'center',
        action: () => {
            if (window.openDimensionalAnalysisModal) {
                window.openDimensionalAnalysisModal();
            }
        },
        buttons: [
            { text: 'Atrás', action: 'back', secondary: true },
            { text: 'Siguiente', action: 'next' }
        ]
    },
    {
        id: 'share-present',
        title: 'Paso 10: Compartir y Presentar 🔗📺',
        content: `
            <p>Finalmente, puedes:</p>
            <ul>
                <li>🔗 <strong>Compartir</strong> - Genera una URL con tus datos</li>
                <li>📺 <strong>Presentación</strong> - Modo pantalla completa (Alt+P)</li>
                <li>💾 <strong>Guardar Proyecto</strong> - Exporta como JSON</li>
            </ul>
        `,
        highlight: 'header',
        position: 'bottom',
        action: () => {
            // Cerrar modal al avanzar
            if (window.closeDimensionalAnalysisModal) {
                window.closeDimensionalAnalysisModal();
            }
        },
        buttons: [
            { text: 'Atrás', action: 'back', secondary: true },
            { text: 'Siguiente', action: 'next' }
        ]
    },
    {
        id: 'complete',
        title: '¡Tour Completado! 🎉',
        content: `
            <p>¡Felicitaciones! Ahora conoces las funcionalidades principales.</p>
            <p><strong>Próximos pasos:</strong></p>
            <ul>
                <li>📝 Ingresa tus propios datos</li>
                <li>🔬 Experimenta con diferentes ajustes</li>
                <li>📊 Exporta tus gráficas</li>
                <li>❓ Usa Ctrl+H para ver atajos de teclado</li>
            </ul>
            <p style="margin-top: 20px; padding: 15px; background: #f0f8ff; border-radius: 8px; border-left: 4px solid #667eea;">
                💡 <strong>Tip:</strong> Puedes volver a ver este tour desde el menú de ayuda.
            </p>
        `,
        position: 'center',
        buttons: [
            { text: 'Finalizar', action: 'complete' }
        ]
    }
];

/**
 * Estado del tour
 *
 * Nota sobre z-index: el resto de los overlays de la app (modales, notificaciones,
 * modo presentación) usan como máximo 10000. El tour usa 10007-10009 a propósito,
 * para quedar siempre por encima — es un flujo guiado bloqueante y no debería quedar
 * tapado si el usuario dispara otro overlay (ej. Ctrl+H) mientras está activo.
 */
let tourState = {
    active: false,
    currentStep: 0,
    overlay: null,
    modal: null,
    // IDs de interval/timeout pendientes, para poder cancelarlos al navegar de paso
    // o al terminar el tour (si no, siguen corriendo en segundo plano y pueden
    // disparar un highlight/notificación "fantasma" de un paso que ya no está activo).
    monitorIntervalId: null,
    monitorTimeoutId: null,
    monitorNotifyTimeoutId: null,
    highlightTimeoutId: null
};

/**
 * Inicia el tour guiado
 */
export function startTour() {
    if (tourState.active) return;

    tourState.active = true;
    tourState.currentStep = 0;

    // Crear overlay y modal
    createTourUI();

    // Mostrar primer paso
    showStep(0);

    console.log('🎓 Tour guiado iniciado');
}

/**
 * Crea la UI del tour
 */
function createTourUI() {
    // Crear overlay muy transparente que permite ver la página claramente
    tourState.overlay = document.createElement('div');
    tourState.overlay.id = 'tour-overlay';
    tourState.overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.15);
        z-index: 10008;
        pointer-events: none;
    `;

    // Crear modal
    tourState.modal = document.createElement('div');
    tourState.modal.id = 'tour-modal';
    tourState.modal.style.cssText = `
        position: fixed;
        background: white;
        border-radius: 12px;
        padding: 25px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        z-index: 10009;
        max-width: 500px;
        min-width: 400px;
        pointer-events: auto;
    `;

    document.body.appendChild(tourState.overlay);
    document.body.appendChild(tourState.modal);
}

/**
 * Muestra un paso del tour
 */
function showStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= TOUR_STEPS.length) return;

    // Cancelar el monitoreo del paso anterior antes de mostrar uno nuevo
    clearMonitor();

    const step = TOUR_STEPS[stepIndex];
    tourState.currentStep = stepIndex;

    // Ejecutar acción del paso si existe
    if (step.action) {
        step.action();
    }

    // Actualizar contenido del modal
    tourState.modal.innerHTML = `
        <div style="margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h3 style="margin: 0; color: #667eea;">${step.title}</h3>
                <span style="color: #999; font-size: 14px;">${stepIndex + 1}/${TOUR_STEPS.length}</span>
            </div>
            <div style="color: #666; line-height: 1.6;">
                ${step.content}
            </div>
        </div>
        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
            ${step.buttons.map(btn => `
                <button 
                    onclick="handleTourButton('${btn.action}')"
                    style="padding: 10px 20px; background: ${btn.secondary ? '#95a5a6' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}; 
                    color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                    ${btn.text}
                </button>
            `).join('')}
        </div>
    `;

    // Posicionar modal
    positionModal(step);

    // Highlight elemento si existe
    if (step.highlight) {
        highlightElement(step.highlight);
    } else {
        removeHighlight();
    }

    // Si hay waitFor, monitorear
    if (step.waitFor) {
        monitorCondition(step.waitFor);
    }
}

/**
 * Posiciona el modal según el paso
 */
function positionModal(step) {
    const modal = tourState.modal;

    if (step.position === 'center') {
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.bottom = 'auto';
        modal.style.right = 'auto';
    } else if (step.highlight) {
        const element = document.querySelector(step.highlight);
        if (!element) {
            // Si el elemento no existe, centrar el modal como fallback
            console.warn(`Tour: Elemento ${step.highlight} no encontrado, centrando modal`);
            modal.style.top = '50%';
            modal.style.left = '50%';
            modal.style.transform = 'translate(-50%, -50%)';
            modal.style.bottom = 'auto';
            modal.style.right = 'auto';
            return;
        }

        const rect = element.getBoundingClientRect();
        const modalWidth = 500; // max-width del modal
        const modalHeight = 300; // altura estimada
        const padding = 20;

        switch (step.position) {
            case 'bottom':
                // Posicionar debajo del elemento
                let topPos = rect.bottom + padding;
                // Asegurar que no se salga por abajo
                if (topPos + modalHeight > window.innerHeight) {
                    topPos = window.innerHeight - modalHeight - padding;
                }
                modal.style.top = `${topPos}px`;
                modal.style.left = `${Math.max(padding, Math.min(rect.left, window.innerWidth - modalWidth - padding))}px`;
                modal.style.transform = 'none';
                modal.style.bottom = 'auto';
                modal.style.right = 'auto';
                break;
            case 'top':
                // Posicionar arriba del elemento
                modal.style.bottom = `${window.innerHeight - rect.top + padding}px`;
                modal.style.left = `${Math.max(padding, Math.min(rect.left, window.innerWidth - modalWidth - padding))}px`;
                modal.style.top = 'auto';
                modal.style.transform = 'none';
                modal.style.right = 'auto';
                break;
            case 'left':
                // Posicionar a la izquierda del elemento
                modal.style.top = `${Math.max(padding, rect.top)}px`;
                modal.style.right = `${window.innerWidth - rect.left + padding}px`;
                modal.style.left = 'auto';
                modal.style.transform = 'none';
                modal.style.bottom = 'auto';
                break;
            case 'right':
                // Posicionar a la derecha del elemento
                modal.style.top = `${Math.max(padding, rect.top)}px`;
                let leftPos = rect.right + padding;
                // Si se sale por la derecha, posicionar a la izquierda
                if (leftPos + modalWidth > window.innerWidth) {
                    modal.style.right = `${window.innerWidth - rect.left + padding}px`;
                    modal.style.left = 'auto';
                } else {
                    modal.style.left = `${leftPos}px`;
                    modal.style.right = 'auto';
                }
                modal.style.transform = 'none';
                modal.style.bottom = 'auto';
                break;
        }
    }
}

/**
 * Resalta un elemento
 */
function highlightElement(selector) {
    removeHighlight();

    const element = document.querySelector(selector);
    if (!element) return;

    // Hacer scroll hacia el elemento
    element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
    });

    // Esperar un poco para que el scroll termine
    tourState.highlightTimeoutId = setTimeout(() => {
        tourState.highlightTimeoutId = null;
        const rect = element.getBoundingClientRect();

        const highlight = document.createElement('div');
        highlight.id = 'tour-highlight';
        highlight.style.cssText = `
            position: fixed;
            top: ${rect.top - 8}px;
            left: ${rect.left - 8}px;
            width: ${rect.width + 16}px;
            height: ${rect.height + 16}px;
            border: 4px solid #667eea;
            border-radius: 8px;
            z-index: 10007;
            pointer-events: none;
            box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.15), 0 0 20px rgba(102, 126, 234, 0.5);
            animation: pulse 2s infinite;
        `;

        document.body.appendChild(highlight);
    }, 300);
}

/**
 * Remueve el highlight (y cancela un highlight pendiente de aparecer, para que
 * no se posicione sobre el elemento equivocado si el usuario ya avanzó de paso)
 */
function removeHighlight() {
    if (tourState.highlightTimeoutId) {
        clearTimeout(tourState.highlightTimeoutId);
        tourState.highlightTimeoutId = null;
    }
    const highlight = document.getElementById('tour-highlight');
    if (highlight) {
        highlight.remove();
    }
}

/**
 * Monitorea una condición y avanza automáticamente
 */
function monitorCondition(condition) {
    // Por las dudas, cancelar cualquier monitoreo previo (no debería quedar ninguno
    // activo ya que showStep() llama a clearMonitor(), pero es una función también
    // usada de forma independiente).
    clearMonitor();

    tourState.monitorIntervalId = setInterval(() => {
        if (condition()) {
            clearInterval(tourState.monitorIntervalId);
            tourState.monitorIntervalId = null;
            // Pequeño delay antes de permitir avanzar
            tourState.monitorNotifyTimeoutId = setTimeout(() => {
                tourState.monitorNotifyTimeoutId = null;
                showNotification('✓ ¡Paso completado!', 'success');
            }, 500);
        }
    }, 500);

    // Limpiar después de 30 segundos
    tourState.monitorTimeoutId = setTimeout(() => {
        if (tourState.monitorIntervalId) {
            clearInterval(tourState.monitorIntervalId);
            tourState.monitorIntervalId = null;
        }
        tourState.monitorTimeoutId = null;
    }, 30000);
}

/**
 * Cancela cualquier interval/timeout de monitoreo de condición pendiente. Se llama
 * al navegar a otro paso y al finalizar el tour, para que un `waitFor` de un paso
 * anterior no dispare una notificación "¡Paso completado!" fantasma más tarde.
 */
function clearMonitor() {
    if (tourState.monitorIntervalId) {
        clearInterval(tourState.monitorIntervalId);
        tourState.monitorIntervalId = null;
    }
    if (tourState.monitorTimeoutId) {
        clearTimeout(tourState.monitorTimeoutId);
        tourState.monitorTimeoutId = null;
    }
    if (tourState.monitorNotifyTimeoutId) {
        clearTimeout(tourState.monitorNotifyTimeoutId);
        tourState.monitorNotifyTimeoutId = null;
    }
}

/**
 * Maneja los botones del tour
 */
window.handleTourButton = function (action) {
    switch (action) {
        case 'next':
            showStep(tourState.currentStep + 1);
            break;
        case 'back':
            showStep(tourState.currentStep - 1);
            break;
        case 'skip':
        case 'complete':
            endTour();
            break;
    }
};

/**
 * Finaliza el tour
 */
function endTour() {
    tourState.active = false;
    clearMonitor();

    if (tourState.overlay) tourState.overlay.remove();
    if (tourState.modal) tourState.modal.remove();
    removeHighlight();

    // Marcar tour como completado
    localStorage.setItem('tour-completed', 'true');

    console.log('🎓 Tour guiado finalizado');
}

/**
 * Muestra notificación
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;

    const colors = {
        success: '#11998e',
        info: '#667eea'
    };

    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10010;
        animation: slideInUp 0.3s ease-out;
    `;

    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
}

/**
 * Inicializa el tour
 */
export function initTour() {
    // DESACTIVADO: Preguntar si quiere ver el tour en primera visita
    // if (!localStorage.getItem('tour-completed')) {
    //     setTimeout(() => {
    //         if (confirm('¿Quieres un tour rápido de la aplicación? (3 minutos)')) {
    //             startTour();
    //         } else {
    //             localStorage.setItem('tour-completed', 'true');
    //         }
    //     }, 2000);
    // }

    // Agregar CSS de animación
    if (!document.getElementById('tour-styles')) {
        const style = document.createElement('style');
        style.id = 'tour-styles';
        style.textContent = `
            @keyframes pulse {
                0%, 100% { 
                    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.15), 
                                0 0 20px rgba(102, 126, 234, 0.5); 
                }
                50% { 
                    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.15), 
                                0 0 30px rgba(102, 126, 234, 0.8),
                                0 0 40px rgba(102, 126, 234, 0.4); 
                }
            }
            
            @keyframes slideInUp {
                from { transform: translateY(100px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Carga datos lineales para el tour
 */
function loadLinearDataForTour() {
    // Datos de ejemplo para función lineal: y = 2x + 1
    // Nota: la incertidumbre se aplica a nivel de eje/columna
    // (AppState.config.defaultXError/defaultYError, ver comentario en
    // renderTable() de ui-handlers.js), no por punto ni por serie — por eso
    // se setean los inputs del panel de Configuración de Ejes más abajo.
    const linearData = [
        { x: 0, y: 1 },
        { x: 1, y: 3 },
        { x: 2, y: 5 },
        { x: 3, y: 7 },
        { x: 4, y: 9 },
        { x: 5, y: 11 }
    ];

    // Usar AppState global si está disponible, sino el importado
    const state = window.AppState || AppState;

    // Limpiar series existentes
    state.series = [];
    state.nextId = 0;

    // Agregar nueva serie
    const serie = {
        id: state.nextId++,
        name: 'Datos Lineales',
        data: linearData,
        color: '#3498db',
        fitType: 'linear',
        equation: '',
        r2: null
    };

    state.series.push(serie);

    // La incertidumbre es de eje/columna: reflejar los valores de ejemplo en
    // los inputs del panel de Configuración de Ejes.
    const xErrInput = document.getElementById('defaultXError');
    const yErrInput = document.getElementById('defaultYError');
    if (xErrInput) xErrInput.value = formatNumber(0.1);
    if (yErrInput) yErrInput.value = formatNumber(0.25);

    // Actualizar UI de series (esto renderizará el select con el valor correcto)
    if (typeof renderSeries === 'function') renderSeries();
    else if (typeof window.renderSeries === 'function') window.renderSeries();

    // Actualizar configuración (aplica la incertidumbre de eje recién seteada)
    if (typeof updateChartConfig === 'function') updateChartConfig();
    else if (typeof window.updateChartConfig === 'function') window.updateChartConfig();

    // Actualizar gráfica
    if (typeof updateChart === 'function') updateChart();
    else if (typeof window.updateChart === 'function') window.updateChart();

    console.log('✓ Datos lineales cargados para el tour');
}

/**
 * Carga datos cuadráticos para el tour
 */
function loadQuadraticDataForTour() {
    // Datos de ejemplo para función cuadrática: y = x² - 2x + 1
    const quadraticData = [
        { x: 0, y: 1, xError: 0.1, yError: 0.2 },
        { x: 1, y: 0, xError: 0.1, yError: 0.2 },
        { x: 2, y: 1, xError: 0.1, yError: 0.2 },
        { x: 3, y: 4, xError: 0.1, yError: 0.3 },
        { x: 4, y: 9, xError: 0.1, yError: 0.3 },
        { x: 5, y: 16, xError: 0.1, yError: 0.4 }
    ];

    // Usar AppState global si está disponible, sino el importado
    const state = window.AppState || AppState;

    // Agregar segunda serie
    const serie = {
        id: state.nextId++,
        name: 'Datos Cuadráticos',
        data: quadraticData,
        color: '#e74c3c',
        fitType: 'poly2',
        equation: '',
        r2: null
    };

    state.series.push(serie);

    // Actualizar UI de series (esto renderizará el select con el valor correcto)
    if (typeof renderSeries === 'function') renderSeries();
    else if (typeof window.renderSeries === 'function') window.renderSeries();

    // Actualizar gráfica
    if (typeof updateChart === 'function') updateChart();
    else if (typeof window.updateChart === 'function') window.updateChart();

    console.log('✓ Datos cuadráticos cargados para el tour');
}

// Exportar para uso global
window.startTour = startTour;
