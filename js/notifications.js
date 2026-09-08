/**
 * ============================================
 * NOTIFICACIONES FLOTANTES
 * ============================================
 *
 * Toast único y centralizado. Antes cada módulo (share-manager, keyboard-shortcuts,
 * ui-handlers, presentation-mode) tenía su propia copia con estilos inline repetidos.
 *
 * @module notifications
 */

const STYLE_ID = 'notification-styles';

/** Inyecta las animaciones una sola vez. */
function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
        @keyframes notif-in  { from { transform: translateY(100px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes notif-out { from { transform: translateY(0); opacity: 1; } to { transform: translateY(100px); opacity: 0; } }
    `;
    document.head.appendChild(style);
}

const BACKGROUNDS = {
    success: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    error: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
    info: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
};

/**
 * Muestra una notificación temporal abajo a la derecha.
 *
 * @param {string} message - Texto (se inserta como textContent, no HTML)
 * @param {'success'|'error'|'info'} [type='info']
 * @param {number} [durationMs=3000] - Cuánto permanece visible antes de desvanecerse
 */
export function showNotification(message, type = 'info', durationMs = 3000) {
    ensureStyles();

    const el = document.createElement('div');
    el.className = 'app-notification';
    el.setAttribute('role', 'status');
    el.textContent = message;
    el.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        max-width: min(90vw, 420px);
        background: ${BACKGROUNDS[type] || BACKGROUNDS.info};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        font-size: 14px;
        font-weight: 500;
        animation: notif-in 0.3s ease-out;
    `;

    document.body.appendChild(el);

    setTimeout(() => {
        el.style.animation = 'notif-out 0.3s ease-in';
        setTimeout(() => el.remove(), 300);
    }, durationMs);

    return el;
}
