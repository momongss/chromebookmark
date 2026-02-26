// Utility to build a clustered dragImage for multi-selection dragging
// Creates an offscreen container with mini tiles representing selected nodes
// and passes it to dataTransfer.setDragImage, then removes it immediately.

function parseWrapperCoords(wrapperEl) {
  const classes = (wrapperEl?.className || '').split(/\s+/);
  for (const cls of classes) {
    const m = cls.match(/^node-wrapper-(\d+)-(\d+)$/);
    if (m) return { x: parseInt(m[1], 10), y: parseInt(m[2], 10) };
  }
  const m = (wrapperEl?.className || '').match(/node-wrapper-(\d+)-(\d+)/);
  if (m) return { x: parseInt(m[1], 10), y: parseInt(m[2], 10) };
  return null;
}

function getOriginalPos(el) {
  if (el?.originalPosition && typeof el.originalPosition.x === 'number') return el.originalPosition;
  const parent = el?.parentElement;
  if (parent && typeof parent.className === 'string' && parent.className.includes('node-wrapper')) {
    const p = parseWrapperCoords(parent);
    if (p) return p;
  }
  return { x: 0, y: 0 };
}

function makeTileForElement(el, options) {
  const { tileW, tileH, scale, useDomClone, opacity } = options;
  const tile = document.createElement('div');
  tile.style.cssText = [
    'position:absolute',
    `width:${tileW}px`,
    `height:${tileH}px`,
    'box-sizing:border-box',
    'pointer-events:none',
    'overflow:visible',
    'background:rgba(255, 255, 255, 0.42)',
    'border-radius:10px',
    'border:1px solid rgba(255,255,255,0.15)'
  ].join(';');
  // 모든 타일 동일 불투명도 (기본 1, UA 드래그 피드백 투명도와 중첩 방지)
  tile.style.opacity = 1; //String(opacity ?? 1);

  if (useDomClone) {
    // Try to clone the inner visual node to match original UI
    const nodeEl = el.querySelector?.('.node') || el.firstElementChild || el;
    let cloned;
    try {
      cloned = nodeEl.cloneNode(true);
    } catch (err) {
      cloned = null;
    }
    if (cloned) {
      // Normalize cloned node for preview (효과 제거, 원본 그대로)
      cloned.style.pointerEvents = 'none';
      cloned.style.userSelect = 'none';
  // UA 기본 드래그 피드백의 반투명 처리와 겹치지 않도록 완전 불투명으로 고정
  cloned.style.opacity = '1';
      // 크기를 앵커 노드 측정값에 맞춤(왜곡 방지)
      cloned.style.width = `${tileW}px`;
      cloned.style.height = `${tileH}px`;
      // Remove draggable on descendants
      cloned.querySelectorAll?.('[draggable]')?.forEach(elm => elm.removeAttribute('draggable'));
      tile.appendChild(cloned);
    } else {
      // Fallback: 단순 타이틀 텍스트 (효과 없음)
      const fallback = document.createElement('div');
      fallback.style.cssText = [
        'width:100%', 'height:100%',
        'display:flex','align-items:center','justify-content:center',
        'font:600 12px/1 system-ui,sans-serif','color:#1a1a1a'
      ].join(';');
      fallback.textContent = el?.bookMark?.title || el.tagName.toLowerCase();
      tile.appendChild(fallback);
    }
  } else {
    // Placeholder 제거: 효과 없는 간단 텍스트만 표시
    const text = document.createElement('div');
    text.textContent = el?.bookMark?.title || el.tagName.toLowerCase();
    text.style.cssText = [
      'width:100%','height:100%','display:flex','align-items:center','justify-content:center',
      'font:600 12px/1 system-ui,sans-serif','color:#1a1a1a',
    ].join(';');
    tile.appendChild(text);
  }

  if (scale !== 1) {
    tile.style.transform = `scale(${scale})`;
    tile.style.transformOrigin = 'top left';
  }

  return tile;
}

export function applyMultiDragImage(e, selectedElements, anchorElement, opts = {}) {
  if (!selectedElements || selectedElements.length === 0) return;
  const options = {
    tileW: 96,
    tileH: 80,
    gapX: 8,
    gapY: 8,
    scale: 1,
    useDomClone: true,
    autoSizeFromNode: true,
    // 모든 타일에 동일한 불투명도 적용 (기본 1.0: 브라우저의 드래그 피드백 반투명과 중첩 방지)
    opacity: 1,
    ...opts,
  };

  // Build positions based on original grid snapshot
  const anchorPos = getOriginalPos(anchorElement);
  // If requested, infer tile size from actual node UI (anchor)
  if (options.autoSizeFromNode) {
    const sampleNode = anchorElement.querySelector?.('.node') || anchorElement.firstElementChild;
    if (sampleNode) {
      const rect = sampleNode.getBoundingClientRect();
      // Apply sensible bounds to avoid overly large drag images
      const maxW = 140, maxH = 120;
      options.tileW = Math.min(Math.max(64, Math.round(rect.width)), maxW);
      options.tileH = Math.min(Math.max(56, Math.round(rect.height)), maxH);
    }
  }
  const items = selectedElements.map(el => {
    const p = getOriginalPos(el);
    const dx = p.x - anchorPos.x;
    const dy = p.y - anchorPos.y;
    return { el, dx, dy };
  });

  // Determine extents to size container and compute positive coords
  let minDx = Infinity, minDy = Infinity, maxDx = -Infinity, maxDy = -Infinity;
  for (const it of items) {
    minDx = Math.min(minDx, it.dx);
    minDy = Math.min(minDy, it.dy);
    maxDx = Math.max(maxDx, it.dx);
    maxDy = Math.max(maxDy, it.dy);
  }

  const cols = (maxDx - minDx + 1);
  const rows = (maxDy - minDy + 1);
  const width = cols * options.tileW + (cols - 1) * options.gapX;
  const height = rows * options.tileH + (rows - 1) * options.gapY;

  // Offscreen container
  const container = document.createElement('div');
  container.style.cssText = [
    'position:absolute',
    'top:-10000px',
    'left:-10000px',
    `width:${width}px`,
    `height:${height}px`,
    'pointer-events:none',
    // 드래그 스냅샷의 기본 반투명도와 겹치지 않도록 컨테이너도 불투명 처리
    'opacity:1',
    'background:rgba(255, 255, 255, 0)',
    'border-radius:12px',
    'padding:4px'
  ].join(';');

  // Create tiles
  for (const it of items) {
    const tile = makeTileForElement(it.el, options);
    const x = (it.dx - minDx) * (options.tileW + options.gapX);
    const y = (it.dy - minDy) * (options.tileH + options.gapY);
    tile.style.left = `${x}px`;
    tile.style.top = `${y}px`;
    container.appendChild(tile);
  }

  document.body.appendChild(container);

  // Cursor offset: center of anchor tile
  const anchorLeft = (0 - minDx) * (options.tileW + options.gapX);
  const anchorTop = (0 - minDy) * (options.tileH + options.gapY);
  const offsetX = Math.round(anchorLeft + options.tileW / 2);
  const offsetY = Math.round(anchorTop + options.tileH / 2);

  try {
    e.dataTransfer.setDragImage(container, offsetX, offsetY);
  } catch (err) {
    console.warn('applyMultiDragImage: setDragImage failed', err);
  }

  // Remove container after snapshot; allow layout to flush
  requestAnimationFrame(() => {
    if (container.parentNode) container.parentNode.removeChild(container);
  });
}
