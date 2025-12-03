// ============================================
// GESTIÓN DE ESTADO CENTRALIZADA
// ============================================

/**
 * Estado global de la aplicación
 * Centraliza todas las variables globales para mejor mantenibilidad
 */
const AppState = {
    // Series de datos del usuario
    series: [],

    // Instancia del gráfico de Chart.js
    chart: null,

    // Contador para IDs únicos de series
    nextId: 1,

    // Configuración de la gráfica
    config: {
        title: 'Gráfica de Datos',
        xLabel: 'X',
        yLabel: 'Y',
        xMin: null,  // null = auto
        xMax: null,  // null = auto
        yMin: null,  // null = auto
        yMax: null,  // null = auto
        showGrid: true
    }
};

/**
 * Estructura de una serie de datos
 * @typedef {Object} Serie
 * @property {number} id - ID único de la serie
 * @property {string} name - Nombre de la serie
 * @property {string} color - Color en formato hex
 * @property {string} fitType - Tipo de ajuste ('none', 'linear', 'poly2', etc.)
 * @property {Array<DataPoint>} data - Array de puntos de datos
 * @property {string} equation - Ecuación del ajuste (generada)
 * @property {number} r2 - Coeficiente R² del ajuste (generado)
 */

/**
 * Estructura de un punto de datos
 * @typedef {Object} DataPoint
 * @property {number|string} x - Valor X
 * @property {number|string} y - Valor Y
 * @property {number} xError - Error en X
 * @property {number} yError - Error en Y
 */
