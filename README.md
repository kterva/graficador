# 📊 Graficador Científico

Aplicación web interactiva para análisis de datos experimentales con ajustes de regresión, propagación de incertidumbre y conversión de unidades. Ideal para estudiantes, científicos e ingenieros.

![Version](https://img.shields.io/badge/version-1.4.0-blue)
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
- **Barras de error** (Δx, Δy) con visualización
- **Análisis de incertidumbre** en pendientes (método de pendiente máxima/mínima)

### 🧮 Cálculos Físicos Especializados
- **Propagación de incertidumbre:**
  - Suma (R = A + B)
  - Resta (R = A - B)
  - Producto (P = A × B)
  - Cociente (C = A / B)
  - Validación educativa de cifras significativas
- **Sistema de unidades completo:**
  - Unidades básicas: longitud, masa, tiempo, temperatura
  - Unidades derivadas: velocidad, aceleración, fuerza, energía
  - Conversión automática entre unidades
  - Etiquetas de ejes con formato "Label (unit)"
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
> Para detalles técnicos y arquitectura, ver [📘 Contexto del Proyecto](project_context.md).

### 1️⃣ Agregar Datos

**Opción A: Manual**
1. Click en **"+ Nueva Serie"**
2. Ingresar datos en la tabla
3. Opcionalmente agregar errores (Δx, Δy)
4. Usar `Enter` para agregar filas rápidamente

**Opción B: Importar CSV**
1. Click en **"📂 Importar"**
2. Seleccionar archivo CSV
3. Formato: `x,y`

**Opción C: Datos de Prueba** (modo desarrollo)
- Click en botones de ejemplo: 📈 Lineal, 📊 Cuadrática, etc.

### 2️⃣ Configurar Ajuste

1. Seleccionar **tipo de ajuste** en el dropdown de cada serie
2. Ver **ecuación** y **R²** calculados automáticamente
3. Activar **"Mostrar líneas de incertidumbre"** para análisis avanzado

### 3️⃣ Configurar Unidades

1. Abrir **"⚙️ Configuración de Gráfica"**
2. Establecer etiquetas: "Tiempo", "Posición", etc.
3. Seleccionar unidades: segundos (s), metros (m), etc.
4. Los datos se convierten automáticamente

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

### Estructura Modular (ES6)

```
graficador/
├── index.html              # Interfaz principal
├── css/
│   └── styles.css         # Estilos
└── js/
    ├── main.js            # Punto de entrada (125 líneas)
    ├── state.js           # Estado global
    ├── chart-manager.js   # Gestión de Chart.js
    ├── calculations.js    # Regresiones y cálculos
    ├── ui-handlers.js     # Manejadores de eventos
    ├── units.js           # Sistema de unidades
    ├── uncertainty-propagation.js  # Propagación de errores
    ├── utils.js           # Utilidades
    └── chart-plugins.js   # Plugins personalizados
```

### Tecnologías

- **HTML5/CSS3** - Interfaz moderna y responsive
- **JavaScript ES6+** - Módulos nativos, sin bundler
- **[Chart.js 3.9](https://www.chartjs.org/)** - Visualización de gráficas
- **[Chart.js Zoom Plugin](https://www.chartjs.org/chartjs-plugin-zoom/)** - Zoom interactivo
- **[jsPDF](https://github.com/parallax/jsPDF)** - Generación de PDF

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
P = 21.0 ± 1.2
```

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