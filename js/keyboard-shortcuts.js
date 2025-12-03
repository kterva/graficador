/**
 * ============================================
 * ATAJOS DE TECLADO Y ACCESIBILIDAD
 * ============================================
 * 
 * Módulo para manejar atajos de teclado y mejorar la accesibilidad
 * 
 * @module keyboard-shortcuts
 */

// Nota: addSerie, exportProject y otras funciones están disponibles globalmente
// desde main.js que las expone en window

/**
 * Inicializa los atajos de teclado
 */
export function initKeyboardShortcuts() {
    document.addEventListener('keydown', handleKeyboardShortcut);
    console.log('⌨️ Atajos de teclado inicializados');
}

/**
 * Maneja los atajos de teclado
 */
function handleKeyboardShortcut(event) {
    // Ctrl/Cmd + N: Nueva serie
    if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
        event.preventDefault();
        if (typeof window.addSerie === 'function') {
            window.addSerie();
            showShortcutNotification('Nueva serie agregada');
        }
    }

    // Ctrl/Cmd + S: Guardar proyecto
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        if (typeof window.exportProject === 'function') {
            window.exportProject();
            showShortcutNotification('Proyecto guardado');
        }
    }

    // Ctrl/Cmd + E: Abrir menú de exportación
    if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
        event.preventDefault();
        const exportBtn = document.querySelector('[onclick*="exportCSV"]')?.closest('.btn-group');
        if (exportBtn) {
            exportBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            exportBtn.style.animation = 'pulse 0.5s';
        }
        showShortcutNotification('Menú de exportación');
    }

    // Ctrl/Cmd + H: Mostrar ayuda de atajos
    if ((event.ctrlKey || event.metaKey) && event.key === 'h') {
        event.preventDefault();
        showKeyboardShortcutsHelp();
    }

    // F1: Ayuda general
    if (event.key === 'F1') {
        event.preventDefault();
        showKeyboardShortcutsHelp();
    }

    // Escape: Cerrar modales
    if (event.key === 'Escape') {
        closeAllModals();
    }
}

/**
 * Muestra notificación de atajo usado
 */
function showShortcutNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'shortcut-notification';
    notification.textContent = `⌨️ ${message}`;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideInUp 0.3s ease-out;
        font-size: 14px;
        font-weight: 500;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutDown 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

/**
 * Muestra ayuda de atajos de teclado
 */
function showKeyboardShortcutsHelp() {
    const modal = document.createElement('div');
    modal.id = 'keyboardShortcutsModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    modal.innerHTML = `
        <div style="background: white; border-radius: 12px; padding: 30px; max-width: 500px; box-shadow: 0 8px 32px rgba(0,0,0,0.3);">
            <h2 style="margin-top: 0; color: #667eea;">⌨️ Atajos de Teclado</h2>
            
            <div style="margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px; font-weight: bold;">Ctrl + N</td>
                        <td style="padding: 10px;">Nueva serie</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px; font-weight: bold;">Ctrl + S</td>
                        <td style="padding: 10px;">Guardar proyecto</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px; font-weight: bold;">Ctrl + E</td>
                        <td style="padding: 10px;">Ir a exportación</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px; font-weight: bold;">Ctrl + H</td>
                        <td style="padding: 10px;">Mostrar esta ayuda</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px; font-weight: bold;">F1</td>
                        <td style="padding: 10px;">Ayuda general</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px; font-weight: bold;">Enter</td>
                        <td style="padding: 10px;">Agregar fila (en tabla)</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px; font-weight: bold;">Tab</td>
                        <td style="padding: 10px;">Navegar entre campos</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; font-weight: bold;">Escape</td>
                        <td style="padding: 10px;">Cerrar modales</td>
                    </tr>
                </table>
            </div>
            
            <button onclick="document.getElementById('keyboardShortcutsModal').remove()" 
                style="width: 100%; padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: 600; cursor: pointer;">
                Cerrar
            </button>
        </div>
    `;

    document.body.appendChild(modal);

    // Cerrar al hacer click fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

/**
 * Cierra todos los modales abiertos
 */
function closeAllModals() {
    // Cerrar modal de propagación de errores
    const errorModal = document.getElementById('errorPropagationModal');
    if (errorModal && errorModal.style.display !== 'none') {
        errorModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // Cerrar modal de atajos
    const shortcutsModal = document.getElementById('keyboardShortcutsModal');
    if (shortcutsModal) {
        shortcutsModal.remove();
    }

    // Cerrar menú de herramientas
    const toolsMenu = document.getElementById('toolsMenu');
    if (toolsMenu && toolsMenu.style.display !== 'none') {
        toolsMenu.style.display = 'none';
        const button = document.querySelector('[aria-controls="toolsMenu"]');
        if (button) {
            button.setAttribute('aria-expanded', 'false');
        }
    }
}

// Agregar animaciones CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInUp {
        from {
            transform: translateY(100px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutDown {
        from {
            transform: translateY(0);
            opacity: 1;
        }
        to {
            transform: translateY(100px);
            opacity: 0;
        }
    }
    
    @keyframes pulse {
        0%, 100% {
            box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.7);
        }
        50% {
            box-shadow: 0 0 0 10px rgba(102, 126, 234, 0);
        }
    }
`;
document.head.appendChild(style);
