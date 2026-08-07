import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    calculateDerivative,
    calculateIntegral,
    getRegressionCoeffs,
    calculateFit
} from '../js/calculations.js';

function closeTo(actual, expected, tolerance = 1e-6) {
    assert.ok(
        Math.abs(actual - expected) <= tolerance,
        `expected ${actual} to be close to ${expected} (tolerance ${tolerance})`
    );
}

test('calculateDerivative: linear returns the slope', () => {
    assert.equal(calculateDerivative(5, { a: 3, b: -2 }, 'linear'), 3);
});

test('calculateDerivative: poly2 returns 2ax + b', () => {
    // y = 2x² - 3x + 1 -> y' = 4x - 3
    closeTo(calculateDerivative(2, [2, -3, 1], 'poly2'), 5);
});

test('calculateDerivative: poly3 returns 3ax² + 2bx + c', () => {
    // y = x³ + 2x² - x + 4 -> y' = 3x² + 4x - 1
    closeTo(calculateDerivative(2, [1, 2, -1, 4], 'poly3'), 19);
});

test('calculateDerivative: logarithmic returns a/x, is undefined (NaN) for x <= 0', () => {
    closeTo(calculateDerivative(2, { a: 4 }, 'logarithmic'), 2);
    assert.ok(Number.isNaN(calculateDerivative(0, { a: 4 }, 'logarithmic')));
    assert.ok(Number.isNaN(calculateDerivative(-1, { a: 4 }, 'logarithmic')));
});

test('calculateDerivative: power returns a*b*x^(b-1), is undefined (NaN) for x <= 0', () => {
    // y = 2x^3 -> y' = 6x^2
    closeTo(calculateDerivative(3, { a: 2, b: 3 }, 'power'), 54);
    assert.ok(Number.isNaN(calculateDerivative(0, { a: 2, b: 3 }, 'power')));
});

test('calculateIntegral: linear matches analytic antiderivative', () => {
    // y = 2x + 1 -> ∫ from 0 to 3 = x² + x = 9 + 3 = 12
    closeTo(calculateIntegral(0, 3, { a: 2, b: 1 }, 'linear'), 12);
});

test('calculateIntegral: poly2 matches analytic antiderivative', () => {
    // y = x² -> ∫ from 0 to 3 = 9
    closeTo(calculateIntegral(0, 3, [1, 0, 0], 'poly2'), 9);
});

test('calculateIntegral: power handles the b = -1 special case (a·ln x)', () => {
    // y = 2/x -> ∫ from 1 to e = 2*(ln(e) - ln(1)) = 2
    closeTo(calculateIntegral(1, Math.E, { a: 2, b: -1 }, 'power'), 2, 1e-9);
});

test('getRegressionCoeffs: dispatches to the right regression by type', () => {
    const data = [{ x: 0, y: 1 }, { x: 1, y: 3 }, { x: 2, y: 5 }];
    const linear = getRegressionCoeffs(data, 'linear');
    closeTo(linear.a, 2);
    closeTo(linear.b, 1);

    assert.equal(getRegressionCoeffs(data, 'unknown-type'), null);
});

test('calculateFit: poly2 equation has no dangling "+ -" for negative coefficients', () => {
    // y = 2x² - 3x + 5
    const data = [0, 1, 2, 3, 4].map(x => ({ x, y: 2 * x * x - 3 * x + 5, xError: 0, yError: 0 }));
    const fit = calculateFit(data, 'poly2', 'X', 'Y');
    assert.doesNotMatch(fit.equation, /\+\s*-/);
    assert.match(fit.equation, /- 3,0000x/);
    closeTo(fit.r2, 1, 1e-6);
});

test('calculateFit: poly3 equation has no dangling "+ -" for negative coefficients', () => {
    // y = x³ - 2x² + x - 5
    const data = [0, 1, 2, 3, 4, 5].map(x => ({
        x, y: x ** 3 - 2 * x * x + x - 5, xError: 0, yError: 0
    }));
    const fit = calculateFit(data, 'poly3', 'X', 'Y');
    assert.doesNotMatch(fit.equation, /\+\s*-/);
});

test('calculateFit: linear equation without uncertainty has no dangling "+ -"', () => {
    // y = x - 7 (negative intercept, no error bars)
    const data = [0, 1, 2, 3].map(x => ({ x, y: x - 7, xError: 0, yError: 0 }));
    const fit = calculateFit(data, 'linear', 'X', 'Y');
    assert.doesNotMatch(fit.equation, /\+\s*-/);
    assert.match(fit.equation, /y = 1,0000x - 7,0000/);
});

test('calculateFit: linear equation with uncertainty keeps the sign fix inside the HTML', () => {
    const data = [
        { x: 0, y: -1, xError: 0.2, yError: 0.5 },
        { x: 10, y: 9, xError: 0.2, yError: 0.5 }
    ];
    const fit = calculateFit(data, 'linear', 'X', 'Y');
    assert.doesNotMatch(fit.equation, /\+\s*-/);
    assert.match(fit.equation, /y = 1,0x - 1,0/);
    assert.ok(fit.uncertainty);
});

test('calculateFit: sample points span the requested xRange', () => {
    const data = [0, 1, 2].map(x => ({ x, y: x, xError: 0, yError: 0 }));
    const fit = calculateFit(data, 'linear', 'X', 'Y', { min: -5, max: 5 });
    const xs = fit.points.map(p => p.x);
    closeTo(Math.min(...xs), -5);
    closeTo(Math.max(...xs), 5);
});

test('calculateFit: a failed fit reports r2 as null, not 0 (avoids a misleading "R² = 0.0000")', () => {
    // Solo 2 puntos con X distintos para un ajuste cuadrático (necesita >= 3): falla.
    const data = [{ x: 1, y: 1, xError: 0, yError: 0 }, { x: 2, y: 4, xError: 0, yError: 0 }];
    const fit = calculateFit(data, 'poly2', 'X', 'Y');
    assert.equal(fit.r2, null);
    assert.match(fit.equation, /⚠️/);
    assert.equal(fit.points.length, 0);
});
