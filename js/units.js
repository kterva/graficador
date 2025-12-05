/**
 * ============================================
 * SISTEMA DE CONVERSIÓN DE UNIDADES
 * ============================================
 * 
 * Módulo para convertir entre diferentes unidades físicas
 * 
 * @module units
 */

/**
 * Categorías de unidades soportadas con sus factores de conversión
 * Todos los factores son relativos a la unidad base del SI
 */
export const UNIT_CATEGORIES = {
    length: {
        name: 'Longitud',
        baseUnit: 'm',
        units: {
            // Métricas
            'nm': { factor: 1e-9, label: 'nanómetros (nm)' },
            'μm': { factor: 1e-6, label: 'micrómetros (μm)' },
            'mm': { factor: 0.001, label: 'milímetros (mm)' },
            'cm': { factor: 0.01, label: 'centímetros (cm)' },
            'm': { factor: 1, label: 'metros (m)' },
            'km': { factor: 1000, label: 'kilómetros (km)' },
            // Imperiales
            'in': { factor: 0.0254, label: 'pulgadas (in)' },
            'ft': { factor: 0.3048, label: 'pies (ft)' },
            'yd': { factor: 0.9144, label: 'yardas (yd)' },
            'mi': { factor: 1609.34, label: 'millas (mi)' }
        }
    },
    mass: {
        name: 'Masa',
        baseUnit: 'kg',
        units: {
            // Métricas
            'mg': { factor: 1e-6, label: 'miligramos (mg)' },
            'g': { factor: 0.001, label: 'gramos (g)' },
            'kg': { factor: 1, label: 'kilogramos (kg)' },
            'ton': { factor: 1000, label: 'toneladas (ton)' },
            // Imperiales
            'oz': { factor: 0.0283495, label: 'onzas (oz)' },
            'lb': { factor: 0.453592, label: 'libras (lb)' }
        }
    },
    time: {
        name: 'Tiempo',
        baseUnit: 's',
        units: {
            'μs': { factor: 1e-6, label: 'microsegundos (μs)' },
            'ms': { factor: 0.001, label: 'milisegundos (ms)' },
            's': { factor: 1, label: 'segundos (s)' },
            'min': { factor: 60, label: 'minutos (min)' },
            'h': { factor: 3600, label: 'horas (h)' },
            'day': { factor: 86400, label: 'días (day)' }
        }
    },
    temperature: {
        name: 'Temperatura',
        baseUnit: 'K',
        // Temperatura requiere conversión especial (no lineal)
        units: {
            'K': { label: 'kelvin (K)' },
            'C': { label: 'grados Celsius (°C)' },
            'F': { label: 'grados Fahrenheit (°F)' }
        }
    },
    velocity: {
        name: 'Velocidad',
        baseUnit: 'm/s',
        units: {
            'm/s': { factor: 1, label: 'metros por segundo (m/s)' },
            'cm/s': { factor: 0.01, label: 'centímetros por segundo (cm/s)' },
            'km/h': { factor: 1 / 3.6, label: 'kilómetros por hora (km/h)' },
            'km/s': { factor: 1000, label: 'kilómetros por segundo (km/s)' }
        }
    },
    acceleration: {
        name: 'Aceleración',
        baseUnit: 'm/s²',
        units: {
            'm/s²': { factor: 1, label: 'metros por segundo cuadrado (m/s²)' },
            'cm/s²': { factor: 0.01, label: 'centímetros por segundo cuadrado (cm/s²)' },
            'km/s²': { factor: 1000, label: 'kilómetros por segundo cuadrado (km/s²)' }
        }
    },
    force: {
        name: 'Fuerza',
        baseUnit: 'N',
        units: {
            'N': { factor: 1, label: 'newton (N)' },
            'kN': { factor: 1000, label: 'kilonewton (kN)' },
            'dyn': { factor: 1e-5, label: 'dina (dyn)' }
        }
    },
    energy: {
        name: 'Energía',
        baseUnit: 'J',
        units: {
            'J': { factor: 1, label: 'joule (J)' },
            'kJ': { factor: 1000, label: 'kilojoule (kJ)' },
            'cal': { factor: 4.184, label: 'caloría (cal)' },
            'kcal': { factor: 4184, label: 'kilocaloría (kcal)' },
            'eV': { factor: 1.602e-19, label: 'electronvoltio (eV)' }
        }
    }
};

/**
 * Convierte un valor de una unidad a otra dentro de la misma categoría
 * 
 * @param {number} value - Valor a convertir
 * @param {string} fromUnit - Unidad de origen
 * @param {string} toUnit - Unidad de destino
 * @param {string} category - Categoría de unidad (length, mass, time, temperature)
 * @returns {number} Valor convertido
 * 
 * @example
 * convert(100, 'm', 'cm', 'length') // returns 10000
 * convert(1, 'kg', 'g', 'mass') // returns 1000
 */
export function convert(value, fromUnit, toUnit, category) {
    if (fromUnit === toUnit) return value;

    const categoryData = UNIT_CATEGORIES[category];
    if (!categoryData) {
        throw new Error(`Categoría desconocida: ${category}`);
    }

    // Temperatura requiere conversión especial
    if (category === 'temperature') {
        return convertTemperature(value, fromUnit, toUnit);
    }

    const fromFactor = categoryData.units[fromUnit]?.factor;
    const toFactor = categoryData.units[toUnit]?.factor;

    if (fromFactor === undefined || toFactor === undefined) {
        throw new Error(`Unidad desconocida: ${fromUnit} o ${toUnit}`);
    }

    // Convertir a unidad base, luego a unidad destino
    const baseValue = value * fromFactor;
    return baseValue / toFactor;
}

/**
 * Convierte temperatura entre diferentes escalas
 * 
 * @param {number} value - Valor de temperatura
 * @param {string} from - Escala de origen (K, C, F)
 * @param {string} to - Escala de destino (K, C, F)
 * @returns {number} Temperatura convertida
 * 
 * @example
 * convertTemperature(0, 'C', 'K') // returns 273.15
 * convertTemperature(32, 'F', 'C') // returns 0
 */
export function convertTemperature(value, from, to) {
    if (from === to) return value;

    // Primero convertir a Kelvin (base)
    let kelvin;
    switch (from) {
        case 'C':
            kelvin = value + 273.15;
            break;
        case 'F':
            kelvin = (value - 32) * 5 / 9 + 273.15;
            break;
        case 'K':
            kelvin = value;
            break;
        default:
            throw new Error(`Escala de temperatura desconocida: ${from}`);
    }

    // Luego convertir de Kelvin a destino
    switch (to) {
        case 'C':
            return kelvin - 273.15;
        case 'F':
            return (kelvin - 273.15) * 9 / 5 + 32;
        case 'K':
            return kelvin;
        default:
            throw new Error(`Escala de temperatura desconocida: ${to}`);
    }
}

/**
 * Detecta automáticamente la categoría de una unidad
 * 
 * @param {string} unit - Símbolo de la unidad
 * @returns {string|null} Categoría detectada o null si no se encuentra
 * 
 * @example
 * detectCategory('m') // returns 'length'
 * detectCategory('kg') // returns 'mass'
 */
export function detectCategory(unit) {
    for (const [category, data] of Object.entries(UNIT_CATEGORIES)) {
        if (unit in data.units) {
            return category;
        }
    }
    return null;
}

/**
 * Obtiene todas las unidades disponibles para una categoría
 * 
 * @param {string} category - Categoría de unidad
 * @returns {Object} Objeto con las unidades y sus datos
 * 
 * @example
 * getUnitsForCategory('length')
 * // returns { 'm': { factor: 1, label: 'metros (m)' }, ... }
 */
export function getUnitsForCategory(category) {
    const categoryData = UNIT_CATEGORIES[category];
    if (!categoryData) {
        throw new Error(`Categoría desconocida: ${category}`);
    }
    return categoryData.units;
}

/**
 * Formatea un valor con su unidad
 * 
 * @param {number} value - Valor numérico
 * @param {string} unit - Símbolo de la unidad
 * @param {number} decimals - Número de decimales
 * @returns {string} Valor formateado con unidad
 * 
 * @example
 * formatWithUnit(10.5, 'm', 2) // returns "10.50 m"
 */
export function formatWithUnit(value, unit, decimals = 2) {
    if (!unit) return value.toFixed(decimals);
    return `${value.toFixed(decimals)} ${unit}`;
}

/**
 * Obtiene el nombre completo de una categoría
 * 
 * @param {string} category - Categoría de unidad
 * @returns {string} Nombre de la categoría
 */
export function getCategoryName(category) {
    return UNIT_CATEGORIES[category]?.name || category;
}

/**
 * Obtiene la etiqueta legible de una unidad
 * 
 * @param {string} unit - Símbolo de la unidad
 * @param {string} category - Categoría de la unidad
 * @returns {string} Etiqueta legible
 */
export function getUnitLabel(unit, category) {
    const categoryData = UNIT_CATEGORIES[category];
    if (!categoryData) return unit;
    return categoryData.units[unit]?.label || unit;
}

/**
 * Valida si una unidad existe en una categoría
 * 
 * @param {string} unit - Símbolo de la unidad
 * @param {string} category - Categoría de unidad
 * @returns {boolean} true si la unidad existe
 */
export function isValidUnit(unit, category) {
    const categoryData = UNIT_CATEGORIES[category];
    if (!categoryData) return false;
    return unit in categoryData.units;
}
