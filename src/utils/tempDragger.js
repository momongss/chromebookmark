import { getNodeAtPoint } from './utils.js';
import { applyMultiDragImage } from './multiDragPreview.js';

class TempDragger extends HTMLElement {
  constructor() {
    super();
    this.init();
  }

  init() {
    // 기본 스타일 설정 (비활성화 상태)
    this.style.position = 'fixed';
    this.style.top = '0';
    this.style.left = '0';
    this.style.width = '0';
    this.style.height = '0';
    this.style.pointerEvents = 'none';
    this.style.zIndex = '9999';
    this.style.overflow = 'visible'; // 요소들이 경계를 벗어날 수 있도록
    this.draggable = false;
    this.className = 'temp-dragger';
    this.style.backgroundColor = 'rgba(107, 83, 83, 0)'; // 투명 배경
    // 임시 디버깅용 플래그 기본 활성화
    if (window.DEBUG_TEMP_DRAGGER === undefined) {
      window.DEBUG_TEMP_DRAGGER = true;
    }
    
    // 드래그 이벤트 리스너 추가
    this.addEventListener('dragstart', this.onDragStart);
    this.addEventListener('dragend', this.onDragEnd);
  }

  // 활성화: 선택된 요소들을 감싸는 크기로 설정하고 draggable 활성화
  enable(elements) {
    // 요소들의 경계 박스 계산
    const bounds = this.calculateBounds(elements);
    
    this.style.left = `${bounds.left}px`;
    this.style.top = `${bounds.top}px`;
    this.style.width = `${bounds.width}px`;
    this.style.height = `${bounds.height}px`;
    this.style.pointerEvents = 'auto';
    this.draggable = true;
    this.isEnabled = true;
    
    // 경계 박스 정보 저장
    this.bounds = bounds;
    // 디버그 시각화 적용
    this.updateDebugVisual(true);
  }

  // 비활성화: 크기를 0으로 설정하고 draggable 비활성화
  disable() {
    this.style.left = '0';
    this.style.top = '0';
    this.style.width = '0';
    this.style.height = '0';
    this.style.pointerEvents = 'none';
    this.draggable = false;
    this.isEnabled = false;
    
    // 경계 박스 정보 제거
    this.bounds = null;
    
  // 애니메이션/오버레이 제거: 시각 효과 사용 안 함
    // 디버그 시각화 해제
    this.updateDebugVisual(false);
    
    // 선택된 요소들의 시각적 효과와 드래그 설정 제거
    if (this.selectedElements) {
      this.selectedElements.forEach(element => {
        element.style.position = '';
        element.style.left = '';
        element.style.top = '';
        element.style.zIndex = '';
        element.style.opacity = '';
        element.style.transform = '';
        element.style.filter = '';
        element.style.boxShadow = '';
        element.style.transition = '';
        element.draggable = true; // 원래 드래그 가능 상태로 복원
        
        // TempDragger 전용 이벤트 리스너 제거
        if (element._tempDragStartHandler) {
          element.removeEventListener('dragstart', element._tempDragStartHandler);
          delete element._tempDragStartHandler;
        }
        if (element._tempDragEndHandler) {
          element.removeEventListener('dragend', element._tempDragEndHandler);
          delete element._tempDragEndHandler;
        }
        
        // 추가적으로 요소에 남아있을 수 있는 TempDragger 관련 속성 정리
        element._isTempDragElement = false;
      });
    }
    
    // 드래그 미리보기 제거
    if (this.dragPreview) {
      this.dragPreview.remove();
      this.dragPreview = null;
    }
    
    this.selectedElements = null;
  }

  // 선택된 요소들을 추가
  addElements(elements) {
    if (!this.isEnabled) {
      this.enable(elements);
    }

    // TempDragger 자체도 드래그 가능하게 설정
    this.draggable = true;
    this.style.pointerEvents = 'auto';

    // 원래 부모와 위치 정보 저장
    this.saveOriginalParents(elements);

  // 드래그 미리보기 사용 안 함 (애니메이션 제거)

    elements.forEach((element, index) => {
      // 요소를 원래 위치에 그대로 두고 시각적 효과와 드래그 가능 설정
      
      // 각 요소에 TempDragger 전용 이벤트 리스너 함수 생성 및 저장
      element._tempDragStartHandler = (e) => this.onDragStart(e);
      element._tempDragEndHandler = (e) => this.onDragEnd(e);
      element._isTempDragElement = true; // TempDragger에 의해 관리되는 요소임을 표시
      
      // 드래그 이벤트 리스너 추가
      element.addEventListener('dragstart', element._tempDragStartHandler);
      element.addEventListener('dragend', element._tempDragEndHandler);
    });

    this.selectedElements = elements;
  }

  // 드래그 미리보기 제거됨 (애니메이션/배지 미사용)



  // 드래그 오버레이 제거됨 (애니메이션 미사용)

  // 커스텀 드래그 이미지 설정
  setCustomDragImage(e) {
    try {
      // 멀티 선택 스냅샷을 클러스터로 만들어 커서를 따라가게 설정
      applyMultiDragImage(e, this.selectedElements, this.dragStartNode, {
        tileW: 96,
        tileH: 80,
        gapX: 8,
        gapY: 8,
        scale: 1,
        bg: 'transparent'
      });
    } catch (err) {
      console.warn('멀티 드래그 이미지 생성 실패 - 배지로 폴백', err);
      const dragImage = document.createElement('div');
      dragImage.style.cssText = `
        background: linear-gradient(135deg, rgba(0, 123, 255, 0.8), rgba(0, 86, 179, 0.8));
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        position: absolute;
        top: -1000px;
        left: -1000px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      `;
      dragImage.textContent = `${this.selectedElements.length}개 항목`;
      document.body.appendChild(dragImage);
      try {
        e.dataTransfer.setDragImage(dragImage, 50, 20);
      } catch (e2) {}
      setTimeout(() => dragImage.remove(), 0);
    }
  }

  // 드래그 시작
  onDragStart = (e) => {
    // TempDragger가 비활성화되었거나 선택된 요소가 없으면 아무것도 하지 않음
    if (!this.isEnabled || !this.selectedElements || this.selectedElements.length === 0) {
      console.log('TempDragger 비활성화 상태 - 멀티 드래그 차단, 원래 드래그 허용');
      return; // preventDefault 호출하지 않아서 노드의 원래 드래그가 작동하도록 함
    }
    
    // 드래그 이벤트가 TempDragger에 의해 관리되는 요소에서 발생했는지 확인
    const draggedElement = getNodeAtPoint(e.clientX, e.clientY);
    if (draggedElement && !draggedElement._isTempDragElement) {
      console.log('TempDragger 관리 대상이 아닌 요소에서 드래그 - 원래 드래그 허용');
      return;
    }
    
    const draggedFromTempDragger = e.target === this || e.target.closest('temp-dragger') === this;
    if (!draggedFromTempDragger && (!draggedElement || !this.selectedElements?.includes(draggedElement))) {
      console.log('멀티 선택된 노드가 아닌 곳에서 드래그 시도 - 원래 드래그 허용');
      return; // preventDefault 호출하지 않아서 노드의 원래 드래그가 작동하도록 함
    }

    // 드래그 시작 노드를 기준으로 설정
    this.dragStartNode = draggedElement;
    window.dragStartNode = this.dragStartNode;
    
    e.dataTransfer.setData('text/plain', 'multi-drag');
    window.currentDragNodes = [...this.selectedElements];
    window.isTempDragActive = true;

    // 커스텀 드래그 이미지 설정
    this.setCustomDragImage(e);
  }

  // 드래그 종료
  onDragEnd = (e) => {
    if (!this.isEnabled || !this.selectedElements || this.selectedElements.length === 0) {
      console.log('TempDragger 비활성화 상태 - 멀티 드래그 종료 차단');
      return;
    }

    if (!this.dragSuccessful) {
      this.restoreElements();
      this.clearAllSelections();
    }
    
    // 정리
    window.currentDragNodes = null;
    window.isTempDragActive = false;
    window.dragStartNode = null;
    this.dragStartNode = null;
    this.dragSuccessful = false;

    setTimeout(() => {
      this.disable();
    }, 300);
  }

  // 요소들을 원래 위치로 복원
  restoreElements() {
    if (!this.selectedElements) return;

    this.selectedElements.forEach(element => {
      // 모든 임시 스타일 제거 (요소는 이미 원래 위치에 있음)
      element.style.position = '';
      element.style.left = '';
      element.style.top = '';
      element.style.zIndex = '';
      element.style.opacity = '';
      element.style.transform = '';
      element.style.filter = '';
      element.style.boxShadow = '';
      element.style.transition = '';
      
      // 선택 상태는 유지 (multi 클래스는 그대로 둠)
    });

    // 드래그 미리보기 제거
    if (this.dragPreview) {
      this.dragPreview.remove();
      this.dragPreview = null;
    }
  }

  // 요소들의 원래 부모 저장
  saveOriginalParents(elements) {
    elements.forEach(element => {
      element.originalParent = element.parentNode;
      
      // 원래 그리드 위치도 저장
      const parent = element.parentElement;
      if (parent && parent.className.includes('node-wrapper')) {
        const pos = parent.className.split('-');
        if (pos.length >= 4) {
          element.originalPosition = {
            x: parseInt(pos[2]),
            y: parseInt(pos[3])
          };
        }
      }
    });
  }

  // 선택된 요소들의 경계 박스 계산
  calculateBounds(elements) {
    if (!elements || elements.length === 0) {
      return { left: 0, top: 0, width: 100, height: 100 };
    }

    let minLeft = Infinity;
    let minTop = Infinity;
    let maxRight = -Infinity;
    let maxBottom = -Infinity;

    elements.forEach(element => {
      const rect = element.getBoundingClientRect();
      minLeft = Math.min(minLeft, rect.left);
      minTop = Math.min(minTop, rect.top);
      maxRight = Math.max(maxRight, rect.right);
      maxBottom = Math.max(maxBottom, rect.bottom);
    });

    // 약간의 패딩 추가
    const padding = 10;
    
    return {
      left: minLeft - padding,
      top: minTop - padding,
      width: (maxRight - minLeft) + (padding * 2),
      height: (maxBottom - minTop) + (padding * 2)
    };
  }

  // 드롭이 성공했음을 표시하고 정리
  markDropSuccessful() {
    this.dragSuccessful = true;
    
    // 모든 선택 상태 완전히 초기화 (시각적 상태)
  this.clearAllSelections();
    
  // 전역 멀티 드래그 상태를 즉시 해제 (drop 이후 dragend 전에 해제 필요)
  window.isTempDragActive = false;
  window.currentDragNodes = null;
    this.dragStartNode = null;
    window.dragStartNode = null;
    
    // 즉시 정리 (애니메이션/지연 제거)
    this.disable();
  }

  // 모든 선택 상태 초기화
  clearAllSelections() {
    // 모든 노드의 선택 상태 제거
    const allNodes = document.querySelectorAll('file-node, folder-node, item-node');
    allNodes.forEach(node => {
      node.classList.remove('multi');
      if (node.firstElementChild) {
        node.firstElementChild.classList.remove('selected');
      }
      // 모든 임시 스타일 제거
      node.style.opacity = '';
      node.style.transform = '';
      node.style.filter = '';
      node.style.boxShadow = '';
      node.style.position = '';
      node.style.left = '';
      node.style.top = '';
      node.style.zIndex = '';
      node.style.transition = '';
      
      // RectDragger 참조 제거
      if (node.dragger) {
        node.dragger = null;
      }
    });
    
    // 모든 RectDragger의 선택 상태 초기화
    const rectDraggers = document.querySelectorAll('rect-dragger');
    rectDraggers.forEach(dragger => {
      if (dragger.matchingElements) {
        dragger.matchingElements = [];
      }
    });
  }

  // 디버그용 경계 박스 시각화 토글
  updateDebugVisual(show) {
    // 디버그 비활성화 시 정리
    if (!window.DEBUG_TEMP_DRAGGER) {
      this.style.border = '';
      this.style.background = '';
      this.style.borderRadius = '';
      if (this._debugBadge) {
        this._debugBadge.remove();
        this._debugBadge = null;
      }
      return;
    }

    if (show) {
      this.style.border = '2px dashed rgba(0, 123, 255, 0.7)';
      this.style.background = 'rgba(0, 123, 255, 0.08)';
      this.style.borderRadius = '8px';
      // 배지 업데이트/생성
      const count = this.selectedElements?.length || 0;
      if (!this._debugBadge) {
        const badge = document.createElement('div');
        badge.style.cssText = [
          'position:absolute',
          'top:-24px',
          'left:0',
          'padding:2px 6px',
          'font:600 12px/18px system-ui, sans-serif',
          'color:#0056b3',
          'background:rgba(0,123,255,0.12)',
          'border:1px solid rgba(0,123,255,0.35)',
          'border-radius:6px',
          'pointer-events:none',
          'user-select:none'
        ].join(';');
        badge.textContent = `TempDragger • ${count}개`;
        this.appendChild(badge);
        this._debugBadge = badge;
      } else {
        this._debugBadge.textContent = `TempDragger • ${count}개`;
      }
    } else {
      this.style.border = '';
      this.style.background = '';
      this.style.borderRadius = '';
      if (this._debugBadge) {
        this._debugBadge.remove();
        this._debugBadge = null;
      }
    }
  }
}

customElements.define('temp-dragger', TempDragger);

export default TempDragger;
