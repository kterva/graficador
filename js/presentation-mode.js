/**
 * ============================================
 * MODO PRESENTACIÓN
 * ============================================
 * 
 * Módulo para manejar el modo presentación (pantalla completa)
 * 
 * @module presentation-mode
 */

import { AppState } from './state.js';
import { updateChart } from './chart-manager.js';

/**
 * Alterna el estado del modo presentación
 */
export function togglePresentationMode() {
    document.body.classList.toggle('presentation-mode');

    const isPresentation = document.body.classList.contains('presentation-mode');

    if (isPresentation) {
        // Entrar en modo presentación
        showNotification('📺 Modo presentación activado. Presiona ESC para salir.', 'info');

        // Intentar poner el navegador en pantalla completa
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(e => {
                console.log('No se pudo activar pantalla completa del navegador:', e);
            });
        }
    } else {
        // Salir de modo presentación
        if (document.exitFullscreen && document.fullscreenElement) {
            document.exitFullscreen().catch(e => {
                console.log('No se pudo salir de pantalla completa:', e);
            });
        }
    }

    // Redimensionar gráfica para asegurar que ocupe el espacio correcto
    setTimeout(() => {
        if (AppState.chart) {
            AppState.chart.resize();
        }
    }, 100);
}

/**
 * Inicializa los listeners para el modo presentación
 */
export function initPresentationMode() {
    // Atajo de teclado: F11 o Ctrl+P (si no entra en conflicto con imprimir)
    // Nota: F11 es nativo del navegador, pero podemos detectar 'p'
    document.addEventListener('keydown', (e) => {
        // Alt+P para modo presentación (evitamos Ctrl+P que es imprimir)
        if (e.altKey && e.key === 'p') {
            e.preventDefault();
            togglePresentationMode();
        }

        // ESC para salir (además del nativo del navegador)
        if (e.key === 'Escape' && document.body.classList.contains('presentation-mode')) {
            togglePresentationMode();
        }
    });

    // Detectar cambios de pantalla completa nativos (F11)
    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement && document.body.classList.contains('presentation-mode')) {
            // Si el usuario sale de pantalla completa con ESC nativo, desactivar clase
            document.body.classList.remove('presentation-mode');
            if (AppState.chart) AppState.chart.resize();
        }
    });
}

/**
 * Muestra una notificación temporal
 * (Reutilizamos lógica similar a keyboard-shortcuts pero centralizada si fuera posible,
 * por ahora duplicamos simple para independencia del módulo)
 */
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'presentation-notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 24px;
        border-radius: 30px;
        z-index: 10000;
        font-size: 16px;
        pointer-events: none;
        animation: fadeInOut 3s forwards;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Agregar estilos de animación si no existen
if (!document.getElementById('presentation-styles')) {
    const style = document.createElement('style');
    style.id = 'presentation-styles';
    style.textContent = `
        @keyframes fadeInOut {
            0% { opacity: 0; transform: translate(-50%, -20px); }
            10% { opacity: 1; transform: translate(-50%, 0); }
            90% { opacity: 1; transform: translate(-50%, 0); }
            100% { opacity: 0; transform: translate(-50%, -20px); }
        }
        
        /* Estilos del Modo Presentación */
        body.presentation-mode {
            overflow: hidden;
            background: white;
            margin: 0;
            padding: 0;
        }
        
        body.presentation-mode .container > header,
        body.presentation-mode .intro-section,
        body.presentation-mode .data-section,
        body.presentation-mode .config-panel,
        body.presentation-mode .controls-panel,
        body.presentation-mode footer,
        body.presentation-mode #dev-panel {
            display: none !important;
        }
        
        body.presentation-mode .container {
            max-width: 100% !important;
            width: 100vw !important;
            height: 100vh !important;
            margin: 0 !important;
            padding: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background: white;
        }
        
        body.presentation-mode .chart-container {
            width: 98vw !important;
            height: 95vh !important;
            max-width: 98vw !important;
            max-height: 95vh !important;
            padding: 20px !important;
            margin: 0 !important;
            box-shadow: none !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background: white;
        }
        
        body.presentation-mode canvas {
            max-width: 100% !important;
            max-height: 100% !important;
        }
        
        /* Botón flotante para salir (opcional, ESC también funciona) */
        body.presentation-mode .exit-presentation-btn {
            display: block;
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 10001;
        }
    `;
    document.head.appendChild(style);
}
