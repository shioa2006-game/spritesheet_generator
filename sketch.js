// プレビューキャンバスのサイズ定義
const canvasSize = 384;
// プレビュー背景のセルサイズ定義
const cellSize = 24;
// スプライトの仕様をまとめて定義
const spriteSpec = {
  edge: 12,
  minValue: 0,
  maxValue: 32
};

// PNG出力時の拡大倍率
const exportScale = 4;

// パレット定義（要件で指定された順番を保持）
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

// アプリ全体の状態をここで保持
const state = {
  sprites: [],
  layout: {
    columns: 8,
    padding: 0,
    margin: 0,
    spriteSize: spriteSpec.edge
  }
};

// レイアウトプリセット定義
const layoutPresets = {
  default: { columns: 8, padding: 0, margin: 0 },
  tight: { columns: 12, padding: 0, margin: 0 },
  spaced: { columns: 6, padding: 2, margin: 2 },
  custom: null
};

// DOM参照をまとめて保持
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
  // p5.jsキャンバスを生成してDOMに接続
  const canvas = createCanvas(canvasSize, canvasSize);
  canvas.parent("p5-container");
  noSmooth();

  // DOM要素を取得してキャッシュ
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

  // イベントハンドラを紐付け
  if (domRefs.addButton) {
    domRefs.addButton.addEventListener("click", handleAddClick);
  }
  if (domRefs.clearButton) {
    domRefs.clearButton.addEventListener("click", handleClearClick);
  }
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
  // 背景パターンを描画してからスプライトを配置
  background(255);
  drawBackgroundPattern();
  const metrics = updatePreviewStatistics();
  drawSpritesOnPreview(metrics);
  noLoop();
}

// 追加ボタン押下時の処理
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

// クリアボタン押下時の処理
function handleClearClick() {
  if (domRefs.spriteInput) {
    domRefs.spriteInput.value = "";
  }
  updateErrorMessage("入力エリアをクリアしました。");
  loop();
  redraw();
}

// 全削除ボタン押下時の処理
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

// PNG出力ボタン押下時の処理
function handleExportClick() {
  if (state.sprites.length === 0) {
    updateErrorMessage("出力するスプライトがありません。");
    return;
  }
  updateErrorMessage("PNG出力を準備しています…");

  if (state.sprites.length === 1) {
    const singleCanvas = generateSingleSpriteCanvas(state.sprites[0].data, exportScale);
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
  const sheetCanvas = generateSpriteSheetCanvas(metrics, sheetLayout, exportScale);
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

// チェックボードパターンをキャンバス全体に描画
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

// プレビュー用にスプライトをすべて描画
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
    const baseX = offset.x + (margin + col * (spriteSize + padding)) * scale;
    const baseY = offset.y + (margin + row * (spriteSize + padding)) * scale;
    drawSpritePixels(sprite.data, baseX, baseY, scale);
  });
}

// 1つのスプライトをピクセル単位で描画
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
      rect(baseX + x * scale, baseY + y * scale, scale, scale);
    }
  }
}

// シートサイズと行数を計算
function calculateSheetMetrics(spriteCount, layout = state.layout) {
  const { columns, padding, margin, spriteSize } = layout;
  if (spriteCount === 0) {
    return { rows: 0, sheetWidth: margin * 2, sheetHeight: margin * 2 };
  }
  const rows = Math.ceil(spriteCount / columns);
  const sheetWidth = columns * spriteSize + Math.max(0, columns - 1) * padding + margin * 2;
  const sheetHeight = rows * spriteSize + Math.max(0, rows - 1) * padding + margin * 2;
  return { rows, sheetWidth, sheetHeight };
}

// プレビューに収めるためのスケールを決定
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

// シート全体を中央に配置するためのオフセットを計算
function calculateSheetOffset(sheetWidth, sheetHeight, scale) {
  const drawnWidth = sheetWidth * scale;
  const drawnHeight = sheetHeight * scale;
  return {
    x: (canvasSize - drawnWidth) / 2,
    y: (canvasSize - drawnHeight) / 2
  };
}

// プレビュー情報の表示を更新
function updatePreviewStatistics() {
  const metrics = calculateSheetMetrics(state.sprites.length);
  if (domRefs.previewInfo) {
    domRefs.previewInfo.textContent =
      `スプライト数: ${state.sprites.length}個 / サイズ: ${metrics.sheetWidth}x${metrics.sheetHeight}px / グリッド: ${state.layout.columns}列x${metrics.rows}行`;
  }
  return metrics;
}

// スプライト一覧の表示を更新
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
    indexLabel.textContent = `#${index}`;
    thumbWrapper.appendChild(indexLabel);

    const thumbnailCanvas = createSpriteThumbnail(sprite.data);
    thumbWrapper.appendChild(thumbnailCanvas);

    const deleteButton = document.createElement("button");
    deleteButton.className = "sprite-delete";
    deleteButton.type = "button";
    deleteButton.textContent = "削除";
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

// サムネイル用のCanvasを生成
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

// スプライト一覧の空状態表示を制御
function updateSpriteListEmptyState() {
  if (!domRefs.spriteListEmpty) {
    return;
  }
  domRefs.spriteListEmpty.hidden = state.sprites.length > 0;
}

// 出力ボタンの活性状態を更新
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

// スプライト一覧で削除ボタンが押されたときの処理
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

// 指定IDのスプライトを削除
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

// スプライトIDを生成
function generateSpriteId() {
  const timestamp = Date.now();
  const randomSuffix = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");
  return `sprite_${timestamp}_${randomSuffix}`;
}

// エラーメッセージ表示を更新
function updateErrorMessage(message) {
  if (!domRefs.errorMessage) {
    return;
  }
  domRefs.errorMessage.textContent = message;
}

// タイムスタンプ文字列を生成
function formatTimestamp(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_` +
    `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  );
}

// テキスト入力を解析してスプライト配列を検証
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
      message: `行数が${spriteSpec.edge}ではありません（現在: ${parsed.length}行）。`
    };
  }

  for (let rowIndex = 0; rowIndex < parsed.length; rowIndex += 1) {
    const row = parsed[rowIndex];
    if (!Array.isArray(row)) {
      return {
        ok: false,
        message: `${rowIndex + 1}行目が配列ではありません。`
      };
    }

    if (row.length !== spriteSpec.edge) {
      return {
        ok: false,
        message: `${rowIndex + 1}行目の列数が${spriteSpec.edge}ではありません（現在: ${row.length}列）。`
      };
    }

    for (let colIndex = 0; colIndex < row.length; colIndex += 1) {
      const value = row[colIndex];
      if (typeof value !== "number" || Number.isNaN(value)) {
        return {
          ok: false,
          message: `${rowIndex + 1}行${colIndex + 1}列が数値ではありません（値: ${value}）。`
        };
      }
      if (!Number.isInteger(value)) {
        return {
          ok: false,
          message: `${rowIndex + 1}行${colIndex + 1}列が整数ではありません（値: ${value}）。`
        };
      }
      if (value < spriteSpec.minValue || value > spriteSpec.maxValue) {
        return {
          ok: false,
          message: `${rowIndex + 1}行${colIndex + 1}列の値が範囲外です（値: ${value}、範囲: ${spriteSpec.minValue}-${spriteSpec.maxValue}）。`
        };
      }
    }
  }

  return {
    ok: true,
    data: parsed
  };
}

// レイアウト設定を適用して再描画
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

// セレクタ表示を現在値に合わせる
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

// レイアウトセレクト変更時の処理
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

// プリセット変更時の処理
function handleLayoutPresetChange() {
  const presetKey = domRefs.layoutPreset?.value ?? "default";
  const preset = layoutPresets[presetKey];
  if (!preset) {
    return;
  }
  applyLayoutSettings(preset);
  const label = domRefs.layoutPreset?.selectedOptions?.[0]?.textContent ?? "プリセット";
  updateErrorMessage(`プリセット「${label}」を適用しました。`);
}

// 数値を範囲内に収める
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// 現在の設定がどのプリセットに該当するか判定
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

// 出力用スプライトシートCanvasを生成
function generateSpriteSheetCanvas(metrics, layout = state.layout, scale = 1) {
  const { columns, padding, margin, spriteSize } = layout;
  const { sheetWidth, sheetHeight } = metrics;
  const canvas = document.createElement("canvas");
  canvas.width = sheetWidth * scale;
  canvas.height = sheetHeight * scale;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) {
    return null;
  }
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, sheetWidth * scale, sheetHeight * scale);

  state.sprites.forEach((spriteItem, index) => {
    const sprite = spriteItem.data;
    const col = index % columns;
    const row = Math.floor(index / columns);
    const baseX = (margin + col * (spriteSize + padding)) * scale;
    const baseY = (margin + row * (spriteSize + padding)) * scale;
    for (let y = 0; y < spriteSize; y += 1) {
      for (let x = 0; x < spriteSize; x += 1) {
        const value = sprite[y][x];
        if (value === 0) {
          continue;
        }
        ctx.fillStyle = palette[value] || "#000000";
        ctx.fillRect(baseX + x * scale, baseY + y * scale, scale, scale);
      }
    }
  });

  return canvas;
}

// 単体スプライトをPNG用キャンバスに変換
function generateSingleSpriteCanvas(sprite, scale = 1) {
  const size = spriteSpec.edge;
  const canvas = document.createElement("canvas");
  canvas.width = size * scale;
  canvas.height = size * scale;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) {
    return null;
  }
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, size * scale, size * scale);

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

// CanvasをPNGとしてダウンロード
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
