// ===================================
// Generador de Paletas - script.js
// ===================================

// variables que van guardando el estado de la app
let currentPalette = [];
let currentSize = 6;
let currentFormat = "hex";
let currentGradientType = "135deg";

const THEME_KEY = "colorfly_theme";
const HISTORY_KEY = "colorfly_history";

// referencias a elementos del HTML
const paletteList = document.getElementById("palette-list");
const generateBtn = document.getElementById("generate-btn");
const saveBtn = document.getElementById("save-btn");
const clearSavedBtn = document.getElementById("clear-saved-btn");
const savedList = document.getElementById("saved-list");
const toastEl = document.getElementById("toast");
const sizeInputs = document.querySelectorAll('input[name="palette-size"]');
const formatInputs = document.querySelectorAll('input[name="color-format"]');
const themeToggle = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");
const backToTopBtn = document.getElementById("back-to-top");
const gradientPreview = document.getElementById("gradient-preview");
const gradientTypeInputs = document.querySelectorAll('input[name="gradient-type"]');
const copyGradientBtn = document.getElementById("copy-gradient-btn");
const rolesList = document.getElementById("roles-list");
const pairsList = document.getElementById("pairs-list");
const downloadPngBtn = document.getElementById("download-png-btn");
const printBtn = document.getElementById("print-btn");
const shareBtn = document.getElementById("share-btn");
const historyStrip = document.getElementById("history-strip");
const imageInput = document.getElementById("image-input");
const extractPreviewRow = document.getElementById("extract-preview-row");
const extractPreviewImg = document.getElementById("extract-preview-img");
const extractPreviewName = document.getElementById("extract-preview-name");

// ===================================
// FUNCIONES PARA MANEJAR COLORES
// ===================================

// genero un color aleatorio en HSL
// uso el "angulo dorado" para que el matiz no se repita tanto entre un color y otro
let hueCursor = Math.random() * 360;
function randomHsl() {
  hueCursor = (hueCursor + 137.5 + (Math.random() * 20 - 10)) % 360;
  const h = Math.floor(hueCursor);
  const s = Math.floor(Math.random() * 55) + 40;
  const l = Math.floor(Math.random() * 55) + 25;
  return [h, s, l];
}

function hslToString(hsl) {
  return "hsl(" + hsl[0] + ", " + hsl[1] + "%, " + hsl[2] + "%)";
}

// convierto hsl a hex, es una formula matematica normal para pasar de un formato a otro
function hslToHex(hsl) {
  let h = hsl[0], s = hsl[1] / 100, l = hsl[2] / 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = x => Math.round(255 * x).toString(16).padStart(2, "0");
  return ("#" + toHex(f(0)) + toHex(f(8)) + toHex(f(4))).toUpperCase();
}

function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }
  return [h, Math.round(s * 100), Math.round(l * 100)];
}

function rgbToHsl(rgb) {
  return hexToHsl(rgbToHex(rgb));
}

function rgbToHex(rgb) {
  const toHex = v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return ("#" + toHex(rgb[0]) + toHex(rgb[1]) + toHex(rgb[2])).toUpperCase();
}

// si el color es claro devuelvo texto oscuro, si es oscuro devuelvo texto claro
function getReadableTextColor(hsl) {
  return hsl[2] > 60 ? "#221E19" : "#FFFFFF";
}

function formatColor(hsl, format) {
  return format === "hex" ? hslToHex(hsl) : hslToString(hsl);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// tints y shades: mismo color pero mas claro o mas oscuro
function getVariations(hsl) {
  const pasos = [-36, -18, 0, 18, 36];
  const resultado = [];
  for (let i = 0; i < pasos.length; i++) {
    const delta = pasos[i];
    const nuevaL = clamp(hsl[2] + delta, 6, 95);
    const nuevaS = delta === 0 ? hsl[1] : clamp(hsl[1] - Math.abs(delta) * 0.15, 15, 100);
    resultado.push([hsl[0], Math.round(nuevaS), Math.round(nuevaL)]);
  }
  return resultado;
}

// ===================================
// CONTRASTE (WCAG) - para saber si un texto se lee bien sobre un fondo
// ===================================

function hexToRgbArray(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

// formula oficial de luminancia relativa de WCAG
function relativeLuminance(rgb) {
  const canal = rgb.map(c => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * canal[0] + 0.7152 * canal[1] + 0.0722 * canal[2];
}

function contrastRatio(hexA, hexB) {
  const lumA = relativeLuminance(hexToRgbArray(hexA));
  const lumB = relativeLuminance(hexToRgbArray(hexB));
  const claro = Math.max(lumA, lumB);
  const oscuro = Math.min(lumA, lumB);
  return (claro + 0.05) / (oscuro + 0.05);
}

// ===================================
// AVISO FLOTANTE (toast)
// ===================================

let toastTimer = null;
function showToast(mensaje) {
  toastEl.textContent = mensaje;
  toastEl.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove("visible");
  }, 2200);
}

// ===================================
// GENERAR Y DIBUJAR LA PALETA
// ===================================

function generatePalette() {
  const nueva = [];
  for (let i = 0; i < currentSize; i++) {
    const anterior = currentPalette[i];
    if (anterior && anterior.locked) {
      nueva.push(anterior);
    } else {
      nueva.push({ hsl: randomHsl(), locked: false });
    }
  }
  currentPalette = nueva;
  renderPalette();
  pushHistory();
  showToast("Nueva paleta generada");
}

function renderPalette() {
  // acomodo la cantidad de columnas segun el tamaño elegido
  if (currentSize === 6) paletteList.style.setProperty("--cols", "3");
  if (currentSize === 8) paletteList.style.setProperty("--cols", "4");
  if (currentSize === 9) paletteList.style.setProperty("--cols", "3");

  paletteList.innerHTML = "";

  for (let index = 0; index < currentPalette.length; index++) {
    const color = currentPalette[index];
    const hex = hslToHex(color.hsl);
    const textColor = getReadableTextColor(color.hsl);
    const displayCode = formatColor(color.hsl, currentFormat);

    const li = document.createElement("li");
    li.className = "color-card";
    li.style.background = hex;
    li.style.color = textColor;
    if (color.locked) li.classList.add("bloqueado");

    const lockBtn = document.createElement("button");
    lockBtn.type = "button";
    lockBtn.className = "candado";
    lockBtn.setAttribute("aria-label", color.locked ? "Desbloquear color" : "Bloquear color");
    lockBtn.textContent = color.locked ? "🔒" : "🔓";
    lockBtn.addEventListener("click", () => toggleLock(index));
    li.appendChild(lockBtn);

    const variacionesDiv = document.createElement("div");
    variacionesDiv.className = "variaciones";
    const variaciones = getVariations(color.hsl);
    for (let v = 0; v < variaciones.length; v++) {
      const hexVariante = hslToHex(variaciones[v]);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.style.background = hexVariante;
      btn.setAttribute("aria-label", "Copiar variación " + hexVariante);
      btn.addEventListener("click", e => {
        e.stopPropagation();
        copyToClipboard(hexVariante, "variación");
      });
      variacionesDiv.appendChild(btn);
    }
    li.appendChild(variacionesDiv);

    const codeBtn = document.createElement("button");
    codeBtn.type = "button";
    codeBtn.className = "codigo-color";
    codeBtn.textContent = displayCode;
    codeBtn.addEventListener("click", () => copyToClipboard(displayCode, "código"));
    li.appendChild(codeBtn);

    paletteList.appendChild(li);
  }

  updateGradient();
  updateSuggestions();
}

function toggleLock(index) {
  currentPalette[index].locked = !currentPalette[index].locked;
  renderPalette();
  showToast(currentPalette[index].locked ? "Color bloqueado" : "Color desbloqueado");
}

async function copyToClipboard(texto, etiqueta) {
  try {
    await navigator.clipboard.writeText(texto);
    showToast("Copiado (" + (etiqueta || "código") + "): " + texto);
  } catch (error) {
    showToast("No se pudo copiar, copialo a mano");
  }
}

// ===================================
// HISTORIAL (se guarda solo, distinto de "guardadas")
// ===================================

function getHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function pushHistory() {
  const hexes = currentPalette.map(c => hslToHex(c.hsl));
  const clave = hexes.join(",");
  let historial = getHistory().filter(h => h.colors.join(",") !== clave);
  historial.unshift({ id: Date.now(), colors: hexes });
  historial = historial.slice(0, 10);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(historial));
  renderHistory();
}

function renderHistory() {
  const historial = getHistory();
  historyStrip.innerHTML = "";

  if (historial.length === 0) {
    const p = document.createElement("p");
    p.textContent = "Las últimas paletas que generes van a aparecer acá.";
    historyStrip.appendChild(p);
    return;
  }

  historial.forEach(entry => {
    const item = document.createElement("button");
    item.type = "button";
    entry.colors.forEach(hex => {
      const span = document.createElement("span");
      span.style.background = hex;
      item.appendChild(span);
    });
    item.addEventListener("click", () => loadPaletteFromHexes(entry.colors));
    historyStrip.appendChild(item);
  });
}

function loadPaletteFromHexes(hexes) {
  if (hexes.length === 6 || hexes.length === 8 || hexes.length === 9) {
    currentSize = hexes.length;
    const sizeInput = document.querySelector('input[name="palette-size"][value="' + currentSize + '"]');
    if (sizeInput) sizeInput.checked = true;
  }
  currentPalette = hexes.map(hex => ({ hsl: hexToHsl(hex), locked: false }));
  renderPalette();
  showToast("Paleta cargada");
}

// ===================================
// EXTRAER COLORES DE UNA IMAGEN
// ===================================

// agrupa pixeles parecidos en "k" grupos, y devuelve el centro de cada grupo
function kMeansColors(pixels, k, iteraciones) {
  if (pixels.length === 0) return [];
  let centros = [];
  const usados = new Set();
  while (centros.length < k && centros.length < pixels.length) {
    const idx = Math.floor(Math.random() * pixels.length);
    if (!usados.has(idx)) {
      usados.add(idx);
      centros.push(pixels[idx].slice());
    }
  }

  for (let iter = 0; iter < iteraciones; iter++) {
    const grupos = [];
    for (let i = 0; i < centros.length; i++) grupos.push([]);

    pixels.forEach(p => {
      let mejorIndice = 0;
      let mejorDistancia = Infinity;
      centros.forEach((c, i) => {
        const distancia = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2;
        if (distancia < mejorDistancia) {
          mejorDistancia = distancia;
          mejorIndice = i;
        }
      });
      grupos[mejorIndice].push(p);
    });

    centros = grupos.map((grupo, i) => {
      if (grupo.length === 0) return centros[i];
      let sumaR = 0, sumaG = 0, sumaB = 0;
      grupo.forEach(p => {
        sumaR += p[0];
        sumaG += p[1];
        sumaB += p[2];
      });
      return [sumaR / grupo.length, sumaG / grupo.length, sumaB / grupo.length];
    });
  }

  return centros.map(c => c.map(v => Math.round(v)));
}

function extractPaletteFromImage(file) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      const maxDim = 160;
      const escala = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * escala));
      canvas.height = Math.max(1, Math.round(img.height * escala));
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      let data;
      try {
        data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      } catch (err) {
        showToast("No se pudo leer esta imagen");
        return;
      }

      const pixeles = [];
      for (let i = 0; i < data.length; i += 8) {
        if (data[i + 3] < 128) continue; // salteo pixeles muy transparentes
        pixeles.push([data[i], data[i + 1], data[i + 2]]);
      }

      const grupos = kMeansColors(pixeles, currentSize, 6);
      currentPalette = grupos.map(rgb => ({ hsl: rgbToHsl(rgb), locked: false }));
      renderPalette();
      pushHistory();
      showToast("Paleta extraída de la imagen");

      extractPreviewImg.src = e.target.result;
      extractPreviewName.textContent = file.name;
      extractPreviewRow.hidden = false;
    };
    img.onerror = () => showToast("No se pudo cargar la imagen");
    img.src = e.target.result;
  };
  reader.onerror = () => showToast("No se pudo leer el archivo");
  reader.readAsDataURL(file);
}

// ===================================
// PALETAS GUARDADAS (manual, en localStorage)
// ===================================

function getSavedPalettes() {
  try {
    const raw = localStorage.getItem("colorfly_saved_palettes");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function setSavedPalettes(palettes) {
  localStorage.setItem("colorfly_saved_palettes", JSON.stringify(palettes));
}

function savePalette() {
  const palettes = getSavedPalettes();
  palettes.unshift({
    id: Date.now(),
    colors: currentPalette.map(c => hslToHex(c.hsl)),
  });
  setSavedPalettes(palettes);
  renderSavedPalettes();
  showToast("Paleta guardada en este navegador");
}

function deleteSavedPalette(id) {
  setSavedPalettes(getSavedPalettes().filter(p => p.id !== id));
  renderSavedPalettes();
  showToast("Paleta eliminada");
}

function clearAllSaved() {
  setSavedPalettes([]);
  renderSavedPalettes();
  showToast("Se borraron todas las paletas guardadas");
}

function loadSavedPalette(id) {
  const entry = getSavedPalettes().find(p => p.id === id);
  if (!entry) return;
  loadPaletteFromHexes(entry.colors);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderSavedPalettes() {
  const palettes = getSavedPalettes();
  savedList.innerHTML = "";

  if (palettes.length === 0) {
    const li = document.createElement("li");
    li.className = "texto-vacio";
    li.textContent = "Todavía no guardaste ninguna paleta.";
    savedList.appendChild(li);
    return;
  }

  palettes.forEach(entry => {
    const li = document.createElement("li");
    li.className = "item-guardado";

    const franja = document.createElement("div");
    franja.className = "franja";
    entry.colors.forEach(hex => {
      const span = document.createElement("span");
      span.style.background = hex;
      franja.appendChild(span);
    });

    const loadBtn = document.createElement("button");
    loadBtn.type = "button";
    loadBtn.textContent = "Cargar";
    loadBtn.addEventListener("click", () => loadSavedPalette(entry.id));

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.textContent = "Eliminar";
    deleteBtn.addEventListener("click", () => deleteSavedPalette(entry.id));

    li.appendChild(franja);
    li.appendChild(loadBtn);
    li.appendChild(deleteBtn);
    savedList.appendChild(li);
  });
}

// ===================================
// GRADIENTE
// ===================================

function buildGradientCss() {
  const hexes = currentPalette.map(c => hslToHex(c.hsl));
  const stops = hexes
    .map((hex, i) => hex + " " + Math.round((i / (hexes.length - 1 || 1)) * 100) + "%")
    .join(", ");
  if (currentGradientType === "radial") {
    return "radial-gradient(circle, " + stops + ")";
  }
  return "linear-gradient(" + currentGradientType + ", " + stops + ")";
}

function updateGradient() {
  gradientPreview.style.background = buildGradientCss();
}

async function copyGradientCss() {
  const css = "background: " + buildGradientCss() + ";";
  try {
    await navigator.clipboard.writeText(css);
    showToast("CSS del gradiente copiado");
  } catch (e) {
    showToast("No se pudo copiar");
  }
}

// ===================================
// SUGERENCIAS DE USO (roles y contraste)
// ===================================

function getPaletteRoles() {
  const items = currentPalette.map(c => ({
    hex: hslToHex(c.hsl),
    h: c.hsl[0],
    s: c.hsl[1],
    l: c.hsl[2],
  }));

  const porLuz = items.slice().sort((a, b) => a.l - b.l);
  const porSaturacion = items.slice().sort((a, b) => b.s - a.s);

  const texto = porLuz[0];
  const fondo = porLuz[porLuz.length - 1];
  let acento = porSaturacion.find(c => c.hex !== texto.hex && c.hex !== fondo.hex);
  if (!acento) acento = porSaturacion[0];

  const secundarios = items.filter(
    c => c.hex !== texto.hex && c.hex !== fondo.hex && c.hex !== acento.hex
  );

  return { fondo, texto, acento, secundarios };
}

function renderRoleCard(etiqueta, hex) {
  const div = document.createElement("div");
  div.className = "tarjeta-rol";
  div.innerHTML =
    '<div class="color" style="background:' + hex + '"></div>' +
    "<div><p class=\"etiqueta\">" + etiqueta + "</p><p class=\"codigo\">" + hex + "</p></div>";
  return div;
}

function updateSuggestions() {
  if (currentPalette.length === 0) return;
  const roles = getPaletteRoles();

  rolesList.innerHTML = "";
  rolesList.appendChild(renderRoleCard("Fondo sugerido", roles.fondo.hex));
  rolesList.appendChild(renderRoleCard("Texto principal", roles.texto.hex));
  rolesList.appendChild(renderRoleCard("Acento / CTA", roles.acento.hex));
  roles.secundarios.slice(0, 3).forEach((c, i) => {
    rolesList.appendChild(renderRoleCard("Secundario " + (i + 1), c.hex));
  });

  // busco los pares de colores con mejor contraste
  const hexes = currentPalette.map(c => hslToHex(c.hsl));
  const pares = [];
  for (let i = 0; i < hexes.length; i++) {
    for (let j = 0; j < hexes.length; j++) {
      if (i === j) continue;
      pares.push({
        fondo: hexes[i],
        texto: hexes[j],
        ratio: contrastRatio(hexes[i], hexes[j]),
      });
    }
  }
  pares.sort((a, b) => b.ratio - a.ratio);
  const mejores = pares.slice(0, 3);

  pairsList.innerHTML = "";
  mejores.forEach(par => {
    const ratioTexto = par.ratio.toFixed(1) + ":1";
    const esBueno = par.ratio >= 4.5;
    const div = document.createElement("div");
    div.className = "tarjeta-par";
    div.innerHTML =
      '<span class="demo" style="background:' + par.fondo + ";color:" + par.texto + '">Aa Texto</span>' +
      '<span class="texto">Fondo ' + par.fondo + " + texto " + par.texto + " - " +
      (esBueno ? "buen contraste, sirve para texto de cuerpo." : "usar solo para texto grande.") +
      "</span>" +
      '<span class="ratio ' + (esBueno ? "ratio-buena" : "ratio-baja") + '">' + ratioTexto + "</span>";
    pairsList.appendChild(div);
  });
}

// ===================================
// EXPORTAR COMO PNG
// ===================================

function downloadPaletteAsPng() {
  if (currentPalette.length === 0) return;

  const anchoColor = 220;
  const altoColor = 260;
  const altoHeader = 50;
  const width = anchoColor * currentPalette.length;
  const height = altoHeader + altoColor;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#f5efe2";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#221e19";
  ctx.font = "bold 20px sans-serif";
  ctx.fillText("Colorfly Studio - Paleta generada", 20, 32);

  currentPalette.forEach((color, i) => {
    const hex = hslToHex(color.hsl);
    const etiqueta = formatColor(color.hsl, currentFormat);
    const colorTexto = getReadableTextColor(color.hsl);

    ctx.fillStyle = hex;
    ctx.fillRect(i * anchoColor, altoHeader, anchoColor, altoColor);

    ctx.fillStyle = colorTexto;
    ctx.font = "bold 14px monospace";
    ctx.textAlign = "center";
    ctx.fillText(etiqueta, i * anchoColor + anchoColor / 2, altoHeader + altoColor - 20);
  });

  const link = document.createElement("a");
  link.download = "paleta-colorfly-" + Date.now() + ".png";
  link.href = canvas.toDataURL("image/png");
  link.click();
  showToast("PNG descargado");
}

// ===================================
// COMPARTIR POR LINK
// ===================================

function buildShareUrl() {
  const hexes = currentPalette.map(c => hslToHex(c.hsl));
  const param = hexes.map(h => h.replace("#", "")).join("-");
  const url = new URL(window.location.href);
  url.searchParams.set("p", param);
  url.searchParams.set("f", currentFormat);
  return url.toString();
}

async function sharePalette() {
  const url = buildShareUrl();
  try {
    await navigator.clipboard.writeText(url);
    showToast("Link copiado, ya lo podés compartir");
  } catch (e) {
    showToast("No se pudo copiar el link");
  }
}

function loadPaletteFromQueryString() {
  const params = new URLSearchParams(window.location.search);
  const p = params.get("p");
  if (!p) return false;

  const hexes = p
    .split("-")
    .map(h => "#" + h)
    .filter(h => /^#[0-9A-Fa-f]{6}$/i.test(h));

  if (hexes.length !== 6 && hexes.length !== 8 && hexes.length !== 9) return false;

  const format = params.get("f");
  if (format === "hsl" || format === "hex") {
    currentFormat = format;
    const formatInput = document.querySelector('input[name="color-format"][value="' + format + '"]');
    if (formatInput) formatInput.checked = true;
  }

  loadPaletteFromHexes(hexes);
  showToast("Paleta cargada desde el link compartido");
  return true;
}

// ===================================
// MODO OSCURO
// ===================================

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeIcon.textContent = theme === "dark" ? "☀️" : "🌙";
}

function initTheme() {
  const guardado = localStorage.getItem(THEME_KEY);
  if (guardado) {
    applyTheme(guardado);
    return;
  }
  const prefiereOscuro = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(prefiereOscuro ? "dark" : "light");
}

// ===================================
// EVENTOS
// ===================================

generateBtn.addEventListener("click", generatePalette);
saveBtn.addEventListener("click", savePalette);
clearSavedBtn.addEventListener("click", clearAllSaved);

sizeInputs.forEach(input => {
  input.addEventListener("change", e => {
    currentSize = Number(e.target.value);
    generatePalette();
  });
});

formatInputs.forEach(input => {
  input.addEventListener("change", e => {
    currentFormat = e.target.value;
    renderPalette();
  });
});

backToTopBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

gradientTypeInputs.forEach(input => {
  input.addEventListener("change", e => {
    currentGradientType = e.target.value;
    updateGradient();
  });
});

copyGradientBtn.addEventListener("click", copyGradientCss);

themeToggle.addEventListener("click", () => {
  const actual = document.documentElement.getAttribute("data-theme");
  const nuevo = actual === "dark" ? "light" : "dark";
  applyTheme(nuevo);
  localStorage.setItem(THEME_KEY, nuevo);
});

downloadPngBtn.addEventListener("click", downloadPaletteAsPng);
printBtn.addEventListener("click", () => window.print());
shareBtn.addEventListener("click", sharePalette);

imageInput.addEventListener("change", e => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    showToast("Elegí un archivo de imagen válido");
    return;
  }
  extractPaletteFromImage(file);
});

// ===================================
// INICIO
// ===================================

function init() {
  initTheme();
  currentSize = Number(document.querySelector('input[name="palette-size"]:checked').value);
  currentFormat = document.querySelector('input[name="color-format"]:checked').value;

  const cargadoDesdeLink = loadPaletteFromQueryString();
  if (!cargadoDesdeLink) {
    generatePalette();
  }

  renderSavedPalettes();
  renderHistory();
}

init();