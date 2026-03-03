// main.js --- 筆算計算
// Author: katahiromz
// License: MIT

"use strict";

const VERSION = '0.0.0'; // バージョン
const DEBUGGING = true; // デバッグ中か？

document.addEventListener('DOMContentLoaded', function(){
  Paper.g_minimal = true; // 紙の拡張を最小限にする

  let canvas = document.getElementById('my-canvas');
  let canvas_space = document.getElementById('my-canvas-space');;
  let start_button = document.getElementById('my-start-button');
  let stop_button = document.getElementById('my-stop-button');
  let reset_button = document.getElementById('my-reset-button');
  let next_step_button = document.getElementById('my-next-step-button');
  let textarea = document.getElementById('my-textarea');
  let text_a = document.getElementById('my-text-a');
  let text_b = document.getElementById('my-text-b');
  let text_c = document.getElementById('my-text-c');
  let accuracy = document.getElementById('my-accuracy');
  let select = document.getElementById('my-select');
  let speedRange = document.getElementById('my-speed-range');
  let speedLabel = document.getElementById('speed-label');
  let errorDisplay = document.getElementById('input-error-message');
  let label_a = document.getElementById('label-a');
  let label_b = document.getElementById('label-b');
  let algorithm = null;
  let op = null;
  let speedInfo = {
    1: { text: '超遅い', delay: 900 },
    2: { text: 'すごく遅い', delay: 800 },
    3: { text: '少し遅い', delay: 700 },
    4: { text: '普通', delay: 500 },
    5: { text: '少し速い', delay: 300 },
    6: { text: 'すごく速い', delay: 200 },
    7: { text: '超速い', delay: 100 },
  };

  // Ctrl + マウスホイール回転でキャンバスをズーム
  // - Ctrl+Wheel はブラウザのページズームに奪われがちなので、passive:false で preventDefault する
  // - CSS transform で拡大縮小し、マウスポインタ位置を transform-origin にして直感的にズームする
  const zoomState = {
    scale: 1.0,
    minScale: 0.25,
    maxScale: 6.0,
    step: 1.2,
  };

  // 中ボタンドラッグでキャンバスをパン(移動)
  // transform を (translate + scale) に統一して、ズームとパンを共存させる
  const panState = {
    x: 0,
    y: 0,
    dragging: false,
    startClientX: 0,
    startClientY: 0,
    startX: 0,
    startY: 0,
    pointerId: null,
  };

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const applyCanvasTransform = (originX, originY) => {
    // transform-origin は要素の左上からの座標(px)
    canvas.style.transformOrigin = `${originX}px ${originY}px`;
    canvas.style.transform = `translate(${panState.x}px, ${panState.y}px) scale(${zoomState.scale})`;
  };

  const applyCanvasZoom = (originX, originY) => {
    applyCanvasTransform(originX, originY);
  };

  const applyCanvasPan = () => {
    const origin = (canvas.style.transformOrigin || '0 0').split(' ');
    const ox = parseFloat(origin[0]) || 0;
    const oy = parseFloat(origin[1]) || 0;
    applyCanvasTransform(ox, oy);
  };

  const getWheelScaleFactor = (deltaY) => {
    // deltaY: 下方向が正(通常)。下に回す=縮小, 上に回す=拡大
    if (deltaY < 0) return zoomState.step;
    if (deltaY > 0) return 1 / zoomState.step;
    return 1;
  };

  // マウスホイール回転時の処理
  const onCanvasWheel = (e) => {
    // Ctrl が押されていない通常スクロールは従来通り(何もしない)
    if (!e.ctrlKey) return;

    // ブラウザ(ページ)ズームを抑止
    e.preventDefault();

    if (canvas.width <= 1 && canvas.height <= 1)
      return;

    const rect = canvas.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;

    // 次のスケールを計算
    const factor = getWheelScaleFactor(e.deltaY);
    const nextScale = clamp(zoomState.scale * factor, zoomState.minScale, zoomState.maxScale);

    // スケールが変わらない場合は何もしない
    if (nextScale === zoomState.scale) {
      applyCanvasZoom(localX, localY);
      return;
    }

    zoomState.scale = nextScale;
    applyCanvasZoom(localX, localY);
  };

  // 中ボタン(ホイール押し込み)ドラッグでパン
  const onCanvasPointerDown = (e) => {
    if (e.button !== 1) return;
    e.preventDefault();

    panState.dragging = true;
    panState.startClientX = e.clientX;
    panState.startClientY = e.clientY;
    panState.startX = panState.x;
    panState.startY = panState.y;

    if (e.pointerId != null && canvas.setPointerCapture) {
      panState.pointerId = e.pointerId;
      canvas.setPointerCapture(e.pointerId);
    }

    canvas.style.cursor = 'grabbing';
  };

  const onCanvasPointerMove = (e) => {
    if (!panState.dragging) return;
    e.preventDefault();

    const dx = e.clientX - panState.startClientX;
    const dy = e.clientY - panState.startClientY;
    panState.x = panState.startX + dx;
    panState.y = panState.startY + dy;
    applyCanvasPan();
  };

  const endPanDrag = (e) => {
    if (!panState.dragging) return;
    panState.dragging = false;

    if (panState.pointerId != null && canvas.releasePointerCapture) {
      try {
        canvas.releasePointerCapture(panState.pointerId);
      } catch (err) {
        // ignore
      }
      panState.pointerId = null;
    }

    canvas.style.cursor = '';

    if (e) e.preventDefault();
  };

  // zoom/pan 用の初期スタイル
  canvas.style.transformOrigin = '0 0';
  canvas.style.transform = 'translate(0px, 0px) scale(1)';

  // ドラッグ中の右クリックメニュー抑止(環境によっては発生するため)
  canvas.addEventListener('contextmenu', (e) => {
    if (panState.dragging) e.preventDefault();
  });

  canvas_space.addEventListener('pointerdown', onCanvasPointerDown, { passive: false });
  canvas_space.addEventListener('pointermove', onCanvasPointerMove, { passive: false });
  canvas_space.addEventListener('pointerup', endPanDrag, { passive: false });
  canvas_space.addEventListener('pointercancel', endPanDrag, { passive: false });
  window.addEventListener('wheel', onCanvasWheel, { passive: false });

  // 設定を読み込む
  const loadSettings = () => {
    let PenCalc_textA = localStorage.getItem('PenCalc_textA');
    if (PenCalc_textA)
      text_a.value = PenCalc_textA;
    let PenCalc_textB = localStorage.getItem('PenCalc_textB');
    if (PenCalc_textB)
      text_b.value = PenCalc_textB;
    let PenCalc_textC = localStorage.getItem('PenCalc_textC');
    if (PenCalc_textC)
      text_c.value = PenCalc_textC;
    let PenCalc_select = localStorage.getItem('PenCalc_select');
    if (PenCalc_select)
      select.value = PenCalc_select;
    let PenCalc_speedRange = localStorage.getItem('PenCalc_speedRange');
    if (PenCalc_speedRange)
      speedRange.value = PenCalc_speedRange;
  };
  loadSettings();

  // 全ての画���を読み込む
  Promise.all(Object.keys(digitInfo).map(key => loadImage(key)))
    .then(() => {
      console.log('全ての画像の読み込みが完了しました');
    })
    .catch(error => {
      console.error('画像の読み込みに失敗しました:', error);
    });

  if (DEBUGGING) {
    (new AlgoBase(canvas, textarea)).unitTest();
    (new AlgoAdd(canvas, textarea)).unitTest();
    (new AlgoSub(canvas, textarea)).unitTest();
    (new AlgoMul(canvas, textarea)).unitTest();
    (new AlgoDiv(canvas, textarea)).unitTest();
    (new AlgoTest(canvas, textarea)).unitTest();
    textarea.innerText = '';
  }

  // スピード変更時の処理
  const speedChanged = () => {
    let val = speedRange.value;
    let info = speedInfo[parseInt(val)];
    speedLabel.innerText = info.text;
    if (algorithm) {
      algorithm.setDelay(speedInfo[parseInt(speedRange.value)].delay);
    }
    localStorage.setItem('PenCalc_speedRange', val.toString());
  };
  speedChanged();

  // スライダー変更時のイベント
  speedRange.addEventListener('input', (e) => {
    speedChanged();
  });

  // 入力内容を検証する
  const validateInput = () => {
    let message = "";
    const a = text_a.value, b = text_b.value, c = text_c.value;
    let isAValid = true, isBValid = true, isCValid = true;

    // 数Aのチェック (getNumberInfoを使用)
    if (a !== "" && !getNumberInfo(a)) {
      message = "数が正しくありません（符号なし実数のみ）";
      isAValid = false;
    }
    // 数Bのチェック
    if (b !== "" && !getNumberInfo(b)) {
      message = "数が正しくありません（符号なし実数のみ）";
      isBValid = false;
    }
    // 数Cのチェック
    if (c !== "" && !getNumberInfo(c)) {
      message = "数が正しくありません（符号なし実数のみ）";
      isCValid = false;
    }
    if (isAValid && isBValid) {
      // 引き算の制約チェック
      if (select.value === 'sub' && a !== "" && b !== "") {
        if (comparePositiveNumbers(a, b) < 0) {
          message = "引き算では、引かれる数を引く数より大きくしてください。";
          isAValid = isBValid = false;
        }
      }
      // 割り算の制約チェック
      if (select.value === 'div' && a !== "" && b !== "") {
        if (comparePositiveNumbers(b, '0') == 0) {
          message = "ゼロで割ることはできません。";
          isBValid = false;
        }
      }
    }

    // UIへの反映
    text_a.classList.toggle('input-error', !isAValid);
    text_b.classList.toggle('input-error', !isBValid);
    text_c.classList.toggle('input-error', !isCValid);
    errorDisplay.innerText = message;

    // エラーがある場合は開始ボタンなどを無効化
    let isValid = (message === "" && isAValid && isBValid && isCValid);
    start_button.disabled = !isValid;
    next_step_button.disabled = !isValid;
    return isValid;
  };

  // 再生ボタン
  start_button.addEventListener('click', (e) => {
    let a = text_a.value;
    let b = text_b.value;
    let c = text_c.value;
    console.log(a, b, c);
    if (!validateInput())
      return;

    if (algorithm) {
      algorithm.stop();
      algorithm = null;
    }

    switch (select.value) {
    case 'add':
      algorithm = new AlgoAdd(canvas, textarea, () => {
        next_step_button.disabled = true;
        stop_button.click();
      });
      break;
    case 'sub':
      algorithm = new AlgoSub(canvas, textarea, () => {
        next_step_button.disabled = true;
        stop_button.click();
      });
      break;
    case 'mul':
      algorithm = new AlgoMul(canvas, textarea, () => {
        next_step_button.disabled = true;
        stop_button.click();
      });
      break;
    case 'div':
      algorithm = new AlgoDiv(canvas, textarea, () => {
        next_step_button.disabled = true;
        stop_button.click();
      });
      break;
    case 'test':
      algorithm = new AlgoTest(canvas, textarea, () => {
        next_step_button.disabled = true;
        stop_button.click();
      });
      break;
    default:
      alert(select.value);
      return;
    }
    start_button.disabled = true;
    stop_button.disabled = false;
    text_a.disabled = true;
    text_b.disabled = true;
    text_c.disabled = true;
    next_step_button.disabled = true;
    reset_button.disabled = false;
    op = select.value;
    algorithm.autoPlay = true;
    textarea.innerText = '';
    algorithm.set(a, b, c);
    algorithm.setDelay(speedInfo[parseInt(speedRange.value)].delay);
    algorithm.start();
  });

  // 停止ボタン
  stop_button.addEventListener('click', (e) => {
    if (algorithm) {
      algorithm.stop();
    }
    start_button.disabled = false;
    stop_button.disabled = true;
    reset_button.disabled = false;
    text_a.disabled = false;
    text_b.disabled = false;
    text_c.disabled = false;
  });

  // 「1歩進む」ボタン
  next_step_button.addEventListener('click', (e) => {
    // アルゴリズムがまだ作成されていない、または停止している場合は初期化
    if (!algorithm || !algorithm.running) {
      let a = text_a.value;
      let b = text_b.value;
      let c = text_c.value;
      if (!validateInput())
        return;

      // 既存のインスタンスがあれば停止
      if (algorithm) algorithm.stop();

      // 選択された演算に応じてインスタンス化
      switch (select.value) {
        case 'add': algorithm = new AlgoAdd(canvas, textarea); break;
        case 'sub': algorithm = new AlgoSub(canvas, textarea); break;
        case 'mul': algorithm = new AlgoMul(canvas, textarea); break;
        case 'div': algorithm = new AlgoDiv(canvas, textarea); break;
        case 'test': algorithm = new AlgoTest(canvas, textarea); break;
        default: return;
      }

      // 終了時のコールバック設定
      algorithm.end_fn = () => {
        next_step_button.disabled = true;
        stop_button.click();
      };

      algorithm.set(a, b, c);
      algorithm.autoPlay = false; // 自動再生はOFF
      algorithm.start();          // 描画ループを開始
    }

    // UI状態の更新
    start_button.disabled = true;
    stop_button.disabled = true;
    text_a.disabled = true;
    text_b.disabled = true;
    text_c.disabled = true;
    reset_button.disabled = false;

    // 次の 'step' まで実行
    algorithm.nextStep();
  });

  // リセットボタン
  reset_button.addEventListener('click', (e) => {
    if (algorithm) {
      algorithm.stop();
      algorithm.clearPaper();
    }
    start_button.disabled = false;
    stop_button.disabled = true;
    next_step_button.disabled = false;
    text_a.disabled = false;
    text_b.disabled = false;
    text_c.disabled = false;
    reset_button.disabled = false;
    textarea.innerHTML = '';

    zoomState.scale = 1.0;
    panState.x = 0;
    panState.y = 0;
    applyCanvasTransform(0, 0);
  });

  text_a.addEventListener('input', () => {
    if (!validateInput())
      return;
    localStorage.setItem('PenCalc_textA', text_a.value);
  });

  text_b.addEventListener('input', () => {
    if (!validateInput())
      return;
    localStorage.setItem('PenCalc_textB', text_b.value);
  });

  text_c.addEventListener('input', () => {
    if (!validateInput())
      return;
    localStorage.setItem('PenCalc_textC', text_c.value);
  });

  const updateLabels = () => {
    switch (select.value) {
    case 'add':
      label_a.innerText = "足される数"; // 被加数
      label_b.innerText = "足す数"; // 加数
      accuracy.classList.add('hidden');
      text_c.value = '0';
      break;
    case 'sub':
      label_a.innerText = "引かれる数"; // 被減数
      label_b.innerText = "引く数"; // 減数
      accuracy.classList.add('hidden');
      text_c.value = '0';
      break;
    case 'mul':
      label_a.innerText = "掛けられる数"; // 被乗数
      label_b.innerText = "掛ける数"; // 乗数
      accuracy.classList.add('hidden');
      text_c.value = '0';
      break;
    case 'div':
      label_a.innerText = "割られる数"; // 被除数
      label_b.innerText = "割る数"; // 除数
      accuracy.classList.remove('hidden');
      break;
    case 'test':
      label_a.innerText = "数A";
      label_b.innerText = "数B";
      accuracy.classList.remove('hidden');
      break;
    default:
      return false;
    }
    return true;
  };

  select.addEventListener('change', () => {
    if (!updateLabels())
      return;
    localStorage.setItem('PenCalc_select', select.value);
    validateInput();
  });

  const ready = () => {
    select.disabled = false;
    speedRange.disabled = false;
    text_a.disabled = false;
    text_b.disabled = false;
    text_c.disabled = false;
    start_button.disabled = false;
    stop_button.disabled = true;
    next_step_button.disabled = false;
    reset_button.disabled = false;
  }

  updateLabels();
  ready();
});
