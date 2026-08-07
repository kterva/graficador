/**
 * ============================================
 * CÁLCULOS MATEMÁTICOS
 * ============================================
 * 
 * Funciones para cálculo de derivadas, integrales y ajustes de curvas.
 * 
 * @module calculations
 */

import {
    linearRegression,
    polynomialRegression,
    exponentialRegression,
    logarithmicRegression,
    powerRegression
} from './regression.js';
import { extractUnit, formatWithUncertainty, calculateR2 } from './utils.js';

/**
 * Calcula la derivada (pendiente) en un punto x
 * @param {number} x - Punto donde calcular la derivada
 * @param {Object|Array} coeffs - Coeficientes de la función
 * @param {string} type - Tipo de función ('linear', 'poly2', etc.)
 * @returns {number} Valor de la derivada en x
 */
export function calculateDerivative(x, coeffs, type) {
    if (type === 'linear') {
        // y = ax + b -> y' = a
        return coeffs.a;
    } else if (type === 'poly2') {
        // y = ax^2 + bx + c -> y' = 2ax + b
        // coeffs = [a, b, c]
        return 2 * coeffs[0] * x + coeffs[1];
    } else if (type === 'poly3') {
        // y = ax³+bx²+cx+d  →  y' = 3ax²+2bx+c
        // coeffs = [a, b, c, d] (mayor grado primero)
        return 3 * coeffs[0] * x * x + 2 * coeffs[1] * x + coeffs[2];
    } else if (type === 'logarithmic') {
        // y = a·ln(x)+b  →  y' = a/x (indefinida para x <= 0, no cero)
        if (x <= 0) return NaN;
        return coeffs.a / x;
    } else if (type === 'power') {
        // y = a·x^b  →  y' = a·b·x^(b-1) (indefinida para x <= 0, no cero)
        if (x <= 0) return NaN;
        return coeffs.a * coeffs.b * Math.pow(x, coeffs.b - 1);
    }
}

/**
 * Calcula la integral definida entre x1 y x2
 * @param {number} x1 - Límite inferior
 * @param {number} x2 - Límite superior
 * @param {Object|Array} coeffs - Coeficientes de la función
 * @param {string} type - Tipo de función ('linear', 'poly2', etc.)
 * @returns {number} Valor de la integral definida
 */
export function calculateIntegral(x1, x2, coeffs, type) {
    if (type === 'linear') {
        // y = ax + b -> ∫y = (a/2)x^2 + bx
        const F = (x) => (coeffs.a / 2) * x * x + coeffs.b * x;
        return F(x2) - F(x1);
    } else if (type === 'poly2') {
        // y = ax^2 + bx + c -> ∫y = (a/3)x^3 + (b/2)x^2 + cx
        const F = (x) => (coeffs[0] / 3) * Math.pow(x, 3) + (coeffs[1] / 2) * x * x + coeffs[2] * x;
        return F(x2) - F(x1);
    } else if (type === 'poly3') {
        // y = ax³+bx²+cx+d  →  ∫y = (a/4)x⁴+(b/3)x³+(c/2)x²+dx
        const F = (x) => (coeffs[0] / 4) * Math.pow(x, 4) + (coeffs[1] / 3) * Math.pow(x, 3) + (coeffs[2] / 2) * x * x + coeffs[3] * x;
        return F(x2) - F(x1);
    } else if (type === 'logarithmic') {
        // y = a·ln(x)+b  →  ∫y = a·(x·ln(x)-x)+b·x
        if (x1 <= 0 || x2 <= 0) return 0;
        const F = (x) => coeffs.a * (x * Math.log(x) - x) + coeffs.b * x;
        return F(x2) - F(x1);
    } else if (type === 'power') {
        // y = a·x^b  →  ∫y = a·x^(b+1)/(b+1)  (b ≠ -1)
        if (x1 <= 0 || x2 <= 0) return 0;
        if (Math.abs(coeffs.b + 1) < 1e-10) {
            // Caso especial b = -1: ∫a/x dx = a·ln(x)
            const F = (x) => coeffs.a * Math.log(x);
            return F(x2) - F(x1);
        }
        const F = (x) => coeffs.a * Math.pow(x, coeffs.b + 1) / (coeffs.b + 1);
        return F(x2) - F(x1);
    }
}

/**
 * Obtiene coeficientes numéricos de la regresión
 * @param {Array} data - Datos para la regresión
 * @param {string} type - Tipo de regresión
 * @returns {Object|Array|null} Coeficientes de la regresión
 */
export function getRegressionCoeffs(data, type) {
    const xs = data.map(p => p.x);
    const ys = data.map(p => p.y);

    if (type === 'linear') {
        return linearRegression(data);
    } else if (type === 'poly2') {
        return polynomialRegression(xs, ys, 2);
    } else if (type === 'poly3') {
        return polynomialRegression(xs, ys, 3);
    } else if (type === 'exponential') {
        return exponentialRegression(xs, ys);
    } else if (type === 'logarithmic') {
        return logarithmicRegression(xs, ys);
    } else if (type === 'power') {
        return powerRegression(xs, ys);
    }
    return null;
}

/**
 * Calcula el ajuste completo para un conjunto de datos
 * @param {Array} data - Puntos de datos
 * @param {string} type - Tipo de ajuste
 * @param {string} xLabel - Etiqueta del eje X
 * @param {string} yLabel - Etiqueta del eje Y
 * @returns {Object} Resultado del ajuste con ecuación, r2, puntos, etc.
 */
export function calculateFit(data, type, xLabel = 'X', yLabel = 'Y', xRange = null) {
    const xs = data.map(p => p.x);
    const ys = data.map(p => p.y);
    const n = xs.length;

    let equation = '';
    let r2 = null; // null = sin ajuste calculado (evita mostrar "R² = 0.0000" en un fallo)
    let fitFunc = null;
    let uncertainty = null;

    if (type === 'linear') {
        const result = linearRegression(data);

        if (!result) {
            equation = '⚠️ No se puede calcular un ajuste lineal: todos los valores de X son iguales (línea vertical).';
        } else {
            const a = result.a;
            const b = result.b;

            // Extraer unidades
            const xUnit = extractUnit(xLabel);
            const yUnit = extractUnit(yLabel);
            let slopeUnit = '';
            if (yUnit && xUnit) {
                slopeUnit = ` ${yUnit}/${xUnit}`;
            } else if (yUnit) {
                slopeUnit = ` ${yUnit}`;
            }
            let interceptUnit = yUnit ? ` ${yUnit}` : '';

            let eqStr = '';
            if (result.uncertainty) {
                const formattedA = formatWithUncertainty(a, result.uncertainty.slope);
                const formattedB = formatWithUncertainty(b, result.uncertainty.intercept);

                eqStr = `y = ${formattedA.value}x + ${formattedB.value}`;
                eqStr += `<br><span style="font-size:0.9em; color:#666">
                        m = ${formattedA.value} ± ${formattedA.uncertainty}${slopeUnit}<br>
                        b = ${formattedB.value} ± ${formattedB.uncertainty}${interceptUnit}
                    </span>`;
            } else {
                eqStr = `y = ${a.toFixed(4)}x + ${b.toFixed(4)}`;
            }

            equation = eqStr;
            r2 = result.r2;
            fitFunc = x => a * x + b;
            uncertainty = result.uncertainty;
        }
    }
    else if (type === 'poly2') {
        const coeffs = polynomialRegression(xs, ys, 2);
        if (!coeffs) {
            equation = '⚠️ Se necesitan al menos 3 valores de X distintos para un ajuste cuadrático.';
        } else {
            equation = `y = ${coeffs[0].toFixed(4)}x² + ${coeffs[1].toFixed(4)}x + ${coeffs[2].toFixed(4)}`;
            r2 = calculateR2(ys, xs.map(x => coeffs[0] * x * x + coeffs[1] * x + coeffs[2]));
            fitFunc = x => coeffs[0] * x * x + coeffs[1] * x + coeffs[2];
        }
    }
    else if (type === 'poly3') {
        const coeffs = polynomialRegression(xs, ys, 3);
        if (!coeffs) {
            equation = '⚠️ Se necesitan al menos 4 valores de X distintos para un ajuste cúbico.';
        } else {
            equation = `y = ${coeffs[0].toFixed(4)}x³ + ${coeffs[1].toFixed(4)}x² + ${coeffs[2].toFixed(4)}x + ${coeffs[3].toFixed(4)}`;
            r2 = calculateR2(ys, xs.map(x => coeffs[0] * x * x * x + coeffs[1] * x * x + coeffs[2] * x + coeffs[3]));
            fitFunc = x => coeffs[0] * x * x * x + coeffs[1] * x * x + coeffs[2] * x + coeffs[3];
        }
    }
    else if (type === 'exponential') {
        const result = exponentialRegression(xs, ys);
        if (!result) {
            equation = '⚠️ El ajuste exponencial requiere que todos los valores de Y sean positivos.';
        } else {
            equation = `y = ${result.a.toFixed(4)}e^(${result.b.toFixed(4)}x)`;
            r2 = result.r2;
            fitFunc = x => result.a * Math.exp(result.b * x);
        }
    }
    else if (type === 'logarithmic') {
        const result = logarithmicRegression(xs, ys);
        if (!result) {
            equation = '⚠️ El ajuste logarítmico requiere que todos los valores de X sean positivos.';
        } else {
            equation = `y = ${result.a.toFixed(4)}ln(x) + ${result.b.toFixed(4)}`;
            r2 = result.r2;
            fitFunc = x => result.a * Math.log(x) + result.b;
        }
    }
    else if (type === 'power') {
        const result = powerRegression(xs, ys);
        if (!result) {
            equation = '⚠️ El ajuste potencial requiere que todos los valores de X e Y sean positivos.';
        } else {
            equation = `y = ${result.a.toFixed(4)}x^(${result.b.toFixed(4)})`;
            r2 = result.r2;
            fitFunc = x => result.a * Math.pow(x, result.b);
        }
    }

    // Limpiar "+ -" que aparece cuando un coeficiente negativo sigue a un "+" literal
    if (equation) {
        equation = equation.replace(/\+\s*-/g, '- ');
    }

    // Calculate range including errors to ensure lines cover the error boxes
    let minX = Infinity;
    let maxX = -Infinity;

    for (let i = 0; i < n; i++) {
        const x = xs[i];
        const xErr = data[i].xError || 0;
        if (x - xErr < minX) minX = x - xErr;
        if (x + xErr > maxX) maxX = x + xErr;
    }

    // Fallback if no data
    if (minX === Infinity) {
        minX = Math.min(...xs);
        maxX = Math.max(...xs);
    }

    if (xRange && typeof xRange.min === 'number' && !isNaN(xRange.min)) {
        minX = xRange.min;
    }
    if (xRange && typeof xRange.max === 'number' && !isNaN(xRange.max)) {
        maxX = xRange.max;
    }

    // Adjust minX for logarithmic and power functions if necessary
    if ((type === 'logarithmic' || type === 'power') && minX <= 0) {
        minX = 0.0001; // Avoid 0 or negative values
    }

    const range = maxX - minX;
    const points = [];
    const maxSlopePoints = [];
    const minSlopePoints = [];

    for (let i = 0; fitFunc && i <= 100; i++) {
        const x = minX + (range * i / 100);
        // Ensure x is valid for the function type
        if ((type === 'logarithmic' || type === 'power') && x <= 0) continue;

        points.push({ x: x, y: fitFunc(x) });

        // Generate points for max/min slope lines if uncertainty exists
        if (uncertainty && uncertainty.mMax !== undefined && isFinite(uncertainty.mMax) && isFinite(uncertainty.mMin)) {
            maxSlopePoints.push({ x: x, y: uncertainty.mMax * x + uncertainty.bMax });
            minSlopePoints.push({ x: x, y: uncertainty.mMin * x + uncertainty.bMin });
        }
    }

    return { equation, r2, points, uncertainty, maxSlopePoints, minSlopePoints };
}
