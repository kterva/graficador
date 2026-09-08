/**
 * ============================================
 * MODALES: focus trap + diálogo de confirmación
 * ============================================
 *
 * - `trapFocus(container)` — atrapa el foco de teclado dentro de `container`
 *   (Tab / Shift+Tab hacen ciclo), y al liberar devuelve el foco al elemento
 *   que lo tenía antes. Devuelve la función de liberación. (C6)
 * - `activateModal(el)` / `deactivateModal(el)` — envuelven a trapFocus para los
 *   modales que se muestran/ocultan con `style.display`.
 * - `confirmDialog(opts)` — reemplaza a `window.confirm()` por un modal propio,
 *   no bloqueante y estilable. Devuelve `Promise<boolean>`. (C5)
 *
 * @module modal
 */

const FOCUSABLE = [
    'a[href]', 'button:not([disabled])', 'input:not([disabled])',
    'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])'
].join(',');

/**
 * Atrapa el foco dentro de `container` hasta que se llame a la función devuelta.
 * @param {HTMLElement} container
 * @returns {() => void} liberador
 */
export function trapFocus(container) {
    const previouslyFocused = document.activeElement;

    const focusables = () => Array.from(container.querySelectorAll(FOCUSABLE))
        .filter(el => el.offsetParent !== null); // sólo visibles

    // Mover el foco adentro
    const first = focusables()[0];
    if (first) {
        first.focus();
    } else {
        // Sin elementos enfocables: hacer enfocable el contenedor
        if (!container.hasAttribute('tabindex')) container.setAttribute('tabindex', '-1');
        container.focus();
    }

    const onKeydown = (e) => {
        if (e.key !== 'Tab') return;
        const els = focusables();
        if (els.length === 0) { e.preventDefault(); return; }
        const firstEl = els[0];
        const lastEl = els[els.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
            e.preventDefault();
            firstEl.focus();
        } else if (!container.contains(document.activeElement)) {
            e.preventDefault();
            firstEl.focus();
        }
    };

    container.addEventListener('keydown', onKeydown);

    return function release() {
        container.removeEventListener('keydown', onKeydown);
        if (previouslyFocused && typeof previouslyFocused.focus === 'function' &&
            document.contains(previouslyFocused)) {
            previouslyFocused.focus();
        }
    };
}

// Registro de liberadores por elemento de modal (para modales show/hide).
const _releasers = new WeakMap();

/**
 * Activa el focus trap de un modal que se muestra con `style.display`.
 * @param {HTMLElement} el - contenedor del modal
 * @param {() => void} [onEscape] - si se pasa, Escape lo llama (cerrar el modal)
 */
export function activateModal(el, onEscape) {
    if (!el || _releasers.has(el)) return;
    const releaseTrap = trapFocus(el);
    let onKey = null;
    if (typeof onEscape === 'function') {
        onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); onEscape(); } };
        document.addEventListener('keydown', onKey, true);
    }
    _releasers.set(el, () => {
        releaseTrap();
        if (onKey) document.removeEventListener('keydown', onKey, true);
    });
}

/** Libera el focus trap de un modal que se oculta. */
export function deactivateModal(el) {
    if (!el) return;
    const release = _releasers.get(el);
    if (release) {
        release();
        _releasers.delete(el);
    }
}

/**
 * Diálogo de confirmación no bloqueante. Reemplazo de `window.confirm()`.
 *
 * @param {Object} opts
 * @param {string} opts.message - Texto (puede tener `\n`)
 * @param {string} [opts.confirmText='Confirmar']
 * @param {string} [opts.cancelText='Cancelar']
 * @param {boolean} [opts.danger=false] - Estilo rojo para el botón de confirmar
 * @returns {Promise<boolean>} true si el usuario confirma
 */
export function confirmDialog({ message, confirmText = 'Confirmar', cancelText = 'Cancelar', danger = false } = {}) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'app-confirm-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.style.cssText = `
            position: fixed; inset: 0; z-index: 12000;
            background: rgba(0,0,0,0.5);
            display: flex; align-items: center; justify-content: center;
            padding: 20px;
        `;

        const box = document.createElement('div');
        box.style.cssText = `
            background: #fff; color: #333; border-radius: 10px;
            max-width: 420px; width: 100%; padding: 22px;
            box-shadow: 0 12px 40px rgba(0,0,0,0.3);
            font-size: 15px; line-height: 1.5;
        `;

        const msg = document.createElement('p');
        msg.style.cssText = 'margin: 0 0 20px 0; white-space: pre-line;';
        msg.textContent = message;

        const actions = document.createElement('div');
        actions.style.cssText = 'display: flex; gap: 10px; justify-content: flex-end;';

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.textContent = cancelText;
        cancelBtn.style.cssText = 'padding: 9px 16px; border-radius: 6px; border: 1px solid #ccc; background: #f5f5f5; cursor: pointer; font-weight: 500;';

        const okBtn = document.createElement('button');
        okBtn.type = 'button';
        okBtn.textContent = confirmText;
        okBtn.style.cssText = `padding: 9px 16px; border-radius: 6px; border: none; cursor: pointer; font-weight: 600; color: #fff;
            background: ${danger ? '#e74c3c' : '#3498db'};`;

        actions.append(cancelBtn, okBtn);
        box.append(msg, actions);
        overlay.append(box);
        document.body.appendChild(overlay);

        const release = trapFocus(box);
        // El foco por defecto va al botón menos destructivo (Cancelar)
        cancelBtn.focus();

        const close = (result) => {
            release();
            overlay.remove();
            document.removeEventListener('keydown', onKey, true);
            resolve(result);
        };

        const onKey = (e) => {
            if (e.key === 'Escape') { e.preventDefault(); close(false); }
        };
        document.addEventListener('keydown', onKey, true);

        cancelBtn.addEventListener('click', () => close(false));
        okBtn.addEventListener('click', () => close(true));
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });
    });
}
