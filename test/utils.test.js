import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    extractUnit,
    formatWithUncertainty,
    calculateR2,
    parseDecimal,
    normalizeDecimalInput
} from '../js/utils.js';

test('extractUnit: pulls the content between parentheses', () => {
    assert.equal(extractUnit('Tiempo (s)'), 's');
    assert.equal(extractUnit('Velocidad (m/s)'), 'm/s');
    assert.equal(extractUnit('Sin unidad'), '');
});

test('formatWithUncertainty: matches the documented example', () => {
    const result = formatWithUncertainty(3.14159, 0.05);
    assert.deepEqual(result, { value: '3.14', uncertainty: '0.05' });
});

test('formatWithUncertainty: zero uncertainty falls back to 4 decimals', () => {
    assert.deepEqual(formatWithUncertainty(3.14159, 0), { value: '3.1416', uncertainty: '0' });
});

test('formatWithUncertainty: rounds the uncertainty to 1 significant figure', () => {
    // uncertainty 0.7 -> order of magnitude -1 -> 1 decimal place
    const result = formatWithUncertainty(1, 0.7);
    assert.equal(result.uncertainty, '0.7');
});

test('calculateR2: perfect fit is 1', () => {
    assert.equal(calculateR2([1, 2, 3, 4], [1, 2, 3, 4]), 1);
});

test('calculateR2: worse-than-mean predictions can go negative', () => {
    const r2 = calculateR2([1, 2, 3, 4], [10, 10, 10, 10]);
    assert.ok(r2 < 0);
});

test('parseDecimal: accepts comma or dot as decimal separator', () => {
    assert.equal(parseDecimal('3,14'), 3.14);
    assert.equal(parseDecimal('3.14'), 3.14);
    assert.equal(parseDecimal(5), 5);
});

test('parseDecimal: empty/null/undefined is NaN', () => {
    assert.ok(Number.isNaN(parseDecimal('')));
    assert.ok(Number.isNaN(parseDecimal(null)));
    assert.ok(Number.isNaN(parseDecimal(undefined)));
});

test('normalizeDecimalInput: replaces comma with dot without parsing', () => {
    assert.equal(normalizeDecimalInput('3,14'), '3.14');
    assert.equal(normalizeDecimalInput(' 3,14 '), '3.14');
});
