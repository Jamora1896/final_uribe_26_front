# final_uribe_26_front


# 🛍️ RIFLE - Sistema de Gestión de Ventas (Frontend)

Aplicación web desarrollada en **HTML, CSS y JavaScript puro** para la gestión básica de usuarios y registro de ventas en una tienda de ropa llamada **RIFLE**.

El sistema simula un entorno real de ventas con autenticación, dashboard de métricas y registro de transacciones, utilizando almacenamiento local del navegador.

## 📌 Descripción del Proyecto

Este proyecto fue desarrollado como una solución frontend para una tienda de ropa, permitiendo:

* Autenticación de usuarios (login, registro y recuperación)
* Registro de ventas con validaciones
* Visualización de métricas en un dashboard
* Persistencia de datos en el navegador (LocalStorage / SessionStorage)

Todo el sistema funciona **sin backend**, simulando una aplicación real.

## 🚀 Funcionalidades

### 🔐 Autenticación

* Inicio de sesión
* Registro de nuevos usuarios
* Recuperación de contraseña (simulada)
* Manejo de sesión con opción “recordarme”

### 📊 Dashboard

* Total de ventas del día
* Número de ventas registradas
* Producto más vendido

### 💰 Registro de Ventas

* Selección de asesor
* Selección de local
* Lista desplegable de productos
* Cálculo automático del total
* Validación de datos
* Historial de ventas recientes

## 🧱 Tecnologías Utilizadas

* HTML5
* CSS3 (Diseño moderno en escala de grises)
* JavaScript (Vanilla JS)
* LocalStorage y SessionStorage

## 📁 Estructura del Proyecto

```
/final_uribe_26_front
│
├── index.html
├── README.md
│
├── /css
│   └── styles.css
│
├── /js
│   └── app.js
│
├── /assets
│   └── /img
│       └── rifle-pattern.png
```


## ▶️ Cómo Ejecutar el Proyecto

1. Descargar o clonar el repositorio
2. Abrir la carpeta del proyecto
3. Hacer doble clic en:

```
index.html
```

O abrirlo desde el navegador:

```
Click derecho → Abrir con → Google Chrome
```

✅ No requiere instalación de dependencias
✅ No requiere Node.js
✅ No requiere servidor


## 🔑 Usuarios de Prueba

El sistema incluye usuarios pre-cargados:

| Usuario | Contraseña |
| ------- | ---------- |
| admin   | admin12345 |
| demo    | demo12345  |


## 💾 Persistencia de Datos

Los datos se almacenan en el navegador usando:

* `localStorage` → usuarios y ventas
* `sessionStorage` → sesión temporal

⚠️ Nota: Si limpias el navegador, se perderán los datos.


## 🎨 Diseño

* Interfaz moderna y profesional
* Uso de tonos grises (reemplazo de burdeos)
* Efectos de transparencia y blur
* Diseño responsive


## 📌 Validaciones Implementadas

* Campos obligatorios
* Longitud mínima de contraseña
* Validación de teléfono
* Validación de productos existentes
* Control de sesión


## ⚙️ Consideraciones Técnicas

* Arquitectura basada en módulos dentro de un solo archivo JS
* Uso de funciones reutilizables
* Manejo de rutas mediante `hash` (#login, #dashboard, etc.)
* Simulación de backend con almacenamiento local


## 🔮 Mejoras Futuras

* Integración con backend real (Node.js / Firebase)
* Base de datos persistente
* Autenticación segura (JWT)
* Reportes avanzados
* Gráficas en dashboard
* Gestión de inventario


## 👩‍💻 Autor

Proyecto desarrollado por:

**Jessica Alexandra Mora Ferraro**
Estudiante de desarrollo de software


## 📄 Licencia

Este proyecto es de uso académico y demostrativo.

