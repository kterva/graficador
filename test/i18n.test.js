/**
 * Tests de internacionalización.
 *
 * Lo más importante: cada texto traducible de index.html tiene entrada en el diccionario
 * inglés. Si alguien agrega un texto al HTML y no lo traduce, este test falla y dice cuál.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import EN from '../js/locales/en.js';
import { t, normalize, getLang, LANGS, DEFAULT_LANG, templateParams, variants } from '../js/i18n.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const HTML = readFileSync(join(ROOT, 'index.html'), 'utf8');

const TRANSLATABLE_ATTRS = ['title', 'placeholder', 'aria-label', 'alt'];

function decode(s) {
    return s.replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');
}

/** Textos traducibles del <body>: nodos de texto y atributos, sin <script>/<style> ni translate="no". */
function extractStrings(html) {
    let body = html.slice(html.indexOf('<body'));
    body = body.replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<script[\s\S]*?<\/script>/g, '')
        .replace(/<style[\s\S]*?<\/style>/g, '');
    const VOID = new Set(['input', 'br', 'img', 'meta', 'link', 'hr']);
    const hasLetters = (v) => /[A-Za-zÁ-úñ]{2}/.test(v);
    const out = new Set();
    const stack = []; // true = este nivel (o un ancestro) no se traduce
    const skipping = () => stack.length > 0 && stack[stack.length - 1];
    const tagRe = /<[^>]+>/g;
    let last = 0;
    let m;
    while ((m = tagRe.exec(body))) {
        const text = normalize(decode(body.slice(last, m.index)));
        if (text && hasLetters(text) && !skipping()) out.add(text);
        last = m.index + m[0].length;

        const tag = m[0];
        const name = (tag.match(/^<\/?([a-zA-Z0-9]+)/) || [])[1];
        if (tag.startsWith('</')) { stack.pop(); continue; }
        const own = /\btranslate="no"/.test(tag) || /\bdata-i18n-skip\b/.test(tag);
        const skip = skipping() || own;
        if (!skip) {
            for (const attr of TRANSLATABLE_ATTRS) {
                const am = tag.match(new RegExp(`\\s${attr}="([^"]*)"`));
                const v = am && normalize(decode(am[1]));
                if (v && hasLetters(v)) out.add(v);
            }
        }
        if (!VOID.has(name) && !tag.endsWith('/>')) stack.push(skip);
    }
    return [...out];
}

test('el idioma por defecto es español y es uno de los soportados', () => {
    assert.equal(DEFAULT_LANG, 'es');
    assert.deepEqual(LANGS, ['es', 'en']);
    assert.equal(getLang(), 'es');
});

test('en español t() devuelve el mismo texto y aplica parámetros', () => {
    assert.equal(t('Hola'), 'Hola');
    assert.equal(t('Serie {n} de {total}', { n: 2, total: 5 }), 'Serie 2 de 5');
    assert.equal(t('Falta {x}', {}), 'Falta {x}', 'un parámetro ausente se deja tal cual');
});

test('el diccionario inglés no tiene valores vacíos ni espacios sobrantes', () => {
    for (const [es, en] of Object.entries(EN)) {
        assert.ok(en && en.trim() === en, `valor vacío o con espacios en: ${es}`);
        assert.ok(es === normalize(es), `clave con espacios sin normalizar: "${es}"`);
    }
});

test('cada {parámetro} de la clave aparece también en la traducción', () => {
    const params = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((x) => x[1]).sort().join(',');
    for (const [es, en] of Object.entries(EN)) {
        assert.equal(params(en), params(es), `parámetros distintos en: ${es}`);
    }
});

test('todo texto traducible de index.html tiene entrada en el diccionario inglés', () => {
    const strings = extractStrings(HTML);
    assert.ok(strings.length > 200, `se esperaban >200 textos, hay ${strings.length}`);
    const missing = strings.filter((s) => !Object.prototype.hasOwnProperty.call(EN, s));
    assert.deepEqual(missing, [], `Faltan traducciones en js/locales/en.js:\n  ${missing.join('\n  ')}`);
});

test('título y metadatos del <head> tienen traducción', () => {
    const title = normalize(HTML.match(/<title>([^<]*)<\/title>/)[1]);
    assert.ok(title in EN, `título sin traducir: ${title}`);
    const metas = [...HTML.matchAll(/<meta\s+(?:name|property)="(description|og:description|og:title|og:image:alt|twitter:title|twitter:description)"\s+content="([^"]*)"/g)];
    assert.ok(metas.length >= 5);
    for (const [, name, content] of metas) {
        assert.ok(normalize(content) in EN, `meta ${name} sin traducir: ${content}`);
    }
});

// ---------------------------------------------------------------------------
// Código JS: claves de t() y plantillas HTML armadas por los módulos
// ---------------------------------------------------------------------------

/**
 * Módulos cuyos textos todavía no se tradujeron (etapas 3 y 4 del plan). Cada etapa
 * saca módulos de esta lista; cuando quede vacía, todo el código está cubierto.
 */
const PENDING_MODULES = new Set([
    'calculations.js', 'regression.js', 'uncertainty-propagation.js', 'dimensional-analysis.js',
    'units.js', 'tour-guide.js', 'dev-tools.js'
]);

const JS_DIR = join(ROOT, 'js');
const modules = readdirSync(JS_DIR).filter((f) => f.endsWith('.js') && !PENDING_MODULES.has(f) && f !== 'i18n.js');

/** Quita comentarios de línea y de bloque (sin tocar strings con // dentro, como las URL). */
function stripComments(src) {
    let out = '';
    let i = 0;
    while (i < src.length) {
        const c = src[i];
        if (c === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
        if (c === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i + 2); i = i < 0 ? src.length : i + 2; continue; }
        if (c === "'" || c === '"') {
            let j = i + 1;
            while (j < src.length && src[j] !== c && src[j] !== '\n') { if (src[j] === '\\') j++; j++; }
            if (src[j] !== c) { out += c; i++; continue; } // no era un string (p. ej. comilla dentro de una regex)
            out += src.slice(i, j + 1); i = j + 1; continue;
        }
        if (c === '`') {
            // template: se copia entero (incluye ${...}); alcanza para este análisis
            let j = i + 1, depth = 0;
            while (j < src.length) {
                if (src[j] === '\\') { j += 2; continue; }
                if (src[j] === '$' && src[j + 1] === '{') { depth++; j += 2; continue; }
                if (src[j] === '}' && depth) { depth--; j++; continue; }
                if (src[j] === '`' && !depth) break;
                j++;
            }
            out += src.slice(i, j + 1); i = j + 1; continue;
        }
        out += c; i++;
    }
    return out;
}

test('cada clave de t(\'…\') usada en el código tiene entrada en el diccionario inglés', () => {
    const missing = [];
    let found = 0;
    for (const f of modules) {
        const src = stripComments(readFileSync(join(JS_DIR, f), 'utf8'));
        for (const m of src.matchAll(/(?<![\w$.])t\((['"])((?:(?!\1)[^\\\n]|\\.)*)\1/g)) {
            found++;
            const key = m[2].replace(/\\(['"])/g, '$1');
            if (!Object.prototype.hasOwnProperty.call(EN, key)) missing.push(`${f}: ${key}`);
        }
    }
    assert.ok(found > 60, `se esperaban >60 llamadas a t(), hay ${found}`);
    assert.deepEqual(missing, [], `Faltan traducciones en js/locales/en.js:\n  ${missing.join('\n  ')}`);
});

/** Partes literales de cada template literal (con ${} como separador), incluyendo anidados. */
function templateLiterals(src) {
    const out = [];
    // Un string con comillas no cruza líneas; si no cierra en la misma línea no es un string.
    const skipStr = (i, q) => { let j = i + 1; while (j < src.length && src[j] !== q && src[j] !== '\n') { if (src[j] === '\\') j++; j++; } return src[j] === q ? j + 1 : i + 1; };
    const parse = (i) => {
        const parts = []; let cur = ''; let j = i + 1;
        while (j < src.length) {
            const c = src[j];
            if (c === '\\') { cur += src.slice(j, j + 2); j += 2; continue; }
            if (c === '`') { parts.push(cur); return [j + 1, parts]; }
            if (c === '$' && src[j + 1] === '{') {
                parts.push(cur); cur = ''; j += 2; let depth = 1;
                while (j < src.length && depth) {
                    const d = src[j];
                    if (d === "'" || d === '"') { j = skipStr(j, d); continue; }
                    if (d === '`') { const [e, sub] = parse(j); out.push(sub); j = e; continue; }
                    if (d === '{') depth++; else if (d === '}') depth--;
                    j++;
                }
                continue;
            }
            cur += c; j++;
        }
        return [src.length, parts];
    };
    let i = 0;
    while (i < src.length) {
        const c = src[i];
        if (c === "'" || c === '"') {
            const e = skipStr(i, c);
            if (e > i + 1) {
                const lit = src.slice(i + 1, e - 1);
                if (/<[a-zA-Z]/.test(lit)) out.push([lit]); // HTML en un string con comillas
            }
            i = e; continue;
        }
        if (c === '`') { const [e, parts] = parse(i); out.push(parts); i = e; continue; }
        i++;
    }
    return out;
}

test('los textos fijos de las plantillas HTML de los módulos tienen entrada en el diccionario inglés', () => {
    const M = '\u0001';
    const missing = [];
    let checked = 0;
    for (const f of modules) {
        const src = stripComments(readFileSync(join(JS_DIR, f), 'utf8'));
        for (const parts of templateLiterals(src)) {
            if (!parts.some((p) => p.includes('<'))) continue;
            for (const piece of parts.join(M).split(/<[a-zA-Z/!][^>]*>/)) {
                const text = normalize(decode(piece.replace(/&times;/g, '×')));
                if (!text || !/[A-Za-zÁ-úñ]{2}/.test(text.replace(new RegExp(M, 'g'), ''))) continue;
                if (text.includes(M)) continue; // con valores interpolados: se arma con t() y se prueba arriba
                checked++;
                if (!Object.prototype.hasOwnProperty.call(EN, text)) missing.push(`${f}: ${text.slice(0, 90)}`);
            }
        }
    }
    assert.ok(checked > 100, `se esperaban >100 fragmentos, hay ${checked}`);
    assert.deepEqual(missing, [], `Faltan traducciones en js/locales/en.js:\n  ${missing.join('\n  ')}`);
});

test('templateParams y variants reconocen valores por defecto en ambos idiomas', () => {
    assert.deepEqual(templateParams('Serie 3', 'Serie {n}'), { n: '3' });
    assert.deepEqual(templateParams('Series 12', 'Serie {n}'), { n: '12' });
    assert.equal(templateParams('Mi experimento', 'Serie {n}'), null);
    assert.equal(templateParams('Series', 'Serie {n}'), null);
    assert.deepEqual(variants('Gráfica de Datos'), ['Gráfica de Datos', 'Data Chart']);
    assert.deepEqual(variants('texto que no está'), ['texto que no está']);
});
