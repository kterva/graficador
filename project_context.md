# 📘 Contexto del Proyecto: Graficador Científico

## 🎯 Visión General
El **Graficador Científico** es una aplicación web interactiva diseñada para el análisis de datos experimentales en entornos educativos y científicos. Su objetivo es proporcionar una herramienta accesible, precisa y visualmente rica para realizar ajustes de curvas, análisis de incertidumbre y cálculos físicos, todo directamente en el navegador sin necesidad de instalación.

## 🛠️ Stack Tecnológico
El proyecto se adhiere a la filosofía de "Vanilla Web" para maximizar la compatibilidad, el rendimiento y la facilidad de despliegue.

- **Core:** HTML5, CSS3, JavaScript (ES6+).
- **Módulos:** Arquitectura basada en ES Modules nativos (`import`/`export`).
- **Librerías Externas:**
    - [Chart.js 3.9](https://www.chartjs.org/): Motor de renderizado de gráficas.
    - [chartjs-plugin-zoom](https://www.chartjs.org/chartjs-plugin-zoom/): Funcionalidades de zoom y pan.
    - [jsPDF](https://github.com/parallax/jsPDF): Generación de reportes en PDF.
- **Entorno de Desarrollo:** Servidor HTTP simple (Python `http.server` o similar), Git para control de versiones.

## 🏗️ Arquitectura del Sistema
La aplicación sigue una arquitectura modular para mantener el código organizado y escalable.

### Estructura de Archivos
```
graficador/
├── index.html              # Punto de entrada y estructura DOM
├── css/
│   └── styles.css         # Estilos globales y responsivos
└── js/
    ├── main.js            # Orquestador principal e inicialización
    ├── state.js           # Gestión del estado global (AppState)
    ├── chart-manager.js   # Configuración y control de Chart.js
    ├── calculations.js    # Lógica matemática (regresiones, derivadas, integrales)
    ├── ui-handlers.js     # Manejo de eventos de usuario e interacción DOM
    ├── units.js           # Sistema de conversión y manejo de unidades
    ├── uncertainty-propagation.js  # Lógica de propagación de errores
    ├── export_manager.js  # Gestión de exportación (PDF, PNG, CSV, JSON)
    ├── project_manager.js # Gestión de carga/guardado de proyectos
    ├── utils.js           # Funciones auxiliares
    └── dev-tools.js       # Herramientas de desarrollo (carga rápida de datos)
```

### Flujo de Datos
1.  **Entrada:** El usuario ingresa datos en la tabla (manual o CSV).
2.  **Estado:** `ui-handlers.js` actualiza `AppState.series`.
3.  **Cálculo:** `chart-manager.js` solicita cálculos a `calculations.js` (ajustes, errores).
4.  **Renderizado:** `chart-manager.js` actualiza la instancia de Chart.js.
5.  **Salida:** El usuario visualiza la gráfica o exporta resultados vía `export_manager.js`.

## ✨ Características Clave (v1.4.0)
- **Análisis de Datos:** 6 tipos de ajuste (Lineal, Cuadrático, Cúbico, Exponencial, Logarítmico, Potencial).
- **Incertidumbre:** Barras de error, análisis de pendiente máxima/mínima, propagación de errores.
- **Unidades:** Sistema completo de unidades físicas con conversión automática.
- **Herramientas Interactivas:** Tangente (derivada) y Área (integral) con visualización en tiempo real.
- **Interfaz Adaptable:** Diseño responsive optimizado para móviles y tablets (menú popover, controles táctiles).
- **Exportación:** Reportes completos en PDF, imágenes PNG, datos CSV y persistencia de proyectos JSON.

## 🔄 Flujo de Trabajo (Git)
- **`main`:** Rama de producción (estable). `IS_DEVELOPMENT = false`.
- **`develop`:** Rama de desarrollo (integración). `IS_DEVELOPMENT = true`.
- **Feature Branches:** Ramas temporales para nuevas funcionalidades.
