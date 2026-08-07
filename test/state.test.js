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

test('sanitizeImportedSeries: coerces non-numeric xError/yError to 0 instead of passing through', () => {
    const result = sanitizeImportedSeries([
        { id: 1, data: [{ x: 1, y: 1, xError: 'boom', yError: null }] }
    ]);
    assert.equal(result[0].data[0].xError, 0);
    assert.equal(result[0].data[0].yError, 0);
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
