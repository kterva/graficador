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
 * importado o link compartido). Descarta entradas que no sean objetos, fuerza
 * que cada `id` sea un entero único y no negativo (de otro modo se interpolaría
 * sin comillas en atributos `onclick` del DOM), y garantiza que `data` sea
 * siempre un array de puntos {x,y} — sin esto, una serie malformada (ej. sin
 * `data`, o con `data` no-array) hace explotar `renderTable` con
 * `serie.data.forEach is not a function` recién DESPUÉS de que el estado previo
 * del usuario ya fue reemplazado, perdiendo su trabajo.
 *
 * @param {Array} rawSeries - Series crudas, potencialmente no confiables
 * @returns {Array} Series saneadas, seguras de renderizar
 */
export function sanitizeImportedSeries(rawSeries) {
    if (!Array.isArray(rawSeries)) return [];

    const usedIds = new Set();
    let fallbackId = 1;
    const nextFallbackId = () => {
        while (usedIds.has(fallbackId)) fallbackId++;
        return fallbackId++;
    };

    return rawSeries
        .filter(raw => raw !== null && typeof raw === 'object')
        .map((raw, index) => {
            const serie = { ...raw };

            const id = Number(serie.id);
            serie.id = (Number.isInteger(id) && id >= 0 && !usedIds.has(id)) ? id : nextFallbackId();
            usedIds.add(serie.id);

            serie.name = (typeof serie.name === 'string' && serie.name.trim()) ? serie.name : `Serie ${serie.id}`;
            serie.color = (typeof serie.color === 'string' && serie.color) ? serie.color : COLORS[index % COLORS.length];
            serie.fitType = typeof serie.fitType === 'string' ? serie.fitType : 'none';

            const rawData = Array.isArray(serie.data) ? serie.data : [];
            const cleanData = rawData
                .filter(p => p !== null && typeof p === 'object')
                .map(p => ({
                    x: (typeof p.x === 'number' || typeof p.x === 'string') ? p.x : '',
                    y: (typeof p.y === 'number' || typeof p.y === 'string') ? p.y : '',
                    xError: typeof p.xError === 'number' ? p.xError : 0,
                    yError: typeof p.yError === 'number' ? p.yError : 0
                }));
            serie.data = cleanData.length > 0 ? cleanData : [{ x: '', y: '' }];

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

