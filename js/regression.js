/**
 * ============================================
 * ALGORITMOS DE REGRESIÓN
 * ============================================
 * 
 * Implementaciones de diferentes tipos de regresión para ajuste de curvas.
 * Incluye regresión lineal con análisis de incertidumbre.
 * 
 * @module regression
 */

import { calculateR2 } from './utils.js';

/**
 * Regresión lineal con análisis de incertidumbre
 * Calcula y = ax + b usando mínimos cuadrados.
 * Si hay errores en los datos, calcula pendientes máxima y mínima.
 * 
 * @param {Array<{x: number, y: number, xError: number, yError: number}>} data - Puntos de datos
 * @returns {Object} Resultado de la regresión
 * @returns {number} return.a - Pendiente (slope)
 * @returns {number} return.b - Ordenada al origen (intercept)
 * @returns {number} return.r2 - Coeficiente de determinación
 * @returns {Object|null} return.uncertainty - Análisis de incertidumbre (si hay errores)
 */
export function linearRegression(data) {
    const xs = data.map(p => p.x);
    const ys = data.map(p => p.y);
    const n = xs.length;

    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = ys.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((sum, x, i) => sum + x * ys[i], 0);
    const sumX2 = xs.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const yPred = xs.map(x => slope * x + intercept);
    const r2 = calculateR2(ys, yPred);

    // Calculate Uncertainty using Max/Min Slope Method
    let uncertainty = null;
    const hasErrors = data.some(p => p.xError > 0 || p.yError > 0);

    if (hasErrors && n >= 2) {
        // Sort by X to find endpoints
        const sortedData = [...data].sort((a, b) => a.x - b.x);
        const p1 = sortedData[0];
        const pn = sortedData[n - 1];

        // Centroid
        const xBar = sumX / n;
        const yBar = sumY / n;

        // Worst case slopes (Endpoint Method)
        // Max Slope: Steepest possible line between error boxes of endpoints
        // Min Slope: Flattest possible line between error boxes of endpoints

        // Case 1: Positive slope
        let mMax, mMin, bMax, bMin;

        if (slope >= 0) {
            // Steepest: (x1+dx, y1-dy) to (xn-dx, yn+dy)
            // Denominator min, Numerator max
            const x1_inner = p1.x + p1.xError;
            const y1_inner = p1.y - p1.yError;
            const xn_inner = pn.x - pn.xError;
            const yn_inner = pn.y + pn.yError;

            // Flattest: (x1-dx, y1+dy) to (xn+dx, yn-dy)
            // Denominator max, Numerator min
            const x1_outer = p1.x - p1.xError;
            const y1_outer = p1.y + p1.yError;
            const xn_outer = pn.x + pn.xError;
            const yn_outer = pn.y - pn.yError;

            // Calculate both slopes
            const m1 = (yn_inner - y1_inner) / (xn_inner - x1_inner);
            const m2 = (yn_outer - y1_outer) / (xn_outer - x1_outer);

            // Determine which is max and which is min
            if (m1 > m2) {
                mMax = m1;
                mMin = m2;
                // mMax passes through inner points
                bMax = y1_inner - mMax * x1_inner;
                // mMin passes through outer points
                bMin = y1_outer - mMin * x1_outer;
            } else {
                mMax = m2;
                mMin = m1;
                // mMax passes through outer points
                bMax = y1_outer - mMax * x1_outer;
                // mMin passes through inner points
                bMin = y1_inner - mMin * x1_inner;
            }

        } else {
            // Negative slope logic
            // Steepest (most negative): (x1+dx, y1+dy) to (xn-dx, yn-dy)
            const x1_inner = p1.x + p1.xError;
            const y1_inner = p1.y + p1.yError;
            const xn_inner = pn.x - pn.xError;
            const yn_inner = pn.y - pn.yError;

            // Flattest (least negative): (x1-dx, y1-dy) to (xn+dx, yn+dy)
            const x1_outer = p1.x - p1.xError;
            const y1_outer = p1.y - p1.yError;
            const xn_outer = pn.x + pn.xError;
            const yn_outer = pn.y + pn.yError;

            const m1 = (yn_inner - y1_inner) / (xn_inner - x1_inner);
            const m2 = (yn_outer - y1_outer) / (xn_outer - x1_outer);

            // Determine which is max and which is min
            if (m1 > m2) {
                mMax = m1;
                mMin = m2;
                bMax = y1_inner - mMax * x1_inner;
                bMin = y1_outer - mMin * x1_outer;
            } else {
                mMax = m2;
                mMin = m1;
                bMax = y1_outer - mMax * x1_outer;
                bMin = y1_inner - mMin * x1_inner;
            }
        }

        const slopeError = (mMax - mMin) / 2;
        const interceptError = Math.abs(bMax - bMin) / 2;

        uncertainty = {
            slope: slopeError,
            intercept: interceptError,
            mMax: mMax,
            mMin: mMin,
            bMax: bMax,
            bMin: bMin,
            mBest: slope
        };
    }

    return { a: slope, b: intercept, r2, uncertainty };
}

/**
 * Helper para regresiones no lineales que necesitan regresión lineal con arrays
 * @param {number[]} xs - Valores X
 * @param {number[]} ys - Valores Y
 * @returns {Object} Resultado con slope e intercept
 */
function linearRegressionArrays(xs, ys) {
    const data = xs.map((x, i) => ({ x, y: ys[i], xError: 0, yError: 0 }));
    const result = linearRegression(data);
    return { slope: result.a, intercept: result.b };
}

/**
 * Regresión polinomial de grado n
 * Calcula y = a₀ + a₁x + a₂x² + ... + aₙxⁿ
 * 
 * @param {number[]} xs - Valores X
 * @param {number[]} ys - Valores Y
 * @param {number} degree - Grado del polinomio (2 o 3)
 * @returns {number[]} Coeficientes [aₙ, aₙ₋₁, ..., a₁, a₀]
 */
export function polynomialRegression(xs, ys, degree) {
    const n = xs.length;
    const matrix = [];
    const result = [];

    for (let i = 0; i <= degree; i++) {
        const row = [];
        for (let j = 0; j <= degree; j++) {
            let sum = 0;
            for (let k = 0; k < n; k++) {
                sum += Math.pow(xs[k], i + j);
            }
            row.push(sum);
        }
        matrix.push(row);

        let sum = 0;
        for (let k = 0; k < n; k++) {
            sum += ys[k] * Math.pow(xs[k], i);
        }
        result.push(sum);
    }

    return gaussianElimination(matrix, result).reverse();
}

/**
 * Eliminación gaussiana para resolver sistemas de ecuaciones lineales
 * @param {number[][]} matrix - Matriz de coeficientes
 * @param {number[]} result - Vector de resultados
 * @returns {number[]} Solución del sistema
 */
export function gaussianElimination(matrix, result) {
    const n = matrix.length;

    for (let i = 0; i < n; i++) {
        let maxRow = i;
        for (let k = i + 1; k < n; k++) {
            if (Math.abs(matrix[k][i]) > Math.abs(matrix[maxRow][i])) {
                maxRow = k;
            }
        }

        [matrix[i], matrix[maxRow]] = [matrix[maxRow], matrix[i]];
        [result[i], result[maxRow]] = [result[maxRow], result[i]];

        for (let k = i + 1; k < n; k++) {
            const factor = matrix[k][i] / matrix[i][i];
            result[k] -= factor * result[i];
            for (let j = i; j < n; j++) {
                matrix[k][j] -= factor * matrix[i][j];
            }
        }
    }

    const solution = new Array(n);
    for (let i = n - 1; i >= 0; i--) {
        solution[i] = result[i];
        for (let j = i + 1; j < n; j++) {
            solution[i] -= matrix[i][j] * solution[j];
        }
        solution[i] /= matrix[i][i];
    }

    return solution;
}

/**
 * Regresión exponencial: y = a·e^(bx)
 * Usa transformación logarítmica y regresión lineal
 * 
 * @param {number[]} xs - Valores X
 * @param {number[]} ys - Valores Y (deben ser positivos)
 * @returns {Object} Resultado con coeficientes a, b y r2
 */
export function exponentialRegression(xs, ys) {
    const lnYs = ys.map(y => Math.log(y));
    const result = linearRegressionArrays(xs, lnYs);
    const a = Math.exp(result.intercept);
    const b = result.slope;

    const yPred = xs.map(x => a * Math.exp(b * x));
    const r2 = calculateR2(ys, yPred);

    return { a, b, r2 };
}

/**
 * Regresión logarítmica: y = a·ln(x) + b
 * Usa transformación logarítmica y regresión lineal
 * 
 * @param {number[]} xs - Valores X (deben ser positivos)
 * @param {number[]} ys - Valores Y
 * @returns {Object} Resultado con coeficientes a, b y r2
 */
export function logarithmicRegression(xs, ys) {
    const lnXs = xs.map(x => Math.log(x));
    const result = linearRegressionArrays(lnXs, ys);
    const a = result.slope;
    const b = result.intercept;

    const yPred = xs.map(x => a * Math.log(x) + b);
    const r2 = calculateR2(ys, yPred);

    return { a, b, r2 };
}

/**
 * Regresión potencial: y = a·x^b
 * Usa transformación logarítmica doble y regresión lineal
 * 
 * @param {number[]} xs - Valores X (deben ser positivos)
 * @param {number[]} ys - Valores Y (deben ser positivos)
 * @returns {Object} Resultado con coeficientes a, b y r2
 */
export function powerRegression(xs, ys) {
    const lnXs = xs.map(x => Math.log(x));
    const lnYs = ys.map(y => Math.log(y));
    const result = linearRegressionArrays(lnXs, lnYs);
    const a = Math.exp(result.intercept);
    const b = result.slope;

    const yPred = xs.map(x => a * Math.pow(x, b));
    const r2 = calculateR2(ys, yPred);

    return { a, b, r2 };
}
