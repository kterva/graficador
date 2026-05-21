/**
 * ============================================
 * SISTEMA DE CONVERSIÓN DE UNIDADES
 * ============================================
 * 
 * Módulo para convertir entre diferentes unidades físicas
 * 
 * @module units
 */

export const PREFIXES = {
    'p': { factor: 1e-12, name: 'pico' },
    'n': { factor: 1e-9, name: 'nano' },
    'μ': { factor: 1e-6, name: 'micro' },
    'm': { factor: 1e-3, name: 'mili' },
    'c': { factor: 1e-2, name: 'centi' },
    'd': { factor: 1e-1, name: 'deci' },
    'da': { factor: 1e1, name: 'deca' },
    'h': { factor: 1e2, name: 'hecto' },
    'k': { factor: 1e3, name: 'kilo' },
    'M': { factor: 1e6, name: 'mega' },
    'G': { factor: 1e9, name: 'giga' },
    'T': { factor: 1e12, name: 'tera' }
};

/**
 * Categorías de unidades soportadas con sus factores de conversión
 * Todos los factores son relativos a la unidad base del SI
 */
export const UNIT_CATEGORIES = {
    length: {
        name: 'Longitud',
        baseUnit: 'm',
        units: {
            'm': { factor: 1, label: 'metros (m)' }
        }
    },
    mass: {
        name: 'Masa',
        baseUnit: 'kg', // Sistema Internacional
        units: {
            'g': { factor: 0.001, label: 'gramos (g)' },
            'kg': { factor: 1, label: 'kilogramos (kg)' },
            'ton': { factor: 1000, label: 'toneladas métricas (ton)' }
        }
    },
    time: {
        name: 'Tiempo',
        baseUnit: 's',
        units: {
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
            '°C': { label: 'grados Celsius (°C)' }
        }
    },
    velocity: {
        name: 'Velocidad',
        baseUnit: 'm/s',
        units: {
            'm/s': { factor: 1, label: 'metros por segundo (m/s)' },
            'km/h': { factor: 1 / 3.6, label: 'kilómetros por hora (km/h)' }
        }
    },
    acceleration: {
        name: 'Aceleración',
        baseUnit: 'm/s²',
        units: {
            'm/s²': { factor: 1, label: 'metros por segundo cuadrado (m/s²)' }
        }
    },
    force: {
        name: 'Fuerza',
        baseUnit: 'N',
        units: {
            'N': { factor: 1, label: 'newton (N)' }
        }
    },
    energy: {
        name: 'Energía',
        baseUnit: 'J',
        units: {
            'J': { factor: 1, label: 'joule (J)' },
            'cal': { factor: 4.184, label: 'caloría (cal)' },
            'eV': { factor: 1.602e-19, label: 'electronvoltio (eV)' }
        }
    }
};

/**
 * Busca si una unidad existe, resolviendo dinámicamente prefijos si es necesario.
 * @param {string} unit 
 * @param {string} category 
 * @returns {Object|null} Objeto con { factor, label } o null
 */
export function resolveUnit(unit, category) {
    const categoryData = UNIT_CATEGORIES[category];
    if (!categoryData) return null;

    // 1. Búsqueda exacta
    if (unit in categoryData.units) {
        return categoryData.units[unit];
    }

    // 2. No se permiten prefijos en temperatura o tiempo no base
    if (category === 'temperature') return null;

    // 3. Resolución dinámica de prefijos (1 o 2 caracteres)
    let prefix = null;
    let base = null;

    if (unit.length >= 3 && unit.substring(0, 2) in PREFIXES) {
        prefix = unit.substring(0, 2);
        base = unit.substring(2);
    } else if (unit.length >= 2 && unit.substring(0, 1) in PREFIXES) {
        prefix = unit.substring(0, 1);
        base = unit.substring(1);
    }

    if (prefix && base) {
        // La base DEBE existir en la categoría para poder aplicar el prefijo
        // Excepción: "g" en masa, "m" en longitud, "s" en tiempo
        let validBase = false;
        let baseFactor = 1;
        let baseName = '';
        
        // Manejo especial de unidades que admiten prefijos comunes:
        if (category === 'mass' && base === 'g') {
            validBase = true;
            baseFactor = categoryData.units['g'].factor;
            baseName = 'gramos';
        } else if (category === 'length' && base === 'm') {
            validBase = true;
            baseFactor = categoryData.units['m'].factor;
            baseName = 'metros';
        } else if (category === 'time' && base === 's') {
            validBase = true;
            baseFactor = categoryData.units['s'].factor;
            baseName = 'segundos';
        } else if (category === 'force' && base === 'N') {
            validBase = true;
            baseFactor = categoryData.units['N'].factor;
            baseName = 'newton';
        } else if (category === 'energy' && base === 'J') {
            validBase = true;
            baseFactor = categoryData.units['J'].factor;
            baseName = 'joule';
        } else if (category === 'energy' && base === 'eV') {
            validBase = true;
            baseFactor = categoryData.units['eV'].factor;
            baseName = 'electronvoltios';
        } else if (category === 'energy' && base === 'cal') {
            validBase = true;
            baseFactor = categoryData.units['cal'].factor;
            baseName = 'calorías';
        } else if (category === 'velocity' && base === 'm/s') {
            validBase = true;
            baseFactor = categoryData.units['m/s'].factor;
            baseName = 'metros por segundo';
        } else if (category === 'acceleration' && base === 'm/s²') {
            validBase = true;
            baseFactor = categoryData.units['m/s²'].factor;
            baseName = 'metros por segundo cuadrado';
        }
        // También si la base está directamente listada
        else if (base in categoryData.units) {
            validBase = true;
            baseFactor = categoryData.units[base].factor;
            const fullLabel = categoryData.units[base].label;
            baseName = fullLabel.split(' ')[0]; // heurística básica
        }

        if (validBase) {
            const prefixData = PREFIXES[prefix];
            return {
                factor: baseFactor * prefixData.factor,
                label: `${prefixData.name}${baseName.toLowerCase()} (${unit})`
            };
        }
    }

    return null;
}

/**
 * Convierte un valor de una unidad a otra dentro de la misma categoría
 */
export function convert(value, fromUnit, toUnit, category) {
    if (fromUnit === toUnit) return value;

    const categoryData = UNIT_CATEGORIES[category];
    if (!categoryData) {
        throw new Error(`Categoría desconocida: ${category}`);
    }

    if (category === 'temperature') {
        return convertTemperature(value, fromUnit, toUnit);
    }

    const fromData = resolveUnit(fromUnit, category);
    const toData = resolveUnit(toUnit, category);

    if (!fromData || !toData) {
        throw new Error(`Unidad desconocida: ${fromUnit} o ${toUnit}`);
    }

    const baseValue = value * fromData.factor;
    return baseValue / toData.factor;
}

export function convertTemperature(value, from, to) {
    if (from === to) return value;
    let kelvin;
    switch (from) {
        case '°C':
            kelvin = value + 273.15;
            break;
        case 'K':
            kelvin = value;
            break;
        default:
            throw new Error(`Escala de temperatura desconocida: ${from}`);
    }
    switch (to) {
        case '°C':
            return kelvin - 273.15;
        case 'K':
            return kelvin;
        default:
            throw new Error(`Escala de temperatura desconocida: ${to}`);
    }
}

/**
 * Detecta automáticamente la categoría de una unidad
 */
export function detectCategory(unit) {
    // 1. Buscar en unidades predefinidas primero
    for (const [category, data] of Object.entries(UNIT_CATEGORIES)) {
        if (unit in data.units) {
            return category;
        }
    }
    
    // 2. Intentar resolver con prefijos
    for (const category of Object.keys(UNIT_CATEGORIES)) {
        if (resolveUnit(unit, category) !== null) {
            return category;
        }
    }

    return null;
}

/**
 * Obtiene todas las unidades disponibles estáticamente para una categoría
 */
export function getUnitsForCategory(category) {
    const categoryData = UNIT_CATEGORIES[category];
    if (!categoryData) {
        throw new Error(`Categoría desconocida: ${category}`);
    }
    return categoryData.units;
}

export function formatWithUnit(value, unit, decimals = 2) {
    if (!unit) return value.toFixed(decimals);
    return `${value.toFixed(decimals)} ${unit}`;
}

export function getCategoryName(category) {
    if (category === 'custom') return 'Personalizada';
    return UNIT_CATEGORIES[category]?.name || category;
}

export function getUnitLabel(unit, category) {
    if (category === 'custom') return unit;
    const categoryData = UNIT_CATEGORIES[category];
    if (!categoryData) return unit;
    
    const resolved = resolveUnit(unit, category);
    return resolved ? resolved.label : unit;
}

export function isValidUnit(unit, category) {
    if (category === 'custom') return true;
    return resolveUnit(unit, category) !== null;
}
