(function () {
  "use strict";

  function hsvToRgb(h, s, v) {
    h = ((h % 360) + 360) % 360;
    s = clamp(s, 0, 100) / 100;
    v = clamp(v, 0, 100) / 100;

    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;

    let r1, g1, b1;
    if (h < 60) { r1 = c; g1 = x; b1 = 0; }
    else if (h < 120) { r1 = x; g1 = c; b1 = 0; }
    else if (h < 180) { r1 = 0; g1 = c; b1 = x; }
    else if (h < 240) { r1 = 0; g1 = x; b1 = c; }
    else if (h < 300) { r1 = x; g1 = 0; b1 = c; }
    else { r1 = c; g1 = 0; b1 = x; }

    return {
      r: Math.round((r1 + m) * 255),
      g: Math.round((g1 + m) * 255),
      b: Math.round((b1 + m) * 255)
    };
  }

  function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h = 0;
    if (delta !== 0) {
      if (max === r) h = 60 * (((g - b) / delta) % 6);
      else if (max === g) h = 60 * ((b - r) / delta + 2);
      else h = 60 * ((r - g) / delta + 4);
    }
    if (h < 0) h += 360;

    const s = max === 0 ? 0 : delta / max;
    const v = max;

    return { h: h, s: s * 100, v: v * 100 };
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h = 0;
    if (delta !== 0) {
      if (max === r) h = 60 * (((g - b) / delta) % 6);
      else if (max === g) h = 60 * ((b - r) / delta + 2);
      else h = 60 * ((r - g) / delta + 4);
    }
    if (h < 0) h += 360;

    const l = (max + min) / 2;
    const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

    return { h: h, s: s * 100, l: l * 100 };
  }

  function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360;
    s = clamp(s, 0, 100) / 100;
    l = clamp(l, 0, 100) / 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    let r1, g1, b1;
    if (h < 60) { r1 = c; g1 = x; b1 = 0; }
    else if (h < 120) { r1 = x; g1 = c; b1 = 0; }
    else if (h < 180) { r1 = 0; g1 = c; b1 = x; }
    else if (h < 240) { r1 = 0; g1 = x; b1 = c; }
    else if (h < 300) { r1 = x; g1 = 0; b1 = c; }
    else { r1 = c; g1 = 0; b1 = x; }

    return {
      r: Math.round((r1 + m) * 255),
      g: Math.round((g1 + m) * 255),
      b: Math.round((b1 + m) * 255)
    };
  }

  function rgbToHex(r, g, b) {
    const toHex = (n) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
    return "#" + toHex(r) + toHex(g) + toHex(b);
  }

  function hexToRgb(hex) {
    if (!hex) return null;
    hex = hex.trim().replace(/^#/, "");

    if (/^[0-9a-fA-F]{3}$/.test(hex)) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return { r, g, b };
    }
    if (/^[0-9a-fA-F]{6}$/.test(hex)) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return { r, g, b };
    }
    return null;
  }

  function clamp(n, min, max) {
    if (isNaN(n)) return min;
    return Math.min(max, Math.max(min, n));
  }

  const state = { h: 0, s: 0, v: 100 };

  const svWrap    = document.getElementById("svWrap");
  const svCanvas  = document.getElementById("svCanvas");
  const svCursor  = document.getElementById("svCursor");
  const svCtx     = svCanvas.getContext("2d");

  const hueWrap   = document.getElementById("hueWrap");
  const hueCanvas = document.getElementById("hueCanvas");
  const hueCursor = document.getElementById("hueCursor");
  const hueCtx    = hueCanvas.getContext("2d");

  const previewSwatch = document.getElementById("previewSwatch");

  const hexInput = document.getElementById("hexInput");
  const rInput = document.getElementById("rInput");
  const gInput = document.getElementById("gInput");
  const bInput = document.getElementById("bInput");
  const hsvHInput = document.getElementById("hsvHInput");
  const hsvSInput = document.getElementById("hsvSInput");
  const hsvVInput = document.getElementById("hsvVInput");
  const hslHInput = document.getElementById("hslHInput");
  const hslSInput = document.getElementById("hslSInput");
  const hslLInput = document.getElementById("hslLInput");

  const eyedropperBtn = document.getElementById("eyedropperBtn");

  function drawSvSquare() {
    const w = svCanvas.width;
    const h = svCanvas.height;

    const hueRgb = hsvToRgb(state.h, 100, 100);
    svCtx.fillStyle = "rgb(" + hueRgb.r + "," + hueRgb.g + "," + hueRgb.b + ")";
    svCtx.fillRect(0, 0, w, h);

    const whiteGrad = svCtx.createLinearGradient(0, 0, w, 0);
    whiteGrad.addColorStop(0, "rgba(255,255,255,1)");
    whiteGrad.addColorStop(1, "rgba(255,255,255,0)");
    svCtx.fillStyle = whiteGrad;
    svCtx.fillRect(0, 0, w, h);

    const blackGrad = svCtx.createLinearGradient(0, 0, 0, h);
    blackGrad.addColorStop(0, "rgba(0,0,0,0)");
    blackGrad.addColorStop(1, "rgba(0,0,0,1)");
    svCtx.fillStyle = blackGrad;
    svCtx.fillRect(0, 0, w, h);
  }

  function drawHueBar() {
    const w = hueCanvas.width;
    const h = hueCanvas.height;
    const grad = hueCtx.createLinearGradient(0, 0, 0, h);
    const stops = 12;
    for (let i = 0; i <= stops; i++) {
      const hue = (i / stops) * 360;
      const rgb = hsvToRgb(hue, 100, 100);
      grad.addColorStop(i / stops, "rgb(" + rgb.r + "," + rgb.g + "," + rgb.b + ")");
    }
    hueCtx.fillStyle = grad;
    hueCtx.fillRect(0, 0, w, h);
  }

  function updateSvCursorPosition() {
    const rect = svWrap.getBoundingClientRect();
    const x = (state.s / 100) * rect.width;
    const y = (1 - state.v / 100) * rect.height;
    svCursor.style.left = x + "px";
    svCursor.style.top = y + "px";

    svCursor.style.borderColor = state.v > 50 && state.s < 50 ? "#1a1a1a" : "#ffffff";
  }

  function updateHueCursorPosition() {
    const rect = hueWrap.getBoundingClientRect();
    const y = (state.h / 360) * rect.height;
    hueCursor.style.top = y + "px";
  }

  function updateAll(skipField) {
    const rgb = hsvToRgb(state.h, state.s, state.v);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);

    drawSvSquare();
    updateSvCursorPosition();
    updateHueCursorPosition();

    previewSwatch.style.setProperty("--preview-color", hex);

    if (skipField !== hexInput) hexInput.value = hex.toUpperCase();

    if (skipField !== rInput) rInput.value = rgb.r;
    if (skipField !== gInput) gInput.value = rgb.g;
    if (skipField !== bInput) bInput.value = rgb.b;

    if (skipField !== hsvHInput) hsvHInput.value = Math.round(state.h);
    if (skipField !== hsvSInput) hsvSInput.value = Math.round(state.s);
    if (skipField !== hsvVInput) hsvVInput.value = Math.round(state.v);

    if (skipField !== hslHInput) hslHInput.value = Math.round(hsl.h);
    if (skipField !== hslSInput) hslSInput.value = Math.round(hsl.s);
    if (skipField !== hslLInput) hslLInput.value = Math.round(hsl.l);

    [hexInput, rInput, gInput, bInput, hsvHInput, hsvSInput, hsvVInput,
     hslHInput, hslSInput, hslLInput].forEach((el) => {
      if (el !== skipField) el.classList.remove("invalid");
    });
  }

  let svDragging = false;

  function handleSvPointer(clientX, clientY) {
    const rect = svWrap.getBoundingClientRect();
    let x = clientX - rect.left;
    let y = clientY - rect.top;
    x = clamp(x, 0, rect.width);
    y = clamp(y, 0, rect.height);

    state.s = (x / rect.width) * 100;
    state.v = (1 - y / rect.height) * 100;

    updateAll(null);
  }

  svWrap.addEventListener("pointerdown", (e) => {
    svDragging = true;
    svWrap.setPointerCapture(e.pointerId);
    handleSvPointer(e.clientX, e.clientY);
  });

  svWrap.addEventListener("pointermove", (e) => {
    if (!svDragging) return;
    handleSvPointer(e.clientX, e.clientY);
  });

  function stopSvDrag(e) {
    svDragging = false;
    if (svWrap.hasPointerCapture && e && svWrap.hasPointerCapture(e.pointerId)) {
      svWrap.releasePointerCapture(e.pointerId);
    }
  }
  svWrap.addEventListener("pointerup", stopSvDrag);
  svWrap.addEventListener("pointercancel", stopSvDrag);

  let hueDragging = false;

  function handleHuePointer(clientY) {
    const rect = hueWrap.getBoundingClientRect();
    let y = clientY - rect.top;
    y = clamp(y, 0, rect.height);

    state.h = (y / rect.height) * 360;
    if (state.h >= 360) state.h = 359.999;

    updateAll(null);
  }

  hueWrap.addEventListener("pointerdown", (e) => {
    hueDragging = true;
    hueWrap.setPointerCapture(e.pointerId);
    handleHuePointer(e.clientY);
  });

  hueWrap.addEventListener("pointermove", (e) => {
    if (!hueDragging) return;
    handleHuePointer(e.clientY);
  });

  function stopHueDrag(e) {
    hueDragging = false;
    if (hueWrap.hasPointerCapture && e && hueWrap.hasPointerCapture(e.pointerId)) {
      hueWrap.releasePointerCapture(e.pointerId);
    }
  }
  hueWrap.addEventListener("pointerup", stopHueDrag);
  hueWrap.addEventListener("pointercancel", stopHueDrag);

  hexInput.addEventListener("input", () => {
    const rgb = hexToRgb(hexInput.value);
    if (rgb === null) {
      hexInput.classList.add("invalid");
      return;
    }
    hexInput.classList.remove("invalid");
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    state.h = hsv.h; state.s = hsv.s; state.v = hsv.v;
    updateAll(hexInput);
  });

  hexInput.addEventListener("blur", () => {
    updateAll(null);
  });

  function readRgbFields() {
    const rRaw = rInput.value.trim();
    const gRaw = gInput.value.trim();
    const bRaw = bInput.value.trim();

    const rNum = Number(rRaw);
    const gNum = Number(gRaw);
    const bNum = Number(bRaw);

    const rValid = rRaw !== "" && !isNaN(rNum) && rNum >= 0 && rNum <= 255;
    const gValid = gRaw !== "" && !isNaN(gNum) && gNum >= 0 && gNum <= 255;
    const bValid = bRaw !== "" && !isNaN(bNum) && bNum >= 0 && bNum <= 255;

    rInput.classList.toggle("invalid", !rValid);
    gInput.classList.toggle("invalid", !gValid);
    bInput.classList.toggle("invalid", !bValid);

    if (!rValid || !gValid || !bValid) return null;
    return { r: rNum, g: gNum, b: bNum };
  }

  function onRgbInput(sourceField) {
    const rgb = readRgbFields();
    if (rgb === null) return;
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    state.h = hsv.h; state.s = hsv.s; state.v = hsv.v;
    updateAll(sourceField);
  }

  rInput.addEventListener("input", () => onRgbInput(rInput));
  gInput.addEventListener("input", () => onRgbInput(gInput));
  bInput.addEventListener("input", () => onRgbInput(bInput));
  [rInput, gInput, bInput].forEach((el) => el.addEventListener("blur", () => updateAll(null)));

  function readValidated(el, min, max) {
    const raw = el.value.trim();
    const num = Number(raw);
    const valid = raw !== "" && !isNaN(num) && num >= min && num <= max;
    el.classList.toggle("invalid", !valid);
    return valid ? num : null;
  }

  function onHsvInput(sourceField) {
    const h = readValidated(hsvHInput, 0, 360);
    const s = readValidated(hsvSInput, 0, 100);
    const v = readValidated(hsvVInput, 0, 100);
    if (h === null || s === null || v === null) return;
    state.h = h; state.s = s; state.v = v;
    updateAll(sourceField);
  }

  hsvHInput.addEventListener("input", () => onHsvInput(hsvHInput));
  hsvSInput.addEventListener("input", () => onHsvInput(hsvSInput));
  hsvVInput.addEventListener("input", () => onHsvInput(hsvVInput));
  [hsvHInput, hsvSInput, hsvVInput].forEach((el) => el.addEventListener("blur", () => updateAll(null)));

  function onHslInput(sourceField) {
    const h = readValidated(hslHInput, 0, 360);
    const s = readValidated(hslSInput, 0, 100);
    const l = readValidated(hslLInput, 0, 100);
    if (h === null || s === null || l === null) return;
    const rgb = hslToRgb(h, s, l);
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    state.h = hsv.h; state.s = hsv.s; state.v = hsv.v;
    updateAll(sourceField);
  }

  hslHInput.addEventListener("input", () => onHslInput(hslHInput));
  hslSInput.addEventListener("input", () => onHslInput(hslSInput));
  hslLInput.addEventListener("input", () => onHslInput(hslLInput));
  [hslHInput, hslSInput, hslLInput].forEach((el) => el.addEventListener("blur", () => updateAll(null)));

  document.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = btn.getAttribute("data-copy");
      const rgb = hsvToRgb(state.h, state.s, state.v);
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);

      let text = "";
      if (type === "hex") text = hex.toUpperCase();
      else if (type === "rgb") text = "rgb(" + rgb.r + ", " + rgb.g + ", " + rgb.b + ")";
      else if (type === "hsv") text = "hsv(" + Math.round(state.h) + ", " + Math.round(state.s) + "%, " + Math.round(state.v) + "%)";
      else if (type === "hsl") text = "hsl(" + Math.round(hsl.h) + ", " + Math.round(hsl.s) + "%, " + Math.round(hsl.l) + "%)";

      copyToClipboard(text, btn);
    });
  });

  function copyToClipboard(text, btn) {
    const showSuccess = () => {
      const original = btn.textContent;
      btn.textContent = "Kopiert!";
      btn.classList.add("copied");
      setTimeout(() => {
        btn.textContent = original;
        btn.classList.remove("copied");
      }, 1200);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(showSuccess).catch(() => fallbackCopy(text, showSuccess));
    } else {
      fallbackCopy(text, showSuccess);
    }
  }

  function fallbackCopy(text, onSuccess) {
    const tmp = document.createElement("textarea");
    tmp.value = text;
    tmp.style.position = "fixed";
    tmp.style.opacity = "0";
    document.body.appendChild(tmp);
    tmp.select();
    try {
      document.execCommand("copy");
      onSuccess();
    } catch (err) {

    }
    document.body.removeChild(tmp);
  }

  eyedropperBtn.addEventListener("click", async () => {
    if (typeof window.EyeDropper === "function") {
      try {
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        const rgb = hexToRgb(result.sRGBHex);
        if (rgb) {
          const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
          state.h = hsv.h;
          state.s = hsv.s;
          state.v = hsv.v;
          updateAll(null);
        }
      } catch (err) {
        
      }
    } else {
      eyedropperBtn.style.opacity = "0.4";
      setTimeout(() => { eyedropperBtn.style.opacity = "1"; }, 400);
    }
  });

  window.addEventListener("resize", () => {
    updateSvCursorPosition();
    updateHueCursorPosition();
  });

  drawHueBar();
  updateAll(null);

})();
