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
        showNotification('📺 Modo presentación activado. Pan y Zoom habilitados. ESC para salir.', 'info');

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
            if (!isPresentation) {
                // Al salir: limpieza agresiva
                const canvas = AppState.chart.canvas;

                // 1. Limpiar estilos inline
                canvas.style.width = '';
                canvas.style.height = '';

                // 2. Limpiar atributos HTML que Chart.js establece
                canvas.removeAttribute('width');
                canvas.removeAttribute('height');

                // 3. Forzar redimensionado de Chart.js
                AppState.chart.resize();

                // 4. Disparar evento de resize de ventana por si acaso
                window.dispatchEvent(new Event('resize'));
            } else {
                // Al entrar, asegurar que ocupe todo
                AppState.chart.resize();
            }
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
            if (AppState.chart) {
                const canvas = AppState.chart.canvas;
                canvas.style.width = '';
                canvas.style.height = '';
                canvas.removeAttribute('width');
                canvas.removeAttribute('height');
                AppState.chart.resize();
            }
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
        
        /* Estilos del Modo Presentación - ESTRATEGIA OVERLAY */
        /* No modificamos el layout base, solo superponemos la gráfica */
        
        body.presentation-mode {
            overflow: hidden; /* Evitar scroll mientras está activo */
        }
        
        /* Contenedor del gráfico en modo presentación */
        body.presentation-mode .chart-container {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            max-width: none !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 20px !important;
            background: white !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            
            /* Centrado del canvas */
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
        }
        
        body.presentation-mode canvas {
            width: 100% !important;
            height: 100% !important;
            max-width: 100% !important;
            max-height: 100% !important;
        }
        
        /* Botón de salir flotante */
        .exit-presentation-btn {
            display: none; /* Oculto por defecto */
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            background: rgba(231, 76, 60, 0.9);
            color: white;
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            font-size: 20px;
            cursor: pointer;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            transition: transform 0.2s, background 0.2s;
            align-items: center;
            justify-content: center;
        }
        
        .exit-presentation-btn:hover {
            transform: scale(1.1);
            background: #c0392b;
        }
        
        body.presentation-mode .exit-presentation-btn {
            display: flex !important; /* Visible solo en modo presentación */
        }
    `;
    document.head.appendChild(style);

    // Crear el botón de cierre si no existe
    if (!document.getElementById('exit-presentation-btn')) {
        const btn = document.createElement('button');
        btn.id = 'exit-presentation-btn';
        btn.className = 'exit-presentation-btn';
        btn.innerHTML = '×';
        btn.title = 'Salir del modo presentación (ESC)';
        btn.onclick = togglePresentationMode;
        document.body.appendChild(btn);
    }
}
