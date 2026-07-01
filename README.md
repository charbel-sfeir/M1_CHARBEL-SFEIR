<div align="center">

# 🎨 Paleta

**Generador de paletas de color interactivo, construido con HTML, CSS y JavaScript puros.**

[Ver demo en vivo](https://charbel-sfeir.github.io/M1_CHARBEL-SFEIR/) · [Reportar un bug](https://github.com/charbel-sfeir/M1_CHARBEL-SFEIR/issues)

</div>

---

## Sobre el proyecto

**Paleta** genera combinaciones de color aleatorias pensadas para acelerar el arranque de un proyecto de diseño o branding. A partir de un click, produce paletas de 6, 8 o 9 colores en formato HEX o HSL, y a partir de ahí propone variaciones tonales, un gradiente combinado y sugerencias de qué color usar como fondo, texto o acento — basadas en cálculos reales de contraste (WCAG), no en corazonadas.

Sin frameworks, sin dependencias, sin build step. Un `index.html`, una hoja de estilos y un script.

## Funcionalidades

- **Generación aleatoria** con distribución de matices por ángulo áureo, para evitar colores repetidos o muy parecidos entre sí en una misma paleta.
- **Bloqueo de color** — fijá los colores que te gustan y regenerá solo el resto.
- **Variaciones tonales** por color (tints y shades), un click para copiar cualquiera.
- **Gradiente combinado** de toda la paleta, en modo diagonal, horizontal o radial, con su CSS listo para copiar.
- **Sugerencias de uso** — la app calcula automáticamente qué color conviene usar como fondo, cuál como texto y cuál como acento, y arma los pares con mejor contraste según WCAG.
- **Paletas guardadas** en `localStorage`, sin necesidad de backend.
- Interfaz accesible: navegación por teclado, foco visible, contraste de texto calculado dinámicamente, `aria-live` en el feedback.

## Stack

`HTML5` · `CSS3` (variables nativas, Grid) · `JavaScript` (ES6+, vanilla)

## Uso local

```bash
git clone https://github.com/charbel-sfeir/M1_CHARBEL-SFEIR.git
cd M1_CHARBEL-SFEIR
```

Abrí `index.html` con la extensión **Live Server** de VS Code, o simplemente abrí el archivo en el navegador — no requiere instalación ni build.

## Estructura

```
M1_CHARBEL-SFEIR/
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── script.js
└── README.md
```

## Autor

**Charbel Sfeir** — [GitHub](https://github.com/charbel-sfeir)