/**
 * Contador de visitas propio (sin servicios de terceros).
 *
 * Al abrir el Graficador se avisa a un pequeño servicio en el servidor de Cultura Libre
 * (plugin «Contador de visitas», en culturalibre.edu.uy) que suma una visita y devuelve el total,
 * que se muestra en el pie. No usa cookies ni identificadores; el servidor no guarda la IP.
 *
 * Reglas de privacidad:
 *   - Si el navegador pidió «No rastrear» (DNT) o Global Privacy Control, NO se cuenta: solo se
 *     pide el total para mostrarlo.
 *   - Tampoco se cuenta cuando la página corre en local (desarrollo) ni con navegadores
 *     automatizados (navigator.webdriver).
 *   - Si el servicio no responde, no pasa nada: el Graficador funciona igual y el pie no muestra el número.
 */

export const VISITAS_API = 'https://culturalibre.edu.uy/wp-json/contador/v1/';
export const VISITAS_SITIO = 'graficador';
const TIEMPO_MAXIMO_MS = 6000;

/** ¿El navegador pidió no ser rastreado? */
export function noRastrear(nav = {}, win = {}) {
    return nav.doNotTrack === '1' || nav.doNotTrack === 'yes' ||
        win.doNotTrack === '1' || nav.msDoNotTrack === '1' ||
        nav.globalPrivacyControl === true;
}

/** Páginas abiertas en local o desde archivos: son pruebas de desarrollo, no visitas reales. */
export function esEntornoLocal(loc = {}) {
    const host = String(loc.hostname || '');
    return loc.protocol === 'file:' || host === '' || host === 'localhost' || host === '127.0.0.1' ||
        host === '[::1]' || host.endsWith('.localhost');
}

/** ¿Corresponde sumar esta visita? */
export function debeContar(nav = {}, win = {}, loc = {}) {
    return !noRastrear(nav, win) && !nav.webdriver && !esEntornoLocal(loc);
}

/** «1 visita» / «1.234 visitas» (miles con punto, como se usa en Uruguay). */
export function textoVisitas(n) {
    const num = Math.max(0, Math.floor(Number(n)));
    const miles = String(num).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `👁 ${miles} ${num === 1 ? 'visita' : 'visitas'}`;
}

function conTiempoMaximo(promesa, ms) {
    return Promise.race([
        promesa,
        new Promise((_, rechazar) => setTimeout(() => rechazar(new Error('tiempo agotado')), ms))
    ]);
}

/**
 * Cuenta la visita (si corresponde) y muestra el total en el elemento del pie.
 * Todas las dependencias se pueden inyectar para probarlo sin navegador.
 */
export async function iniciarVisitas({
    fetchFn = (typeof fetch === 'function' ? fetch : null),
    nav = (typeof navigator !== 'undefined' ? navigator : {}),
    win = (typeof window !== 'undefined' ? window : {}),
    loc = (typeof location !== 'undefined' ? location : {}),
    el = (typeof document !== 'undefined' ? document.getElementById('footer-visitas') : null),
    api = VISITAS_API,
    sitio = VISITAS_SITIO
} = {}) {
    if (!el || !fetchFn) return null;
    const contar = debeContar(nav, win, loc);
    const url = `${api}${contar ? 'hit' : 'total'}?sitio=${encodeURIComponent(sitio)}`;
    try {
        const resp = await conTiempoMaximo(fetchFn(url, {
            method: contar ? 'POST' : 'GET',
            mode: 'cors',
            credentials: 'omit',
            cache: 'no-store',
            referrerPolicy: 'no-referrer',
            keepalive: true
        }), TIEMPO_MAXIMO_MS);
        if (!resp || !resp.ok) return null;
        const datos = await resp.json();
        const total = datos && Number(datos.total);
        if (!Number.isFinite(total) || total < 0) return null;
        el.textContent = textoVisitas(total);
        el.hidden = false;
        return total;
    } catch (e) {
        return null; // sin servicio no hay número; la app sigue funcionando
    }
}
