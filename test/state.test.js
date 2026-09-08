import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeImportedSeries } from '../js/state.js';

test('sanitizeImportedSeries: non-array input returns empty array', () => {
    assert.deepEqual(sanitizeImportedSeries(null), []);
    assert.deepEqual(sanitizeImportedSeries(undefined), []);
    assert.deepEqual(sanitizeImportedSeries('not an array'), []);
});

test('sanitizeImportedSeries: drops non-object entries instead of crashing', () => {
    const result = sanitizeImportedSeries([null, 42, 'foo', { id: 1, name: 'A', data: [{ x: 1, y: 2 }] }]);
    assert.equal(result.length, 1);
    assert.equal(result[0].name, 'A');
});

test('sanitizeImportedSeries: missing/malformed `data` becomes a safe empty row instead of crashing renderTable', () => {
    const result = sanitizeImportedSeries([
        { id: 1, name: 'Sin data' },
        { id: 2, name: 'Data no es array', data: 'oops' },
        { id: 3, name: 'Data con basura', data: [null, 42, { x: 1, y: 2 }, 'nope'] }
    ]);

    assert.deepEqual(result[0].data, [{ x: '', y: '' }]);
    assert.deepEqual(result[1].data, [{ x: '', y: '' }]);
    assert.equal(result[2].data.length, 1);
    assert.equal(result[2].data[0].x, 1);
    assert.equal(result[2].data[0].y, 2);
});

test('sanitizeImportedSeries: defaults missing name/color/fitType to safe values', () => {
    const result = sanitizeImportedSeries([{ id: 5, data: [{ x: 1, y: 1 }] }]);
    assert.equal(result[0].name, 'Serie 5');
    assert.equal(typeof result[0].color, 'string');
    assert.ok(result[0].color.length > 0);
    assert.equal(result[0].fitType, 'none');
});

test('sanitizeImportedSeries: per-point xError/yError are dropped — uncertainty is column-level (A3)', () => {
    const result = sanitizeImportedSeries([
        { id: 1, xError: 5, yError: 5, data: [{ x: 1, y: 1, xError: 'boom', yError: 0.3 }] }
    ]);
    assert.deepEqual(result[0].data[0], { x: 1, y: 1 });
    assert.ok(!('xError' in result[0].data[0]));
    assert.ok(!('yError' in result[0]));
});

test('sanitizeImportedSeries: still deduplicates/coerces ids as before', () => {
    const result = sanitizeImportedSeries([
        { id: 1, data: [{ x: 1, y: 1 }] },
        { id: 1, data: [{ x: 2, y: 2 }] },
        { id: 'not-a-number', data: [{ x: 3, y: 3 }] }
    ]);
    const ids = result.map(s => s.id);
    assert.equal(new Set(ids).size, 3);
    ids.forEach(id => assert.ok(Number.isInteger(id) && id >= 0));
});

test('sanitizeImportedSeries: hostile ids (negative, float, NaN, Infinity) are replaced with safe integers', () => {
    const result = sanitizeImportedSeries([
        { id: -5, data: [{ x: 1, y: 1 }] },
        { id: 3.7, data: [{ x: 2, y: 2 }] },
        { id: Number.NaN, data: [{ x: 3, y: 3 }] },
        { id: Infinity, data: [{ x: 4, y: 4 }] }
    ]);
    assert.equal(result.length, 4);
    result.forEach(s => assert.ok(Number.isInteger(s.id) && s.id >= 0));
    assert.equal(new Set(result.map(s => s.id)).size, 4);
});

test('sanitizeImportedSeries: script-like name/color strings pass through as data (escaping is a render concern)', () => {
    const xss = '<img src=x onerror=alert(1)>';
    const result = sanitizeImportedSeries([{ id: 1, name: xss, color: 'javascript:void(0)', data: [{ x: 1, y: 1 }] }]);
    // El sanitizer no reescribe el texto; garantiza que sea string y no rompa el render.
    assert.equal(typeof result[0].name, 'string');
    assert.equal(result[0].name, xss);
    assert.equal(typeof result[0].color, 'string');
});

test('sanitizeImportedSeries: hostile point coords are neutralised to empty strings', () => {
    const result = sanitizeImportedSeries([
        { id: 1, data: [
            { x: 1, y: 2 },
            { x: {}, y: [] },
            { x: '3', y: '4' }
        ] }
    ]);
    // fila 0: x/y numéricos se conservan
    assert.deepEqual(result[0].data[0], { x: 1, y: 2 });
    // fila 1: x/y no string ni number → ''
    assert.deepEqual(result[0].data[1], { x: '', y: '' });
    // fila 2: strings se conservan tal cual
    assert.deepEqual(result[0].data[2], { x: '3', y: '4' });
});

test('sanitizeImportedSeries: a "__proto__" key in a raw series does not pollute Object.prototype', () => {
    sanitizeImportedSeries([JSON.parse('{"id":1,"__proto__":{"polluted":true},"data":[{"x":1,"y":1}]}')]);
    assert.equal({}.polluted, undefined);
});
