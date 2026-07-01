/* ===========================================================
   Colorfly Studio — Generador de Paletas Interactivo
   script.js
   =========================================================== */

(() => {
  'use strict';

  // ---------- State ----------
  /** @type {{hsl: [number, number, number], locked: boolean}[]} */
  let currentPalette = [];
  let currentSize = 6;
  let currentFormat = 'hex';

  const STORAGE_KEY = 'colorfly_saved_palettes';

  // ---------- DOM refs ----------
  const paletteList = document.getElementById('palette-list');
  const generateBtn = document.getElementById('generate-btn');
  const saveBtn = document.getElementById('save-btn');
  const clearSavedBtn = document.getElementById('clear-saved-btn');
  const savedList = document.getElementById('saved-list');
  const toastEl = document.getElementById('toast');
  const sizeInputs = document.querySelectorAll('input[name="palette-size"]');
  const formatInputs = document.querySelectorAll('input[name="color-format"]');
  const backToTopBtn = document.getElementById('back-to-top');
  const gradientPreview = document.getElementById('gradient-preview');
  const gradientTypeInputs = document.querySelectorAll('input[name="gradient-type"]');
  const copyGradientBtn = document.getElementById('copy-gradient-btn');
  const rolesList = document.getElementById('roles-list');
  const pairsList = document.getElementById('pairs-list');

  let currentGradientType = '135deg';

  // ---------- Color helpers ----------

  // Punto de partida de matiz aleatorio en cada generación, para que las
  // paletas no siempre arranquen del mismo lugar de la rueda de color.
  let hueCursor = Math.random() * 360;

  /**
   * Genera un color HSL "distinto" en cada llamada, avanzando el matiz con
   * el ángulo áureo (~137.5°). Esto evita que colores consecutivos queden
   * muy parecidos entre sí y da paletas más variadas y vivas.
   */
  function randomHsl() {
    hueCursor = (hueCursor + 137.5 + (Math.random() * 20 - 10)) % 360;
    const h = Math.floor(hueCursor);
    const s = Math.floor(Math.random() * 55) + 40; // 40–95%
    const l = Math.floor(Math.random() * 55) + 25; // 25–80%
    return [h, s, l];
  }

  function hslToString([h, s, l]) {
    return `hsl(${h}, ${s}%, ${l}%)`;
  }

  function hslToHex([h, s, l]) {
    s /= 100;
    l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n =>
      l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const toHex = x => Math.round(255 * x).toString(16).padStart(2, '0');
    return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`.toUpperCase();
  }

  /** Decide si el texto sobre el swatch debe ser claro u oscuro según luminosidad */
  function getReadableTextColor([h, s, l]) {
    return l > 60 ? '#1B1B1F' : '#FFFFFF';
  }

  function formatColor(hsl, format) {
    return format === 'hex' ? hslToHex(hsl) : hslToString(hsl);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Genera una escalera de tints/shades para un color: del más oscuro al
   * más claro, manteniendo el mismo matiz. Sirve para ver variaciones
   * tonales usables como estados (hover, fondos suaves, bordes, etc).
   */
  function getVariations([h, s, l]) {
    const steps = [-36, -18, 0, 18, 36];
    return steps.map(delta => {
      const newL = clamp(l + delta, 6, 95);
      const newS = delta === 0 ? s : clamp(s - Math.abs(delta) * 0.15, 15, 100);
      return [h, Math.round(newS), Math.round(newL)];
    });
  }

  // ---------- WCAG contrast helpers ----------
  function hexToRgbArray(hex) {
    return [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];
  }

  function relativeLuminance([r, g, b]) {
    const [rs, gs, bs] = [r, g, b].map(c => {
      const v = c / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  function contrastRatio(hexA, hexB) {
    const lumA = relativeLuminance(hexToRgbArray(hexA));
    const lumB = relativeLuminance(hexToRgbArray(hexB));
    const lighter = Math.max(lumA, lumB);
    const darker = Math.min(lumA, lumB);
    return (lighter + 0.05) / (darker + 0.05);
  }

  // ---------- Toast ----------
  let toastTimer = null;
  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('is-visible');
    }, 2200);
  }

  // ---------- Palette generation ----------
  function generatePalette() {
    generateBtn.classList.add('is-spinning');
    setTimeout(() => generateBtn.classList.remove('is-spinning'), 400);

    const next = [];
    for (let i = 0; i < currentSize; i++) {
      const existing = currentPalette[i];
      if (existing && existing.locked) {
        next.push(existing);
      } else {
        next.push({ hsl: randomHsl(), locked: false });
      }
    }
    currentPalette = next;
    renderPalette();
    showToast('Nueva paleta generada ✓');
  }

  function renderPalette() {
    paletteList.dataset.size = String(currentSize);
    paletteList.style.setProperty('--cols', String(currentSize <= 6 ? 3 : currentSize <= 8 ? 4 : 3));
    // Use a responsive column count: aim for ~3 columns on wider rows automatically via CSS,
    // but ensure base columns scale with palette size for desktop layout.
    if (currentSize === 6) paletteList.style.setProperty('--cols', '3');
    if (currentSize === 8) paletteList.style.setProperty('--cols', '4');
    if (currentSize === 9) paletteList.style.setProperty('--cols', '3');

    paletteList.innerHTML = '';

    currentPalette.forEach((color, index) => {
      const hex = hslToHex(color.hsl);
      const textColor = getReadableTextColor(color.hsl);
      const displayCode = formatColor(color.hsl, currentFormat);

      const li = document.createElement('li');
      li.className = 'swatch';
      li.style.background = hex;
      li.style.color = textColor;
      li.style.animationDelay = `${index * 45}ms`;
      if (color.locked) li.classList.add('is-locked');

      const top = document.createElement('div');
      top.className = 'swatch__top';

      const lockBtn = document.createElement('button');
      lockBtn.type = 'button';
      lockBtn.className = 'swatch__lock';
      lockBtn.style.color = '#1B1B1F';
      lockBtn.setAttribute(
        'aria-label',
        color.locked ? `Desbloquear color ${hex}` : `Bloquear color ${hex}`
      );
      lockBtn.setAttribute('aria-pressed', String(color.locked));
      lockBtn.textContent = color.locked ? '🔒' : '🔓';
      lockBtn.addEventListener('click', () => toggleLock(index));

      top.appendChild(lockBtn);
      li.appendChild(top);

      const codeBtn = document.createElement('button');
      codeBtn.type = 'button';
      codeBtn.className = 'swatch__code-btn';
      codeBtn.style.color = '#1B1B1F';
      codeBtn.textContent = displayCode;
      codeBtn.setAttribute('aria-label', `Copiar código ${displayCode} al portapapeles`);
      codeBtn.addEventListener('click', () => copyToClipboard(displayCode));

      li.appendChild(codeBtn);

      const variationsRow = document.createElement('div');
      variationsRow.className = 'swatch__variations';
      getVariations(color.hsl).forEach(variantHsl => {
        const variantHex = hslToHex(variantHsl);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.style.background = variantHex;
        btn.setAttribute('aria-label', `Copiar variación ${variantHex}`);
        btn.addEventListener('click', e => {
          e.stopPropagation();
          copyToClipboard(variantHex, 'variación');
        });
        variationsRow.appendChild(btn);
      });
      li.appendChild(variationsRow);

      paletteList.appendChild(li);
    });

    updateGradient();
    updateSuggestions();
  }

  function toggleLock(index) {
    currentPalette[index].locked = !currentPalette[index].locked;
    renderPalette();
    showToast(currentPalette[index].locked ? 'Color bloqueado' : 'Color desbloqueado');
  }

  // ---------- Gradient ----------
  function buildGradientCss() {
    const hexes = currentPalette.map(c => hslToHex(c.hsl));
    const stops = hexes
      .map((hex, i) => `${hex} ${Math.round((i / (hexes.length - 1 || 1)) * 100)}%`)
      .join(', ');
    return currentGradientType === 'radial'
      ? `radial-gradient(circle, ${stops})`
      : `linear-gradient(${currentGradientType}, ${stops})`;
  }

  function updateGradient() {
    const css = buildGradientCss();
    gradientPreview.style.background = css;
  }

  // ---------- Role & combination suggestions ----------
  function getPaletteRoles() {
    const items = currentPalette.map(c => ({
      hex: hslToHex(c.hsl),
      h: c.hsl[0], s: c.hsl[1], l: c.hsl[2],
    }));

    const byLightness = [...items].sort((a, b) => a.l - b.l);
    const bySaturation = [...items].sort((a, b) => b.s - a.s);

    const text = byLightness[0];
    const bg = byLightness[byLightness.length - 1];
    const accent = bySaturation.find(c => c.hex !== text.hex && c.hex !== bg.hex) || bySaturation[0];
    const secondary = items.filter(
      c => c.hex !== text.hex && c.hex !== bg.hex && c.hex !== accent.hex
    );

    return { bg, text, accent, secondary };
  }

  function renderRoleCard(label, hex) {
    const card = document.createElement('div');
    card.className = 'role-card';
    card.innerHTML = `
      <div class="role-card__swatch" style="background:${hex}"></div>
      <div>
        <p class="role-card__label">${label}</p>
        <p class="role-card__code">${hex}</p>
      </div>
    `;
    return card;
  }

  function updateSuggestions() {
    if (currentPalette.length === 0) return;
    const { bg, text, accent, secondary } = getPaletteRoles();

    rolesList.innerHTML = '';
    rolesList.appendChild(renderRoleCard('Fondo sugerido', bg.hex));
    rolesList.appendChild(renderRoleCard('Texto principal', text.hex));
    rolesList.appendChild(renderRoleCard('Acento / CTA', accent.hex));
    secondary.slice(0, 3).forEach((c, i) => {
      rolesList.appendChild(renderRoleCard(`Secundario ${i + 1}`, c.hex));
    });

    // Mejores pares de contraste para texto sobre fondo
    const hexes = currentPalette.map(c => hslToHex(c.hsl));
    const pairs = [];
    for (let i = 0; i < hexes.length; i++) {
      for (let j = 0; j < hexes.length; j++) {
        if (i === j) continue;
        pairs.push({
          bg: hexes[i],
          fg: hexes[j],
          ratio: contrastRatio(hexes[i], hexes[j]),
        });
      }
    }
    pairs.sort((a, b) => b.ratio - a.ratio);
    const topPairs = pairs.slice(0, 3);

    pairsList.innerHTML = '';
    topPairs.forEach(pair => {
      const ratioLabel = `${pair.ratio.toFixed(1)}:1`;
      const isAA = pair.ratio >= 4.5;
      const card = document.createElement('div');
      card.className = 'pair-card';
      card.innerHTML = `
        <span class="pair-card__demo" style="background:${pair.bg};color:${pair.fg}">Aa Texto</span>
        <span class="pair-card__text">Fondo ${pair.bg} + texto ${pair.fg} — ${
          isAA ? 'buen contraste, sirve para texto de cuerpo.' : 'usar solo para texto grande o decorativo.'
        }</span>
        <span class="pair-card__ratio ${isAA ? 'pair-card__ratio--aa' : 'pair-card__ratio--low'}">${ratioLabel} ${isAA ? '· AA' : ''}</span>
      `;
      pairsList.appendChild(card);
    });
  }

  async function copyGradientCss() {
    const css = `background: ${buildGradientCss()};`;
    try {
      await navigator.clipboard.writeText(css);
      showToast('CSS del gradiente copiado');
    } catch {
      showToast('No se pudo copiar. Copialo manualmente.');
    }
  }

  async function copyToClipboard(text, label = 'código') {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`Copiado (${label}): ${text}`);
    } catch (err) {
      showToast('No se pudo copiar. Copialo manualmente.');
    }
  }

  // ---------- Saved palettes (localStorage) ----------
  function getSavedPalettes() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function setSavedPalettes(palettes) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(palettes));
  }

  function savePalette() {
    const palettes = getSavedPalettes();
    const entry = {
      id: Date.now(),
      colors: currentPalette.map(c => hslToHex(c.hsl)),
    };
    palettes.unshift(entry);
    setSavedPalettes(palettes);
    renderSavedPalettes();
    showToast('Paleta guardada en este navegador');
  }

  function deleteSavedPalette(id) {
    const palettes = getSavedPalettes().filter(p => p.id !== id);
    setSavedPalettes(palettes);
    renderSavedPalettes();
    showToast('Paleta eliminada');
  }

  function clearAllSaved() {
    setSavedPalettes([]);
    renderSavedPalettes();
    showToast('Se borraron todas las paletas guardadas');
  }

  function loadSavedPalette(id) {
    const palettes = getSavedPalettes();
    const entry = palettes.find(p => p.id === id);
    if (!entry) return;

    currentSize = entry.colors.length;
    document.querySelector(`input[name="palette-size"][value="${currentSize}"]`)?.click();

    currentPalette = entry.colors.map(hex => ({ hsl: hexToHsl(hex), locked: false }));
    renderPalette();
    showToast('Paleta cargada');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      switch (max) {
        case r: h = ((g - b) / d) % 6; break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h = Math.round(h * 60);
      if (h < 0) h += 360;
    }
    return [h, Math.round(s * 100), Math.round(l * 100)];
  }

  function renderSavedPalettes() {
    const palettes = getSavedPalettes();
    savedList.innerHTML = '';

    if (palettes.length === 0) {
      const li = document.createElement('li');
      li.className = 'saved__empty';
      li.textContent = 'Todavía no guardaste ninguna paleta.';
      savedList.appendChild(li);
      return;
    }

    palettes.forEach(entry => {
      const li = document.createElement('li');
      li.className = 'saved__item';

      const swatches = document.createElement('div');
      swatches.className = 'saved__swatches';
      entry.colors.forEach(hex => {
        const span = document.createElement('span');
        span.style.background = hex;
        swatches.appendChild(span);
      });

      const meta = document.createElement('span');
      meta.className = 'saved__meta';
      meta.textContent = `${entry.colors.length} colores`;

      const loadBtn = document.createElement('button');
      loadBtn.type = 'button';
      loadBtn.className = 'saved__load';
      loadBtn.textContent = 'Cargar';
      loadBtn.addEventListener('click', () => loadSavedPalette(entry.id));

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'saved__delete';
      deleteBtn.textContent = 'Eliminar';
      deleteBtn.setAttribute('aria-label', `Eliminar paleta de ${entry.colors.length} colores`);
      deleteBtn.addEventListener('click', () => deleteSavedPalette(entry.id));

      li.append(swatches, meta, loadBtn, deleteBtn);
      savedList.appendChild(li);
    });
  }

  // ---------- Event listeners ----------
  generateBtn.addEventListener('click', generatePalette);
  saveBtn.addEventListener('click', savePalette);
  clearSavedBtn.addEventListener('click', clearAllSaved);

  sizeInputs.forEach(input => {
    input.addEventListener('change', e => {
      currentSize = Number(e.target.value);
      generatePalette();
    });
  });

  formatInputs.forEach(input => {
    input.addEventListener('change', e => {
      currentFormat = e.target.value;
      renderPalette();
    });
  });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  gradientTypeInputs.forEach(input => {
    input.addEventListener('change', e => {
      currentGradientType = e.target.value;
      updateGradient();
    });
  });

  copyGradientBtn.addEventListener('click', copyGradientCss);

  // ---------- Init ----------
  function init() {
    currentSize = Number(document.querySelector('input[name="palette-size"]:checked').value);
    currentFormat = document.querySelector('input[name="color-format"]:checked').value;
    generatePalette();
    renderSavedPalettes();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
