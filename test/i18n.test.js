/**
 * Tests de internacionalización.
 *
 * Lo más importante: cada texto traducible de index.html tiene entrada en el diccionario
 * inglés. Si alguien agrega un texto al HTML y no lo traduce, este test falla y dice cuál.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import EN from '../js/locales/en.js';
import { t, normalize, getLang, LANGS, DEFAULT_LANG } from '../js/i18n.js';

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
