import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    propagateSumSubtract,
    propagateProductQuotient,
    propagateUncertainty,
    validateInputPrecision,
    validateUncertaintyPrecision,
    validateAllInputs
} from '../js/uncertainty-propagation.js';

function closeTo(actual, expected, tolerance = 1e-9) {
    assert.ok(
        Math.abs(actual - expected) <= tolerance,
        `expected ${actual} to be close to ${expected} (tolerance ${tolerance})`
    );
}

test('propagateSumSubtract: sum adds values and uncertainties', () => {
    const result = propagateSumSubtract(10, 0.5, 5, 0.3, 'sum');
    closeTo(result.value, 15);
    closeTo(result.uncertainty, 0.8);
});

test('propagateSumSubtract: subtract keeps uncertainties additive', () => {
    const result = propagateSumSubtract(10, 0.5, 5, 0.3, 'subtract');
    closeTo(result.value, 5);
    closeTo(result.uncertainty, 0.8);
});

test('propagateProductQuotient: product of A=10.5±0.3, B=2.0±0.1', () => {
    const result = propagateProductQuotient(10.5, 0.3, 2.0, 0.1, 'product');
    closeTo(result.value, 21);
    // δP/P = 0.3/10.5 + 0.1/2.0 = 0.078571...; δP = 21 * 0.078571... ≈ 1.65 -> rounds to 1 sig fig (2)
    closeTo(result.uncertainty, 21 * (0.3 / 10.5 + 0.1 / 2.0), 1e-6);
    assert.equal(result.formattedValue, '21');
    assert.equal(result.formattedUncertainty, '2');
});

test('propagateProductQuotient: quotient divides values, sums relative uncertainty', () => {
    const result = propagateProductQuotient(10, 0.5, 5, 0.3, 'quotient');
    closeTo(result.value, 2);
    closeTo(result.uncertainty, 2 * (0.5 / 10 + 0.3 / 5), 1e-9);
});

test('propagateUncertainty: dispatches sum/subtract/product/quotient', () => {
    closeTo(propagateUncertainty(1, 0.1, 2, 0.2, 'sum').value, 3);
    closeTo(propagateUncertainty(1, 0.1, 2, 0.2, 'subtract').value, -1);
    closeTo(propagateUncertainty(2, 0.1, 3, 0.2, 'product').value, 6);
    closeTo(propagateUncertainty(6, 0.1, 3, 0.2, 'quotient').value, 2);
});

test('propagateUncertainty: throws on unsupported operation', () => {
    assert.throws(() => propagateUncertainty(1, 0.1, 2, 0.2, 'power'));
});

test('validateInputPrecision: flags a value with more decimals than its uncertainty', () => {
    const warning = validateInputPrecision(3.14159, 0.1, 'A');
    assert.ok(warning.hasWarning);
    assert.equal(warning.correctedValue, 3.1);
});

test('validateInputPrecision: no warning when precision already matches', () => {
    assert.equal(validateInputPrecision(3.1, 0.1, 'A'), null);
    assert.equal(validateInputPrecision(3.14159, 0, 'A'), null);
});

test('validateUncertaintyPrecision: flags uncertainty with more than 1 significant figure', () => {
    const warning = validateUncertaintyPrecision(0.123, 'A');
    assert.ok(warning.hasWarning);
    closeTo(warning.correctedUncertainty, 0.1);
});

test('validateUncertaintyPrecision: no warning for 1 significant figure or zero', () => {
    assert.equal(validateUncertaintyPrecision(0.1, 'A'), null);
    assert.equal(validateUncertaintyPrecision(0, 'A'), null);
});

test('validateAllInputs: collects warnings for both operands', () => {
    const warnings = validateAllInputs(3.14159, 0.123, 2.71828, 0.05);
    // A tiene incertidumbre mal expresada (2 cifras) y valor con más decimales que la incertidumbre;
    // B ya está correctamente expresado.
    assert.ok(warnings.length >= 2);
    assert.ok(warnings.some(w => w.message.includes('δA')));
});

test('validateAllInputs: no warnings for well-formed inputs', () => {
    assert.deepEqual(validateAllInputs(3.1, 0.1, 2.7, 0.1), []);
});
