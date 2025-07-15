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
    this.style.overflow = 'hidden';
    this.draggable = false;
    this.className = 'temp-dragger';
    
    // 드래그 이벤트 리스너 추가
    this.addEventListener('dragstart', this.onDragStart);
    this.addEventListener('dragend', this.onDragEnd);
  }

  // 활성화: 화면 전체 크기로 설정하고 draggable 활성화
  enable() {
    this.style.width = '100vw';
    this.style.height = '100vh';
    this.style.pointerEvents = 'auto';
    this.draggable = true;
    this.isEnabled = true;
  }

  // 비활성화: 크기를 0으로 설정하고 draggable 비활성화
  disable() {
    this.style.width = '0';
    this.style.height = '0';
    this.style.pointerEvents = 'none';
    this.draggable = false;
    this.isEnabled = false;
    
    // 모든 자식 요소 제거
    while (this.firstChild) {
      this.removeChild(this.firstChild);
    }
  }

  // 선택된 요소들을 추가
  addElements(elements) {
    if (!this.isEnabled) {
      this.enable();
    }

    elements.forEach(element => {
      // 요소의 현재 위치 계산
      const rect = element.getBoundingClientRect();
      
      // 절대 위치로 설정하여 위치 고정
      element.style.position = 'absolute';
      element.style.left = `${rect.left}px`;
      element.style.top = `${rect.top}px`;
      element.style.zIndex = '10000';
      
      // TempDragger에 추가
      this.appendChild(element);
    });

    this.selectedElements = elements;
  }

  // 드래그 시작
  onDragStart = (e) => {
    e.dataTransfer.setData('text/plain', 'multi-drag');
    window.currentDragNodes = [...this.selectedElements];
    
    console.log('멀티 드래그 시작:', this.selectedElements.length, '개 요소');
  }

  // 드래그 종료
  onDragEnd = (e) => {
    console.log('멀티 드래그 종료');
    
    // 요소들을 원래 위치로 복원
    this.restoreElements();
    
    // TempDragger 비활성화
    this.disable();
  }

  // 요소들을 원래 위치로 복원
  restoreElements() {
    if (!this.selectedElements) return;

    this.selectedElements.forEach(element => {
      // 절대 위치 스타일 제거
      element.style.position = '';
      element.style.left = '';
      element.style.top = '';
      element.style.zIndex = '';
      
      // 원래 부모로 복원 (document.body 또는 원래 부모)
      if (element.originalParent) {
        element.originalParent.appendChild(element);
      } else {
        document.body.appendChild(element);
      }
    });

    this.selectedElements = null;
  }

  // 요소들의 원래 부모 저장
  saveOriginalParents(elements) {
    elements.forEach(element => {
      element.originalParent = element.parentNode;
    });
  }
}

customElements.define('temp-dragger', TempDragger);

export default TempDragger;
