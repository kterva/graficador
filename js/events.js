/**
 * ============================================
 * DELEGACIÓN DE EVENTOS
 * ============================================
 *
 * Un único punto de despacho que reemplaza los manejadores `on*=` inline del HTML
 * (que obligaban a `script-src 'unsafe-inline'` en la CSP — ver E1/E2).
 *
 * Uso en el HTML / plantillas:
 *   <button data-on-click="addSerie">…</button>
 *   <button data-on-click="switchHelpTab" data-tab="intro">…</button>
 *   <select data-on-change="updateAxisUnit" data-axis="x">…</select>
 *   <input  data-on-input="handleDecimalInput">
 *   <button data-on-click="openThing closeMenu">…</button>   (varias acciones, en orden)
 *   <tbody  data-on-paste="handleTablePaste" data-serie="3">…</tbody>
 *
 * Cada acción registrada es `(event, element) => void` y sabe extraer de
 * `element.dataset` / `element.value` lo que necesita.
 *
 * @module events
 */

const REGISTRY = new Map();
const EVENT_TYPES = ['click', 'change', 'input', 'keydown', 'paste', 'submit'];

/** camelCase del atributo: 'click' -> 'onClick' (para dataset). */
function datasetKey(type) {
    return `on${type[0].toUpperCase()}${type.slice(1)}`;
}

/**
 * Registra acciones. `actions` es un objeto { nombre: (event, element) => void }.
 * Se puede llamar varias veces; nombres repetidos se sobreescriben.
 */
export function registerActions(actions) {
    for (const [name, fn] of Object.entries(actions)) {
        if (typeof fn === 'function') REGISTRY.set(name, fn);
    }
}

function dispatch(type, event) {
    const key = datasetKey(type);
    let el = event.target;
    while (el && el.nodeType === 1) {
        const spec = el.dataset ? el.dataset[key] : undefined;
        if (spec) {
            for (const name of spec.trim().split(/\s+/)) {
                const fn = REGISTRY.get(name);
                if (fn) {
                    try {
                        fn(event, el);
                    } catch (err) {
                        console.error(`[events] error en la acción "${name}" (${type}):`, err);
                    }
                } else {
                    console.warn(`[events] acción no registrada para data-on-${type}: "${name}"`);
                }
            }
            return;
        }
        el = el.parentElement;
    }
}

/**
 * Conecta un listener delegado por cada tipo de evento en `document`.
 * Llamar una sola vez, al iniciar la app.
 */
export function initEventDelegation() {
    for (const type of EVENT_TYPES) {
        document.addEventListener(type, (event) => dispatch(type, event));
    }
}
