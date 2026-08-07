/**
 * ============================================
 * UTILIDADES COMPARTIDAS
 * ============================================
 * 
 * Funciones auxiliares y constantes utilizadas en múltiples módulos.
 * 
 * @module utils
 */

/**
 * Paleta de colores para las series
 * @type {string[]}
 */
export const COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22'];

/**
 * Versión de la aplicación. Única fuente de verdad: usar esta constante en
 * vez de repetir el número de versión en otros archivos, para evitar que
 * queden desincronizados (como pasó con el footer y el cache-buster).
 * @type {string}
 */
export const APP_VERSION = '1.5.0';

/**
 * Versión del formato de los archivos de proyecto (.json) y de las URLs
 * compartibles. Es independiente de APP_VERSION: solo debe cambiar cuando
 * cambia la estructura de esos datos, no en cada release de la app.
 * @type {string}
 */
export const PROJECT_FILE_FORMAT_VERSION = '1.4.0';

/**
 * Extrae la unidad de una etiqueta de eje
 * @param {string} label - Etiqueta del eje (ej: "Tiempo (s)")
 * @returns {string} Unidad extraída (ej: "s") o cadena vacía
 * 
 * @example
 * extractUnit("Tiempo (s)") // returns "s"
 * extractUnit("Velocidad (m/s)") // returns "m/s"
 */
export function extractUnit(label) {
    const match = label.match(/\(([^)]+)\)/);
    return match ? match[1] : '';
}

/**
 * Escapa caracteres especiales de HTML para prevenir XSS al interpolar
 * valores (potencialmente provenientes de proyectos importados o links
 * compartidos) dentro de innerHTML.
 *
 * @param {*} value - Valor a escapar (se convierte a string)
 * @returns {string} Texto seguro para insertar en HTML o en un atributo entre comillas
 */
export function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));
}

/**
 * Calcula el número de cifras significativas basado en la incertidumbre
 * Regla: La incertidumbre se redondea a 1-2 cifras significativas,
 * y el valor se redondea al mismo decimal.
 * 
 * @param {number} value - Valor a formatear
 * @param {number} uncertainty - Incertidumbre asociada
 * @returns {Object} Objeto con value y uncertainty formateados
 * @returns {string} return.value - Valor formateado
 * @returns {string} return.uncertainty - Incertidumbre formateada
 * 
 * @example
 * formatWithUncertainty(3.14159, 0.05)
 * // returns { value: "3.14", uncertainty: "0.05" }
 */
export function formatWithUncertainty(value, uncertainty) {
    if (!uncertainty || uncertainty === 0) {
        return { value: value.toFixed(4), uncertainty: '0' };
    }

    // Encontrar el orden de magnitud de la incertidumbre
    const orderOfMagnitude = Math.floor(Math.log10(Math.abs(uncertainty)));

    // Redondear incertidumbre a 1 cifra significativa
    const uncertaintyRounded = Math.round(uncertainty / Math.pow(10, orderOfMagnitude)) * Math.pow(10, orderOfMagnitude);

    // Recalcular el orden de magnitud desde el valor YA redondeado: el redondeo puede
    // "cruzar" una potencia de 10 (ej. 0.099 -> 0.10), y usar el orden de magnitud original
    // dejaría decimals desactualizado (mostraría "0.10" con 2 decimales en vez de "0.1").
    const finalOrderOfMagnitude = Math.floor(Math.log10(Math.abs(uncertaintyRounded)));

    // Determinar decimales necesarios
    const decimals = Math.max(0, -finalOrderOfMagnitude);

    return {
        value: value.toFixed(decimals),
        uncertainty: uncertaintyRounded.toFixed(decimals)
    };
}

/**
 * Calcula el coeficiente de determinación R²
 * Mide qué tan bien el modelo se ajusta a los datos observados.
 * 
 * @param {number[]} observed - Valores observados
 * @param {number[]} predicted - Valores predichos por el modelo
 * @returns {number} Valor R² entre 0 y 1 (1 = ajuste perfecto)
 * 
 * @example
 * calculateR2([1, 2, 3, 4], [1.1, 2.0, 2.9, 4.1])
 * // returns ~0.99
 */
export function calculateR2(observed, predicted) {
    const mean = observed.reduce((a, b) => a + b, 0) / observed.length;
    const ssTotal = observed.reduce((sum, y) => sum + Math.pow(y - mean, 2), 0);
    const ssResidual = observed.reduce((sum, y, i) => sum + Math.pow(y - predicted[i], 2), 0);

    if (ssTotal === 0) {
        // Todos los valores observados son iguales: no hay varianza que explicar.
        // El ajuste es "perfecto" si también predice ese mismo valor constante;
        // de lo contrario no hay un R² bien definido, así que devolvemos 0 en vez
        // de -Infinity/NaN.
        return ssResidual === 0 ? 1 : 0;
    }

    return 1 - (ssResidual / ssTotal);
}

/**
 * Parsea un valor numérico aceptando tanto coma como punto como separador decimal.
 * La coma se convierte automáticamente a punto antes de parsear.
 *
 * @param {string|number} value - Valor a parsear
 * @returns {number} Número parseado, o NaN si no es válido
 *
 * @example
 * parseDecimal('3,14')  // returns 3.14
 * parseDecimal('3.14')  // returns 3.14
 */
export function parseDecimal(value) {
    if (value === null || value === undefined || value === '') return NaN;
    if (typeof value === 'number') return value;
    // Normalizar: reemplazar coma por punto
    const normalized = String(value).trim().replace(',', '.');
    return parseFloat(normalized);
}

/**
 * Normaliza un string numérico reemplazando coma por punto.
 * Útil para guardar el valor raw en el estado antes de parsear.
 *
 * @param {string} value - Valor ingresado por el usuario
 * @returns {string} Valor con coma reemplazada por punto
 */
export function normalizeDecimalInput(value) {
    return String(value).trim().replace(',', '.');
}

/**
 * Muestra un aviso flotante debajo del input cuando el usuario tipea punto
 * en lugar de coma como separador decimal.
 *
 * @param {HTMLElement} input - El input que disparó el evento
 */
export function showDecimalWarning(input) {
    const existingWarning = document.getElementById('decimal-warning');
    if (existingWarning) existingWarning.remove();

    const warning = document.createElement('div');
    warning.id = 'decimal-warning';
    warning.textContent = '💡 Usá coma (,) como separador decimal';
    warning.style.cssText = `
        position: fixed;
        background: #fff3cd;
        color: #856404;
        border: 1px solid #ffc107;
        border-radius: 4px;
        padding: 4px 10px;
        font-size: 12px;
        z-index: 3000;
        pointer-events: none;
        box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    `;

    // Posicionar debajo del input
    const rect = input.getBoundingClientRect();
    warning.style.left = `${rect.left}px`;
    warning.style.top = `${rect.bottom + 4}px`;

    document.body.appendChild(warning);

    // Auto-eliminar después de 2.5 segundos
    setTimeout(() => warning.remove(), 2500);
}
