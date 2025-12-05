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
        return value.toFixed(4); // Sin incertidumbre, usar 4 decimales
    }

    // Encontrar el orden de magnitud de la incertidumbre
    const orderOfMagnitude = Math.floor(Math.log10(Math.abs(uncertainty)));

    // Redondear incertidumbre a 1 cifra significativa
    const uncertaintyRounded = Math.round(uncertainty / Math.pow(10, orderOfMagnitude)) * Math.pow(10, orderOfMagnitude);

    // Determinar decimales necesarios
    const decimals = Math.max(0, -orderOfMagnitude);

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
    return 1 - (ssResidual / ssTotal);
}
