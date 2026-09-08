import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    extractUnit,
    formatWithUncertainty,
    calculateR2,
    parseDecimal,
    normalizeDecimalInput,
    formatNumber,
    numericPoints,
    parseTabular
} from '../js/utils.js';

test('extractUnit: pulls the content between parentheses', () => {
    assert.equal(extractUnit('Tiempo (s)'), 's');
    assert.equal(extractUnit('Velocidad (m/s)'), 'm/s');
    assert.equal(extractUnit('Sin unidad'), '');
});

test('extractUnit: escapes HTML in the extracted unit (labels can come from untrusted imports/share URLs)', () => {
    assert.equal(
        extractUnit('X (<img src=x onerror="window.pwned=true">)'),
        '&lt;img src=x onerror=&quot;window.pwned=true&quot;&gt;'
    );
});

test('formatWithUncertainty: matches the documented example (comma as decimal separator, es-UY locale)', () => {
    const result = formatWithUncertainty(3.14159, 0.05);
    assert.deepEqual(result, { value: '3,14', uncertainty: '0,05' });
});

test('formatWithUncertainty: zero uncertainty falls back to 4 decimals', () => {
    assert.deepEqual(formatWithUncertainty(3.14159, 0), { value: '3,1416', uncertainty: '0' });
});

test('formatWithUncertainty: rounds the uncertainty to 1 significant figure', () => {
    // uncertainty 0.7 -> order of magnitude -1 -> 1 decimal place
    const result = formatWithUncertainty(1, 0.7);
    assert.equal(result.uncertainty, '0,7');
});

test('formatWithUncertainty: recomputes decimals when rounding crosses a power of 10', () => {
    // 0.099 rounds to 0.1 (order of magnitude jumps from -2 to -1) -> should show 1 decimal, not 2
    const result = formatWithUncertainty(5.4321, 0.099);
    assert.equal(result.uncertainty, '0,1');
    assert.equal(result.value, '5,4');
});

test('calculateR2: perfect fit is 1', () => {
    assert.equal(calculateR2([1, 2, 3, 4], [1, 2, 3, 4]), 1);
});

test('calculateR2: worse-than-mean predictions can go negative', () => {
    const r2 = calculateR2([1, 2, 3, 4], [10, 10, 10, 10]);
    assert.ok(r2 < 0);
});

test('calculateR2: constant observed values with a perfect fit is 1, not NaN', () => {
    assert.equal(calculateR2([5, 5, 5], [5, 5, 5]), 1);
});

test('calculateR2: constant observed values with an imperfect fit is 0, not -Infinity', () => {
    assert.equal(calculateR2([5, 5, 5], [4, 5, 6]), 0);
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

test('formatNumber: renders with comma as decimal separator', () => {
    assert.equal(formatNumber(3.14159, 2), '3,14');
    assert.equal(formatNumber(0.5), '0,5');
    assert.equal(formatNumber(5, 2), '5,00');
});

test('formatNumber: integers and negatives round-trip correctly', () => {
    assert.equal(formatNumber(-2.5, 1), '-2,5');
    assert.equal(formatNumber(10), '10');
});

test('numericPoints: drops empty and non-numeric cells, parses the rest (R1)', () => {
    const serie = { data: [
        { x: '1', y: '2' },
        { x: 'abc', y: 'xyz' },   // basura → descartada
        { x: '3', y: '' },        // y vacío → descartada
        { x: 3, y: 4 },
        { x: '5,5', y: '6,6' }    // coma decimal
    ] };
    assert.deepEqual(numericPoints(serie), [
        { x: 1, y: 2 }, { x: 3, y: 4 }, { x: 5.5, y: 6.6 }
    ]);
});

test('numericPoints: Infinity / NaN strings are excluded', () => {
    const serie = { data: [{ x: 'Infinity', y: '1' }, { x: '1', y: 'NaN' }, { x: '2', y: '2' }] };
    assert.deepEqual(numericPoints(serie), [{ x: 2, y: 2 }]);
});

test('parseTabular: tab-separated with header row (Excel/Sheets)', () => {
    assert.deepEqual(parseTabular('X\tY\n1\t2\n3\t4'), [{ x: 1, y: 2 }, { x: 3, y: 4 }]);
});

test('parseTabular: semicolon + comma decimal (es-UY CSV)', () => {
    assert.deepEqual(parseTabular('1,5;2,5\n3,5;4,5'), [{ x: 1.5, y: 2.5 }, { x: 3.5, y: 4.5 }]);
});

test('parseTabular: scientific notation on the first row is NOT mistaken for a header (R2)', () => {
    assert.deepEqual(parseTabular('1e3,2e3\n2e3,4e3'), [{ x: 1000, y: 2000 }, { x: 2000, y: 4000 }]);
});

test('parseTabular: non-numeric cells become empty strings, fully empty rows dropped', () => {
    assert.deepEqual(parseTabular('1,foo\n,,\n2,3'), [{ x: 1, y: '' }, { x: 2, y: 3 }]);
});
