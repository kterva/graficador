/**
 * ============================================
 * ANÁLISIS DIMENSIONAL
 * ============================================
 * 
 * Sistema de análisis dimensional para verificar coherencia
 * de ecuaciones físicas y calcular dimensiones resultantes.
 * 
 * Basado en las 7 dimensiones fundamentales del SI:
 * - L (Longitud)
 * - M (Masa)
 * - T (Tiempo)
 * - I (Corriente eléctrica)
 * - Θ (Temperatura)
 * - N (Cantidad de sustancia)
 * - J (Intensidad luminosa)
 * 
 * @module dimensional-analysis
 */

/**
 * Clase que representa una dimensión física
 * Cada magnitud se expresa como: L^a · M^b · T^c · I^d · Θ^e · N^f · J^g
 */
export class Dimension {
    /**
     * @param {number} L - Exponente de longitud
     * @param {number} M - Exponente de masa
     * @param {number} T - Exponente de tiempo
     * @param {number} I - Exponente de corriente
     * @param {number} Theta - Exponente de temperatura
     * @param {number} N - Exponente de cantidad de sustancia
     * @param {number} J - Exponente de intensidad luminosa
     */
    constructor(L = 0, M = 0, T = 0, I = 0, Theta = 0, N = 0, J = 0) {
        this.L = L;
        this.M = M;
        this.T = T;
        this.I = I;
        this.Theta = Theta;
        this.N = N;
        this.J = J;
    }

    /**
     * Multiplica dos dimensiones
     * @param {Dimension} other - Otra dimensión
     * @returns {Dimension} Dimensión resultante
     */
    multiply(other) {
        return new Dimension(
            this.L + other.L,
            this.M + other.M,
            this.T + other.T,
            this.I + other.I,
            this.Theta + other.Theta,
            this.N + other.N,
            this.J + other.J
        );
    }

    /**
     * Divide dos dimensiones
     * @param {Dimension} other - Otra dimensión
     * @returns {Dimension} Dimensión resultante
     */
    divide(other) {
        return new Dimension(
            this.L - other.L,
            this.M - other.M,
            this.T - other.T,
            this.I - other.I,
            this.Theta - other.Theta,
            this.N - other.N,
            this.J - other.J
        );
    }

    /**
     * Eleva una dimensión a una potencia
     * @param {number} n - Exponente
     * @returns {Dimension} Dimensión resultante
     */
    power(n) {
        return new Dimension(
            this.L * n,
            this.M * n,
            this.T * n,
            this.I * n,
            this.Theta * n,
            this.N * n,
            this.J * n
        );
    }

    /**
     * Verifica si dos dimensiones son iguales
     * @param {Dimension} other - Otra dimensión
     * @returns {boolean} true si son iguales
     */
    equals(other) {
        return this.L === other.L &&
            this.M === other.M &&
            this.T === other.T &&
            this.I === other.I &&
            this.Theta === other.Theta &&
            this.N === other.N &&
            this.J === other.J;
    }

    /**
     * Verifica si la dimensión es adimensional
     * @returns {boolean} true si es adimensional
     */
    isDimensionless() {
        return this.L === 0 && this.M === 0 && this.T === 0 &&
            this.I === 0 && this.Theta === 0 && this.N === 0 && this.J === 0;
    }

    /**
     * Convierte un número a superíndice Unicode
     * @param {number} n - Número a convertir
     * @returns {string} Número en superíndice
     */
    static toSuperscript(n) {
        const superscripts = {
            '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
            '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
            '-': '⁻', '+': '⁺'
        };
        return String(n).split('').map(char => superscripts[char] || char).join('');
    }

    /**
     * Convierte la dimensión a string legible con superíndices Unicode
     * @returns {string} Representación en formato [L·M^a·T^b...]
     */
    toString() {
        if (this.isDimensionless()) {
            return '[1]';
        }

        const parts = [];
        if (this.L !== 0) parts.push(`L${this.L !== 1 ? Dimension.toSuperscript(this.L) : ''}`);
        if (this.M !== 0) parts.push(`M${this.M !== 1 ? Dimension.toSuperscript(this.M) : ''}`);
        if (this.T !== 0) parts.push(`T${this.T !== 1 ? Dimension.toSuperscript(this.T) : ''}`);
        if (this.I !== 0) parts.push(`I${this.I !== 1 ? Dimension.toSuperscript(this.I) : ''}`);
        if (this.Theta !== 0) parts.push(`Θ${this.Theta !== 1 ? Dimension.toSuperscript(this.Theta) : ''}`);
        if (this.N !== 0) parts.push(`N${this.N !== 1 ? Dimension.toSuperscript(this.N) : ''}`);
        if (this.J !== 0) parts.push(`J${this.J !== 1 ? Dimension.toSuperscript(this.J) : ''}`);

        return `[${parts.join('·')}]`;
    }
}

/**
 * Catálogo de dimensiones de magnitudes físicas comunes
 */
export const DIMENSIONS = {
    // Sin dimensión
    dimensionless: new Dimension(),

    // Cinemática
    length: new Dimension(1),                    // [L]
    area: new Dimension(2),                      // [L²]
    volume: new Dimension(3),                    // [L³]
    time: new Dimension(0, 0, 1),                // [T]
    velocity: new Dimension(1, 0, -1),           // [L·T^-1]
    acceleration: new Dimension(1, 0, -2),       // [L·T^-2]
    angularVelocity: new Dimension(0, 0, -1),    // [T^-1]
    angularAcceleration: new Dimension(0, 0, -2), // [T^-2]

    // Dinámica
    mass: new Dimension(0, 1),                   // [M]
    density: new Dimension(-3, 1),               // [M·L^-3]
    force: new Dimension(1, 1, -2),              // [M·L·T^-2]
    momentum: new Dimension(1, 1, -1),           // [M·L·T^-1]
    impulse: new Dimension(1, 1, -1),            // [M·L·T^-1]
    energy: new Dimension(2, 1, -2),             // [M·L²·T^-2]
    work: new Dimension(2, 1, -2),               // [M·L²·T^-2]
    power: new Dimension(2, 1, -3),              // [M·L²·T^-3]
    pressure: new Dimension(-1, 1, -2),          // [M·L^-1·T^-2]
    torque: new Dimension(2, 1, -2),             // [M·L²·T^-2]

    // Termodinámica
    temperature: new Dimension(0, 0, 0, 0, 1),   // [Θ]
    heat: new Dimension(2, 1, -2),               // [M·L²·T^-2]
    entropy: new Dimension(2, 1, -2, 0, -1),     // [M·L²·T^-2·Θ^-1]
    heatCapacity: new Dimension(2, 1, -2, 0, -1), // [M·L²·T^-2·Θ^-1]
    thermalConductivity: new Dimension(1, 1, -3, 0, -1), // [M·L·T^-3·Θ^-1]

    // Electromagnetismo
    current: new Dimension(0, 0, 0, 1),          // [I]
    charge: new Dimension(0, 0, 1, 1),           // [T·I]
    voltage: new Dimension(2, 1, -3, -1),        // [M·L²·T^-3·I^-1]
    resistance: new Dimension(2, 1, -3, -2),     // [M·L²·T^-3·I^-2]
    capacitance: new Dimension(-2, -1, 4, 2),    // [M^-1·L^-2·T^4·I²]
    inductance: new Dimension(2, 1, -2, -2),     // [M·L²·T^-2·I^-2]
    electricField: new Dimension(1, 1, -3, -1),  // [M·L·T^-3·I^-1]
    magneticField: new Dimension(0, 1, -2, -1),  // [M·T^-2·I^-1]

    // Óptica
    luminousIntensity: new Dimension(0, 0, 0, 0, 0, 0, 1), // [J]
    luminousFlux: new Dimension(0, 0, 0, 0, 0, 0, 1),      // [J]
    illuminance: new Dimension(-2, 0, 0, 0, 0, 0, 1),      // [L^-2·J]

    // Química
    amountOfSubstance: new Dimension(0, 0, 0, 0, 0, 1),    // [N]
    concentration: new Dimension(-3, 0, 0, 0, 0, 1),       // [L^-3·N]
    molarMass: new Dimension(0, 1, 0, 0, 0, -1),           // [M·N^-1]
};

/**
 * Mapeo de unidades del SI a sus dimensiones
 */
export const UNIT_DIMENSIONS = {
    // Longitud (metro)
    'm': DIMENSIONS.length,

    // Tiempo (segundo)
    's': DIMENSIONS.time,

    // Masa (kilogramo)
    'kg': DIMENSIONS.mass,

    // Temperatura (kelvin)
    'K': DIMENSIONS.temperature,

    // Velocidad (metro por segundo)
    'm/s': DIMENSIONS.velocity,

    // Aceleración (metro por segundo cuadrado)
    'm/s²': DIMENSIONS.acceleration,

    // Fuerza (newton)
    'N': DIMENSIONS.force,

    // Energía (joule)
    'J': DIMENSIONS.energy,

    // Potencia (watt)
    'W': DIMENSIONS.power,

    // Presión (pascal)
    'Pa': DIMENSIONS.pressure,

    // Corriente (ampere)
    'A': DIMENSIONS.current,

    // Voltaje (volt)
    'V': DIMENSIONS.voltage,

    // Resistencia (ohm)
    'Ω': DIMENSIONS.resistance,

    // Carga (coulomb)
    'C': DIMENSIONS.charge,

    // Capacitancia (farad)
    'F': DIMENSIONS.capacitance,

    // Inductancia (henry)
    'H': DIMENSIONS.inductance,

    // Cantidad de sustancia (mol)
    'mol': DIMENSIONS.amountOfSubstance,

    // Intensidad luminosa (candela)
    'cd': DIMENSIONS.luminousIntensity,
};

/**
 * Información sobre magnitudes físicas (solo unidades del SI)
 */
export const MAGNITUDE_INFO = {
    // Cinemática
    'Posición': { dimension: DIMENSIONS.length, units: ['m'], symbol: 'x' },
    'Velocidad': { dimension: DIMENSIONS.velocity, units: ['m/s'], symbol: 'v' },
    'Aceleración': { dimension: DIMENSIONS.acceleration, units: ['m/s²'], symbol: 'a' },
    'Tiempo': { dimension: DIMENSIONS.time, units: ['s'], symbol: 't' },

    // Dinámica
    'Masa': { dimension: DIMENSIONS.mass, units: ['kg'], symbol: 'm' },
    'Fuerza': { dimension: DIMENSIONS.force, units: ['N'], symbol: 'F' },
    'Energía': { dimension: DIMENSIONS.energy, units: ['J'], symbol: 'E' },
    'Potencia': { dimension: DIMENSIONS.power, units: ['W'], symbol: 'P' },
    'Presión': { dimension: DIMENSIONS.pressure, units: ['Pa'], symbol: 'p' },
    'Momento': { dimension: DIMENSIONS.momentum, units: ['kg·m/s'], symbol: 'p' },

    // Termodinámica
    'Temperatura': { dimension: DIMENSIONS.temperature, units: ['K'], symbol: 'T' },
    'Calor': { dimension: DIMENSIONS.heat, units: ['J'], symbol: 'Q' },

    // Electromagnetismo
    'Corriente': { dimension: DIMENSIONS.current, units: ['A'], symbol: 'I' },
    'Voltaje': { dimension: DIMENSIONS.voltage, units: ['V'], symbol: 'V' },
    'Resistencia': { dimension: DIMENSIONS.resistance, units: ['Ω'], symbol: 'R' },
    'Carga': { dimension: DIMENSIONS.charge, units: ['C'], symbol: 'Q' },
    'Capacitancia': { dimension: DIMENSIONS.capacitance, units: ['F'], symbol: 'C' },
    'Inductancia': { dimension: DIMENSIONS.inductance, units: ['H'], symbol: 'L' },
};

/**
 * Obtiene la dimensión de una unidad
 * @param {string} unit - Unidad (ej: 'm', 'm/s', 'N')
 * @returns {Dimension|null} Dimensión correspondiente o null si no se encuentra
 */
export function getDimensionFromUnit(unit) {
    return UNIT_DIMENSIONS[unit] || null;
}

/**
 * Sugiere unidades apropiadas para una dimensión dada
 * @param {Dimension} dimension - Dimensión
 * @returns {string[]} Array de unidades sugeridas
 */
export function suggestUnitsForDimension(dimension) {
    const suggestions = [];

    for (const [unit, dim] of Object.entries(UNIT_DIMENSIONS)) {
        if (dim.equals(dimension)) {
            suggestions.push(unit);
        }
    }

    return suggestions;
}

/**
 * Identifica la magnitud física de una dimensión
 * @param {Dimension} dimension - Dimensión
 * @returns {string|null} Nombre de la magnitud o null
 */
export function identifyMagnitude(dimension) {
    for (const [name, info] of Object.entries(MAGNITUDE_INFO)) {
        if (info.dimension.equals(dimension)) {
            return name;
        }
    }
    return null;
}

/**
 * Verifica si dos dimensiones son compatibles para suma/resta
 * @param {Dimension} dim1 - Primera dimensión
 * @param {Dimension} dim2 - Segunda dimensión
 * @returns {boolean} true si son compatibles
 */
export function areCompatibleForAddition(dim1, dim2) {
    return dim1.equals(dim2);
}

/**
 * Parser simple de expresiones dimensionales
 * Soporta: *, /, ^, paréntesis
 * @param {string} expr - Expresión (ej: "velocidad * tiempo")
 * @returns {Dimension|null} Dimensión resultante o null si hay error
 */
export function parseExpression(expr) {
    try {
        // Reemplazar nombres de magnitudes por sus dimensiones
        let processedExpr = expr.toLowerCase().trim();

        // Mapeo de nombres a dimensiones
        const nameMap = {
            'longitud': DIMENSIONS.length,
            'posicion': DIMENSIONS.length,
            'posición': DIMENSIONS.length,
            'distancia': DIMENSIONS.length,
            'tiempo': DIMENSIONS.time,
            'velocidad': DIMENSIONS.velocity,
            'aceleracion': DIMENSIONS.acceleration,
            'aceleración': DIMENSIONS.acceleration,
            'masa': DIMENSIONS.mass,
            'fuerza': DIMENSIONS.force,
            'energia': DIMENSIONS.energy,
            'energía': DIMENSIONS.energy,
            'potencia': DIMENSIONS.power,
            'presion': DIMENSIONS.pressure,
            'presión': DIMENSIONS.pressure,
            'temperatura': DIMENSIONS.temperature,
            'corriente': DIMENSIONS.current,
            'voltaje': DIMENSIONS.voltage,
            'resistencia': DIMENSIONS.resistance,
        };

        // Evaluar expresión simple
        // Por ahora, solo soportamos operaciones básicas
        const tokens = processedExpr.split(/([*\/^()])/);

        // Implementación simplificada - evaluar de izquierda a derecha
        let result = null;
        let operation = null;

        for (let token of tokens) {
            token = token.trim();
            if (!token) continue;

            if (token === '*' || token === '/' || token === '^') {
                operation = token;
            } else if (nameMap[token]) {
                const dim = nameMap[token];
                if (result === null) {
                    result = dim;
                } else if (operation === '*') {
                    result = result.multiply(dim);
                    operation = null;
                } else if (operation === '/') {
                    result = result.divide(dim);
                    operation = null;
                }
            }
        }

        return result;
    } catch (error) {
        console.error('Error parsing expression:', error);
        return null;
    }
}
