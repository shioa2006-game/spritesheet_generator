// 繝励Ξ繝薙Η繝ｼ繧ｭ繝｣繝ｳ繝舌せ縺ｮ蟷・ｒ螳夂ｾｩ
const canvasSize = 384;
// 繝励Ξ繝薙Η繝ｼ閭梧勹縺ｮ繧ｻ繝ｫ蟷・ｒ螳夂ｾｩ
const cellSize = 24;
// 繧ｹ繝励Λ繧､繝医・莉墓ｧ倥ｒ縺ｾ縺ｨ繧√※螳夂ｾｩ
const spriteSpec = {
  edge: 12,
  minValue: 0,
  maxValue: 32
};

// 繝代Ξ繝・ヨ螳夂ｾｩ・郁ｦ∽ｻｶ縺ｨ蜷後§鬆・ｺ上〒菫晄戟・・
const palette = {
  0: "transparent",
  1: "#000000",
  2: "#222034",
  3: "#45283c",
  4: "#663931",
  5: "#8f563b",
  6: "#df7126",
  7: "#d9a066",
  8: "#eec39a",
  9: "#fbf236",
  10: "#99e550",
  11: "#6abe30",
  12: "#37946e",
  13: "#4b692f",
  14: "#524b24",
  15: "#323c39",
  16: "#3f3f74",
  17: "#306082",
  18: "#5b6ee1",
  19: "#639bff",
  20: "#5fcde4",
  21: "#cbdbfc",
  22: "#ffffff",
  23: "#9badb7",
  24: "#847e87",
  25: "#696a6a",
  26: "#595652",
  27: "#76428a",
  28: "#ac3232",
  29: "#d95763",
  30: "#d77bba",
  31: "#8f974a",
  32: "#8a6f30"
};

// 繧｢繝励Μ蜈ｨ菴薙・迥ｶ諷九ｒ縺薙％縺ｧ菫晄戟
const state = {
  sprites: [],
  layout: {
    columns: 8,
    padding: 0,
    margin: 0,
    spriteSize: spriteSpec.edge
  }
};

const layoutPresets = {
  default: { columns: 8, padding: 0, margin: 0 },
  tight: { columns: 12, padding: 0, margin: 0 },
  spaced: { columns: 6, padding: 2, margin: 2 },
  custom: null
};

// DOM蜿ら・繧偵∪縺ｨ繧√※菫晄戟
const domRefs = {
  spriteInput: null,
  addButton: null,
  clearButton: null,
  errorMessage: null,
  spriteList: null,
  spriteListEmpty: null,
  clearAllButton: null,
  previewInfo: null,
  exportButton: null,
  layoutColumns: null,
  layoutPadding: null,
  layoutMargin: null,
  layoutPreset: null
};

function setup() {
  // p5.js繧ｭ繝｣繝ｳ繝舌せ繧堤函謌舌＠縺ｦDOM縺ｫ謗･邯・
  const canvas = createCanvas(canvasSize, canvasSize);
  canvas.parent("p5-container");
  noSmooth();

  // DOM隕∫ｴ繧貞叙蠕励＠縺ｦ繧ｭ繝｣繝・す繝･
  domRefs.spriteInput = document.getElementById("spriteInput");
  domRefs.addButton = document.getElementById("addButton");
  domRefs.clearButton = document.getElementById("clearButton");
  domRefs.errorMessage = document.getElementById("errorMessage");
  domRefs.spriteList = document.getElementById("spriteList");
  domRefs.spriteListEmpty = document.getElementById("spriteListEmpty");
  domRefs.clearAllButton = document.getElementById("clearAllButton");
  domRefs.previewInfo = document.getElementById("previewInfo");
  domRefs.exportButton = document.getElementById("exportButton");
  domRefs.layoutColumns = document.getElementById("layoutColumns");
  domRefs.layoutPadding = document.getElementById("layoutPadding");
  domRefs.layoutMargin = document.getElementById("layoutMargin");
  domRefs.layoutPreset = document.getElementById("layoutPreset");

  // 繧､繝吶Φ繝医ワ繝ｳ繝峨Λ繧堤ｴ蝉ｻ倥￠
  domRefs.addButton.addEventListener("click", handleAddClick);
  domRefs.clearButton.addEventListener("click", handleClearClick);
  if (domRefs.spriteInput) {
    domRefs.spriteInput.addEventListener("input", () => updateErrorMessage(""));
  }
  if (domRefs.clearAllButton) {
    domRefs.clearAllButton.addEventListener("click", handleClearAllClick);
  }
  if (domRefs.spriteList) {
    domRefs.spriteList.addEventListener("click", handleSpriteListClick);
  }
  if (domRefs.layoutColumns) {
    domRefs.layoutColumns.addEventListener("change", handleLayoutSelectChange);
  }
  if (domRefs.layoutPadding) {
    domRefs.layoutPadding.addEventListener("change", handleLayoutSelectChange);
  }
  if (domRefs.layoutMargin) {
    domRefs.layoutMargin.addEventListener("change", handleLayoutSelectChange);
  }
  if (domRefs.layoutPreset) {
    domRefs.layoutPreset.addEventListener("change", handleLayoutPresetChange);
  }
  if (domRefs.exportButton) {
    domRefs.exportButton.addEventListener("click", handleExportClick);
  }

  renderSpriteList();
  syncLayoutSelectors();
  updateExportButtonState();
}

function draw() {
  // 閭梧勹繝代ち繝ｼ繝ｳ繧呈緒逕ｻ縺励※縺九ｉ繧ｹ繝励Λ繧､繝医ｒ驟咲ｽｮ
  background(255);
  drawBackgroundPattern();
  const metrics = updatePreviewStatistics();
  drawSpritesOnPreview(metrics);
  noLoop();
}

// 霑ｽ蜉繝懊ち繝ｳ謚ｼ荳区凾縺ｮ蜃ｦ逅・
function handleAddClick() {
  const rawText = domRefs.spriteInput ? domRefs.spriteInput.value.trim() : "";
  const validation = parseSpriteText(rawText);
  if (!validation.ok) {
    updateErrorMessage(validation.message);
    return;
  }

  if (state.sprites.length >= 256) {
    updateErrorMessage("スプライトの最大数に達しました（上限: 256個）。");
    return;
  }

  const spriteId = generateSpriteId();
  state.sprites.push({
    id: spriteId,
    data: validation.data
  });
  updateErrorMessage(`スプライトを追加しました（現在: ${state.sprites.length}個）。`);
  if (domRefs.spriteInput) {
    domRefs.spriteInput.value = "";
  }

  renderSpriteList();
  loop();
  redraw();
}

// 繧ｯ繝ｪ繧｢繝懊ち繝ｳ謚ｼ荳区凾縺ｮ蜃ｦ逅・
function handleClearClick() {
  if (domRefs.spriteInput) {
    domRefs.spriteInput.value = "";
  }
  updateErrorMessage("入力エリアをクリアしました。");
  loop();
  redraw();
}

// 蜈ｨ蜑企勁繝懊ち繝ｳ謚ｼ荳区凾縺ｮ蜃ｦ逅・
function handleClearAllClick() {
  if (state.sprites.length === 0) {
    updateErrorMessage("削除するスプライトがありません。");
    return;
  }
  const shouldClear = window.confirm("登録済みのスプライトをすべて削除しますか？");
  if (!shouldClear) {
    return;
  }
  state.sprites = [];
  renderSpriteList();
  updateErrorMessage("全てのスプライトを削除しました。");
  loop();
  redraw();
}

// PNG蜃ｺ蜉帙・繧ｿ繝ｳ謚ｼ荳区凾縺ｮ蜃ｦ逅・
function handleExportClick() {
  if (state.sprites.length === 0) {
    updateErrorMessage("出力するスプライトがありません。");
    return;
  }
  updateErrorMessage("PNG出力を準備しています…");

  if (state.sprites.length === 1) {
    const singleCanvas = generateSingleSpriteCanvas(state.sprites[0].data);
    if (!singleCanvas) {
      updateErrorMessage("単体スプライトのPNG出力に失敗しました。");
      return;
    }
    downloadCanvasAsPng(singleCanvas, { type: "single" });
    return;
  }

  const sheetLayout = {
    columns: 8,
    padding: 0,
    margin: 0,
    spriteSize: spriteSpec.edge
  };
  const metrics = calculateSheetMetrics(state.sprites.length, sheetLayout);
  const sheetCanvas = generateSpriteSheetCanvas(metrics, sheetLayout);
  if (!sheetCanvas) {
    updateErrorMessage("スプライトシートのPNG出力に失敗しました。");
    return;
  }
  downloadCanvasAsPng(sheetCanvas, {
    type: "sheet",
    columns: sheetLayout.columns,
    rows: metrics.rows
  });
}

// 繝√ぉ繝・き繝ｼ繝代ち繝ｼ繝ｳ繧偵く繝｣繝ｳ繝舌せ蜈ｨ菴薙↓謠冗判
function drawBackgroundPattern() {
  noStroke();
  for (let y = 0; y < height; y += cellSize) {
    for (let x = 0; x < width; x += cellSize) {
      const isLight = (Math.floor(x / cellSize) + Math.floor(y / cellSize)) % 2 === 0;
      fill(isLight ? 224 : 255);
      rect(x, y, cellSize, cellSize);
    }
  }
}

// 繝励Ξ繝薙Η繝ｼ逕ｨ縺ｫ繧ｹ繝励Λ繧､繝医ｒ縺吶∋縺ｦ謠冗判
function drawSpritesOnPreview(metrics) {
  if (state.sprites.length === 0) {
    return;
  }

  const scale = determineScale(metrics.sheetWidth, metrics.sheetHeight);
  const offset = calculateSheetOffset(metrics.sheetWidth, metrics.sheetHeight, scale);
  const { columns, padding, margin, spriteSize } = state.layout;

  state.sprites.forEach((sprite, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const baseX =
      offset.x + (margin + col * (spriteSize + padding)) * scale;
    const baseY =
      offset.y + (margin + row * (spriteSize + padding)) * scale;
    drawSpritePixels(sprite.data, baseX, baseY, scale);
  });
}

// 荳縺､縺ｮ繧ｹ繝励Λ繧､繝医ｒ繝斐け繧ｻ繝ｫ蜊倅ｽ阪〒謠冗判
function drawSpritePixels(sprite, baseX, baseY, scale) {
  const { spriteSize } = state.layout;
  noStroke();
  for (let y = 0; y < spriteSize; y += 1) {
    for (let x = 0; x < spriteSize; x += 1) {
      const value = sprite[y][x];
      if (value === 0) {
        continue;
      }
      const color = palette[value] || "#000000";
      fill(color);
      const drawX = baseX + x * scale;
      const drawY = baseY + y * scale;
      rect(drawX, drawY, scale, scale);
    }
  }
}

// 繧ｷ繝ｼ繝医し繧､繧ｺ縺ｨ陦梧焚繧定ｨ育ｮ・
function calculateSheetMetrics(spriteCount, layout = state.layout) {
  const { columns, padding, margin, spriteSize } = layout;
  const rows = spriteCount === 0 ? 0 : Math.ceil(spriteCount / columns);
  const sheetWidth =
    columns * spriteSize +
    Math.max(0, columns - 1) * padding +
    margin * 2;
  const sheetHeight =
    rows * spriteSize +
    Math.max(0, rows - 1) * padding +
    margin * 2;
  return { rows, sheetWidth, sheetHeight };
}

// 繧ｭ繝｣繝ｳ繝舌せ縺ｫ蜿弱ａ繧九◆繧√・繧ｹ繧ｱ繝ｼ繝ｫ繧呈ｱｺ螳・
function determineScale(sheetWidth, sheetHeight) {
  if (sheetWidth === 0 || sheetHeight === 0) {
    return 1;
  }
  const maxSide = Math.max(sheetWidth, sheetHeight);
  const fitScale = canvasSize / maxSide;
  if (fitScale >= 1) {
    const integerScale = Math.floor(fitScale);
    return Math.min(4, Math.max(1, integerScale));
  }
  return fitScale;
}

// 繧ｷ繝ｼ繝亥・菴薙ｒ荳ｭ螟ｮ縺ｫ驟咲ｽｮ縺吶ｋ縺溘ａ縺ｮ繧ｪ繝輔そ繝・ヨ繧定ｨ育ｮ・
function calculateSheetOffset(sheetWidth, sheetHeight, scale) {
  const drawnWidth = sheetWidth * scale;
  const drawnHeight = sheetHeight * scale;
  return {
    x: (canvasSize - drawnWidth) / 2,
    y: (canvasSize - drawnHeight) / 2
  };
}

// 繝励Ξ繝薙Η繝ｼ諠・ｱ縺ｮ陦ｨ遉ｺ繧呈峩譁ｰ

// 蜃ｺ蜉帷畑繧ｹ繝励Λ繧､繝医す繝ｼ繝・anvas繧堤函謌・
function generateSpriteSheetCanvas(metrics, layout = state.layout) {
  const { columns, padding, margin, spriteSize } = layout;
  const { sheetWidth, sheetHeight } = metrics;
  const canvas = document.createElement("canvas");
  canvas.width = sheetWidth;
  canvas.height = sheetHeight;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) {
    return null;
  }
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, sheetWidth, sheetHeight);

  state.sprites.forEach((spriteItem, index) => {
    const sprite = spriteItem.data;
    const col = index % columns;
    const row = Math.floor(index / columns);
    const baseX = margin + col * (spriteSize + padding);
    const baseY = margin + row * (spriteSize + padding);
    for (let y = 0; y < spriteSize; y += 1) {
      for (let x = 0; x < spriteSize; x += 1) {
        const value = sprite[y][x];
        if (value === 0) {
          continue;
        }
        ctx.fillStyle = palette[value] || "#000000";
        ctx.fillRect(baseX + x, baseY + y, 1, 1);
      }
    }
  });

  return canvas;
}


// 単体スプライトをPNG用キャンバスに変換
function generateSingleSpriteCanvas(sprite) {
  const size = spriteSpec.edge;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) {
    return null;
  }
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, size, size);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const value = sprite[y][x];
      if (value === 0) {
        continue;
      }
      ctx.fillStyle = palette[value] || "#000000";
      ctx.fillRect(x, y, 1, 1);
    }
  }

  return canvas;
}

// Canvas繧単NG縺ｨ縺励※繝繧ｦ繝ｳ繝ｭ繝ｼ繝・
function downloadCanvasAsPng(canvas, options) {
  const timestamp = formatTimestamp(new Date());
  let filename;
  if (options?.type === "single") {
    filename = `sprite_${timestamp}.png`;
  } else {
    const columns = options?.columns ?? state.layout.columns;
    const rows = options?.rows ?? calculateSheetMetrics(state.sprites.length).rows;
    filename = `spritesheet_${columns}x${rows}_${timestamp}.png`;
  }
  const triggerDownload = (blob) => {
    if (!blob) {
      updateErrorMessage("PNG出力に失敗しました。");
      return;
    }
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    updateErrorMessage(`PNGファイル「${filename}」をダウンロードしました。`);
  };

  if (canvas.toBlob) {
    canvas.toBlob((blob) => triggerDownload(blob), "image/png");
  } else {
    const dataUrl = canvas.toDataURL("image/png");
    const byteString = atob(dataUrl.split(",")[1]);
    const mimeString = dataUrl.split(",")[0].split(":")[1].split(";")[0];
    const buffer = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i += 1) {
      buffer[i] = byteString.charCodeAt(i);
    }
    triggerDownload(new Blob([buffer], { type: mimeString }));
  }
}

function updatePreviewStatistics() {
  const metrics = calculateSheetMetrics(state.sprites.length);
  if (domRefs.previewInfo) {
    domRefs.previewInfo.textContent = "スプライト数: " + state.sprites.length + "個 / サイズ: " + metrics.sheetWidth + "x" + metrics.sheetHeight + "px / グリッド: " + state.layout.columns + "列x" + metrics.rows + "行";
  }
  return metrics;
}

// 繧ｹ繝励Λ繧､繝井ｸ隕ｧ縺ｮ陦ｨ遉ｺ繧呈峩譁ｰ
function renderSpriteList() {
  if (!domRefs.spriteList) {
    return;
  }

  domRefs.spriteList.innerHTML = "";
  const fragment = document.createDocumentFragment();

  state.sprites.forEach((sprite, index) => {
    const card = document.createElement("div");
    card.className = "sprite-card";

    const thumbWrapper = document.createElement("div");
    thumbWrapper.className = "sprite-thumb";

    const indexLabel = document.createElement("span");
    indexLabel.className = "sprite-index";
    indexLabel.textContent = "#" + index;
    thumbWrapper.appendChild(indexLabel);

    const thumbnailCanvas = createSpriteThumbnail(sprite.data);
    thumbWrapper.appendChild(thumbnailCanvas);

    const deleteButton = document.createElement("button");
    deleteButton.className = "sprite-delete";
    deleteButton.type = "button";
    deleteButton.textContent = "蜑企勁";
    deleteButton.dataset.action = "delete";
    deleteButton.dataset.id = sprite.id;

    card.appendChild(thumbWrapper);
    card.appendChild(deleteButton);
    fragment.appendChild(card);
  });

  domRefs.spriteList.appendChild(fragment);
  updateSpriteListEmptyState();
  updateExportButtonState();
}

// 繧ｵ繝繝阪う繝ｫ逕ｨ縺ｮCanvas繧堤函謌・
function createSpriteThumbnail(sprite) {
  const scale = 4;
  const size = spriteSpec.edge;
  const canvas = document.createElement("canvas");
  canvas.width = size * scale;
  canvas.height = size * scale;

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) {
    return canvas;
  }
  ctx.imageSmoothingEnabled = false;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const value = sprite[y][x];
      if (value === 0) {
        continue;
      }
      ctx.fillStyle = palette[value] || "#000000";
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }

  return canvas;
}

// 繧ｹ繝励Λ繧､繝井ｸ隕ｧ縺ｮ遨ｺ迥ｶ諷玖｡ｨ遉ｺ繧貞宛蠕｡
function updateSpriteListEmptyState() {
  if (!domRefs.spriteListEmpty) {
    return;
  }
  domRefs.spriteListEmpty.hidden = state.sprites.length > 0;
}

// 蜃ｺ蜉帙・繧ｿ繝ｳ縺ｮ豢ｻ諤ｧ迥ｶ諷九ｒ譖ｴ譁ｰ
function updateExportButtonState() {
  if (!domRefs.exportButton) {
    return;
  }
  const shouldDisable = state.sprites.length === 0;
  domRefs.exportButton.disabled = shouldDisable;
  domRefs.exportButton.title = shouldDisable
    ? "スプライトを追加するとPNG出力できます。"
    : "";
}

function handleSpriteListClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const button = target.closest("button");
  if (!button || button.dataset.action !== "delete") {
    return;
  }
  const spriteId = button.dataset.id;
  removeSpriteById(spriteId);
}
function removeSpriteById(spriteId) {
  const nextSprites = state.sprites.filter((sprite) => sprite.id !== spriteId);
  if (nextSprites.length === state.sprites.length) {
    updateErrorMessage("指定されたスプライトが見つかりませんでした。");
    return;
  }
  state.sprites = nextSprites;
  renderSpriteList();
  updateErrorMessage("スプライトを削除しました。");
  loop();
  redraw();
}

// 繧ｹ繝励Λ繧､繝・D繧堤函謌・
function generateSpriteId() {
  const timestamp = Date.now();
  const randomSuffix = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");
  return "sprite_" + timestamp + "_" + randomSuffix;
}

// 繧ｨ繝ｩ繝ｼ繝｡繝・そ繝ｼ繧ｸ陦ｨ遉ｺ繧呈峩譁ｰ
function updateErrorMessage(message) {
  if (!domRefs.errorMessage) {
    return;
  }
  domRefs.errorMessage.textContent = message;
}

// 繝・く繧ｹ繝亥・蜉帙ｒ隗｣譫舌＠縺ｦ繧ｹ繝励Λ繧､繝磯・蛻励ｒ讀懆ｨｼ

// 繧ｿ繧､繝繧ｹ繧ｿ繝ｳ繝玲枚蟄怜・繧堤函謌・
function formatTimestamp(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return (
    String(date.getFullYear()) +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    "_" +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

function parseSpriteText(rawText) {
  if (!rawText) {
    return {
      ok: false,
      message: "配列データが空です。"
    };
  }

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch (error) {
    return {
      ok: false,
      message: "配列の形式が正しくありません。"
    };
  }

  if (!Array.isArray(parsed)) {
    return {
      ok: false,
      message: "配列の最上位は一次元配列である必要があります。"
    };
  }

  if (parsed.length !== spriteSpec.edge) {
    return {
      ok: false,
      message: "行数が" + spriteSpec.edge + "ではありません（現在: " + parsed.length + "行）。"
    };
  }

  for (let rowIndex = 0; rowIndex < parsed.length; rowIndex += 1) {
    const row = parsed[rowIndex];
    if (!Array.isArray(row)) {
      return {
        ok: false,
        message: (rowIndex + 1) + "行目が配列ではありません。"
      };
    }

    if (row.length !== spriteSpec.edge) {
      return {
        ok: false,
        message: (rowIndex + 1) + "行目の列数が" + spriteSpec.edge + "ではありません（現在: " + row.length + "列）。"
      };
    }

    for (let colIndex = 0; colIndex < row.length; colIndex += 1) {
      const value = row[colIndex];
      if (typeof value !== "number" || Number.isNaN(value)) {
        return {
          ok: false,
          message: (rowIndex + 1) + "行" + (colIndex + 1) + "列が数値ではありません（値: " + value + "）。"
        };
      }
      if (!Number.isInteger(value)) {
        return {
          ok: false,
          message: (rowIndex + 1) + "行" + (colIndex + 1) + "列が整数ではありません（値: " + value + "）。"
        };
      }
      if (value < spriteSpec.minValue || value > spriteSpec.maxValue) {
        return {
          ok: false,
          message: (rowIndex + 1) + "行" + (colIndex + 1) + "列の値が範囲外です（値: " + value + "、範囲: " + spriteSpec.minValue + "-" + spriteSpec.maxValue + "）。"
        };
      }
    }
  }

  return {
    ok: true,
    data: parsed
  };
}


// 繝ｬ繧､繧｢繧ｦ繝郁ｨｭ螳壹ｒ驕ｩ逕ｨ縺励※蜀肴緒逕ｻ
function applyLayoutSettings(nextLayout) {
  state.layout = {
    ...state.layout,
    ...nextLayout,
    spriteSize: spriteSpec.edge
  };
  syncLayoutSelectors();
  updateExportButtonState();
  loop();
  redraw();
}

// 繧ｻ繝ｬ繧ｯ繧ｿ陦ｨ遉ｺ繧堤樟蝨ｨ蛟､縺ｫ蜷医ｏ縺帙ｋ
function syncLayoutSelectors() {
  if (domRefs.layoutColumns) {
    domRefs.layoutColumns.value = String(state.layout.columns);
  }
  if (domRefs.layoutPadding) {
    domRefs.layoutPadding.value = String(state.layout.padding);
  }
  if (domRefs.layoutMargin) {
    domRefs.layoutMargin.value = String(state.layout.margin);
  }
  if (domRefs.layoutPreset) {
    domRefs.layoutPreset.value = resolveLayoutPresetKey();
  }
}

// 繝ｬ繧､繧｢繧ｦ繝医そ繝ｬ繧ｯ繝亥､画峩譎ゅ・蜃ｦ逅・
function handleLayoutSelectChange() {
  const columns = parseInt(domRefs.layoutColumns?.value ?? state.layout.columns, 10);
  const padding = parseInt(domRefs.layoutPadding?.value ?? state.layout.padding, 10);
  const margin = parseInt(domRefs.layoutMargin?.value ?? state.layout.margin, 10);

  applyLayoutSettings({
    columns: clamp(columns, 1, 16),
    padding: clamp(padding, 0, 4),
    margin: clamp(margin, 0, 4)
  });

  updateErrorMessage("レイアウト設定を更新しました。");
}

// 繝励Μ繧ｻ繝・ヨ螟画峩譎ゅ・蜃ｦ逅・
function handleLayoutPresetChange() {
  const presetKey = domRefs.layoutPreset?.value ?? "default";
  const preset = layoutPresets[presetKey];
  if (!preset) {
    return;
  }
  applyLayoutSettings(preset);
  const label = domRefs.layoutPreset?.selectedOptions?.[0]?.textContent ?? "繝励Μ繧ｻ繝・ヨ";
  updateErrorMessage("プリセット「" + label + "」を適用しました。");
}

// 謨ｰ蛟､繧堤ｯ・峇蜀・↓蜿弱ａ繧・
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// 迴ｾ蝨ｨ縺ｮ險ｭ螳壹′縺ｩ縺ｮ繝励Μ繧ｻ繝・ヨ縺ｫ隧ｲ蠖薙☆繧九°蛻､螳・
function resolveLayoutPresetKey() {
  const { columns, padding, margin } = state.layout;
  for (const [key, preset] of Object.entries(layoutPresets)) {
    if (!preset) {
      continue;
    }
    if (preset.columns === columns && preset.padding === padding && preset.margin === margin) {
      return key;
    }
  }
  return "custom";
}




