# 🚀 Inicio Rápido (Quick Start)

Esta guía te ayudará a poner en marcha el **Graficador Científico** en tu entorno local en cuestión de minutos.

## 📋 Requisitos Previos
- Un navegador web moderno (Chrome, Firefox, Edge, Safari).
- **Git** (para clonar el repositorio).
- **Python 3** (recomendado para servidor local) o cualquier otro servidor estático (Node.js `http-server`, VS Code Live Server, etc.).

## 📥 Instalación

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/kterva/graficador.git
    cd graficador
    ```

2.  **Seleccionar la rama de trabajo:**
    - Para **desarrollo** (con herramientas extra):
        ```bash
        git checkout develop
        ```
    - Para **producción** (versión estable):
        ```bash
        git checkout main
        ```

## ▶️ Ejecución

La aplicación no requiere compilación (build step). Solo necesitas servir los archivos estáticos.

### Opción A: Python (Recomendado)
```bash
python3 -m http.server 8000
```
Abre tu navegador en: [http://localhost:8000](http://localhost:8000)

### Opción B: VS Code Live Server
Si usas Visual Studio Code:
1.  Instala la extensión "Live Server".
2.  Abre `index.html`.
3.  Click derecho -> "Open with Live Server".

## 🛠️ Modo Desarrollo
La rama `develop` sirve `index.html` con `<body data-development="true">`. Con eso,
`js/main.js` carga `js/dev-tools.js` y aparece en **🧰 Herramientas** la opción
**🧪 Cargar Datos de Prueba** (Lineal, Cuadrática, Exponencial, Logarítmica,
Potencial, Con Incertidumbre). En `main` el atributo está en `"false"` y esa opción
no se muestra.

## ⌨️ Atajos de Teclado
- `Ctrl + N`: Nueva serie.
- `Ctrl + S`: Guardar proyecto.
- `Ctrl + E`: Exportar resultados.
- `Enter` (en tabla): Nueva fila.
- `Tab`: Navegar entre celdas.

## 🐛 Solución de Problemas Comunes
- **La gráfica no carga:** Verifica que estás sirviendo los archivos a través de un servidor HTTP (`http://...`) y no abriendo el archivo directamente (`file://...`), ya que los módulos ES6 requieren protocolo HTTP por seguridad CORS.
- **Cambios no visibles:** Intenta limpiar la caché del navegador con `Ctrl + Shift + R`.
