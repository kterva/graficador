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
En la rama `develop`, la variable `window.IS_DEVELOPMENT` está configurada en `true`. Esto habilita un panel flotante rojo ("Datos de Prueba (DEV)") que permite cargar datos de ejemplo con un solo click:

- **📈 Lineal:** Carga datos con tendencia lineal y error.
- **📊 Cuadrática:** Carga una parábola perfecta para pruebas de ajuste.
- **📉 Exponencial:** Carga datos de decaimiento exponencial.
- **🧹 Limpiar:** Borra todos los datos rápidamente.

> **Nota:** En la rama `main`, este panel está oculto por defecto (`IS_DEVELOPMENT = false`).

## ⌨️ Atajos de Teclado
- `Ctrl + N`: Nueva serie.
- `Ctrl + S`: Guardar proyecto.
- `Ctrl + E`: Exportar resultados.
- `Enter` (en tabla): Nueva fila.
- `Tab`: Navegar entre celdas.

## 🐛 Solución de Problemas Comunes
- **La gráfica no carga:** Verifica que estás sirviendo los archivos a través de un servidor HTTP (`http://...`) y no abriendo el archivo directamente (`file://...`), ya que los módulos ES6 requieren protocolo HTTP por seguridad CORS.
- **Cambios no visibles:** Intenta limpiar la caché del navegador con `Ctrl + Shift + R`.
