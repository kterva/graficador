/**
 * ============================================
 * GESTIÓN DE COMPARTIR (URL COMPARTIBLE)
 * ============================================
 * 
 * Módulo para generar y cargar URLs compartibles con datos
 * 
 * @module share-manager
 */

import { AppState } from './state.js';
import { renderSeries, updateChart } from './main.js';

/**
 * Genera una URL compartible con el estado actual
 * @returns {string} URL completa con datos codificados
 */
export function generateShareURL() {
    const state = {
        version: '1.3.0',
        series: AppState.series.map(s => ({
            id: s.id,
            name: s.name,
            data: s.data,
            color: s.color,
            fitType: s.fitType
        })),
        config: {
            title: document.getElementById('chartTitle')?.value || '',
            xLabel: document.getElementById('labelX')?.value || 'X',
            yLabel: document.getElementById('labelY')?.value || 'Y',
            xUnit: document.getElementById('unitX')?.value || '',
            yUnit: document.getElementById('unitY')?.value || '',
            xMin: document.getElementById('xMin')?.value || '',
            xMax: document.getElementById('xMax')?.value || '',
            yMin: document.getElementById('yMin')?.value || '',
            yMax: document.getElementById('yMax')?.value || ''
        }
    };

    // Convertir a JSON y comprimir con base64
    const json = JSON.stringify(state);
    const compressed = btoa(encodeURIComponent(json));

    // Generar URL
    const url = `${window.location.origin}${window.location.pathname}?data=${compressed}`;

    return url;
}

/**
 * Carga datos desde URL si existe el parámetro 'data'
 * @returns {boolean} true si se cargaron datos, false si no
 */
export function loadFromURL() {
    const params = new URLSearchParams(window.location.search);
    const compressed = params.get('data');

    if (!compressed) return false;

    try {
        // Descomprimir y parsear
        const json = decodeURIComponent(atob(compressed));
        const state = JSON.parse(json);

        // Validar versión (opcional, por ahora solo advertir)
        if (state.version && state.version !== '1.3.0') {
            console.warn(`URL generada con versión ${state.version}, actual: 1.3.0`);
        }

        // Cargar series
        if (state.series && Array.isArray(state.series)) {
            AppState.series = state.series;

            // Actualizar contador de IDs
            const maxId = state.series.reduce((max, s) => Math.max(max, s.id || 0), -1);
            AppState.serieCounter = maxId + 1;
        }

        // Cargar configuración
        if (state.config) {
            if (state.config.title) document.getElementById('chartTitle').value = state.config.title;
            if (state.config.xLabel) document.getElementById('labelX').value = state.config.xLabel;
            if (state.config.yLabel) document.getElementById('labelY').value = state.config.yLabel;
            if (state.config.xUnit) document.getElementById('unitX').value = state.config.xUnit;
            if (state.config.yUnit) document.getElementById('unitY').value = state.config.yUnit;
            if (state.config.xMin) document.getElementById('xMin').value = state.config.xMin;
            if (state.config.xMax) document.getElementById('xMax').value = state.config.xMax;
            if (state.config.yMin) document.getElementById('yMin').value = state.config.yMin;
            if (state.config.yMax) document.getElementById('yMax').value = state.config.yMax;
        }

        // Renderizar UI y actualizar gráfica
        renderSeries();
        updateChart();

        // Mostrar notificación
        showNotification('✓ Datos cargados desde URL compartida', 'success');

        return true;
    } catch (error) {
        console.error('Error al cargar desde URL:', error);
        showNotification('✗ Error al cargar datos de la URL', 'error');
        return false;
    }
}

/**
 * Copia la URL compartible al clipboard
 */
export async function copyShareURL() {
    try {
        const url = generateShareURL();

        // Copiar al clipboard
        await navigator.clipboard.writeText(url);

        showNotification('✓ URL copiada al portapapeles', 'success');

        // Mostrar modal con la URL
        showShareModal(url);

    } catch (error) {
        console.error('Error al copiar URL:', error);
        showNotification('✗ Error al copiar URL', 'error');
    }
}

/**
 * Muestra modal con la URL compartible
 */
function showShareModal(url) {
    // Crear modal si no existe
    let modal = document.getElementById('shareModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'shareModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        modal.innerHTML = `
            <div style="background: white; border-radius: 12px; padding: 30px; max-width: 600px; width: 90%; box-shadow: 0 8px 32px rgba(0,0,0,0.3);">
                <h2 style="margin-top: 0; color: #667eea;">🔗 Compartir Gráfica</h2>
                
                <p style="color: #666; margin-bottom: 20px;">
                    Comparte esta URL para que otros puedan ver tu gráfica con los datos actuales:
                </p>
                
                <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; word-break: break-all; font-family: monospace; font-size: 14px;">
                    <span id="shareURLText"></span>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button onclick="copyShareURLAgain()" 
                        style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                        📋 Copiar de nuevo
                    </button>
                    <button onclick="closeShareModal()" 
                        style="padding: 10px 20px; background: #95a5a6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                        Cerrar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Cerrar al hacer click fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeShareModal();
            }
        });
    }

    // Actualizar URL en el modal
    document.getElementById('shareURLText').textContent = url;
    modal.style.display = 'flex';
}

/**
 * Cierra el modal de compartir
 */
export function closeShareModal() {
    const modal = document.getElementById('shareModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Copia la URL de nuevo desde el modal
 */
export function copyShareURLAgain() {
    const urlText = document.getElementById('shareURLText').textContent;
    navigator.clipboard.writeText(urlText).then(() => {
        showNotification('✓ URL copiada', 'success');
    });
}

/**
 * Muestra una notificación temporal
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'share-notification';
    notification.textContent = message;

    const colors = {
        success: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        error: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
        info: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    };

    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideInUp 0.3s ease-out;
        font-size: 14px;
        font-weight: 500;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutDown 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Inicializar: cargar desde URL si existe
export function initShareManager() {
    // Intentar cargar desde URL al iniciar
    const loaded = loadFromURL();

    if (loaded) {
        console.log('📊 Datos cargados desde URL compartida');
    }
}
