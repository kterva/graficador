import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    resolveUnit,
    convert,
    convertTemperature,
    detectCategory,
    getUnitsForCategory,
    formatWithUnit,
    getCategoryName,
    getUnitLabel,
    isValidUnit
} from '../js/units.js';

function closeTo(actual, expected, tolerance = 1e-9) {
    assert.ok(
        Math.abs(actual - expected) <= tolerance,
        `expected ${actual} to be close to ${expected} (tolerance ${tolerance})`
    );
}

test('resolveUnit: exact match', () => {
    assert.deepEqual(resolveUnit('m', 'length'), { factor: 1, label: 'metros (m)' });
});

test('resolveUnit: unknown category returns null', () => {
    assert.equal(resolveUnit('m', 'not-a-category'), null);
});

test('resolveUnit: applies prefixes to a valid base unit (km)', () => {
    const result = resolveUnit('km', 'length');
    closeTo(result.factor, 1000);
});

test('resolveUnit: rejects prefixes on temperature', () => {
    assert.equal(resolveUnit('mK', 'temperature'), null);
});

test('resolveUnit: rejects an invalid base with a valid prefix (kX)', () => {
    assert.equal(resolveUnit('kX', 'length'), null);
});

test('convert: same unit is a no-op', () => {
    assert.equal(convert(5, 'm', 'm', 'length'), 5);
});

test('convert: length km -> m', () => {
    closeTo(convert(2, 'km', 'm', 'length'), 2000);
});

test('convert: mass g -> kg', () => {
    closeTo(convert(1500, 'g', 'kg', 'mass'), 1.5);
});

test('convert: time min -> s', () => {
    closeTo(convert(2, 'min', 's', 'time'), 120);
});

test('convert: throws on unknown category', () => {
    assert.throws(() => convert(1, 'm', 'km', 'nope'));
});

test('convert: throws on unknown unit', () => {
    assert.throws(() => convert(1, 'parsecs', 'm', 'length'));
});

test('convertTemperature: Celsius <-> Kelvin round-trips', () => {
    closeTo(convertTemperature(0, '°C', 'K'), 273.15);
    closeTo(convertTemperature(273.15, 'K', '°C'), 0);
    assert.equal(convertTemperature(100, '°C', '°C'), 100);
});

test('convertTemperature: throws on unknown scale', () => {
    assert.throws(() => convertTemperature(0, '°F', 'K'));
});

test('detectCategory: finds predefined and prefixed units', () => {
    assert.equal(detectCategory('kg'), 'mass');
    assert.equal(detectCategory('km'), 'length');
    assert.equal(detectCategory('unobtainium'), null);
});

test('getUnitsForCategory: returns empty object for custom, throws for unknown', () => {
    assert.deepEqual(getUnitsForCategory('custom'), {});
    assert.throws(() => getUnitsForCategory('nope'));
});

test('formatWithUnit: appends unit or falls back to bare number', () => {
    assert.equal(formatWithUnit(3.14159, 'm', 2), '3.14 m');
    assert.equal(formatWithUnit(3.14159, '', 2), '3.14');
});

test('getCategoryName / getUnitLabel: custom category passes through unit as-is', () => {
    assert.equal(getCategoryName('custom'), 'Personalizada');
    assert.equal(getUnitLabel('widgets', 'custom'), 'widgets');
});

test('isValidUnit: true for known/prefixed units, false otherwise', () => {
    assert.equal(isValidUnit('kg', 'mass'), true);
    assert.equal(isValidUnit('mg', 'mass'), true);
    assert.equal(isValidUnit('parsecs', 'length'), false);
    assert.equal(isValidUnit('anything', 'custom'), true);
});
