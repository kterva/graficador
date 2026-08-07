import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    linearRegression,
    gaussianElimination,
    polynomialRegression,
    exponentialRegression,
    logarithmicRegression,
    powerRegression
} from '../js/regression.js';

function closeTo(actual, expected, tolerance = 1e-6) {
    assert.ok(
        Math.abs(actual - expected) <= tolerance,
        `expected ${actual} to be close to ${expected} (tolerance ${tolerance})`
    );
}

function pointsFrom(xs, f) {
    return xs.map(x => ({ x, y: f(x), xError: 0, yError: 0 }));
}

test('linearRegression: perfect line without errors', () => {
    const data = pointsFrom([0, 1, 2, 3, 4], x => 2 * x - 3);
    const result = linearRegression(data);
    closeTo(result.a, 2);
    closeTo(result.b, -3);
    closeTo(result.r2, 1);
    assert.equal(result.uncertainty, null);
});

test('linearRegression: max/min slope method with symmetric error boxes', () => {
    const data = [
        { x: 0, y: 0, xError: 0.5, yError: 0.5 },
        { x: 10, y: 10, xError: 0.5, yError: 0.5 }
    ];
    const result = linearRegression(data);
    closeTo(result.a, 1);
    assert.ok(result.uncertainty.mMax > result.a);
    assert.ok(result.uncertainty.mMin < result.a);
    closeTo(result.uncertainty.mMax, 11 / 9);
    closeTo(result.uncertainty.mMin, 9 / 11);
    closeTo(result.uncertainty.slope, (11 / 9 - 9 / 11) / 2);
    assert.equal(result.uncertainty.mBest, result.a);
});

test('linearRegression: vertical line (all X equal) returns null instead of NaN', () => {
    const data = pointsFrom([5, 5, 5], () => 1).map((p, i) => ({ ...p, y: i }));
    assert.equal(linearRegression(data), null);
});

test('linearRegression: negative slope still resolves mMax/mMin consistently', () => {
    const data = [
        { x: 0, y: 10, xError: 0.5, yError: 0.5 },
        { x: 10, y: 0, xError: 0.5, yError: 0.5 }
    ];
    const result = linearRegression(data);
    closeTo(result.a, -1);
    assert.ok(result.uncertainty.mMax > result.uncertainty.mMin);
});

test('gaussianElimination: solves a known 2x2 system', () => {
    const solution = gaussianElimination([[2, 1], [1, 3]], [5, 10]);
    closeTo(solution[0], 1);
    closeTo(solution[1], 3);
});

test('polynomialRegression: recovers exact quadratic coefficients (highest degree first)', () => {
    const f = x => 2 * x * x - 3 * x + 4;
    const xs = [0, 1, 2, 3, 4];
    const ys = xs.map(f);
    const coeffs = polynomialRegression(xs, ys, 2);
    closeTo(coeffs[0], 2, 1e-4);
    closeTo(coeffs[1], -3, 1e-4);
    closeTo(coeffs[2], 4, 1e-4);
});

test('polynomialRegression: recovers exact cubic coefficients', () => {
    const f = x => x * x * x - 2 * x * x + x - 5;
    const xs = [0, 1, 2, 3, 4, 5];
    const ys = xs.map(f);
    const coeffs = polynomialRegression(xs, ys, 3);
    closeTo(coeffs[0], 1, 1e-3);
    closeTo(coeffs[1], -2, 1e-3);
    closeTo(coeffs[2], 1, 1e-3);
    closeTo(coeffs[3], -5, 1e-3);
});

test('polynomialRegression: too few distinct X values returns null instead of garbage coefficients', () => {
    assert.equal(polynomialRegression([1, 2], [1, 4], 2), null);
});

test('polynomialRegression: degenerate system (duplicate x) returns null instead of NaN coefficients', () => {
    const result = polynomialRegression([1, 1, 1], [1, 2, 3], 2);
    assert.equal(result, null);
});

test('exponentialRegression: recovers a and b from y = a*e^(b*x)', () => {
    const a = 3, b = 0.5;
    const xs = [0, 1, 2, 3, 4];
    const ys = xs.map(x => a * Math.exp(b * x));
    const result = exponentialRegression(xs, ys);
    closeTo(result.a, a, 1e-4);
    closeTo(result.b, b, 1e-4);
    closeTo(result.r2, 1, 1e-6);
});

test('logarithmicRegression: recovers a and b from y = a*ln(x) + b', () => {
    const a = 2, b = -1;
    const xs = [1, 2, 4, 8, 16];
    const ys = xs.map(x => a * Math.log(x) + b);
    const result = logarithmicRegression(xs, ys);
    closeTo(result.a, a, 1e-4);
    closeTo(result.b, b, 1e-4);
    closeTo(result.r2, 1, 1e-6);
});

test('powerRegression: recovers a and b from y = a*x^b', () => {
    const a = 5, b = 1.5;
    const xs = [1, 2, 3, 4, 5];
    const ys = xs.map(x => a * Math.pow(x, b));
    const result = powerRegression(xs, ys);
    closeTo(result.a, a, 1e-4);
    closeTo(result.b, b, 1e-4);
    closeTo(result.r2, 1, 1e-6);
});

test('exponentialRegression: returns null instead of NaN when Y has non-positive values', () => {
    assert.equal(exponentialRegression([0, 1, 2], [1, 0, -1]), null);
});

test('logarithmicRegression: returns null instead of NaN when X has non-positive values', () => {
    assert.equal(logarithmicRegression([0, 1, 2], [1, 2, 3]), null);
});

test('powerRegression: returns null instead of NaN when X or Y has non-positive values', () => {
    assert.equal(powerRegression([1, 2, 3], [1, -2, 3]), null);
    assert.equal(powerRegression([-1, 2, 3], [1, 2, 3]), null);
});
