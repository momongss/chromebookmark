function getRangedRandom(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * 주어진 마우스 좌표(clientX, clientY)에서 최상단의 노드 요소를 반환합니다.
 * 기본적으로 드래그 프리뷰/오버레이 및 TempDragger는 무시합니다.
 *
 * 반환 우선순위: folder-node > file-node > item-node
 *
 * @param {number} clientX - MouseEvent.clientX
 * @param {number} clientY - MouseEvent.clientY
 * @param {Object} [options]
 * @param {boolean} [options.ignoreTempDragger=true] - temp-dragger 요소 무시
 * @param {boolean} [options.ignorePreview=true] - 드래그 프리뷰/오버레이 무시
 * @param {boolean} [options.skipDraggingNodes=true] - 현재 드래그 중인 멀티 선택 노드 무시
 * @param {boolean} [options.includeWrapper=false] - 노드를 못 찾으면 node-wrapper를 반환할지 여부
 * @returns {Element|null} folder-node | file-node | item-node | (includeWrapper일 때 node-wrapper) | null
 */
function getNodeAtPoint(clientX, clientY, options = {}) {
  const {
    ignoreTempDragger = true,
    ignorePreview = true,
    skipDraggingNodes = true,
    includeWrapper = false,
  } = options;

  const elements = document.elementsFromPoint(clientX, clientY) || [];

  // 1) 상단에서부터 유효한 node를 찾는다
  for (const el of elements) {
    // 필터: TempDragger / 프리뷰 / 오버레이 제외
    if (ignoreTempDragger && el.tagName === 'TEMP-DRAGGER') continue;
    if (ignorePreview && (el.classList?.contains('drag-preview') || el.classList?.contains('drag-overlay'))) continue;

    // folder > file > item 우선순위로 탐색
    const node = el.closest?.('folder-node, file-node, item-node');
    if (!node) continue;

    // 멀티 드래그 중인 자신의 요소는 스킵(옵션)
    if (skipDraggingNodes && Array.isArray(window.currentDragNodes) && window.currentDragNodes.includes(node)) {
      continue;
    }

    return node;
  }

  // 2) 노드가 없고 wrapper 반환을 허용하면 node-wrapper 반환
  if (includeWrapper) {
    for (const el of elements) {
      if (ignoreTempDragger && el.tagName === 'TEMP-DRAGGER') continue;
      if (ignorePreview && (el.classList?.contains('drag-preview') || el.classList?.contains('drag-overlay'))) continue;
      if (typeof el.className === 'string' && el.className.includes('node-wrapper')) {
        return el;
      }
      const wrapper = el.closest?.('[class*="node-wrapper"]');
      if (wrapper && wrapper.className.includes('node-wrapper')) {
        return wrapper;
      }
    }
  }

  return null;
}

export { getRangedRandom, getNodeAtPoint };
