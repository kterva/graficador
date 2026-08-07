/**
 * ============================================
 * GESTIÓN DE ESTADO CENTRALIZADA
 * ============================================
 * 
 * Estado global de la aplicación.
 * Centraliza todas las variables globales para mejor mantenibilidad.
 * 
 * @module state
 */

import { COLORS } from './utils.js';

/**
 * Estado global de la aplicación
 * Centraliza todas las variables globales para mejor mantenibilidad
 */
export const AppState = {
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
        defaultXError: 0,
        defaultYError: 0,
        showGrid: true
    },

    // Estado de herramientas de cálculo
    tools: {
        showTangent: false,
        tangentX: 0,
        showArea: false,
        areaX1: 0,
        areaX2: 0
    },

    // Paleta de colores
    colors: COLORS,

    // Flag para detectar que el usuario está arrastrando el gráfico (pan)
    isPanning: false
};

/**
 * Obtiene el siguiente color disponible basado en el número de series
 * @returns {string} Color en formato hex
 */
export function getNextColor() {
    return AppState.colors[AppState.series.length % AppState.colors.length];
}

/**
 * Encuentra una serie por su ID
 * @param {number} id - ID de la serie
 * @returns {Object|undefined} Serie encontrada o undefined
 */
export function findSerieById(id) {
    return AppState.series.find(s => s.id === id);
}

/**
 * Sanea un array de series proveniente de una fuente no confiable (proyecto
 * importado o link compartido). Fuerza que cada `id` sea un entero único y
 * no negativo, descartando cualquier otro valor (string, objeto, etc.) que
 * de otro modo se interpolaría sin comillas en atributos `onclick` del DOM.
 *
 * @param {Array} rawSeries - Series crudas, potencialmente no confiables
 * @returns {Array} Series con `id` saneado
 */
export function sanitizeImportedSeries(rawSeries) {
    if (!Array.isArray(rawSeries)) return [];

    const usedIds = new Set();
    let fallbackId = 1;
    const nextFallbackId = () => {
        while (usedIds.has(fallbackId)) fallbackId++;
        return fallbackId++;
    };

    return rawSeries.map(raw => {
        const serie = { ...raw };
        const id = Number(serie.id);
        serie.id = (Number.isInteger(id) && id >= 0 && !usedIds.has(id)) ? id : nextFallbackId();
        usedIds.add(serie.id);
        return serie;
    });
}

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
 * @property {number} defaultXError - Incertidumbre por defecto para el eje X (aplica a toda la columna)
 * @property {number} defaultYError - Incertidumbre por defecto para el eje Y (aplica a toda la columna)
 * @property {Object} units - Metadatos de unidades (opcional)
 * @property {Object} units.x - Unidad del eje X
 * @property {string} units.x.unit - Símbolo de la unidad (ej: 'm', 's')
 * @property {string} units.x.category - Categoría (ej: 'length', 'time')
 * @property {string} units.x.original - Unidad original antes de conversiones
 * @property {Object} units.y - Unidad del eje Y
 * @property {string} units.y.unit - Símbolo de la unidad
 * @property {string} units.y.category - Categoría
 * @property {string} units.y.original - Unidad original antes de conversiones
 */

/**
 * Estructura de un punto de datos
 * @typedef {Object} DataPoint
 * @property {number|string} x - Valor X
 * @property {number|string} y - Valor Y
 */

