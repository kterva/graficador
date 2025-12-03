/**
 * ============================================
 * TOUR GUIADO INTERACTIVO
 * ============================================
 * 
 * Módulo para el tour guiado de la aplicación
 * 
 * @module tour-guide
 */

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
        position: 'right',
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
        position: 'right',
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
        ]
    },
    {
        id: 'share-present',
        title: 'Paso 9: Compartir y Presentar 🔗📺',
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
 */
let tourState = {
    active: false,
    currentStep: 0,
    overlay: null,
    modal: null
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
    // Crear overlay
    tourState.overlay = document.createElement('div');
    tourState.overlay.id = 'tour-overlay';
    tourState.overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 9998;
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
        z-index: 9999;
        max-width: 450px;
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
        if (element) {
            const rect = element.getBoundingClientRect();

            switch (step.position) {
                case 'bottom':
                    modal.style.top = `${rect.bottom + 20}px`;
                    modal.style.left = `${rect.left}px`;
                    modal.style.transform = 'none';
                    break;
                case 'top':
                    modal.style.bottom = `${window.innerHeight - rect.top + 20}px`;
                    modal.style.left = `${rect.left}px`;
                    modal.style.top = 'auto';
                    modal.style.transform = 'none';
                    break;
                case 'left':
                    modal.style.top = `${rect.top}px`;
                    modal.style.right = `${window.innerWidth - rect.left + 20}px`;
                    modal.style.left = 'auto';
                    modal.style.transform = 'none';
                    break;
                case 'right':
                    modal.style.top = `${rect.top}px`;
                    modal.style.left = `${rect.right + 20}px`;
                    modal.style.transform = 'none';
                    break;
            }
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

    const rect = element.getBoundingClientRect();

    const highlight = document.createElement('div');
    highlight.id = 'tour-highlight';
    highlight.style.cssText = `
        position: fixed;
        top: ${rect.top - 5}px;
        left: ${rect.left - 5}px;
        width: ${rect.width + 10}px;
        height: ${rect.height + 10}px;
        border: 3px solid #667eea;
        border-radius: 8px;
        z-index: 9997;
        pointer-events: none;
        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
        animation: pulse 2s infinite;
    `;

    document.body.appendChild(highlight);
}

/**
 * Remueve el highlight
 */
function removeHighlight() {
    const highlight = document.getElementById('tour-highlight');
    if (highlight) {
        highlight.remove();
    }
}

/**
 * Monitorea una condición y avanza automáticamente
 */
function monitorCondition(condition) {
    const interval = setInterval(() => {
        if (condition()) {
            clearInterval(interval);
            // Pequeño delay antes de permitir avanzar
            setTimeout(() => {
                showNotification('✓ ¡Paso completado!', 'success');
            }, 500);
        }
    }, 500);

    // Limpiar después de 30 segundos
    setTimeout(() => clearInterval(interval), 30000);
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
        z-index: 10000;
        animation: slideInUp 0.3s ease-out;
    `;

    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
}

/**
 * Inicializa el tour
 */
export function initTour() {
    // Preguntar si quiere ver el tour en primera visita
    if (!localStorage.getItem('tour-completed')) {
        setTimeout(() => {
            if (confirm('¿Quieres un tour rápido de la aplicación? (3 minutos)')) {
                startTour();
            } else {
                localStorage.setItem('tour-completed', 'true');
            }
        }, 2000);
    }

    // Agregar CSS de animación
    if (!document.getElementById('tour-styles')) {
        const style = document.createElement('style');
        style.id = 'tour-styles';
        style.textContent = `
            @keyframes pulse {
                0%, 100% { box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 0 0 rgba(102, 126, 234, 0.7); }
                50% { box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 0 10px rgba(102, 126, 234, 0); }
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
    const linearData = [
        { x: 0, y: 1, dx: 0.1, dy: 0.2 },
        { x: 1, y: 3, dx: 0.1, dy: 0.2 },
        { x: 2, y: 5, dx: 0.1, dy: 0.3 },
        { x: 3, y: 7, dx: 0.1, dy: 0.2 },
        { x: 4, y: 9, dx: 0.1, dy: 0.3 },
        { x: 5, y: 11, dx: 0.1, dy: 0.2 }
    ];

    // Crear serie si no existe
    if (!window.AppState) {
        console.error('AppState no disponible');
        return;
    }

    // Limpiar series existentes
    window.AppState.series = [];
    window.AppState.serieCounter = 0;

    // Agregar nueva serie
    const serie = {
        id: window.AppState.serieCounter++,
        name: 'Datos Lineales',
        data: linearData,
        color: '#3498db',
        fitType: 'linear'
    };

    window.AppState.series.push(serie);

    // Actualizar UI
    if (typeof window.renderSeries === 'function') {
        window.renderSeries();
    }
    if (typeof window.updateChart === 'function') {
        window.updateChart();
    }

    console.log('✓ Datos lineales cargados para el tour');
}

/**
 * Carga datos cuadráticos para el tour
 */
function loadQuadraticDataForTour() {
    // Datos de ejemplo para función cuadrática: y = x² - 2x + 1
    const quadraticData = [
        { x: 0, y: 1, dx: 0.1, dy: 0.2 },
        { x: 1, y: 0, dx: 0.1, dy: 0.2 },
        { x: 2, y: 1, dx: 0.1, dy: 0.2 },
        { x: 3, y: 4, dx: 0.1, dy: 0.3 },
        { x: 4, y: 9, dx: 0.1, dy: 0.3 },
        { x: 5, y: 16, dx: 0.1, dy: 0.4 }
    ];

    if (!window.AppState) {
        console.error('AppState no disponible');
        return;
    }

    // Agregar segunda serie
    const serie = {
        id: window.AppState.serieCounter++,
        name: 'Datos Cuadráticos',
        data: quadraticData,
        color: '#e74c3c',
        fitType: 'polynomial2'
    };

    window.AppState.series.push(serie);

    // Actualizar UI
    if (typeof window.renderSeries === 'function') {
        window.renderSeries();
    }
    if (typeof window.updateChart === 'function') {
        window.updateChart();
    }

    console.log('✓ Datos cuadráticos cargados para el tour');
}

// Exportar para uso global
window.startTour = startTour;
