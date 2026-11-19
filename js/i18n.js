/**
 * ============================================
 * INTERNACIONALIZACIÓN (ES / EN)
 * ============================================
 *
 * El español es el idioma de origen: el HTML y el código están escritos en español y
 * el texto en español es la clave del diccionario (estilo gettext). Para pasar a inglés:
 *
 *   - Textos estáticos (HTML) y contenido que la app pinta con innerHTML: se recorre el
 *     DOM y cada nodo de texto / atributo (title, placeholder, aria-label, alt) cuyo texto
 *     figure en `locales/en.js` se reemplaza. El original se guarda para poder volver.
 *   - Textos armados por código (mensajes, etiquetas, PDF…): `t('Texto en español', {n})`.
 *
 * Un texto sin traducción se muestra en español (nunca vacío ni con una clave rara).
 * Para excluir un elemento (contenido del usuario, siglas) usar `translate="no"`.
 *
 * Preferencia: `?lang=en` en la URL (no se guarda) o el botón ES/EN (se guarda en
 * localStorage). Sin ninguna de las dos: español.
 *
 * @module i18n
 */

import EN from './locales/en.js';

export const LANGS = ['es', 'en'];
export const DEFAULT_LANG = 'es';
const STORAGE_KEY = 'graficador-lang';
const DICTIONARIES = { en: EN };
const TRANSLATABLE_ATTRS = ['title', 'placeholder', 'aria-label', 'alt'];
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'NOSCRIPT']);
const EVENT_NAME = 'graficador:languagechange';

let current = DEFAULT_LANG;

/** Originales en español de lo que ya se tradujo (para volver a español). */
const textOriginals = new WeakMap(); // Text node -> string
const attrOriginals = new WeakMap(); // Element -> { attr: string }
const headOriginals = new Map();     // clave -> contenido original (título y metas)
let observer = null;

/** Colapsa espacios y recorta: así el HTML con saltos de línea coincide con la clave. */
export function normalize(text) {
    return String(text).replace(/\s+/g, ' ').trim();
}

/** Idioma activo ('es' | 'en'). */
export function getLang() {
    return current;
}

/**
 * Traduce un texto en español al idioma activo y reemplaza `{nombre}` con `params`.
 * En español devuelve el mismo texto (con los parámetros aplicados).
 */
export function t(key, params) {
    const dict = DICTIONARIES[current];
    let out = (dict && Object.prototype.hasOwnProperty.call(dict, key)) ? dict[key] : key;
    if (params) {
        out = out.replace(/\{(\w+)\}/g, (m, name) => (name in params ? String(params[name]) : m));
    }
    return out;
}

/** Traducción de un texto con espacios arbitrarios; conserva los de los bordes. */
function translateSpaced(raw) {
    const dict = DICTIONARIES[current];
    if (!dict) return null;
    const key = normalize(raw);
    if (!key || !Object.prototype.hasOwnProperty.call(dict, key)) return null;
    const lead = raw.match(/^\s*/)[0];
    const trail = raw.match(/\s*$/)[0];
    return lead + dict[key] + trail;
}

function skipped(el) {
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
        if (SKIP_TAGS.has(n.tagName)) return true;
        if (n.getAttribute('translate') === 'no' || n.hasAttribute('data-i18n-skip')) return true;
    }
    return false;
}

function translateTextNode(node) {
    if (skipped(node.parentElement)) return;
    const orig = textOriginals.has(node) ? textOriginals.get(node) : node.nodeValue;
    if (current === DEFAULT_LANG) {
        if (textOriginals.has(node)) {
            node.nodeValue = textOriginals.get(node);
            textOriginals.delete(node);
        }
        return;
    }
    const tr = translateSpaced(orig);
    if (tr !== null) {
        if (!textOriginals.has(node)) textOriginals.set(node, orig);
        if (node.nodeValue !== tr) node.nodeValue = tr;
    }
}

function translateAttrs(el) {
    if (skipped(el)) return;
    for (const attr of TRANSLATABLE_ATTRS) {
        if (!el.hasAttribute(attr)) continue;
        const saved = attrOriginals.get(el);
        const orig = saved && attr in saved ? saved[attr] : el.getAttribute(attr);
        if (current === DEFAULT_LANG) {
            if (saved && attr in saved) {
                el.setAttribute(attr, saved[attr]);
                delete saved[attr];
            }
            continue;
        }
        const tr = translateSpaced(orig);
        if (tr !== null) {
            const store = saved || {};
            if (!(attr in store)) store[attr] = orig;
            attrOriginals.set(el, store);
            if (el.getAttribute(attr) !== tr) el.setAttribute(attr, tr);
        }
    }
}

/**
 * Traduce (o restaura) `root` y todo lo que contiene según el idioma activo.
 * Es idempotente: se puede llamar cuantas veces haga falta.
 */
export function applyTranslations(root = document.body) {
    if (typeof document === 'undefined' || !root) return;
    if (root.nodeType === 3) { translateTextNode(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    if (root.nodeType === 1) translateAttrs(root);
    const walker = document.createTreeWalker(root, 1 | 4 /* elementos y texto */);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (n.nodeType === 3) translateTextNode(n);
        else translateAttrs(n);
    }
}

const HEAD_META = [
    'meta[name="description"]', 'meta[property="og:title"]', 'meta[property="og:description"]',
    'meta[property="og:image:alt"]', 'meta[name="twitter:title"]', 'meta[name="twitter:description"]'
];

/** Título, descripción y metadatos sociales; `html lang` y `og:locale`. */
function applyHead() {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = current;
    const setOrRestore = (key, getter, setter) => {
        if (!headOriginals.has(key)) headOriginals.set(key, getter());
        const orig = headOriginals.get(key);
        const tr = current === DEFAULT_LANG ? null : translateSpaced(orig);
        setter(tr === null ? orig : tr);
    };
    setOrRestore('title', () => document.title, (v) => { document.title = v; });
    for (const sel of HEAD_META) {
        const el = document.head.querySelector(sel);
        if (el) setOrRestore(sel, () => el.getAttribute('content'), (v) => el.setAttribute('content', v));
    }
    const loc = document.head.querySelector('meta[property="og:locale"]');
    if (loc) loc.setAttribute('content', current === 'en' ? 'en_US' : 'es_UY');
}

/** Texto y atributos del botón ES/EN: están en el idioma al que se cambiará. */
function updateToggleButton() {
    if (typeof document === 'undefined') return;
    const btn = document.getElementById('langToggle');
    if (!btn) return;
    const toEn = current === 'es';
    btn.textContent = toEn ? '🌐 EN' : '🌐 ES';
    const label = toEn ? 'Switch to English' : 'Cambiar a español';
    btn.setAttribute('title', label);
    btn.setAttribute('aria-label', label);
    btn.setAttribute('lang', toEn ? 'en' : 'es');
}

function syncObserver() {
    if (typeof MutationObserver === 'undefined' || typeof document === 'undefined') return;
    if (current === DEFAULT_LANG) {
        if (observer) { observer.disconnect(); observer = null; }
        return;
    }
    if (observer) return;
    // Sólo childList: nuestros propios cambios (nodeValue / atributos) no lo disparan.
    observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
            for (const node of m.addedNodes) applyTranslations(node);
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

function readStored() {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

function writeStored(lang) {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* modo privado, etc. */ }
}

function fromUrl() {
    try {
        const v = new URLSearchParams(window.location.search).get('lang');
        return LANGS.includes(v) ? v : null;
    } catch { return null; }
}

/**
 * Cambia el idioma, actualiza la página y avisa con el evento
 * `graficador:languagechange` para que los módulos repinten lo que armaron con t().
 */
export function setLang(lang, { persist = true } = {}) {
    if (!LANGS.includes(lang)) return;
    current = lang;
    if (persist) writeStored(lang);
    if (typeof document === 'undefined') return;
    applyHead();
    applyTranslations(document.body);
    updateToggleButton();
    syncObserver();
    document.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { lang } }));
}

/** Alterna entre español e inglés (botón de la cabecera). */
export function toggleLanguage() {
    setLang(current === 'es' ? 'en' : 'es');
}

/** Arranque: `?lang=` (sin guardar), preferencia guardada, o español. */
export function initI18n() {
    const url = fromUrl();
    const lang = url || (LANGS.includes(readStored()) ? readStored() : DEFAULT_LANG);
    setLang(lang, { persist: false });
}

/** Para suscribirse al cambio de idioma. Devuelve la función que cancela. */
export function onLanguageChange(fn) {
    const handler = (e) => fn(e.detail.lang);
    document.addEventListener(EVENT_NAME, handler);
    return () => document.removeEventListener(EVENT_NAME, handler);
}
