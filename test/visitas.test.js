import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    noRastrear, esEntornoLocal, debeContar, textoVisitas, iniciarVisitas, VISITAS_API
} from '../js/visitas.js';

const WEB = { hostname: 'graficador.culturalibre.edu.uy', protocol: 'https:' };
const NAV = {}; const WIN = {};
const elFalso = () => ({ textContent: '', hidden: true });
const respuesta = (obj, ok = true) => ({ ok, json: async () => obj });

test('noRastrear: DNT, Global Privacy Control y variantes', () => {
    assert.equal(noRastrear({ doNotTrack: '1' }, {}), true);
    assert.equal(noRastrear({ doNotTrack: 'yes' }, {}), true);
    assert.equal(noRastrear({}, { doNotTrack: '1' }), true);
    assert.equal(noRastrear({ msDoNotTrack: '1' }, {}), true);
    assert.equal(noRastrear({ globalPrivacyControl: true }, {}), true);
    assert.equal(noRastrear({ doNotTrack: '0' }, {}), false);
    assert.equal(noRastrear({}, {}), false);
});

test('esEntornoLocal: localhost, archivos y direcciones de loopback', () => {
    for (const loc of [{ hostname: 'localhost' }, { hostname: '127.0.0.1' }, { hostname: '' }, { protocol: 'file:', hostname: '' }, { hostname: 'app.localhost' }]) {
        assert.equal(esEntornoLocal(loc), true, JSON.stringify(loc));
    }
    assert.equal(esEntornoLocal(WEB), false);
});

test('debeContar: solo visitas reales, sin DNT, sin automatización y no locales', () => {
    assert.equal(debeContar(NAV, WIN, WEB), true);
    assert.equal(debeContar({ doNotTrack: '1' }, WIN, WEB), false);
    assert.equal(debeContar({ webdriver: true }, WIN, WEB), false);
    assert.equal(debeContar(NAV, WIN, { hostname: 'localhost' }), false);
});

test('textoVisitas: singular, plural y miles con punto', () => {
    assert.equal(textoVisitas(0), '👁 0 visitas');
    assert.equal(textoVisitas(1), '👁 1 visita');
    assert.equal(textoVisitas(999), '👁 999 visitas');
    assert.equal(textoVisitas(1234), '👁 1.234 visitas');
    assert.equal(textoVisitas(1234567), '👁 1.234.567 visitas');
    assert.equal(textoVisitas(-5), '👁 0 visitas');
});

test('iniciarVisitas: una visita real hace POST a hit y muestra el total', async () => {
    const el = elFalso(); const llamadas = [];
    const total = await iniciarVisitas({
        fetchFn: async (url, opt) => { llamadas.push({ url, opt }); return respuesta({ total: 1234, contado: true }); },
        nav: NAV, win: WIN, loc: WEB, el
    });
    assert.equal(total, 1234);
    assert.equal(llamadas.length, 1);
    assert.equal(llamadas[0].url, `${VISITAS_API}hit?sitio=graficador`);
    assert.equal(llamadas[0].opt.method, 'POST');
    assert.equal(llamadas[0].opt.credentials, 'omit');
    assert.equal(llamadas[0].opt.referrerPolicy, 'no-referrer');
    assert.equal(el.textContent, '👁 1.234 visitas');
    assert.equal(el.hidden, false);
});

test('iniciarVisitas: con «No rastrear» NO cuenta (GET a total) pero muestra el número', async () => {
    const el = elFalso(); const llamadas = [];
    await iniciarVisitas({
        fetchFn: async (url, opt) => { llamadas.push({ url, opt }); return respuesta({ total: 7 }); },
        nav: { doNotTrack: '1' }, win: WIN, loc: WEB, el
    });
    assert.equal(llamadas[0].url, `${VISITAS_API}total?sitio=graficador`);
    assert.equal(llamadas[0].opt.method, 'GET');
    assert.equal(el.textContent, '👁 7 visitas');
});

test('iniciarVisitas: en local no cuenta', async () => {
    const llamadas = [];
    await iniciarVisitas({ fetchFn: async (u, o) => { llamadas.push(o.method); return respuesta({ total: 3 }); }, nav: NAV, win: WIN, loc: { hostname: 'localhost' }, el: elFalso() });
    assert.deepEqual(llamadas, ['GET']);
});

test('iniciarVisitas: si el servicio falla, no rompe y no muestra nada', async () => {
    for (const fetchFn of [async () => { throw new Error('sin red'); }, async () => respuesta({}, false), async () => respuesta({ total: 'x' }), async () => respuesta({ total: -4 }), async () => respuesta(null)]) {
        const el = elFalso();
        assert.equal(await iniciarVisitas({ fetchFn, nav: NAV, win: WIN, loc: WEB, el }), null);
        assert.equal(el.hidden, true);
        assert.equal(el.textContent, '');
    }
});

test('iniciarVisitas: sin elemento en el pie no hace ninguna llamada', async () => {
    let n = 0;
    assert.equal(await iniciarVisitas({ fetchFn: async () => { n++; return respuesta({ total: 1 }); }, nav: NAV, win: WIN, loc: WEB, el: null }), null);
    assert.equal(n, 0);
});
