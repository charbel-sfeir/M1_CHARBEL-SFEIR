# 🎨 Generador de Paletas Interactivo — Colorfly Studio

Proyecto Integrador M1 — Full Stack (Henry).
Aplicación web estática e interactiva que genera paletas de colores aleatorias en formato **HEX** o **HSL**, pensada para acelerar el flujo creativo de una agencia de branding.

🔗 **Demo en vivo:** _(completar con el link de GitHub Pages una vez desplegado)_
`https://<tu-usuario>.github.io/ProyectoM1_NombreEstudiante/`

---

## ✨ Funcionalidades

### Obligatorias
- Botón **"Generar paleta"** que crea colores aleatorios.
- Selector de **tamaño de paleta**: 6, 8 o 9 colores.
- Cada color se genera en **HSL** y se muestra en **HEX o HSL** (selector de formato).
- Cada swatch muestra su código de color visible.
- Microfeedback visual mediante **toast** en cada acción (generar, copiar, bloquear, guardar, etc.).
- HTML semántico (`header`, `main`, `section`, `fieldset`/`legend`, `footer`).
- Accesibilidad básica: labels asociados a cada input, foco visible (`:focus-visible`), contraste de texto calculado dinámicamente según la luminosidad de cada color, `aria-live` en el toast, `aria-pressed` en los botones de bloqueo.

### Extra credit implementados
1. **Bloqueo de colores** 🔒 — un color bloqueado no cambia al generar una nueva paleta.
2. **Guardado de paletas en `localStorage`** — con listado, carga y eliminación individual o total.
3. **Animaciones sutiles** — entrada escalonada de los swatches, respetando `prefers-reduced-motion`.
4. **Copiar código al portapapeles** — un click sobre el código copia el valor (HEX o HSL) vía `navigator.clipboard`.
5. **Mejoras visuales de UI** — sistema de diseño propio (tipografías Space Grotesk / Inter / JetBrains Mono), layout responsive, estados hover/focus cuidados.

---

## 🛠️ Stack técnico

- **HTML5** semántico
- **CSS3** (variables CSS, Grid, sin estilos inline, una sola hoja de estilos externa)
- **JavaScript** vanilla (ES6+, sin frameworks ni librerías)
- **Git / GitHub** para versionado
- **GitHub Pages** para el despliegue

---

## 📁 Estructura del proyecto

```
ProyectoM1_NombreEstudiante/
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── script.js
├── docs/                  # (opcional) capturas/GIFs para la documentación
└── README.md
```

---

## 🧠 Decisiones técnicas

- **Generación de color en HSL:** se generan valores aleatorios de matiz (0–360°), con saturación (55–90%) y luminosidad (35–75%) acotadas para evitar colores ilegibles (demasiado oscuros, claros o desaturados). Luego se convierten a HEX cuando el formato lo requiere (`hslToHex`).
- **Contraste de texto:** la luminosidad (`l`) de cada color determina si el texto/iconos sobre el swatch deben ser claros u oscuros, garantizando legibilidad mínima (criterio de accesibilidad).
- **Bloqueo de colores:** el estado de la paleta se mantiene en memoria (`currentPalette`); al generar, solo se reemplazan los colores no bloqueados.
- **Persistencia:** las paletas guardadas se almacenan como array de objetos `{ id, colors }` en `localStorage`, no se persiste el estado de bloqueo (no aplica fuera de la sesión activa).
- **Sin librerías externas:** todo el comportamiento (incluida la copia al portapapeles) usa APIs nativas del navegador.

---

## ▶️ Cómo correr el proyecto localmente (Visual Studio Code)

1. Cloná el repositorio:
   ```bash
   git clone https://github.com/<tu-usuario>/ProyectoM1_NombreEstudiante.git
   cd ProyectoM1_NombreEstudiante
   ```
2. Abrí la carpeta en VS Code:
   ```bash
   code .
   ```
3. Instalá la extensión **Live Server** (Ritwick Dey) desde el panel de extensiones de VS Code.
4. Click derecho sobre `index.html` → **"Open with Live Server"** (o el botón "Go Live" abajo a la derecha).
5. Se abrirá automáticamente en `http://127.0.0.1:5500` con recarga automática al guardar cambios.

> No requiere `npm install` ni build: es HTML/CSS/JS puro.

---

## 🚀 Cómo desplegar en GitHub Pages

1. Subí el proyecto a un repositorio en GitHub (ver sección de Git abajo).
2. En GitHub, andá a **Settings → Pages**.
3. En **Branch**, elegí `main` y carpeta `/ (root)` → **Save**.
4. Esperá un par de minutos; GitHub te va a dar el link público:
   `https://<tu-usuario>.github.io/ProyectoM1_NombreEstudiante/`

---

## 🔧 Flujo de Git sugerido

```bash
git init
git add .
git commit -m "feat: estructura base del proyecto"
git branch -M main
git remote add origin https://github.com/<tu-usuario>/ProyectoM1_NombreEstudiante.git
git push -u origin main
```

Sugerencia de commits incrementales (para que el historial cuente la historia del desarrollo):
- `feat: maquetado semántico de la app`
- `feat: estilos base y sistema de diseño`
- `feat: generación de colores aleatorios HSL/HEX`
- `feat: selector de tamaño de paleta (6/8/9)`
- `feat: bloqueo de colores`
- `feat: guardado de paletas en localStorage`
- `feat: copiar código al portapapeles`
- `fix: accesibilidad y contraste de texto`
- `docs: README con instrucciones de uso y despliegue`

---

## 🤖 Documentación del uso de IA

> Completar en el entregable final: prompts utilizados, herramienta de IA (ej. Claude, ChatGPT), y capturas de los resultados obtenidos, como pide la consigna en el punto "Documentación del uso de la IA".
