/**
 * ============================================
 * PROPAGACIÓN DE INCERTIDUMBRE
 * ============================================
 * 
 * Módulo para calcular propagación de errores en operaciones básicas.
 * Nivel: Bachillerato
 * 
 * @module uncertainty-propagation
 */

import { formatWithUncertainty } from './utils.js';

/**
 * Calcula la propagación de error para suma o resta
 * 
 * Fórmula: Si S = A ± B entonces δS = δA + δB
 *          Si R = A - B entonces δR = δA + δB
 * 
 * @param {number} valueA - Valor de A
 * @param {number} deltaA - Incertidumbre de A (δA)
 * @param {number} valueB - Valor de B
 * @param {number} deltaB - Incertidumbre de B (δB)
 * @param {string} operation - 'sum' o 'subtract'
 * @returns {Object} Resultado con valor e incertidumbre
 * 
 * @example
 * propagateSumSubtract(10, 0.5, 5, 0.3, 'sum')
 * // returns { value: 15, uncertainty: 0.8, formula: 'S = A + B ⇒ δS = δA + δB' }
 */
export function propagateSumSubtract(valueA, deltaA, valueB, deltaB, operation = 'sum') {
    const result = operation === 'sum' ? valueA + valueB : valueA - valueB;
    const uncertainty = deltaA + deltaB;

    const symbol = operation === 'sum' ? 'S' : 'R';
    const operator = operation === 'sum' ? '+' : '-';

    // Formatear con cifras significativas apropiadas
    const formatted = formatWithUncertainty(result, uncertainty);

    return {
        value: result,
        uncertainty: uncertainty,
        formula: `${symbol} = A ${operator} B ⇒ δ${symbol} = δA + δB`,
        calculation: `δ${symbol} = ${deltaA} + ${deltaB} = ${uncertainty}`,
        result: `${symbol} = ${formatted.value} ± ${formatted.uncertainty}`,
        formattedValue: formatted.value,
        formattedUncertainty: formatted.uncertainty
    };
}

/**
 * Calcula la propagación de error para producto o cociente
 * 
 * Fórmula: Si P = A × B entonces δP/P = δA/A + δB/B
 *          Si C = A / B entonces δC/C = δA/A + δB/B
 * 
 * @param {number} valueA - Valor de A
 * @param {number} deltaA - Incertidumbre de A (δA)
 * @param {number} valueB - Valor de B
 * @param {number} deltaB - Incertidumbre de B (δB)
 * @param {string} operation - 'product' o 'quotient'
 * @returns {Object} Resultado con valor e incertidumbre
 * 
 * @example
 * propagateProductQuotient(10, 0.5, 5, 0.3, 'product')
 * // returns { value: 50, uncertainty: 3.5, formula: 'P = A × B ⇒ δP/P = δA/A + δB/B' }
 */
export function propagateProductQuotient(valueA, deltaA, valueB, deltaB, operation = 'product') {
    const result = operation === 'product' ? valueA * valueB : valueA / valueB;

    // δP/P = δA/A + δB/B
    const relativeUncertainty = (deltaA / Math.abs(valueA)) + (deltaB / Math.abs(valueB));
    const uncertainty = Math.abs(result) * relativeUncertainty;

    const symbol = operation === 'product' ? 'P' : 'C';
    const operator = operation === 'product' ? '×' : '/';

    // Formatear con cifras significativas apropiadas
    const formatted = formatWithUncertainty(result, uncertainty);

    return {
        value: result,
        uncertainty: uncertainty,
        formula: `${symbol} = A ${operator} B ⇒ δ${symbol}/${symbol} = δA/A + δB/B`,
        calculation: `δ${symbol}/${symbol} = ${deltaA}/${Math.abs(valueA)} + ${deltaB}/${Math.abs(valueB)} = ${relativeUncertainty.toFixed(6)}`,
        uncertaintyCalc: `δ${symbol} = ${symbol} × (δ${symbol}/${symbol}) = ${formatted.value} × ${relativeUncertainty.toFixed(6)} = ${formatted.uncertainty}`,
        result: `${symbol} = ${formatted.value} ± ${formatted.uncertainty}`,
        formattedValue: formatted.value,
        formattedUncertainty: formatted.uncertainty
    };
}

/**
 * Calcula propagación de error para cualquier operación
 * 
 * @param {number} valueA - Valor de A
 * @param {number} deltaA - Incertidumbre de A
 * @param {number} valueB - Valor de B
 * @param {number} deltaB - Incertidumbre de B
 * @param {string} operation - 'sum', 'subtract', 'product', 'quotient'
 * @returns {Object} Resultado con valor e incertidumbre
 */
export function propagateUncertainty(valueA, deltaA, valueB, deltaB, operation) {
    if (operation === 'sum' || operation === 'subtract') {
        return propagateSumSubtract(valueA, deltaA, valueB, deltaB, operation);
    } else if (operation === 'product' || operation === 'quotient') {
        return propagateProductQuotient(valueA, deltaA, valueB, deltaB, operation);
    } else {
        throw new Error(`Operación no soportada: ${operation}`);
    }
}

/**
 * Formatea el resultado para mostrar en UI
 * 
 * @param {Object} result - Resultado de propagación
 * @returns {string} HTML formateado
 */
export function formatPropagationResult(result) {
    return `
        <div style="background: #f0f7ff; padding: 15px; border-radius: 8px; border-left: 4px solid #3498db;">
            <strong>Fórmula:</strong><br>
            ${result.formula}<br><br>
            
            <strong>Cálculo:</strong><br>
            ${result.calculation}<br>
            ${result.uncertaintyCalc ? result.uncertaintyCalc + '<br>' : ''}
            <br>
            
            <strong style="color: #2c3e50; font-size: 1.1em;">Resultado:</strong><br>
            <span style="color: #27ae60; font-size: 1.2em; font-weight: bold;">${result.result}</span>
        </div>
    `;
}

/**
 * Valida que los valores de entrada tengan la precisión apropiada según sus errores
 * 
 * @param {number} value - Valor medido
 * @param {number} uncertainty - Incertidumbre
 * @param {string} label - Etiqueta (A o B)
 * @returns {Object|null} Objeto con warning si hay problema, null si está bien
 */
export function validateInputPrecision(value, uncertainty, label) {
    if (uncertainty === 0) return null; // Sin error, no hay restricción

    // Obtener número de decimales del error
    const uncertaintyStr = uncertainty.toString();
    const uncertaintyDecimals = uncertaintyStr.includes('.')
        ? uncertaintyStr.split('.')[1].length
        : 0;

    // Obtener número de decimales del valor
    const valueStr = value.toString();
    const valueDecimals = valueStr.includes('.')
        ? valueStr.split('.')[1].length
        : 0;

    // El valor no debería tener más decimales que el error
    if (valueDecimals > uncertaintyDecimals) {
        // Calcular el valor correcto
        const correctedValue = parseFloat(value.toFixed(uncertaintyDecimals));

        return {
            hasWarning: true,
            type: 'value',
            message: `⚠️ El valor ${label} no está bien expresado en cifras significativas`,
            explanation: `No corresponde la cantidad de decimales con la de la incertidumbre. Si δ${label} tiene ${uncertaintyDecimals} decimal(es), entonces ${label} también debe tener ${uncertaintyDecimals} decimal(es).`,
            suggestion: `Sugerencia: ${label} = ${correctedValue} ± ${uncertainty}`,
            correctedValue: correctedValue
        };
    }

    return null;
}

/**
 * Cuenta las cifras significativas de un número
 * 
 * @param {number} num - Número a analizar
 * @returns {number} Cantidad de cifras significativas
 */
function countSignificantFigures(num) {
    const str = num.toString();

    // Remover notación científica si existe
    if (str.includes('e')) {
        const [mantissa] = str.split('e');
        return countSignificantFigures(parseFloat(mantissa));
    }

    // Remover el punto decimal para contar
    const withoutDot = str.replace('.', '');

    // Si el número es menor que 1, contar desde el primer dígito no cero
    if (Math.abs(num) < 1) {
        const match = withoutDot.match(/[1-9]\d*/);
        return match ? match[0].length : 1;
    }

    // Para números >= 1, contar todos los dígitos
    return withoutDot.length;
}

/**
 * Valida que la incertidumbre tenga solo 1 cifra significativa
 * 
 * @param {number} uncertainty - Incertidumbre
 * @param {string} label - Etiqueta (A o B)
 * @returns {Object|null} Objeto con warning si hay problema, null si está bien
 */
export function validateUncertaintyPrecision(uncertainty, label) {
    if (uncertainty === 0) return null;

    const sigFigs = countSignificantFigures(uncertainty);

    if (sigFigs > 1) {
        // Redondear a 1 cifra significativa
        const magnitude = Math.floor(Math.log10(Math.abs(uncertainty)));
        const correctedUncertainty = parseFloat((Math.round(uncertainty / Math.pow(10, magnitude)) * Math.pow(10, magnitude)).toPrecision(1));

        return {
            hasWarning: true,
            type: 'uncertainty',
            message: `⚠️ La incertidumbre δ${label} no está bien expresada`,
            explanation: `La incertidumbre debe tener solo 1 cifra significativa. Recordatorio: las cifras significativas son todas las cifras seguras de una medida más la primera afectada de error.`,
            suggestion: `Sugerencia: δ${label} = ${correctedUncertainty}`,
            correctedUncertainty: correctedUncertainty
        };
    }

    return null;
}

/**
 * Valida todos los inputs y retorna advertencias si las hay
 * 
 * @param {number} valueA - Valor de A
 * @param {number} deltaA - Error de A
 * @param {number} valueB - Valor de B
 * @param {number} deltaB - Error de B
 * @returns {Array} Array de advertencias
 */
export function validateAllInputs(valueA, deltaA, valueB, deltaB) {
    const warnings = [];

    // Validar incertidumbres primero (deben tener 1 cifra significativa)
    const uncertaintyWarningA = validateUncertaintyPrecision(deltaA, 'A');
    if (uncertaintyWarningA) warnings.push(uncertaintyWarningA);

    const uncertaintyWarningB = validateUncertaintyPrecision(deltaB, 'B');
    if (uncertaintyWarningB) warnings.push(uncertaintyWarningB);

    // Luego validar valores (deben tener misma precisión que incertidumbre)
    const valueWarningA = validateInputPrecision(valueA, deltaA, 'A');
    if (valueWarningA) warnings.push(valueWarningA);

    const valueWarningB = validateInputPrecision(valueB, deltaB, 'B');
    if (valueWarningB) warnings.push(valueWarningB);

    return warnings;
}

/**
 * Formatea las advertencias para mostrar en UI
 * 
 * @param {Array} warnings - Array de advertencias
 * @returns {string} HTML formateado
 */
export function formatWarnings(warnings) {
    if (warnings.length === 0) return '';

    let html = '<div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin-bottom: 15px;">';
    html += '<strong style="color: #856404;">⚠️ Verifica los valores ingresados:</strong><br><br>';

    warnings.forEach((warning, index) => {
        html += `<div style="margin-bottom: ${index < warnings.length - 1 ? '10px' : '0'};">`;
        html += `<strong>${warning.message}</strong><br>`;
        html += `${warning.explanation}<br>`;
        html += `<span style="color: #28a745; font-weight: bold;">${warning.suggestion}</span>`;
        html += '</div>';
    });

    html += '</div>';
    return html;
}
