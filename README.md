# 📊 Graficador Científico

Aplicación web interactiva para análisis de datos experimentales con ajustes de regresión, propagación de incertidumbre y etiquetado de unidades. Ideal para estudiantes, científicos e ingenieros.

![Version](https://img.shields.io/badge/version-1.6.1-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Características

### 📈 Análisis de Datos
- **Múltiples series de datos** con colores personalizables
- **6 tipos de ajuste:**
  - Lineal (y = ax + b)
  - Cuadrático (y = ax² + bx + c)
  - Cúbico (y = ax³ + bx² + cx + d)
  - Exponencial (y = ae^(bx))
  - Logarítmico (y = a·ln(x) + b)
  - Potencial (y = ax^b)
- **Cálculo automático de R²** y ecuaciones
- **Barras de error** (Δx, Δy) — se ingresan **una vez por eje** ("Incertidumbre de columna"), no por fila
- **Análisis de incertidumbre** en pendientes (método de pendiente máxima/mínima; ver *Limitaciones*)

### 🧮 Cálculos Físicos Especializados
- **Propagación de incertidumbre:**
  - Suma (R = A + B)
  - Resta (R = A - B)
  - Producto (P = A × B)
  - Cociente (C = A / B)
  - Validación educativa de cifras significativas
- **Sistema de unidades:**
  - Catálogo de unidades básicas y derivadas + prefijos SI (mili, kilo, …)
  - Etiquetas de ejes con formato "Etiqueta (unidad)"
  - Nota: la app **no** convierte los datos numéricos al cambiar de unidad (decisión de diseño); sólo actualiza las etiquetas
- **Cálculos con unidades:**
  - Derivada muestra unidades correctas (ej: m/s para velocidad)
  - Integral muestra unidades correctas (ej: m·s)
  - Cifras significativas aplicadas automáticamente

### 🛠️ Herramientas Interactivas
- **Zoom y pan** con rueda del ratón y arrastre
- **Tangente (derivada)** en cualquier punto con slider interactivo
- **Área bajo la curva (integral)** con intervalo personalizable
- **Personalización completa:**
  - Título de gráfica
  - Etiquetas de ejes
  - Límites de ejes
  - Grid configurable
- **Exportación:**
  - PDF (incluye gráfica y ecuaciones)
  - PNG (imagen de alta calidad)
  - CSV (datos tabulares)
  - Proyecto completo (.json)

## 🚀 Inicio Rápido

### Opción 1: Ejecutar Localmente

1. **Clonar repositorio:**
```bash
git clone https://github.com/kterva/graficador.git
cd graficador
```

2. **Iniciar servidor local:**
```bash
python3 -m http.server 8000
```

3. **Abrir en navegador:**
```
http://localhost:8000
```

### Opción 2: Usar Directamente
Simplemente abre `index.html` en tu navegador moderno (Chrome, Firefox, Edge, Safari).

## 📖 Guía de Uso

> **Nota:** Para una guía de inicio rápido y configuración local, ver [🚀 Quick Start](quick_start.md).
> Estado del código y trabajo pendiente: [`PENDING_WORK.md`](PENDING_WORK.md).

### 1️⃣ Agregar Datos

**Opción A: Manual**
1. Click en **"+ Nueva Serie"**
2. Ingresar datos en la tabla
3. Opcionalmente, la incertidumbre (Δx, Δy) se ingresa una vez por eje en "Configuración de Gráfica"
4. Usar `Enter` para agregar filas rápidamente

**Opción B: Pegar desde Excel / Google Sheets**
- `Ctrl + V` sobre la tabla. Detecta el separador (tab, `;` o `,`) y salta la fila de cabecera.

**Opción C: Importar CSV**
1. Click en **"Importar CSV"** en la serie
2. Dos columnas `X`, `Y` (separador `,`, `;` o tab; coma o punto decimal)

### 2️⃣ Configurar Ajuste

1. Seleccionar **tipo de ajuste** en el dropdown de cada serie
2. Ver **ecuación** y **R²** calculados automáticamente
3. Activar **"Mostrar líneas de incertidumbre"** para análisis avanzado

### 3️⃣ Configurar Unidades

1. Abrir **"⚙️ Configuración de Gráfica"**
2. Establecer etiquetas: "Tiempo", "Posición", etc.
3. Seleccionar unidades: segundos (s), metros (m), etc. (con prefijos SI opcionales)
4. Las etiquetas de los ejes se actualizan; los datos numéricos **no** se convierten

### 4️⃣ Análisis Avanzado

**Derivada (Tangente):**
1. Activar **"Mostrar Tangente (Derivada)"**
2. Mover slider para ver pendiente en cualquier punto
3. Resultado muestra unidades derivadas (ej: m/s)

**Integral (Área):**
1. Activar **"∫ Mostrar Área (Integral)"**
2. Definir intervalo [x₁, x₂]
3. Ver área calculada con unidades (ej: m·s)

**Propagación de Errores:**
1. Abrir **"🧰 Herramientas → 📐 Propagación de Errores"**
2. Seleccionar operación (suma, resta, producto, cociente)
3. Ingresar valores con incertidumbres
4. Ver resultado con cifras significativas correctas

### 5️⃣ Exportar Resultados

- **PDF:** Gráfica + ecuaciones + parámetros
- **PNG:** Solo imagen (alta resolución)
- **CSV:** Datos en formato tabular
- **Proyecto:** Estado completo (.json) para recargar después

## 🏗️ Arquitectura

### Estructura Modular (ES6, sin bundler)

```
graficador/
├── index.html                     # Estructura + CSP; todos los eventos vía data-on-*
├── css/styles.css
└── js/
    ├── main.js                    # Punto de entrada: importa todo y arranca la app
    ├── events.js  + actions.js    # Delegación de eventos: data-on-<tipo> → función
    ├── state.js                   # AppState + sanitizeImportedSeries
    ├── data-manager.js            # CRUD de series/puntos, import/export CSV por serie
    ├── ui-handlers.js             # Render de series y tabla, modales, herramientas
    ├── chart-manager.js           # initChart, updateChart, zoom/pan, tangente/área
    ├── chart_config.js            # Panel de configuración, leyenda, intersección
    ├── chart-plugins.js           # Barras de error + puntos "diana"
    ├── calculations.js            # calculateFit, derivada, integral
    ├── regression.js              # Algoritmos de regresión + incertidumbre de pendiente
    ├── uncertainty-propagation.js # Propagación de errores (suma/resta/prod/coc)
    ├── units.js                   # Catálogo de unidades y prefijos
    ├── dimensional-analysis.js    # Análisis dimensional (experimental)
    ├── utils.js                   # numericPoints, parseTabular, formatNumber, parseDecimal…
    ├── modal.js                   # confirmDialog + focus trap de los modales
    ├── notifications.js           # Toast único
    ├── project_manager.js         # Guardar/cargar proyecto .json
    ├── export_manager.js          # Export JPG / PDF / CSV combinado
    ├── share-manager.js           # URL compartible (?data= base64)
    ├── keyboard-shortcuts.js      # Atajos de teclado
    ├── presentation-mode.js       # Modo presentación (pantalla completa)
    ├── tour-guide.js              # Tour guiado (desactivado en producción)
    ├── axis_arrows_plugin.js      # Flechas en los extremos de los ejes
    └── dev-tools.js               # Datos de prueba (sólo en la rama develop)
```

La matemática (`calculations`, `regression`, `uncertainty-propagation`, `utils`, `units`,
`dimensional-analysis`, `state`) es pura y se testea en Node (`npm test`, 113 tests).

### Tecnologías

- **HTML5/CSS3** — sin frameworks
- **JavaScript ES6+** — módulos nativos, sin bundler ni build step
- **[Chart.js 3.9](https://www.chartjs.org/)** + [plugin de zoom](https://www.chartjs.org/chartjs-plugin-zoom/) — gráfica y zoom/pan
- **[jsPDF](https://github.com/parallax/jsPDF)** + jsPDF-AutoTable — exportación a PDF

Todas las dependencias se cargan por CDN con integridad de subrecursos (SRI), y una
CSP en `index.html` fija los orígenes permitidos.

## 🧮 Ejemplos de Uso

### Ejemplo 1: Cinemática - Posición vs Tiempo

```
Datos:
x (s): 0, 1, 2, 3, 4
y (m): 0, 5, 20, 45, 80

Configuración:
- Eje X: "Tiempo (s)"
- Eje Y: "Posición (m)"
- Ajuste: Cuadrático

Resultados:
- Ecuación: y = 5.0x² + 0.0x + 0.0
- R² = 1.000
- Derivada en x=2s: 20.0 m/s (velocidad)
```

### Ejemplo 2: Propagación de Errores

```
Operación: Producto
A = 10.5 ± 0.3
B = 2.0 ± 0.1

Resultado:
P = 21 ± 2
```

## 📐 Notas metodológicas y limitaciones

### Incertidumbre de la pendiente (método de máx/mín)
Se estima con el **método de los extremos**: se toman los puntos con menor y mayor X,
se trazan la recta más empinada y la más plana que pasan por sus cajas de error
(`x ± Δx`, `y ± Δy` de la incertidumbre de columna) y se reporta
`Δm = (m_max − m_min) / 2` (ídem para `Δb`).

Limitaciones:
- Sólo usa los **dos puntos extremos**, no todo el conjunto.
- Si las cajas de error en X de los extremos **se solapan**
  (`x_n − Δx ≤ x_1 + Δx`), el método no aplica: la app no reporta `Δm` y avisa.
- Requiere al menos un `Δx` o `Δy` distinto de cero.

### Regresiones no lineales
`exponencial`, `logarítmica` y `potencial` se ajustan por **mínimos cuadrados sobre
los datos linealizados** (`ln y`, `ln x`), **sin ponderar**. Eso sesga el ajuste
hacia los valores más chicos. El **R² sí se calcula en el espacio original** de los
datos, así que es comparable con el de los ajustes polinómicos.

### Análisis dimensional
El analizador de expresiones (`🧰 Herramientas → Análisis Dimensional`) es
**experimental**: soporta productos, cocientes y potencias de magnitudes, pero no
sumas/restas ni precedencia de paréntesis.

## 🎓 Casos de Uso Educativos

### Física
- Análisis de movimiento (MRU, MRUA)
- Ley de Hooke (F vs Δx)
- Péndulo simple (T vs L)
- Caída libre

### Química
- Cinética de reacciones
- Ley de Beer-Lambert
- Titulaciones

### Ingeniería
- Análisis de datos experimentales
- Calibración de sensores
- Caracterización de materiales

## ⌨️ Atajos de Teclado

| Atajo | Acción |
|-------|--------|
| `Ctrl + N` | Nueva serie |
| `Ctrl + S` | Guardar proyecto |
| `Ctrl + E` | Exportar |
| `Enter` | Agregar fila (en tabla) |
| `Tab` | Navegar entre celdas |

## 🤝 Contribuir

¡Las contribuciones son bienvenidas!

1. Fork del repositorio
2. Crear rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -am 'Agregar nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

### Áreas de Contribución

- 🐛 Reportar bugs
- ✨ Proponer nuevas funcionalidades
- 📝 Mejorar documentación
- 🌐 Traducciones
- 🧪 Agregar tests

## 📝 Changelog

> Detalle completo en [`CHANGELOG.md`](CHANGELOG.md).

### v1.6.1 (2026-09-08)
- ✅ Diálogos de confirmación propios (no bloqueantes) y focus trap en todos los modales
- ✅ Segunda auditoría (R1–R13): datos no numéricos ya no rompen los ajustes, parser de CSV unificado, y varias guardas de correctitud numérica
- ✅ 113 tests

### v1.6.0 (2026-09-08)
- ✅ Pasada de auditoría: bugs de cálculo (tangente/área exponencial, Δm con cajas solapadas) y de UI (limpiar todo, encuadre, headers de tabla)
- ✅ Seguridad: CSP estricta (sin `script-src 'unsafe-inline'`) + delegación de eventos
- ✅ CI (GitHub Actions), 107 tests
- ✅ Análisis dimensional rotulado como experimental

### v1.5.0 (2026-08-06)
- ✅ Ecuación y R² incluidos en exportaciones (PDF, JPG, CSV)
- ✅ Suite de tests automatizados
- ✅ Integridad de subrecursos (SRI) en librerías por CDN
- ✅ Corregido signo duplicado en ecuaciones con coeficientes negativos

### v1.4.0 (2025-12-05)
- ✅ Interfaz móvil mejorada (menú popover)
- ✅ Estabilidad en herramientas (tangente, ejes)
- ✅ Documentación ampliada
- ✅ Modo desarrollo configurable

### v1.3.0 (2025-12-03)
- ✅ Sistema de unidades completo (básicas + derivadas)
- ✅ Propagación de incertidumbre con modal dedicado
- ✅ Unidades en derivada e integral
- ✅ Menú de herramientas
- ✅ Cifras significativas automáticas

### v1.2.0 (2025-12-03)
- ✅ Refactorización modular (9 módulos ES6)
- ✅ Reducción de main.js (-92%)
- ✅ Arquitectura escalable

### v1.1.0
- ✅ Análisis de incertidumbre avanzado
- ✅ Exportación a PDF
- ✅ Herramientas de cálculo (derivada, integral)
- ✅ Gestión de proyectos

### v1.0.0
- ✅ Múltiples series
- ✅ Ajustes básicos
- ✅ Visualización interactiva

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE)

## 🙏 Agradecimientos

- [Chart.js](https://www.chartjs.org/) - Librería de gráficas
- [jsPDF](https://github.com/parallax/jsPDF) - Generación de PDF
- Comunidad de código abierto

## 📧 Contacto

- **Repositorio:** [github.com/kterva/graficador](https://github.com/kterva/graficador)
- **Issues:** [github.com/kterva/graficador/issues](https://github.com/kterva/graficador/issues)

---

**Hecho con ❤️ para la comunidad educativa y científica**